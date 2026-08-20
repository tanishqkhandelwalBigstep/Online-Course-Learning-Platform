const mongoose = require('mongoose')

const sectionSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    order: {
        type: Number,
        required: true
    }
}, { timestamps: true })

const Section = mongoose.model('Section', sectionSchema)

module.exports = Section
