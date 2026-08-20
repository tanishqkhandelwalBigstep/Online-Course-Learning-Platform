const enrollmentsRepository = require('./enrollments.repository')
const coursesRepository = require('../courses/courses.repository')
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

async function getMyCourses(studentId){
    return enrollmentsRepository.findByStudent(studentId)
}

module.exports = {
    enroll,
    getMyCourses
}
