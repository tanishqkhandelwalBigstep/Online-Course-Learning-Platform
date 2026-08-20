function sendSuccess(res, statusCode, message, data, meta){
    const body = {
        success: true,
        message,
        data
    }
    if (meta !== undefined){
        body.meta = meta
    }
    return res.status(statusCode).json(body)
}

function sendError(res, statusCode, message){
    return res.status(statusCode).json({
        success: false,
        message
    })
}

module.exports = {
    sendSuccess,
    sendError
}
