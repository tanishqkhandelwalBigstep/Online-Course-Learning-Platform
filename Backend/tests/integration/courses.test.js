const request = require('supertest')
const app = require('../../src/app')
const { createUser, buildLessonPayload } = require('../helpers/factory')

async function createCategory(){
    const admin = await createUser('admin')
    const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', admin.authHeader)
        .send({ name: `Category ${Date.now()}${Math.round(process.hrtime()[1])}`, description: 'desc' })
    return res.body.data._id
}

async function addSectionWithLesson(courseId, instructor, lessonOverrides){
    const sectionRes = await request(app)
        .post(`/api/v1/courses/${courseId}/sections`)
        .set('Authorization', instructor.authHeader)
        .send({ title: 'Section 1', order: 1 })
    const sectionId = sectionRes.body.data._id

    const lessonRes = await request(app)
        .post(`/api/v1/sections/${sectionId}/lessons`)
        .set('Authorization', instructor.authHeader)
        .send(buildLessonPayload(lessonOverrides))

    return { sectionId, lessonRes }
}

describe('Courses API', () => {
    test('an instructor creates a course as a draft', async () => {
        const categoryId = await createCategory()
        const instructor = await createUser('instructor')

        const res = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', instructor.authHeader)
            .send({ title: 'Node Basics', description: 'Learn Node from scratch', categoryId })

        expect(res.status).toBe(201)
        expect(res.body.data.status).toBe('draft')
    })

    test('rejects a course with an invalid category', async () => {
        const instructor = await createUser('instructor')
        const res = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', instructor.authHeader)
            .send({ title: 'Node Basics', description: 'Learn Node from scratch', categoryId: 'a'.repeat(24) })

        expect(res.status).toBe(400)
    })

    test('rejects a course with a missing description (validation)', async () => {
        const categoryId = await createCategory()
        const instructor = await createUser('instructor')
        const res = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', instructor.authHeader)
            .send({ title: 'Node Basics', categoryId })

        expect(res.status).toBe(400)
    })

    test('publishing fails when the course has no lessons', async () => {
        const categoryId = await createCategory()
        const instructor = await createUser('instructor')
        const courseRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', instructor.authHeader)
            .send({ title: 'Empty Course', description: 'Has no lessons yet', categoryId })

        const res = await request(app)
            .put(`/api/v1/courses/${courseRes.body.data._id}/publish`)
            .set('Authorization', instructor.authHeader)

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/at least one lesson/i)
    })

    test('publishing succeeds once the course has a lesson', async () => {
        const categoryId = await createCategory()
        const instructor = await createUser('instructor')
        const courseRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', instructor.authHeader)
            .send({ title: 'Real Course', description: 'Has a lesson', categoryId })
        const courseId = courseRes.body.data._id

        await addSectionWithLesson(courseId, instructor)

        const res = await request(app)
            .put(`/api/v1/courses/${courseId}/publish`)
            .set('Authorization', instructor.authHeader)

        expect(res.status).toBe(200)
        expect(res.body.data.status).toBe('published')
    })

    test('an instructor cannot publish another instructor\'s course', async () => {
        const categoryId = await createCategory()
        const owner = await createUser('instructor')
        const other = await createUser('instructor')
        const courseRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', owner.authHeader)
            .send({ title: 'Owned Course', description: 'Belongs to owner', categoryId })
        const courseId = courseRes.body.data._id
        await addSectionWithLesson(courseId, owner)

        const res = await request(app)
            .put(`/api/v1/courses/${courseId}/publish`)
            .set('Authorization', other.authHeader)

        expect(res.status).toBe(403)
    })

    test('an instructor cannot add a lesson to another instructor\'s course', async () => {
        const categoryId = await createCategory()
        const owner = await createUser('instructor')
        const other = await createUser('instructor')
        const courseRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', owner.authHeader)
            .send({ title: 'Owned Course', description: 'Belongs to owner', categoryId })
        const courseId = courseRes.body.data._id
        const sectionRes = await request(app)
            .post(`/api/v1/courses/${courseId}/sections`)
            .set('Authorization', owner.authHeader)
            .send({ title: 'Section 1', order: 1 })

        const res = await request(app)
            .post(`/api/v1/sections/${sectionRes.body.data._id}/lessons`)
            .set('Authorization', other.authHeader)
            .send(buildLessonPayload())

        expect(res.status).toBe(403)
    })

    test('creating a lesson requires exactly 5 quiz questions', async () => {
        const categoryId = await createCategory()
        const instructor = await createUser('instructor')
        const courseRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', instructor.authHeader)
            .send({ title: 'Course', description: 'A description', categoryId })
        const sectionRes = await request(app)
            .post(`/api/v1/courses/${courseRes.body.data._id}/sections`)
            .set('Authorization', instructor.authHeader)
            .send({ title: 'Section 1', order: 1 })

        const payload = buildLessonPayload()
        payload.quiz.questions = payload.quiz.questions.slice(0, 4)

        const res = await request(app)
            .post(`/api/v1/sections/${sectionRes.body.data._id}/lessons`)
            .set('Authorization', instructor.authHeader)
            .send(payload)

        expect(res.status).toBe(400)
    })

    test('GET /courses returns only published courses', async () => {
        const categoryId = await createCategory()
        const instructor = await createUser('instructor')

        const publishedRes = await request(app)
            .post('/api/v1/courses')
            .set('Authorization', instructor.authHeader)
            .send({ title: 'Published One', description: 'Will be published', categoryId })
        await addSectionWithLesson(publishedRes.body.data._id, instructor)
        await request(app)
            .put(`/api/v1/courses/${publishedRes.body.data._id}/publish`)
            .set('Authorization', instructor.authHeader)

        await request(app)
            .post('/api/v1/courses')
            .set('Authorization', instructor.authHeader)
            .send({ title: 'Draft One', description: 'Stays a draft', categoryId })

        const res = await request(app).get('/api/v1/courses')
        expect(res.status).toBe(200)
        const titles = res.body.data.map((course) => course.title)
        expect(titles).toContain('Published One')
        expect(titles).not.toContain('Draft One')
    })
})
