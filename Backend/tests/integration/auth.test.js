const request = require('supertest')
const app = require('../../src/app')
const { createUser } = require('../helpers/factory')

describe('Auth API', () => {
    describe('POST /api/v1/auth/register', () => {
        test('registers a new student and returns a token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' })

            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
            expect(res.body.data.token).toBeDefined()
            expect(res.body.data.user.role).toBe('student')
            expect(res.body.data.user.email).toBe('alice@test.com')
            expect(res.headers['set-cookie'][0]).toMatch(/accessToken/)
        })

        test('rejects an attempt to self-assign a role at registration', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Mallory', email: 'mallory@test.com', password: 'password123', role: 'admin' })

            expect(res.status).toBe(400)
        })

        test('a plain registration produces a student role', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Carol', email: 'carol@test.com', password: 'password123' })

            expect(res.status).toBe(201)
            expect(res.body.data.user.role).toBe('student')
        })

        test('rejects a duplicate email with 409', async () => {
            await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Bob', email: 'bob@test.com', password: 'password123' })

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Bob Again', email: 'bob@test.com', password: 'password123' })

            expect(res.status).toBe(409)
            expect(res.body.success).toBe(false)
        })

        test('rejects an invalid body with 400', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'X', email: 'not-an-email', password: '123' })

            expect(res.status).toBe(400)
            expect(res.body.success).toBe(false)
        })
    })

    describe('POST /api/v1/auth/login', () => {
        test('logs in with correct credentials', async () => {
            const student = await createUser('student', { email: 'login@test.com', password: 'secret123' })

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: student.email, password: 'secret123' })

            expect(res.status).toBe(200)
            expect(res.body.data.token).toBeDefined()
            expect(res.body.data.user.email).toBe('login@test.com')
        })

        test('rejects a wrong password with 401', async () => {
            const student = await createUser('student', { email: 'wrong@test.com', password: 'secret123' })

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: student.email, password: 'incorrect' })

            expect(res.status).toBe(401)
        })

        test('rejects an unknown email with 401', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'ghost@test.com', password: 'whatever' })

            expect(res.status).toBe(401)
        })
    })

    describe('POST /api/v1/auth/logout', () => {
        test('requires authentication', async () => {
            const res = await request(app).post('/api/v1/auth/logout')
            expect(res.status).toBe(401)
        })

        test('logs out an authenticated user', async () => {
            const student = await createUser('student')
            const res = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', student.authHeader)

            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    test('GET /health returns ok', async () => {
        const res = await request(app).get('/health')
        expect(res.status).toBe(200)
        expect(res.body.status).toBe('ok')
    })

    test('unknown routes return a 404 in the standard error shape', async () => {
        const res = await request(app).get('/api/v1/does-not-exist')
        expect(res.status).toBe(404)
        expect(res.body.success).toBe(false)
    })
})
