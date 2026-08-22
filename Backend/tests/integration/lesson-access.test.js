const request = require('supertest')
const app = require('../../src/app')
const { createUser } = require('../helpers/factory')
const { buildPublishedCourse, enroll } = require('../helpers/scaffold')

describe('GET /courses/:id/sections — enrollment-gated content', () => {
    test('unauthenticated request gets outline only (no videoUrl or quiz)', async () => {
        const course = await buildPublishedCourse()
        const res = await request(app).get(`/api/v1/courses/${course.courseId}/sections`)

        expect(res.status).toBe(200)
        const lesson = res.body.data[0].lessons[0]
        expect(lesson.title).toBeDefined()
        expect(lesson.hasQuiz).toBe(true)
        expect(lesson.videoUrl).toBeUndefined()
        expect(lesson.quiz).toBeUndefined()
        expect(res.body.data[0].locked).toBe(true)
    })

    test('a non-enrolled student also gets outline only', async () => {
        const course = await buildPublishedCourse()
        const student = await createUser('student')
        const res = await request(app)
            .get(`/api/v1/courses/${course.courseId}/sections`)
            .set('Authorization', student.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data[0].lessons[0].videoUrl).toBeUndefined()
        expect(res.body.data[0].locked).toBe(true)
    })

    test('an enrolled student sees videoUrl and quiz', async () => {
        const course = await buildPublishedCourse()
        const student = await createUser('student')
        await enroll(course.courseId, student)

        const res = await request(app)
            .get(`/api/v1/courses/${course.courseId}/sections`)
            .set('Authorization', student.authHeader)

        expect(res.status).toBe(200)
        const lesson = res.body.data[0].lessons[0]
        expect(lesson.videoUrl).toBeDefined()
        expect(lesson.quiz).toBeDefined()
        expect(lesson.quiz._id).toBeDefined()
        expect(res.body.data[0].locked).toBe(false)
    })

    test('the owner instructor sees content without enrolling', async () => {
        const instructor = await createUser('instructor')
        const course = await buildPublishedCourse({ instructor })

        const res = await request(app)
            .get(`/api/v1/courses/${course.courseId}/sections`)
            .set('Authorization', instructor.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data[0].lessons[0].videoUrl).toBeDefined()
        expect(res.body.data[0].locked).toBe(false)
    })

    test('an admin sees content', async () => {
        const course = await buildPublishedCourse()
        const admin = await createUser('admin')

        const res = await request(app)
            .get(`/api/v1/courses/${course.courseId}/sections`)
            .set('Authorization', admin.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data[0].lessons[0].videoUrl).toBeDefined()
    })
})
