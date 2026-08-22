const Joi = require('joi')

const createCourseSchema = Joi.object({
    title: Joi.string().min(3).max(150).required(),
    description: Joi.string().min(10).max(2000).required(),
    categoryId: Joi.string().hex().length(24).required(),
    thumbnailUrl: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
    price: Joi.number().min(0).default(5000)
})

const updateCourseSchema = Joi.object({
    title: Joi.string().min(3).max(150),
    description: Joi.string().min(10).max(2000),
    categoryId: Joi.string().hex().length(24),
    thumbnailUrl: Joi.string().uri({ scheme: ['http', 'https'] }),
    price: Joi.number().min(0)
}).min(1)

module.exports = {
    createCourseSchema,
    updateCourseSchema
}
