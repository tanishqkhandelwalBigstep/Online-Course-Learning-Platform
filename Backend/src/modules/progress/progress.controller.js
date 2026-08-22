const asyncHandler = require('../../utils/asyncHandler')
const progressService = require('./progress.service')
const { sendSuccess } = require('../../utils/response')
const { BadRequestError } = require('../../utils/error')

const completeLesson = asyncHandler(async (req, res) => {
    const progress = await progressService.completeLesson(req.user.id, req.params.id)
    return sendSuccess(res, 201, 'Lesson marked as completed', progress)
})

const getCourseProgress = asyncHandler(async (req, res) => {
    let studentId
    if (req.user.role === 'student'){
        studentId = req.user.id
    } else {
        studentId = req.query.studentId
        if (!studentId){
            throw new BadRequestError('studentId query is required to view a student progress')
        }
    }

    const progress = await progressService.getCourseProgress(req.user, studentId, req.params.id)
    return sendSuccess(res, 200, 'Course progress fetched successfully', progress)
})

module.exports = {
    completeLesson,
    getCourseProgress
}
