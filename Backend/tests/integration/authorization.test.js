const request = require('supertest')
const app = require('../../src/app')
const { createUser } = require('../helpers/factory')

describe('Authorization / RBAC', () => {
    test('creating a course requires authentication', async () => {
        const res = await request(app)
            .post('/api/v1/courses')
            .send({ title: 'A course', description: 'A description here', categoryId: 'a'.repeat(24) })

        expect(res.status).toBe(401)
    })

    test('a student cannot create a course (instructor only)', async () => {
        const student = await createUser('student')
        const res = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', student.authHeader)
            .send({ title: 'A course', description: 'A description here', categoryId: 'a'.repeat(24) })

        expect(res.status).toBe(403)
    })

    test('an instructor cannot create a category (admin only)', async () => {
        const instructor = await createUser('instructor')
        const res = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', instructor.authHeader)
            .send({ name: 'Programming' })

        expect(res.status).toBe(403)
    })

    test('a student cannot access the admin overview', async () => {
        const student = await createUser('student')
        const res = await request(app)
            .get('/api/v1/admin/overview')
            .set('Authorization', student.authHeader)

        expect(res.status).toBe(403)
    })

    test('a student cannot access the instructor overview', async () => {
        const student = await createUser('student')
        const res = await request(app)
            .get('/api/v1/instructor/overview')
            .set('Authorization', student.authHeader)

        expect(res.status).toBe(403)
    })

    test('an admin can create a category', async () => {
        const admin = await createUser('admin')
        const res = await request(app)
            .post('/api/v1/categories')
            .set('Authorization', admin.authHeader)
            .send({ name: 'Programming', description: 'Code' })

        expect(res.status).toBe(201)
        expect(res.body.data.name).toBe('Programming')
    })

    test('an admin can create an instructor account', async () => {
        const admin = await createUser('admin')
        const res = await request(app)
            .post('/api/v1/admin/users')
            .set('Authorization', admin.authHeader)
            .send({ name: 'New Instructor', email: 'newinstructor@test.com', password: 'password123', role: 'instructor' })

        expect(res.status).toBe(201)
        expect(res.body.data.role).toBe('instructor')
    })

    test('an invalid token is rejected with 401', async () => {
        const res = await request(app)
            .get('/api/v1/instructor/overview')
            .set('Authorization', 'Bearer not.a.real.token')

        expect(res.status).toBe(401)
    })
})
