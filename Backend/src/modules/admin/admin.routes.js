const express = require('express')
const adminController = require('./admin.controller')
const authenticate = require('../../middleware/authenticate')
const authorize = require('../../middleware/authorize')
const validate = require('../../middleware/validate')
const { createUserSchema } = require('./admin.validation')

const router = express.Router()

router.use(authenticate, authorize('admin'))

router.get('/overview', adminController.getOverview)
router.get('/users', adminController.getUsers)
router.post('/users', validate(createUserSchema), adminController.createUser)
router.get('/courses', adminController.getCourses)

module.exports = router
