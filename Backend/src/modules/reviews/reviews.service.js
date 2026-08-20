const reviewsRepository = require('./reviews.repository')
const coursesRepository = require('../courses/courses.repository')
const enrollmentsRepository = require('../enrollments/enrollments.repository')
const { NotFoundError, ForbiddenError, ConflictError } = require('../../utils/error')

async function addReview(studentId, courseId, data){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    const enrollment = await enrollmentsRepository.findByStudentAndCourse(studentId, courseId)
    if (!enrollment){
        throw new ForbiddenError('You must be enrolled in the course to review it')
    }

    const existing = await reviewsRepository.findByStudentAndCourse(studentId, courseId)
    if (existing){
        throw new ConflictError('You have already reviewed this course')
    }

    const review = await reviewsRepository.createReview({
        studentId,
        courseId,
        rating: data.rating,
        comment: data.comment
    })
    return review
}

async function getCourseReviews(courseId){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    const reviews = await reviewsRepository.findByCourse(courseId)
    const summary = await reviewsRepository.getRatingSummary(courseId)

    return {
        averageRating: summary.averageRating,
        totalReviews: summary.totalReviews,
        reviews
    }
}

module.exports = {
    addReview,
    getCourseReviews
}
