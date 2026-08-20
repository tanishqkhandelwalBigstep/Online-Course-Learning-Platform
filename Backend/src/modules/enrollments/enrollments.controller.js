const asyncHandler = require('../../utils/asyncHandler')
const enrollmentsService = require('./enrollments.service')
const { sendSuccess } = require('../../utils/response')

const enroll = asyncHandler(async (req, res) => {
    const enrollment = await enrollmentsService.enroll(req.user.id, req.params.id)
    return sendSuccess(res, 201, 'Enrolled successfully', enrollment)
})

const getMyCourses = asyncHandler(async (req, res) => {
    const result = await enrollmentsService.getMyCourses(req.user.id, req.query)
    return sendSuccess(res, 200, 'Your enrolled courses fetched successfully', result.items, { pagination: result.pagination })
})

module.exports = {
    enroll,
    getMyCourses
}
