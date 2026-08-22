const request = require('supertest')
const app = require('../../src/app')
const { createUser, buildLessonPayload } = require('../helpers/factory')
const { buildPublishedCourse, enroll, correctAnswersPayload, addSection } = require('../helpers/scaffold')
const Quiz = require('../../src/modules/quizzes/quizzes.model')
const Question = require('../../src/modules/questions/questions.model')
const QuizAttempt = require('../../src/modules/quizAttempts/quizAttempts.model')
const Progress = require('../../src/modules/progress/progress.model')

async function seedLessonWithActivity(){
    const course = await buildPublishedCourse()
    const student = await createUser('student')
    await enroll(course.courseId, student)
    await request(app)
        .post(`/api/v1/lessons/${course.lessonId}/complete`)
        .set('Authorization', student.authHeader)
    await request(app)
        .post(`/api/v1/quizzes/${course.quizId}/attempts`)
        .set('Authorization', student.authHeader)
        .send(correctAnswersPayload(course.questions))
    return { course, student }
}

describe('Lesson creation edge cases', () => {
    test('rejects a correctAnswer index that is out of range', async () => {
        const admin = await createUser('admin')
        const instructor = await createUser('instructor')
        const categoryRes = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', admin.authHeader)
            .send({ name: `Range Cat ${process.hrtime()[1]}` })
        const courseRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', instructor.authHeader)
            .send({ title: 'Range Course', description: 'Course description', categoryId: categoryRes.body.data._id, thumbnailUrl: 'https://cdn.colearn.test/thumb.jpg' })
        const sectionId = await addSection(courseRes.body.data._id, instructor)

        const payload = buildLessonPayload()
        payload.quiz.questions[0].correctAnswer = 9

        const res = await request(app)
            .post(`/api/v1/sections/${sectionId}/lessons`)
            .set('Authorization', instructor.authHeader)
            .send(payload)

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/out of range/i)
    })

    test('returns 404 when adding a lesson to a non-existent section', async () => {
        const instructor = await createUser('instructor')
        const res = await request(app)
            .post(`/api/v1/sections/${'a'.repeat(24)}/lessons`)
            .set('Authorization', instructor.authHeader)
            .send(buildLessonPayload())

        expect(res.status).toBe(404)
    })
})

describe('DELETE /api/v1/lessons/:id (cascade)', () => {
    test('deleting a lesson cascades to its quiz, questions, attempts and progress', async () => {
        const { course } = await seedLessonWithActivity()

        expect(await Quiz.countDocuments({ _id: course.quizId })).toBe(1)
        expect(await Question.countDocuments({ quizId: course.quizId })).toBe(5)
        expect(await QuizAttempt.countDocuments({ quizId: course.quizId })).toBe(1)
        expect(await Progress.countDocuments({ lessonId: course.lessonId })).toBe(1)

        const res = await request(app)
            .delete(`/api/v1/lessons/${course.lessonId}`)
            .set('Authorization', course.instructor.authHeader)

        expect(res.status).toBe(200)
        expect(await Quiz.countDocuments({ _id: course.quizId })).toBe(0)
        expect(await Question.countDocuments({ quizId: course.quizId })).toBe(0)
        expect(await QuizAttempt.countDocuments({ quizId: course.quizId })).toBe(0)
        expect(await Progress.countDocuments({ lessonId: course.lessonId })).toBe(0)
    })

    test('an admin can delete any instructor\'s lesson', async () => {
        const course = await buildPublishedCourse()
        const admin = await createUser('admin')

        const res = await request(app)
            .delete(`/api/v1/lessons/${course.lessonId}`)
            .set('Authorization', admin.authHeader)

        expect(res.status).toBe(200)
    })

    test('a non-owner instructor cannot delete the lesson', async () => {
        const course = await buildPublishedCourse()
        const other = await createUser('instructor')

        const res = await request(app)
            .delete(`/api/v1/lessons/${course.lessonId}`)
            .set('Authorization', other.authHeader)

        expect(res.status).toBe(403)
        expect(await Quiz.countDocuments({ _id: course.quizId })).toBe(1)
    })

    test('a student cannot delete a lesson', async () => {
        const course = await buildPublishedCourse()
        const student = await createUser('student')

        const res = await request(app)
            .delete(`/api/v1/lessons/${course.lessonId}`)
            .set('Authorization', student.authHeader)

        expect(res.status).toBe(403)
    })
})

describe('DELETE /api/v1/quizzes/:id (cascade)', () => {
    test('deleting a quiz cascades to its questions and attempts', async () => {
        const { course } = await seedLessonWithActivity()

        const res = await request(app)
            .delete(`/api/v1/quizzes/${course.quizId}`)
            .set('Authorization', course.instructor.authHeader)

        expect(res.status).toBe(200)
        expect(await Quiz.countDocuments({ _id: course.quizId })).toBe(0)
        expect(await Question.countDocuments({ quizId: course.quizId })).toBe(0)
        expect(await QuizAttempt.countDocuments({ quizId: course.quizId })).toBe(0)
    })

    test('a non-owner instructor cannot delete the quiz', async () => {
        const course = await buildPublishedCourse()
        const other = await createUser('instructor')

        const res = await request(app)
            .delete(`/api/v1/quizzes/${course.quizId}`)
            .set('Authorization', other.authHeader)

        expect(res.status).toBe(403)
    })
})
