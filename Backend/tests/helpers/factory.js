const User = require('../../src/modules/users/users.model')
const { createPassword } = require('../../src/utils/hash')
const { signAccessToken } = require('../../src/utils/token')

let counter = 0

function nextId(){
    counter = counter + 1
    return counter
}

async function createUser(role, overrides = {}){
    const n = nextId()
    const password = overrides.password || 'password123'
    const hashed = await createPassword(password)
    const user = await User.create({
        name: overrides.name || `${role} ${n}`,
        email: overrides.email || `${role}${n}@test.com`,
        password: hashed,
        role
    })
    const token = signAccessToken({ userId: user._id.toString(), role: user.role })
    return {
        id: user._id.toString(),
        email: user.email,
        password,
        role: user.role,
        token,
        authHeader: `Bearer ${token}`
    }
}

function buildQuestions(correctAnswers){
    return correctAnswers.map((correct, index) => ({
        question: `Question number ${index + 1}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: correct
    }))
}

function buildLessonPayload(overrides = {}){
    return {
        title: overrides.title || 'Intro Lesson',
        videoUrl: overrides.videoUrl || 'https://videos.test.com/lesson.mp4',
        isRequired: overrides.isRequired !== undefined ? overrides.isRequired : true,
        quiz: {
            title: overrides.quizTitle || 'Intro Quiz',
            passPercentage: overrides.passPercentage !== undefined ? overrides.passPercentage : 60,
            attemptLimit: overrides.attemptLimit || 3,
            questions: buildQuestions(overrides.correctAnswers || [0, 0, 0, 0, 0])
        }
    }
}

module.exports = {
    createUser,
    buildQuestions,
    buildLessonPayload
}
