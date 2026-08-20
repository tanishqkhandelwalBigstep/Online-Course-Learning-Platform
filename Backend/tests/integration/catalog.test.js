const request = require('supertest')
const app = require('../../src/app')
const { createUser } = require('../helpers/factory')
const { buildPublishedCourse, createCategory } = require('../helpers/scaffold')

describe('Categories API', () => {
    test('GET /categories is public and lists categories', async () => {
        const admin = await createUser('admin')
        await createCategory(admin)

        const res = await request(app).get('/api/v1/categories')

        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.data)).toBe(true)
        expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    })

    test('rejects a duplicate category name with 409', async () => {
        const admin = await createUser('admin')
        await request(app)
            .post('/api/v1/categories')
            .set('Authorization', admin.authHeader)
            .send({ name: 'Unique Cat', description: 'first' })

        const res = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', admin.authHeader)
            .send({ name: 'Unique Cat', description: 'second' })

        expect(res.status).toBe(409)
    })

    test('rejects a category with a too-short name (validation)', async () => {
        const admin = await createUser('admin')
        const res = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', admin.authHeader)
            .send({ name: 'X' })

        expect(res.status).toBe(400)
    })
})

describe('Public course catalog reads', () => {
    test('GET /courses/:id returns a single course', async () => {
        const course = await buildPublishedCourse()

        const res = await request(app).get(`/api/v1/courses/${course.courseId}`)

        expect(res.status).toBe(200)
        expect(res.body.data._id).toBe(course.courseId)
    })

    test('GET /courses/:id returns 404 for a missing course', async () => {
        const res = await request(app).get(`/api/v1/courses/${'a'.repeat(24)}`)
        expect(res.status).toBe(404)
    })

    test('GET /courses/:id returns 400 for a malformed id', async () => {
        const res = await request(app).get('/api/v1/courses/not-a-valid-id')
        expect(res.status).toBe(400)
    })

    test('GET /courses/:id/sections returns sections with their lessons', async () => {
        const course = await buildPublishedCourse()

        const res = await request(app).get(`/api/v1/courses/${course.courseId}/sections`)

        expect(res.status).toBe(200)
        expect(res.body.data.length).toBe(1)
        expect(res.body.data[0].lessons.length).toBe(1)
    })
})
