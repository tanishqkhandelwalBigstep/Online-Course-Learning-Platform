const express = require('express')
const dashboardsController = require('./dashboards.controller')
const authenticate = require('../../middleware/authenticate')
const authorize = require('../../middleware/authorize')

const router = express.Router()

router.get('/overview', authenticate, authorize('instructor'), dashboardsController.getInstructorOverview)
router.get('/courses', authenticate, authorize('instructor'), dashboardsController.getInstructorCourses)
router.get('/courses/:id', authenticate, authorize('instructor', 'admin'), dashboardsController.getInstructorCourseDetail)

module.exports = router
