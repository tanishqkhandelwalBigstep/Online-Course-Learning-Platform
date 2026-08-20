const asyncHandler = require('../../utils/asyncHandler')
const dashboardsService = require('./dashboards.service')
const { sendSuccess } = require('../../utils/response')

const getInstructorOverview = asyncHandler(async (req, res) => {
    const data = await dashboardsService.getInstructorOverview(req.user.id)
    return sendSuccess(res, 200, 'Instructor overview fetched successfully', data)
})

const getInstructorCourses = asyncHandler(async (req, res) => {
    const result = await dashboardsService.getInstructorCourses(req.user.id, req.query)
    return sendSuccess(res, 200, 'Instructor courses fetched successfully', result.items, { pagination: result.pagination })
})

const getInstructorCourseDetail = asyncHandler(async (req, res) => {
    const data = await dashboardsService.getInstructorCourseDetail(req.user, req.params.id)
    return sendSuccess(res, 200, 'Course detail fetched successfully', data)
})

module.exports = {
    getInstructorOverview,
    getInstructorCourses,
    getInstructorCourseDetail
}
