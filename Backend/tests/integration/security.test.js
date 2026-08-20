const request = require('supertest')
const app = require('../../src/app')

describe('Security headers (helmet)', () => {
    test('sets X-Content-Type-Options and hides X-Powered-By', async () => {
        const res = await request(app).get('/api/v1/courses')

        expect(res.headers['x-content-type-options']).toBe('nosniff')
        expect(res.headers['x-powered-by']).toBeUndefined()
    })

    test('sets a frame-guard header', async () => {
        const res = await request(app).get('/api/v1/courses')
        expect(res.headers['x-frame-options']).toBeDefined()
    })
})

describe('CORS', () => {
    test('reflects an allowed origin and allows credentials', async () => {
        const res = await request(app)
            .get('/api/v1/courses')
            .set('Origin', 'http://localhost:5173')

        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
        expect(res.headers['access-control-allow-credentials']).toBe('true')
    })

    test('does not reflect a disallowed origin', async () => {
        const res = await request(app)
            .get('/api/v1/courses')
            .set('Origin', 'http://evil.example.com')

        expect(res.headers['access-control-allow-origin']).toBeUndefined()
    })
})
