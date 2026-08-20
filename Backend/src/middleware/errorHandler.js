const { AppError } = require('../utils/error')
const { sendError } = require('../utils/response')
const logger = require('../utils/logger')

function errorHandler(err, req, res, next){
    if (err instanceof AppError){
        return sendError(res, err.statusCode, err.message)
    }

    if (err.name === 'CastError'){
        return sendError(res, 400, 'Invalid id')
    }

    if (err.name === 'ValidationError'){
        return sendError(res, 400, err.message)
    }

    if (err.code === 11000){
        return sendError(res, 409, 'Duplicate value')
    }

    logger.error(err.message)
    return sendError(res, 500, 'Something went wrong')
}

module.exports = errorHandler
