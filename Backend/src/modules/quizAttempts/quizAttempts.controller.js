const asyncHandler = require('../../utils/asyncHandler')
const quizAttemptsService = require('./quizAttempts.service')
const { sendSuccess } = require('../../utils/response')

const submitAttempt = asyncHandler(async (req, res) => {
    const result = await quizAttemptsService.submitAttempt(req.user.id, req.params.id, req.body.answers)
    return sendSuccess(res, 201, 'Quiz attempt submitted successfully', result)
})

const getResults = asyncHandler(async (req, res) => {
    const result = await quizAttemptsService.getResults(req.user, req.params.id)
    return sendSuccess(res, 200, 'Quiz results fetched successfully', result)
})

module.exports = {
    submitAttempt,
    getResults
}
