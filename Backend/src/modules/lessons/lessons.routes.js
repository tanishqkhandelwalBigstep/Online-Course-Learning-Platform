const express = require('express')
const lessonsController = require('./lessons.controller')
const progressController = require('../progress/progress.controller')
const authenticate = require('../../middleware/authenticate')
const authorize = require('../../middleware/authorize')

const router = express.Router()

router.post('/:id/complete', authenticate, authorize('student'), progressController.completeLesson)
router.delete('/:id', authenticate, authorize('instructor', 'admin'), lessonsController.deleteLesson)

module.exports = router
