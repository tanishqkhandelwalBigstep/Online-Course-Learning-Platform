const asyncHandler = require('../../utils/asyncHandler')
const reviewsService = require('./reviews.service')
const { sendSuccess } = require('../../utils/response')

const addReview = asyncHandler(async (req, res) => {
    const review = await reviewsService.addReview(req.user.id, req.params.id, req.body)
    return sendSuccess(res, 201, 'Review added successfully', review)
})

const getCourseReviews = asyncHandler(async (req, res) => {
    const data = await reviewsService.getCourseReviews(req.params.id)
    return sendSuccess(res, 200, 'Reviews fetched successfully', data)
})

module.exports = {
    addReview,
    getCourseReviews
}
