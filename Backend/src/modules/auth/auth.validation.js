const Joi = require('joi')

const passwordRule = Joi.string()
    .min(6)
    .max(100)
    .pattern(/^(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
    .required()
    .messages({
        'string.pattern.base': 'Password must contain at least one number and one special character'
    })

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: passwordRule
})

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
})

module.exports = {
    registerSchema,
    loginSchema
}
