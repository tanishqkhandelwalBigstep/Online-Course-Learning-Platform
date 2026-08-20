const sectionsRepository = require('./sections.repository')
const coursesRepository = require('../courses/courses.repository')
const lessonsRepository = require('../lessons/lessons.repository')
const { NotFoundError, ForbiddenError } = require('../../utils/error')

async function createSection(user, courseId, data){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    if (user.role !== 'admin' && course.instructorId.toString() !== user.id){
        throw new ForbiddenError('You can only add sections to your own course')
    }

    let order = data.order
    if (!order){
        const count = await sectionsRepository.countByCourse(courseId)
        order = count + 1
    }

    const section = await sectionsRepository.createSection({
        courseId,
        title: data.title,
        order
    })
    return section
}

async function getCourseSections(courseId){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    const sections = await sectionsRepository.findByCourse(courseId)

    const result = []
    for (const section of sections){
        const lessons = await lessonsRepository.findBySectionId(section._id)
        result.push({ section, lessons })
    }
    return result
}

module.exports = {
    createSection,
    getCourseSections
}
