const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const env = require('../config/env')

function signAccessToken(payload){
    return jwt.sign(payload, env.accessTokenSecret, { expiresIn: env.accessTokenExpiresIn })
}

function verifyAccessToken(token){
    return jwt.verify(token, env.accessTokenSecret)
}

function signRefreshToken(payload){
    return jwt.sign(payload, env.refreshTokenSecret, { expiresIn: env.refreshTokenExpiresIn })
}

function verifyRefreshToken(token){
    return jwt.verify(token, env.refreshTokenSecret)
}

function generateJti(){
    return crypto.randomBytes(24).toString('hex')
}

module.exports = {
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    generateJti
}
