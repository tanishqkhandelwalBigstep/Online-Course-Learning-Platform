const express = require('express')
const authController = require('./auth.controller')
const validate = require('../../middleware/validate')
const authenticate = require('../../middleware/authenticate')
const { registerSchema, loginSchema } = require('./auth.validation')

const router = express.Router()

router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)
router.post('/logout', authenticate, authController.logout)

module.exports = router
