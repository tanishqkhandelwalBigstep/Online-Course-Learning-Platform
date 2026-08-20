require('dotenv').config()

function parseOrigins(value){
    if (!value){
        return ['http://localhost:5173', 'http://localhost:3000']
    }
    return value.split(',').map((origin) => origin.trim()).filter(Boolean)
}

const jwtSecret = process.env.JWT_SECRET

const env = {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || jwtSecret,
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    accessTokenTtlMs: Number(process.env.ACCESS_TOKEN_TTL_MS) || 15 * 60 * 1000,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || `${jwtSecret}_refresh`,
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    refreshTokenTtlMs: Number(process.env.REFRESH_TOKEN_TTL_MS) || 7 * 24 * 60 * 60 * 1000,
    corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 300,
    authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 30,
    nodeEnv: process.env.NODE_ENV || 'development'
}

module.exports = env
