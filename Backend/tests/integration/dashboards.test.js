const request = require('supertest')
const app = require('../../src/app')
const { createUser } = require('../helpers/factory')
const { buildPublishedCourse, enroll } = require('../helpers/scaffold')

describe('Instructor dashboard', () => {
    test('overview reports course and enrollment totals for the instructor', async () => {
        const instructor = await createUser('instructor')
        const course = await buildPublishedCourse({ instructor })
        const student = await createUser('student')
        await enroll(course.courseId, student)

        const res = await request(app)
            .get('/api/v1/instructor/overview')
            .set('Authorization', instructor.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.totalCourses).toBe(1)
        expect(res.body.data.publishedCourses).toBe(1)
        expect(res.body.data.draftCourses).toBe(0)
        expect(res.body.data.totalEnrollments).toBe(1)
    })

    test('courses list includes section, lesson and enrollment counts', async () => {
        const instructor = await createUser('instructor')
        const course = await buildPublishedCourse({ instructor })
        const student = await createUser('student')
        await enroll(course.courseId, student)

        const res = await request(app)
            .get('/api/v1/instructor/courses')
            .set('Authorization', instructor.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.length).toBe(1)
        expect(res.body.data[0].sectionCount).toBe(1)
        expect(res.body.data[0].lessonCount).toBe(1)
        expect(res.body.data[0].enrollmentCount).toBe(1)
    })

    test('course detail returns the nested sections -> lessons -> quiz -> questions tree', async () => {
        const instructor = await createUser('instructor')
        const course = await buildPublishedCourse({ instructor })

        const res = await request(app)
            .get(`/api/v1/instructor/courses/${course.courseId}`)
            .set('Authorization', instructor.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.sections.length).toBe(1)
        const firstLesson = res.body.data.sections[0].lessons[0]
        expect(firstLesson.quiz).toBeDefined()
        expect(firstLesson.questions.length).toBe(5)
    })

    test('an instructor cannot view another instructor\'s course detail', async () => {
        const course = await buildPublishedCourse()
        const other = await createUser('instructor')

        const res = await request(app)
            .get(`/api/v1/instructor/courses/${course.courseId}`)
            .set('Authorization', other.authHeader)

        expect(res.status).toBe(403)
    })

    test('an admin can view any instructor\'s course detail', async () => {
        const course = await buildPublishedCourse()
        const admin = await createUser('admin')

        const res = await request(app)
            .get(`/api/v1/instructor/courses/${course.courseId}`)
            .set('Authorization', admin.authHeader)

        expect(res.status).toBe(200)
    })
})

describe('Admin dashboard', () => {
    test('overview aggregates users by role, course and enrollment counts', async () => {
        const instructor = await createUser('instructor')
        const course = await buildPublishedCourse({ instructor })
        const student = await createUser('student')
        await enroll(course.courseId, student)

        const res = await request(app)
            .get('/api/v1/admin/overview')
            .set('Authorization', course.admin.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.users.total).toBeGreaterThanOrEqual(3)
        expect(res.body.data.users.instructors).toBeGreaterThanOrEqual(1)
        expect(res.body.data.users.students).toBeGreaterThanOrEqual(1)
        expect(res.body.data.courses.total).toBe(1)
        expect(res.body.data.courses.published).toBe(1)
        expect(res.body.data.totalEnrollments).toBe(1)
        expect(res.body.data.totalCategories).toBeGreaterThanOrEqual(1)
    })

    test('users list returns users without passwords', async () => {
        const admin = await createUser('admin')
        await createUser('student')

        const res = await request(app)
            .get('/api/v1/admin/users')
            .set('Authorization', admin.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.length).toBeGreaterThanOrEqual(2)
        res.body.data.forEach((user) => {
            expect(user.password).toBeUndefined()
        })
    })

    test('courses list returns courses of any status', async () => {
        const admin = await createUser('admin')
        const instructor = await createUser('instructor')
        await buildPublishedCourse({ instructor })
        await buildPublishedCourse({ instructor, publish: false })

        const res = await request(app)
            .get('/api/v1/admin/courses')
            .set('Authorization', admin.authHeader)

        expect(res.status).toBe(200)
        const statuses = res.body.data.map((course) => course.status)
        expect(statuses).toContain('published')
        expect(statuses).toContain('draft')
    })

    test('rejects a duplicate email when admin creates a user', async () => {
        const admin = await createUser('admin')
        await request(app)
            .post('/api/v1/admin/users')
            .set('Authorization', admin.authHeader)
            .send({ name: 'Dup', email: 'dup@test.com', password: 'password123', role: 'instructor' })

        const res = await request(app)
            .post('/api/v1/admin/users')
            .set('Authorization', admin.authHeader)
            .send({ name: 'Dup2', email: 'dup@test.com', password: 'password123', role: 'student' })

        expect(res.status).toBe(409)
    })
})
