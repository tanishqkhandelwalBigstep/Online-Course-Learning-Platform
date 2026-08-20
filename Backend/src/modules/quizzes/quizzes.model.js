const mongoose = require('mongoose')

const quizSchema = new mongoose.Schema({
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    passPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    attemptLimit: {
        type: Number,
        required: true,
        min: 1
    }
}, { timestamps: true })

const Quiz = mongoose.model('Quiz', quizSchema)

module.exports = Quiz
