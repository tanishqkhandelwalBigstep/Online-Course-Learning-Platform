const request = require('supertest')
const app = require('../../src/app')
const { createUser } = require('../helpers/factory')

describe('Auth API', () => {
    describe('POST /api/v1/auth/register', () => {
        test('registers a new student and returns access and refresh tokens', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Alice', email: 'alice@test.com', password: 'password1!' })

            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
            expect(res.body.data.accessToken).toBeDefined()
            expect(res.body.data.refreshToken).toBeDefined()
            expect(res.body.data.user.role).toBe('student')
            expect(res.body.data.user.email).toBe('alice@test.com')
            const cookies = res.headers['set-cookie'].join(';')
            expect(cookies).toMatch(/accessToken/)
            expect(cookies).toMatch(/refreshToken/)
        })

        test('rejects an attempt to self-assign a role at registration', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Mallory', email: 'mallory@test.com', password: 'password1!', role: 'admin' })

            expect(res.status).toBe(400)
        })

        test('a plain registration produces a student role', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Carol', email: 'carol@test.com', password: 'password1!' })

            expect(res.status).toBe(201)
            expect(res.body.data.user.role).toBe('student')
        })

        test('rejects a duplicate email with 409', async () => {
            await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Bob', email: 'bob@test.com', password: 'password1!' })

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Bob Again', email: 'bob@test.com', password: 'password1!' })

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

        test('rejects a password without a number or special character', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Weak Pass', email: 'weak@test.com', password: 'password' })

            expect(res.status).toBe(400)
            expect(res.body.message).toMatch(/number and one special character/i)
        })

        test('accepts a password containing a number and a special character', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ name: 'Strong Pass', email: 'strong@test.com', password: 'Passw0rd!' })

            expect(res.status).toBe(201)
        })
    })

    describe('POST /api/v1/auth/login', () => {
        test('logs in with correct credentials', async () => {
            const student = await createUser('student', { email: 'login@test.com', password: 'secret123' })

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: student.email, password: 'secret123' })

            expect(res.status).toBe(200)
            expect(res.body.data.accessToken).toBeDefined()
            expect(res.body.data.refreshToken).toBeDefined()
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

    describe('POST /api/v1/auth/refresh', () => {
        async function loginAndGetRefreshToken(){
            const student = await createUser('student', { email: `refresh${Date.now()}@test.com`, password: 'secret123' })
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: student.email, password: 'secret123' })
            return res.body.data.refreshToken
        }

        test('issues a new access token from a valid refresh token', async () => {
            const refreshToken = await loginAndGetRefreshToken()

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken })

            expect(res.status).toBe(200)
            expect(res.body.data.accessToken).toBeDefined()
            expect(res.body.data.refreshToken).toBeDefined()
            expect(res.body.data.refreshToken).not.toBe(refreshToken)
        })

        test('rejects a request with no refresh token', async () => {
            const res = await request(app).post('/api/v1/auth/refresh').send({})
            expect(res.status).toBe(401)
        })

        test('rejects a malformed refresh token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'not.a.token' })
            expect(res.status).toBe(401)
        })

        test('rotates the refresh token: the old one cannot be reused', async () => {
            const refreshToken = await loginAndGetRefreshToken()

            const first = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken })
            expect(first.status).toBe(200)

            const reuse = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken })
            expect(reuse.status).toBe(401)
        })

        test('reusing a rotated token also invalidates the newly issued one (reuse detection)', async () => {
            const refreshToken = await loginAndGetRefreshToken()

            const rotated = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken })
            const newRefreshToken = rotated.body.data.refreshToken

            await request(app).post('/api/v1/auth/refresh').send({ refreshToken })

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: newRefreshToken })
            expect(res.status).toBe(401)
        })
    })

    describe('POST /api/v1/auth/logout', () => {
        test('succeeds even without a token and clears cookies', async () => {
            const res = await request(app).post('/api/v1/auth/logout')
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        test('revokes the refresh token so it can no longer be refreshed', async () => {
            const student = await createUser('student', { email: `logout${Date.now()}@test.com`, password: 'secret123' })
            const login = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: student.email, password: 'secret123' })
            const refreshToken = login.body.data.refreshToken

            const out = await request(app)
                .post('/api/v1/auth/logout')
                .send({ refreshToken })
            expect(out.status).toBe(200)

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken })
            expect(res.status).toBe(401)
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
