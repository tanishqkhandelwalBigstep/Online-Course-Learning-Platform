const asyncHandler = require('../../utils/asyncHandler')
const coursesService = require('./courses.service')
const { sendSuccess } = require('../../utils/response')

const createCourse = asyncHandler(async (req, res) => {
    const course = await coursesService.createCourse(req.user.id, req.body)
    return sendSuccess(res, 201, 'Course created successfully', course)
})

const getAllCourses = asyncHandler(async (req, res) => {
    const result = await coursesService.getAllPublishedCourses(req.query)
    return sendSuccess(res, 200, 'Courses fetched successfully', result.items, { pagination: result.pagination })
})

const getCourse = asyncHandler(async (req, res) => {
    const course = await coursesService.getCourseById(req.params.id)
    return sendSuccess(res, 200, 'Course fetched successfully', course)
})

const publishCourse = asyncHandler(async (req, res) => {
    const course = await coursesService.publishCourse(req.user, req.params.id)
    return sendSuccess(res, 200, 'Course published successfully', course)
})

module.exports = {
    createCourse,
    getAllCourses,
    getCourse,
    publishCourse
}
