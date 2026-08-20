const usersRepository = require('../users/users.repository')
const { createPassword, comparePassword } = require('../../utils/hash')
const { signToken } = require('../../utils/token')
const { ConflictError, UnauthorizedError } = require('../../utils/error')

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

    const token = signToken({ userId: user._id.toString(), role: user.role })

    return { user: toPublicUser(user), token }
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

    const token = signToken({ userId: user._id.toString(), role: user.role })

    return { user: toPublicUser(user), token }
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
    login
}
