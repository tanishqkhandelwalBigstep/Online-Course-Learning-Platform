const usersRepository = require('../users/users.repository')
const refreshTokenRepository = require('./refreshToken.repository')
const { createPassword, comparePassword } = require('../../utils/hash')
const { signAccessToken, signRefreshToken, verifyRefreshToken, generateJti } = require('../../utils/token')
const env = require('../../config/env')
const { ConflictError, UnauthorizedError } = require('../../utils/error')

async function issueTokens(user){
    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role })

    const jti = generateJti()
    const expiresAt = new Date(Date.now() + env.refreshTokenTtlMs)
    await refreshTokenRepository.createToken({ userId: user._id, jti, expiresAt })

    const refreshToken = signRefreshToken({ userId: user._id.toString(), jti })

    return { accessToken, refreshToken }
}

async function register({ name, email, password }){
    const existingUser = await usersRepository.findByEmail(email)
    if (existingUser){
        throw new ConflictError('Email is already registered')
    }

    const hashedPassword = await createPassword(password)
    const user = await usersRepository.createUser({
        name,
        email,
        password: hashedPassword,
        role: 'student'
    })

    const tokens = await issueTokens(user)

    return { user: toPublicUser(user), ...tokens }
}

async function login({ email, password }){
    const user = await usersRepository.findByEmail(email)
    if (!user){
        throw new UnauthorizedError('Invalid email or password')
    }

    const isMatch = await comparePassword(password, user.password)
    if (!isMatch){
        throw new UnauthorizedError('Invalid email or password')
    }

    const tokens = await issueTokens(user)

    return { user: toPublicUser(user), ...tokens }
}

async function refresh(refreshToken){
    if (!refreshToken){
        throw new UnauthorizedError('Refresh token missing')
    }

    let payload
    try {
        payload = verifyRefreshToken(refreshToken)
    } catch (err) {
        throw new UnauthorizedError('Invalid or expired refresh token')
    }

    const stored = await refreshTokenRepository.findByJti(payload.jti)
    if (!stored){
        throw new UnauthorizedError('Refresh token is no longer valid')
    }

    if (stored.revoked){
        await refreshTokenRepository.revokeAllForUser(stored.userId)
        throw new UnauthorizedError('Refresh token has already been used')
    }

    if (stored.expiresAt.getTime() < Date.now()){
        throw new UnauthorizedError('Refresh token has expired')
    }

    const user = await usersRepository.findById(payload.userId)
    if (!user){
        throw new UnauthorizedError('User no longer exists')
    }

    await refreshTokenRepository.revokeByJti(payload.jti)

    const tokens = await issueTokens(user)

    return { user: toPublicUser(user), ...tokens }
}

async function logout(refreshToken){
    if (!refreshToken){
        return
    }

    try {
        const payload = verifyRefreshToken(refreshToken)
        await refreshTokenRepository.revokeByJti(payload.jti)
    } catch (err) {
        return
    }
}

function toPublicUser(user){
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
    }
}

module.exports = {
    register,
    login,
    refresh,
    logout
}
