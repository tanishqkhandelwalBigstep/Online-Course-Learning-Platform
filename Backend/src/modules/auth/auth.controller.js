const asyncHandler = require('../../utils/asyncHandler')
const authService = require('./auth.service')
const { sendSuccess } = require('../../utils/response')
const env = require('../../config/env')

const REFRESH_COOKIE_PATH = '/api/v1/auth'

function accessCookieOptions(){
    return {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: env.accessTokenTtlMs
    }
}

function refreshCookieOptions(){
    return {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: env.refreshTokenTtlMs,
        path: REFRESH_COOKIE_PATH
    }
}

function setAuthCookies(res, tokens){
    res.cookie('accessToken', tokens.accessToken, accessCookieOptions())
    res.cookie('refreshToken', tokens.refreshToken, refreshCookieOptions())
}

function clearAuthCookies(res){
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax'
    })
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax',
        path: REFRESH_COOKIE_PATH
    })
}

const register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body)
    setAuthCookies(res, result)
    return sendSuccess(res, 201, 'Registered successfully', result)
})

const login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body)
    setAuthCookies(res, result)
    return sendSuccess(res, 200, 'Logged in successfully', result)
})

const refresh = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken
    const result = await authService.refresh(token)
    setAuthCookies(res, result)
    return sendSuccess(res, 200, 'Token refreshed successfully', result)
})

const logout = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken
    await authService.logout(token)
    clearAuthCookies(res)
    return sendSuccess(res, 200, 'Logged out successfully', null)
})

module.exports = {
    register,
    login,
    refresh,
    logout
}
