const request = require('supertest')
const app = require('../../src/app')
const { createUser } = require('../helpers/factory')
const Course = require('../../src/modules/courses/courses.model')
const Category = require('../../src/modules/categories/categories.model')

async function seedPublishedCourses(titles, options = {}){
    const instructor = options.instructor || (await createUser('instructor'))
    const category = options.category || (await Category.create({ name: `Cat ${Date.now()}${process.hrtime()[1]}` }))
    const docs = titles.map((entry) => {
        const title = typeof entry === 'string' ? entry : entry.title
        const description = typeof entry === 'string' ? `${entry} description` : entry.description
        return {
            instructorId: instructor.id,
            categoryId: category._id,
            title,
            description,
            status: 'published'
        }
    })
    const created = await Course.insertMany(docs)
    return { instructor, category, courses: created }
}

describe('GET /api/v1/courses pagination', () => {
    test('returns pagination metadata alongside the data array', async () => {
        await seedPublishedCourses(['A', 'B', 'C'])

        const res = await request(app).get('/api/v1/courses')

        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.data)).toBe(true)
        expect(res.body.data.length).toBe(3)
        expect(res.body.meta.pagination).toMatchObject({
            total: 3,
            page: 1,
            limit: 10,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
        })
    })

    test('honours page and limit', async () => {
        await seedPublishedCourses(['A', 'B', 'C', 'D', 'E'])

        const page1 = await request(app).get('/api/v1/courses?page=1&limit=2')
        expect(page1.body.data.length).toBe(2)
        expect(page1.body.meta.pagination.total).toBe(5)
        expect(page1.body.meta.pagination.totalPages).toBe(3)
        expect(page1.body.meta.pagination.hasNextPage).toBe(true)
        expect(page1.body.meta.pagination.hasPrevPage).toBe(false)

        const page2 = await request(app).get('/api/v1/courses?page=2&limit=2')
        expect(page2.body.data.length).toBe(2)
        expect(page2.body.meta.pagination.hasNextPage).toBe(true)
        expect(page2.body.meta.pagination.hasPrevPage).toBe(true)

        const page3 = await request(app).get('/api/v1/courses?page=3&limit=2')
        expect(page3.body.data.length).toBe(1)
        expect(page3.body.meta.pagination.hasNextPage).toBe(false)
        expect(page3.body.meta.pagination.hasPrevPage).toBe(true)
    })

    test('does not return the same course across pages', async () => {
        await seedPublishedCourses(['A', 'B', 'C', 'D'])

        const page1 = await request(app).get('/api/v1/courses?page=1&limit=2')
        const page2 = await request(app).get('/api/v1/courses?page=2&limit=2')

        const ids1 = page1.body.data.map((c) => c._id)
        const ids2 = page2.body.data.map((c) => c._id)
        expect(ids1.some((id) => ids2.includes(id))).toBe(false)
    })

    test('caps limit at 100', async () => {
        await seedPublishedCourses(['A'])
        const res = await request(app).get('/api/v1/courses?limit=1000')
        expect(res.body.meta.pagination.limit).toBe(100)
    })

    test('falls back to defaults for invalid page and limit', async () => {
        await seedPublishedCourses(['A'])
        const res = await request(app).get('/api/v1/courses?page=abc&limit=-5')
        expect(res.body.meta.pagination.page).toBe(1)
        expect(res.body.meta.pagination.limit).toBe(10)
    })
})

describe('GET /api/v1/courses search and filter', () => {
    test('searches by title (case-insensitive)', async () => {
        await seedPublishedCourses(['JavaScript Basics', 'Python Intro', 'Advanced JavaScript'])

        const res = await request(app).get('/api/v1/courses?search=javascript')

        expect(res.body.meta.pagination.total).toBe(2)
        res.body.data.forEach((course) => {
            expect(course.title.toLowerCase()).toContain('javascript')
        })
    })

    test('searches by description', async () => {
        await seedPublishedCourses([
            { title: 'Ops Course', description: 'Learn kubernetes and containers' },
            { title: 'Other Course', description: 'Unrelated content here' }
        ])

        const res = await request(app).get('/api/v1/courses?search=kubernetes')

        expect(res.body.meta.pagination.total).toBe(1)
        expect(res.body.data[0].title).toBe('Ops Course')
    })

    test('filters by category', async () => {
        const first = await seedPublishedCourses(['One', 'Two'])
        await seedPublishedCourses(['Three'])

        const res = await request(app).get(`/api/v1/courses?category=${first.category._id.toString()}`)

        expect(res.body.meta.pagination.total).toBe(2)
    })

    test('handles regex special characters in search safely', async () => {
        await seedPublishedCourses(['Normal Course'])
        const res = await request(app).get('/api/v1/courses?search=' + encodeURIComponent('java(script'))
        expect(res.status).toBe(200)
        expect(res.body.meta.pagination.total).toBe(0)
    })
})

describe('Pagination on other list endpoints', () => {
    test('GET /admin/users paginates and filters by role', async () => {
        const admin = await createUser('admin')
        await createUser('student')
        await createUser('student')
        await createUser('instructor')

        const students = await request(app)
            .get('/api/v1/admin/users?role=student')
            .set('Authorization', admin.authHeader)
        expect(students.status).toBe(200)
        expect(students.body.meta.pagination.total).toBe(2)
        students.body.data.forEach((user) => expect(user.role).toBe('student'))

        const limited = await request(app)
            .get('/api/v1/admin/users?limit=1')
            .set('Authorization', admin.authHeader)
        expect(limited.body.data.length).toBe(1)
        expect(limited.body.meta.pagination.total).toBeGreaterThanOrEqual(4)
    })

    test('GET /my-courses paginates enrolled courses', async () => {
        const { courses } = await seedPublishedCourses(['Course One', 'Course Two'])
        const student = await createUser('student')
        for (const course of courses){
            await request(app)
                .post(`/api/v1/courses/${course._id.toString()}/enroll`)
                .set('Authorization', student.authHeader)
        }

        const res = await request(app)
            .get('/api/v1/my-courses?limit=1')
            .set('Authorization', student.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.length).toBe(1)
        expect(res.body.meta.pagination.total).toBe(2)
    })

    test('GET /courses/:id/reviews paginates while keeping the rating summary', async () => {
        const { courses } = await seedPublishedCourses(['Reviewed Course'])
        const courseId = courses[0]._id.toString()

        const studentA = await createUser('student')
        const studentB = await createUser('student')
        for (const student of [studentA, studentB]){
            await request(app).post(`/api/v1/courses/${courseId}/enroll`).set('Authorization', student.authHeader)
        }
        await request(app).post(`/api/v1/courses/${courseId}/reviews`).set('Authorization', studentA.authHeader).send({ rating: 4 })
        await request(app).post(`/api/v1/courses/${courseId}/reviews`).set('Authorization', studentB.authHeader).send({ rating: 2 })

        const res = await request(app).get(`/api/v1/courses/${courseId}/reviews?limit=1`)

        expect(res.status).toBe(200)
        expect(res.body.data.reviews.length).toBe(1)
        expect(res.body.data.totalReviews).toBe(2)
        expect(res.body.data.averageRating).toBe(3)
        expect(res.body.meta.pagination.total).toBe(2)
    })
})
