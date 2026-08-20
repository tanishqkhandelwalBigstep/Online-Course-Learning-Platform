const Joi = require('joi')

const submitAttemptSchema = Joi.object({
    answers: Joi.array().items(Joi.object({
        questionId: Joi.string().hex().length(24).required(),
        selectedOption: Joi.number().integer().min(0).required()
    })).min(1).required()
})

module.exports = {
    submitAttemptSchema
}
