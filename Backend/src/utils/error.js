class AppError extends Error {
    constructor(statusCode, message){
        super(message)
        this.statusCode = statusCode
    }
}

class BadRequestError extends AppError {
    constructor(message){
        super(400, message)
    }
}

class UnauthorizedError extends AppError {
    constructor(message){
        super(401, message)
    }
}

class ForbiddenError extends AppError {
    constructor(message){
        super(403, message)
    }
}

class NotFoundError extends AppError {
    constructor(message){
        super(404, message)
    }
}

class ConflictError extends AppError {
    constructor(message){
        super(409, message)
    }
}

module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError
}
