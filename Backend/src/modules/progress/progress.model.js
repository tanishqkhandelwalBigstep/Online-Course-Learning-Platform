const mongoose = require('mongoose')

const progressSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

progressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true })

const Progress = mongoose.model('Progress', progressSchema)

module.exports = Progress
