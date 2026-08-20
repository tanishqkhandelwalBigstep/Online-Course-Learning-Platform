const asyncHandler = require('../../utils/asyncHandler')
const quizzesService = require('./quizzes.service')
const { sendSuccess } = require('../../utils/response')

const getQuiz = asyncHandler(async (req, res) => {
    const data = await quizzesService.getQuizForStudent(req.user.id, req.params.id)
    return sendSuccess(res, 200, 'Quiz fetched successfully', data)
})

const deleteQuiz = asyncHandler(async (req, res) => {
    const result = await quizzesService.deleteQuiz(req.user, req.params.id)
    return sendSuccess(res, 200, 'Quiz deleted successfully', result)
})

module.exports = {
    getQuiz,
    deleteQuiz
}
