const { verifyAccessToken } = require('../utils/token')
const { UnauthorizedError } = require('../utils/error')
const usersRepository = require('../modules/users/users.repository')

function extractToken(req){
    if (req.cookies && req.cookies.accessToken){
        return req.cookies.accessToken
    }
    const header = req.headers.authorization
    if (header && header.startsWith('Bearer ')){
        return header.split(' ')[1]
    }
    return null
}

async function authenticate(req, res, next){
    try {
        const token = extractToken(req)
        if (!token){
            throw new UnauthorizedError('Authentication required')
        }

        const payload = verifyAccessToken(token)

        const user = await usersRepository.findById(payload.userId)
        if (!user){
            throw new UnauthorizedError('User no longer exists')
        }

        req.user = {
            id: user._id.toString(),
            role: user.role
        }
        next()
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError'){
            return next(new UnauthorizedError('Invalid or expired token'))
        }
        next(err)
    }
}

module.exports = authenticate
