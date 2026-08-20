const asyncHandler = require('../../utils/asyncHandler')
const authService = require('./auth.service')
const { sendSuccess } = require('../../utils/response')
const env = require('../../config/env')

const cookieOptions = {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
}

const register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body)
    res.cookie('accessToken', result.token, cookieOptions)
    return sendSuccess(res, 201, 'Registered successfully', result)
})

const login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body)
    res.cookie('accessToken', result.token, cookieOptions)
    return sendSuccess(res, 200, 'Logged in successfully', result)
})

const logout = asyncHandler(async (req, res) => {
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax'
    })
    return sendSuccess(res, 200, 'Logged out successfully', null)
})

module.exports = {
    register,
    login,
    logout
}
