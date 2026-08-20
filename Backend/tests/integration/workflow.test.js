const request = require('supertest')
const app = require('../../src/app')
const { createUser, buildLessonPayload } = require('../helpers/factory')

async function buildPublishedCourse(overrides = {}){
    const admin = await createUser('admin')
    const instructor = await createUser('instructor')

    const categoryRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', admin.authHeader)
        .send({ name: `Cat ${Date.now()}${process.hrtime()[1]}`, description: 'desc' })
    const categoryId = categoryRes.body.data._id

    const courseRes = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', instructor.authHeader)
        .send({ title: 'Full Journey Course', description: 'A complete course', categoryId })
    const courseId = courseRes.body.data._id

    const sectionRes = await request(app)
        .post(`/api/v1/courses/${courseId}/sections`)
        .set('Authorization', instructor.authHeader)
        .send({ title: 'Section 1', order: 1 })
    const sectionId = sectionRes.body.data._id

    const correctAnswers = overrides.correctAnswers || [0, 1, 2, 3, 0]
    const lessonRes = await request(app)
        .post(`/api/v1/sections/${sectionId}/lessons`)
        .set('Authorization', instructor.authHeader)
        .send(buildLessonPayload({ passPercentage: overrides.passPercentage, attemptLimit: overrides.attemptLimit, correctAnswers }))

    const lessonId = lessonRes.body.data.lesson._id
    const quizId = lessonRes.body.data.quiz._id
    const questions = lessonRes.body.data.questions

    await request(app)
        .put(`/api/v1/courses/${courseId}/publish`)
        .set('Authorization', instructor.authHeader)

    return { admin, instructor, categoryId, courseId, sectionId, lessonId, quizId, questions }
}

function correctAnswersPayload(questions){
    return {
        answers: questions.map((q) => ({ questionId: q._id, selectedOption: q.correctAnswer }))
    }
}

