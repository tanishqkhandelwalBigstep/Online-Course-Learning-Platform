const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
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
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    }
}, { timestamps: true })

reviewSchema.index({ studentId: 1, courseId: 1 }, { unique: true })

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review
