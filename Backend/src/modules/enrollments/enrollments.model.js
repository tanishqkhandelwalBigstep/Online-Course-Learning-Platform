const mongoose = require('mongoose')

const enrollmentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
    }
}, { timestamps: true })

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true })

const Enrollment = mongoose.model('Enrollment', enrollmentSchema)

module.exports = Enrollment
