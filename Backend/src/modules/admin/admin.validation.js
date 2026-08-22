const Joi = require('joi')

const createUserSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
        .min(6)
        .max(100)
        .pattern(/^(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
        .required()
        .messages({
            'string.pattern.base': 'Password must contain at least one number and one special character'
        }),
    role: Joi.string().valid('student', 'instructor', 'admin').required()
})

module.exports = {
    createUserSchema
}
