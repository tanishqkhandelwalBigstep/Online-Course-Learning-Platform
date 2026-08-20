const express = require('express')
const quizzesController = require('./quizzes.controller')
const quizAttemptsController = require('../quizAttempts/quizAttempts.controller')
const authenticate = require('../../middleware/authenticate')
const authorize = require('../../middleware/authorize')
const validate = require('../../middleware/validate')
const { submitAttemptSchema } = require('../quizAttempts/quizAttempts.validation')

const router = express.Router()

router.get('/:id', authenticate, authorize('student'), quizzesController.getQuiz)
router.post('/:id/attempts', authenticate, authorize('student'), validate(submitAttemptSchema), quizAttemptsController.submitAttempt)
router.get('/:id/results', authenticate, authorize('student', 'instructor', 'admin'), quizAttemptsController.getResults)
router.delete('/:id', authenticate, authorize('instructor', 'admin'), quizzesController.deleteQuiz)

module.exports = router
