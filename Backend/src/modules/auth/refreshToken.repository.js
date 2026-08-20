const RefreshToken = require('./refreshToken.model')

function createToken(data){
    return RefreshToken.create(data)
}

function findByJti(jti){
    return RefreshToken.findOne({ jti })
}

function revokeByJti(jti){
    return RefreshToken.updateOne({ jti }, { revoked: true })
}

function revokeAllForUser(userId){
    return RefreshToken.updateMany({ userId, revoked: false }, { revoked: true })
}

module.exports = {
    createToken,
    findByJti,
    revokeByJti,
    revokeAllForUser
}
