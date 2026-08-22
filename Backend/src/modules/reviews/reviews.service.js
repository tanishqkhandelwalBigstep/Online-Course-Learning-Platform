const reviewsRepository = require('./reviews.repository')
const coursesRepository = require('../courses/courses.repository')
const enrollmentsRepository = require('../enrollments/enrollments.repository')
const { getPagination, buildMeta } = require('../../utils/pagination')
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
        rating: data.rating
    })
    return review
}

async function updateReview(studentId, courseId, data){
    const existing = await reviewsRepository.findByStudentAndCourse(studentId, courseId)
    if (!existing){
        throw new NotFoundError('You have not reviewed this course yet')
    }

    return reviewsRepository.updateByStudentAndCourse(studentId, courseId, { rating: data.rating })
}

async function deleteReview(studentId, courseId){
    const existing = await reviewsRepository.findByStudentAndCourse(studentId, courseId)
    if (!existing){
        throw new NotFoundError('You have not reviewed this course yet')
    }

    await reviewsRepository.deleteByStudentAndCourse(studentId, courseId)
    return { deleted: true }
}

async function getCourseReviews(courseId, query){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    const { page, limit, skip } = getPagination(query)

    const [reviews, total, summary] = await Promise.all([
        reviewsRepository.findByCoursePaged(courseId, skip, limit),
        reviewsRepository.countByCourse(courseId),
        reviewsRepository.getRatingSummary(courseId)
    ])

    return {
        data: {
            averageRating: summary.averageRating,
            totalReviews: summary.totalReviews,
            reviews
        },
        pagination: buildMeta(total, page, limit)
    }
}

module.exports = {
    addReview,
    updateReview,
    deleteReview,
    getCourseReviews
}
