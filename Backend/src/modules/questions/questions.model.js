const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
        index: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        required: true
    },
    correctAnswer: {
        type: Number,
        required: true,
        min: 0
    }
}, { timestamps: true })

const Question = mongoose.model('Question', questionSchema)

module.exports = Question
