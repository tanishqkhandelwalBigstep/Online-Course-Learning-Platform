const enrollmentsRepository = require('./enrollments.repository')
const coursesRepository = require('../courses/courses.repository')
const { getPagination, buildMeta } = require('../../utils/pagination')
const { NotFoundError, BadRequestError, ConflictError } = require('../../utils/error')

async function enroll(studentId, courseId){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    if (course.status !== 'published'){
        throw new BadRequestError('Course is not available for enrollment')
    }

    const existing = await enrollmentsRepository.findByStudentAndCourse(studentId, courseId)
    if (existing){
        throw new ConflictError('You are already enrolled in this course')
    }

    const enrollment = await enrollmentsRepository.createEnrollment({
        studentId,
        courseId,
        status: 'active'
    })
    return enrollment
}

async function getMyCourses(studentId, query){
    const { page, limit, skip } = getPagination(query)

    const [items, total] = await Promise.all([
        enrollmentsRepository.findByStudentPaged(studentId, skip, limit),
        enrollmentsRepository.countByStudent(studentId)
    ])

    return { items, pagination: buildMeta(total, page, limit) }
}

module.exports = {
    enroll,
    getMyCourses
}
