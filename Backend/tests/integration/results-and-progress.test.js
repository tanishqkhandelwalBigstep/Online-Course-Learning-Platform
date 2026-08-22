const request = require('supertest')
const app = require('../../src/app')
const { createUser } = require('../helpers/factory')
const { buildPublishedCourse, enroll, correctAnswersPayload } = require('../helpers/scaffold')

describe('Quiz results', () => {
    test('a student sees only their own attempts and best score', async () => {
        const course = await buildPublishedCourse({ passPercentage: 60 })
        const student = await createUser('student')
        await enroll(course.courseId, student)

        await request(app)
            .post(`/api/v1/quizzes/${course.quizId}/attempts`)
            .set('Authorization', student.authHeader)
            .send(correctAnswersPayload(course.questions))

        const res = await request(app)
            .get(`/api/v1/quizzes/${course.quizId}/results`)
            .set('Authorization', student.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.attempts.length).toBe(1)
        expect(res.body.data.bestScore).toBe(100)
        expect(res.body.data.passed).toBe(true)
        expect(res.body.data.attemptLimit).toBeDefined()
    })

    test('an instructor sees all attempts for their own quiz', async () => {
        const instructor = await createUser('instructor')
        const course = await buildPublishedCourse({ instructor })
        const studentA = await createUser('student')
        const studentB = await createUser('student')
        await enroll(course.courseId, studentA)
        await enroll(course.courseId, studentB)
        await request(app).post(`/api/v1/quizzes/${course.quizId}/attempts`).set('Authorization', studentA.authHeader).send(correctAnswersPayload(course.questions))
        await request(app).post(`/api/v1/quizzes/${course.quizId}/attempts`).set('Authorization', studentB.authHeader).send(correctAnswersPayload(course.questions))

        const res = await request(app)
            .get(`/api/v1/quizzes/${course.quizId}/results`)
            .set('Authorization', instructor.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.attempts.length).toBe(2)
    })

    test('an instructor cannot see results for another instructor\'s quiz', async () => {
        const course = await buildPublishedCourse()
        const other = await createUser('instructor')

        const res = await request(app)
            .get(`/api/v1/quizzes/${course.quizId}/results`)
            .set('Authorization', other.authHeader)

        expect(res.status).toBe(403)
    })
})

describe('Course progress viewing', () => {
    test('an instructor can view a specific student\'s progress via ?studentId', async () => {
        const instructor = await createUser('instructor')
        const course = await buildPublishedCourse({ instructor })
        const student = await createUser('student')
        await enroll(course.courseId, student)
        await request(app)
            .post(`/api/v1/lessons/${course.lessonId}/complete`)
            .set('Authorization', student.authHeader)

        const res = await request(app)
            .get(`/api/v1/courses/${course.courseId}/progress?studentId=${student.id}`)
            .set('Authorization', instructor.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.completedRequiredLessons).toBe(1)
    })

    test('an instructor viewing progress without studentId gets 400', async () => {
        const instructor = await createUser('instructor')
        const course = await buildPublishedCourse({ instructor })

        const res = await request(app)
            .get(`/api/v1/courses/${course.courseId}/progress`)
            .set('Authorization', instructor.authHeader)

        expect(res.status).toBe(400)
    })

    test('an instructor cannot view progress for another instructor\'s course', async () => {
        const course = await buildPublishedCourse()
        const student = await createUser('student')
        await enroll(course.courseId, student)
        const other = await createUser('instructor')

        const res = await request(app)
            .get(`/api/v1/courses/${course.courseId}/progress?studentId=${student.id}`)
            .set('Authorization', other.authHeader)

        expect(res.status).toBe(403)
    })

    test('a student sees their own progress without needing a query param', async () => {
        const course = await buildPublishedCourse()
        const student = await createUser('student')
        await enroll(course.courseId, student)

        const res = await request(app)
            .get(`/api/v1/courses/${course.courseId}/progress`)
            .set('Authorization', student.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.percentage).toBe(0)
    })
})
