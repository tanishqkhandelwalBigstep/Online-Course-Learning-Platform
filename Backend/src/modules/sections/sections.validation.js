const Joi = require('joi')

const createSectionSchema = Joi.object({
    title: Joi.string().min(2).max(150).required(),
    order: Joi.number().integer().min(1).optional()
})

module.exports = {
    createSectionSchema
}
