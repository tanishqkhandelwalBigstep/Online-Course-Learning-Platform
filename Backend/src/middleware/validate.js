const { BadRequestError } = require('../utils/error')

function validate(schema){
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false })
        if (error){
            const message = error.details.map((detail) => detail.message).join(', ')
            return next(new BadRequestError(message))
        }
        req.body = value
        next()
    }
}

module.exports = validate
