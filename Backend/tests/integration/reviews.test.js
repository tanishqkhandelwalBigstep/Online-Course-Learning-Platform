const request = require('supertest')
const app = require('../../src/app')
const { createUser } = require('../helpers/factory')
const { buildPublishedCourse, enroll } = require('../helpers/scaffold')

async function enrolledStudent(course) {
    const student = await createUser('student')
    await enroll(course.courseId, student)
    return student
}

describe('Reviews — rating only (1-5)', () => {
    test('an enrolled student can add a rating', async () => {
        const course = await buildPublishedCourse()
        const student = await enrolledStudent(course)
        const res = await request(app)
            .post(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 4 })
        expect(res.status).toBe(201)
        expect(res.body.data.rating).toBe(4)
    })

    test('rejects a rating outside 1-5', async () => {
        const course = await buildPublishedCourse()
        const student = await enrolledStudent(course)
        const res = await request(app)
            .post(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 7 })
        expect(res.status).toBe(400)
    })

    test('ignores/rejects a text comment (rating-only)', async () => {
        const course = await buildPublishedCourse()
        const student = await enrolledStudent(course)
        const res = await request(app)
            .post(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 5, comment: 'should not be allowed' })
        expect(res.status).toBe(400)
    })

    test('a non-enrolled student cannot review', async () => {
        const course = await buildPublishedCourse()
        const student = await createUser('student')
        const res = await request(app)
            .post(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 3 })
        expect(res.status).toBe(403)
    })

    test('one review per course (duplicate rejected)', async () => {
        const course = await buildPublishedCourse()
        const student = await enrolledStudent(course)
        await request(app)
            .post(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 4 })
        const dup = await request(app)
            .post(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 2 })
        expect(dup.status).toBe(409)
    })

    test('a student can update their own rating', async () => {
        const course = await buildPublishedCourse()
        const student = await enrolledStudent(course)
        await request(app)
            .post(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 2 })
        const res = await request(app)
            .put(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 5 })
        expect(res.status).toBe(200)
        expect(res.body.data.rating).toBe(5)
    })

    test('updating without an existing review returns 404', async () => {
        const course = await buildPublishedCourse()
        const student = await enrolledStudent(course)
        const res = await request(app)
            .put(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 5 })
        expect(res.status).toBe(404)
    })

    test('a student can delete their own rating', async () => {
        const course = await buildPublishedCourse()
        const student = await enrolledStudent(course)
        await request(app)
            .post(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
            .send({ rating: 3 })
        const res = await request(app)
            .delete(`/api/v1/courses/${course.courseId}/reviews`)
            .set('Authorization', student.authHeader)
        expect(res.status).toBe(200)
    })

    test('GET reviews returns average, total and a paginated list', async () => {
        const course = await buildPublishedCourse()
        const s1 = await enrolledStudent(course)
        const s2 = await enrolledStudent(course)
        await request(app).post(`/api/v1/courses/${course.courseId}/reviews`).set('Authorization', s1.authHeader).send({ rating: 4 })
        await request(app).post(`/api/v1/courses/${course.courseId}/reviews`).set('Authorization', s2.authHeader).send({ rating: 2 })

        const res = await request(app).get(`/api/v1/courses/${course.courseId}/reviews?page=1&limit=10`)
        expect(res.status).toBe(200)
        expect(res.body.data.totalReviews).toBe(2)
        expect(res.body.data.averageRating).toBe(3)
        expect(res.body.data.reviews.length).toBe(2)
        expect(res.body.meta.pagination.total).toBe(2)
    })
})
