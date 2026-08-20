const request = require('supertest')
const app = require('../../src/app')
const { createUser, buildLessonPayload } = require('./factory')

async function createCategory(admin){
    const owner = admin || (await createUser('admin'))
    const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', owner.authHeader)
        .send({ name: `Cat ${Date.now()}${process.hrtime()[1]}`, description: 'desc' })
    return res.body.data._id
}

async function addSection(courseId, instructor, order = 1){
    const res = await request(app)
        .post(`/api/v1/courses/${courseId}/sections`)
        .set('Authorization', instructor.authHeader)
        .send({ title: `Section ${order}`, order })
    return res.body.data._id
}

async function addLesson(sectionId, instructor, overrides = {}){
    const res = await request(app)
        .post(`/api/v1/sections/${sectionId}/lessons`)
        .set('Authorization', instructor.authHeader)
        .send(buildLessonPayload(overrides))
    return res.body.data
}

async function buildPublishedCourse(overrides = {}){
    const admin = await createUser('admin')
    const instructor = overrides.instructor || (await createUser('instructor'))

    const categoryId = await createCategory(admin)

    const courseRes = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', instructor.authHeader)
        .send({
            title: overrides.title || 'Full Journey Course',
            description: overrides.description || 'A complete course',
            categoryId
        })
    const courseId = courseRes.body.data._id

    const sectionId = await addSection(courseId, instructor)
    const lessonData = await addLesson(sectionId, instructor, {
        passPercentage: overrides.passPercentage,
        attemptLimit: overrides.attemptLimit,
        correctAnswers: overrides.correctAnswers || [0, 1, 2, 3, 0]
    })

    if (overrides.publish !== false){
        await request(app)
            .put(`/api/v1/courses/${courseId}/publish`)
            .set('Authorization', instructor.authHeader)
    }

    return {
        admin,
        instructor,
        categoryId,
        courseId,
        sectionId,
        lessonId: lessonData.lesson._id,
        quizId: lessonData.quiz._id,
        questions: lessonData.questions
    }
}

async function enroll(courseId, student){
    return request(app)
        .post(`/api/v1/courses/${courseId}/enroll`)
        .set('Authorization', student.authHeader)
}

function correctAnswersPayload(questions){
    return {
        answers: questions.map((q) => ({ questionId: q._id, selectedOption: q.correctAnswer }))
    }
}

module.exports = {
    createCategory,
    addSection,
    addLesson,
    buildPublishedCourse,
    enroll,
    correctAnswersPayload
}
