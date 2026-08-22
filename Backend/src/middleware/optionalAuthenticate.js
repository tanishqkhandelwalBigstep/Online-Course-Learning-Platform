const { verifyAccessToken } = require('../utils/token')
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

async function optionalAuthenticate(req, res, next){
    const token = extractToken(req)
    if (!token){
        return next()
    }

    try {
        const payload = verifyAccessToken(token)
        const user = await usersRepository.findById(payload.userId)
        if (user){
            req.user = {
                id: user._id.toString(),
                role: user.role
            }
        }
    } catch (err) {
        // ignore invalid/expired token: request continues as unauthenticated
    }

    next()
}

module.exports = optionalAuthenticate