describe('End-to-end learning journey', () => {
    test('student enrolls, learns, passes the quiz and reaches 100% progress', async () => {
        const course = await buildPublishedCourse()
        const student = await createUser('student')

        const enrollRes = await request(app)
            .post(`/api/v1/courses/${course.courseId}/enroll`)
            .set('Authorization', student.authHeader)
        expect(enrollRes.status).toBe(201)

        const dupEnroll = await request(app)
            .post(`/api/v1/courses/${course.courseId}/enroll`)
            .set('Authorization', student.authHeader)
        expect(dupEnroll.status).toBe(409)

        const myCourses = await request(app)
            .get('/api/v1/my-courses')
            .set('Authorization', student.authHeader)
        expect(myCourses.status).toBe(200)
        expect(myCourses.body.data.length).toBe(1)

        const completeRes = await request(app)
            .post(`/api/v1/lessons/${course.lessonId}/complete`)
            .set('Authorization', student.authHeader)
        expect(completeRes.status).toBe(201)

        const dupComplete = await request(app)
            .post(`/api/v1/lessons/${course.lessonId}/complete`)
            .set('Authorization', student.authHeader)
        expect(dupComplete.status).toBe(409)

        const takeQuiz = await request(app)
            .get(`/api/v1/quizzes/${course.quizId}`)
            .set('Authorization', student.authHeader)
        expect(takeQuiz.status).toBe(200)
        takeQuiz.body.data.questions.forEach((q) => {
            expect(q.correctAnswer).toBeUndefined()
        })

        const attemptRes = await request(app)
            .post(`/api/v1/quizzes/${course.quizId}/attempts`)
            .set('Authorization', student.authHeader)
            .send(correctAnswersPayload(course.questions))
        expect(attemptRes.status).toBe(201)
        expect(attemptRes.body.data.score).toBe(100)
        expect(attemptRes.body.data.passed).toBe(true)

        const progressRes = await request(app)
            .get(`/api/v1/courses/${course.courseId}/progress`)
            .set('Authorization', student.authHeader)
        expect(progressRes.status).toBe(200)
        expect(progressRes.body.data.percentage).toBe(100)

        const myCoursesAfter = await request(app)
            .get('/api/v1/my-courses')
            .set('Authorization', student.authHeader)
        const enrollment = myCoursesAfter.body.data[0]
        expect(enrollment.status).toBe('completed')
    })

    test('quiz answers are scored on the server from the submitted answers only', async () => {
        const course = await buildPublishedCourse({ passPercentage: 60 })
        const student = await createUser('student')
        await request(app)
            .post(`/api/v1/courses/${course.courseId}/enroll`)
            .set('Authorization', student.authHeader)

        const payload = correctAnswersPayload(course.questions)
        payload.answers[0].selectedOption = (payload.answers[0].selectedOption + 1) % 4

        const res = await request(app)
            .post(`/api/v1/quizzes/${course.quizId}/attempts`)
            .set('Authorization', student.authHeader)
            .send(payload)

        expect(res.status).toBe(201)
        expect(res.body.data.score).toBe(80)
    })

    test('enforces the attempt limit and keeps the best score', async () => {
        const course = await buildPublishedCourse({ passPercentage: 90, attemptLimit: 3 })
        const student = await createUser('student')
        await request(app)
            .post(`/api/v1/courses/${course.courseId}/enroll`)
            .set('Authorization', student.authHeader)

        const wrong = { answers: course.questions.map((q) => ({ questionId: q._id, selectedOption: (q.correctAnswer + 1) % 4 })) }
        const perfect = correctAnswersPayload(course.questions)

        const a1 = await request(app).post(`/api/v1/quizzes/${course.quizId}/attempts`).set('Authorization', student.authHeader).send(perfect)
        expect(a1.body.data.score).toBe(100)
        const a2 = await request(app).post(`/api/v1/quizzes/${course.quizId}/attempts`).set('Authorization', student.authHeader).send(wrong)
        expect(a2.body.data.score).toBe(0)
        expect(a2.body.data.bestScore).toBe(100)
        await request(app).post(`/api/v1/quizzes/${course.quizId}/attempts`).set('Authorization', student.authHeader).send(wrong)

        const a4 = await request(app).post(`/api/v1/quizzes/${course.quizId}/attempts`).set('Authorization', student.authHeader).send(perfect)
        expect(a4.status).toBe(400)
        expect(a4.body.message).toMatch(/attempt limit/i)
    })

    test('a student cannot enroll in a draft (unpublished) course', async () => {
        const admin = await createUser('admin')
        const instructor = await createUser('instructor')
        const categoryRes = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', admin.authHeader)
            .send({ name: `Draft Cat ${process.hrtime()[1]}` })
        const courseRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', instructor.authHeader)
            .send({ title: 'Draft Course', description: 'Not published yet', categoryId: categoryRes.body.data._id })

        const student = await createUser('student')
        const res = await request(app)
            .post(`/api/v1/courses/${courseRes.body.data._id}/enroll`)
            .set('Authorization', student.authHeader)

        expect(res.status).toBe(400)
    })

    test('a non-enrolled student cannot view the quiz', async () => {
        const course = await buildPublishedCourse()
        const student = await createUser('student')

        const res = await request(app)
            .get(`/api/v1/quizzes/${course.quizId}`)
            .set('Authorization', student.authHeader)

        expect(res.status).toBe(403)
    })

    test('a student must be enrolled to complete a lesson', async () => {
        const course = await buildPublishedCourse()
        const student = await createUser('student')

        const res = await request(app)
            .post(`/api/v1/lessons/${course.lessonId}/complete`)
            .set('Authorization', student.authHeader)

        expect(res.status).toBe(403)
    })

    test('reviews require enrollment, are one-per-course, and aggregate a rating', async () => {
        const course = await buildPublishedCourse()
        const student = await createUser('student')

        const unenrolledReview = await request(app)
            .post(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 5, comment: 'Great' })
        expect(unenrolledReview.status).toBe(403)

        await request(app)
            .post(`/api/v1/courses/${course.courseId}/enroll`)
            .set('Authorization', student.authHeader)

        const reviewRes = await request(app)
            .post(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 4, comment: 'Solid' })
        expect(reviewRes.status).toBe(201)

        const dupReview = await request(app)
            .post(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 3, comment: 'Changed my mind' })
        expect(dupReview.status).toBe(409)

        const listRes = await request(app).get(`/api/v1/courses/${course.courseId}/reviews`)
        expect(listRes.status).toBe(200)
        expect(listRes.body.data.totalReviews).toBe(1)
        expect(listRes.body.data.averageRating).toBe(4)
    })

    test('the instructor can see all attempts on their own quiz results', async () => {
        const course = await buildPublishedCourse()
        const student = await createUser('student')
        await request(app)
            .post(`/api/v1/courses/${course.courseId}/enroll`)
            .set('Authorization', student.authHeader)
        await request(app)
            .post(`/api/v1/quizzes/${course.quizId}/attempts`)
            .set('Authorization', student.authHeader)
            .send(correctAnswersPayload(course.questions))

        const res = await request(app)
            .get(`/api/v1/quizzes/${course.quizId}/results`)
            .set('Authorization', course.instructor.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.attempts.length).toBe(1)
    })
})
