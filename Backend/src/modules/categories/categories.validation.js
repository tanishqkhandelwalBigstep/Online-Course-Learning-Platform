const Joi = require('joi')

const createCategorySchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional()
})

module.exports = {
    createCategorySchema
}
