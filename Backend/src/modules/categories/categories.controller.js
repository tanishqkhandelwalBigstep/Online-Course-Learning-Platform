const asyncHandler = require('../../utils/asyncHandler')
const categoriesService = require('./categories.service')
const { sendSuccess } = require('../../utils/response')

const createCategory = asyncHandler(async (req, res) => {
    const category = await categoriesService.createCategory(req.body)
    return sendSuccess(res, 201, 'Category created successfully', category)
})

const getCategories = asyncHandler(async (req, res) => {
    const categories = await categoriesService.getAllCategories()
    return sendSuccess(res, 200, 'Categories fetched successfully', categories)
})

module.exports = {
    createCategory,
    getCategories
}
