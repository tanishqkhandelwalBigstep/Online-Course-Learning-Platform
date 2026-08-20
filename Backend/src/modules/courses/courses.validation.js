const Joi = require('joi')

const createCourseSchema = Joi.object({
    title: Joi.string().min(3).max(150).required(),
    description: Joi.string().min(10).max(2000).required(),
    categoryId: Joi.string().hex().length(24).required()
})

module.exports = {
    createCourseSchema
}
