const asyncHandler = require('../../utils/asyncHandler')
const lessonsService = require('./lessons.service')
const { sendSuccess } = require('../../utils/response')

const createLesson = asyncHandler(async (req, res) => {
    const result = await lessonsService.createLesson(req.user, req.params.id, req.body)
    return sendSuccess(res, 201, 'Lesson created successfully', result)
})

const deleteLesson = asyncHandler(async (req, res) => {
    const result = await lessonsService.deleteLesson(req.user, req.params.id)
    return sendSuccess(res, 200, 'Lesson deleted successfully', result)
})

module.exports = {
    createLesson,
    deleteLesson
}
