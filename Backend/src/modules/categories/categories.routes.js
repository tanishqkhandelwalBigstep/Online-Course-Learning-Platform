const express = require('express')
const categoriesController = require('./categories.controller')
const authenticate = require('../../middleware/authenticate')
const authorize = require('../../middleware/authorize')
const validate = require('../../middleware/validate')
const { createCategorySchema } = require('./categories.validation')

const router = express.Router()

router.get('/', categoriesController.getCategories)
router.post('/', authenticate, authorize('admin'), validate(createCategorySchema), categoriesController.createCategory)

module.exports = router
