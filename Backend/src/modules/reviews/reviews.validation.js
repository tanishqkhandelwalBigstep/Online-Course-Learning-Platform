const Joi = require('joi')

const createReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required()
})

const updateReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required()
})

module.exports = {
    createReviewSchema,
    updateReviewSchema
}
