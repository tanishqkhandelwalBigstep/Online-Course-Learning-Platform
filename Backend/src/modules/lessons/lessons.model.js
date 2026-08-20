const mongoose = require('mongoose')

const lessonSchema = new mongoose.Schema({
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    videoUrl: {
        type: String,
        required: true,
        trim: true
    },
    order: {
        type: Number,
        required: true
    },
    isRequired: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

const Lesson = mongoose.model('Lesson', lessonSchema)

module.exports = Lesson
