const express = require('express')
const enrollmentsController = require('./enrollments.controller')
const authenticate = require('../../middleware/authenticate')
const authorize = require('../../middleware/authorize')

const router = express.Router()

router.get('/', authenticate, authorize('student'), enrollmentsController.getMyCourses)

module.exports = router
