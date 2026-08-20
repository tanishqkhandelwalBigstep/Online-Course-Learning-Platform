const mongoose = require('mongoose')

const quizAttemptSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
        index: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    score: {
        type: Number,
        required: true
    },
    passed: {
        type: Boolean,
        required: true
    },
    attemptNo: {
        type: Number,
        required: true,
        min: 1
    }
}, { timestamps: true })

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema)

module.exports = QuizAttempt
