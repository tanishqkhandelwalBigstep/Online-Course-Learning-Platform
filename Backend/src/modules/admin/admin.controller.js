const asyncHandler = require('../../utils/asyncHandler')
const adminService = require('./admin.service')
const { sendSuccess } = require('../../utils/response')

const createUser = asyncHandler(async (req, res) => {
    const user = await adminService.createUser(req.body)
    return sendSuccess(res, 201, 'User created successfully', user)
})

const getUsers = asyncHandler(async (req, res) => {
    const users = await adminService.getAllUsers()
    return sendSuccess(res, 200, 'Users fetched successfully', users)
})

const getCourses = asyncHandler(async (req, res) => {
    const courses = await adminService.getAllCourses()
    return sendSuccess(res, 200, 'Courses fetched successfully', courses)
})

const getOverview = asyncHandler(async (req, res) => {
    const overview = await adminService.getOverview()
    return sendSuccess(res, 200, 'Admin overview fetched successfully', overview)
})

module.exports = {
    createUser,
    getUsers,
    getCourses,
    getOverview
}
