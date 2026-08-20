const express = require('express')
const lessonsController = require('../lessons/lessons.controller')
const authenticate = require('../../middleware/authenticate')
const authorize = require('../../middleware/authorize')
const validate = require('../../middleware/validate')
const { createLessonSchema } = require('../lessons/lessons.validation')

const router = express.Router()

router.post('/:id/lessons', authenticate, authorize('instructor', 'admin'), validate(createLessonSchema), lessonsController.createLesson)

module.exports = router
