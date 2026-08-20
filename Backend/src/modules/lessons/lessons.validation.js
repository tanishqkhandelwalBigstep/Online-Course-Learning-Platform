const Joi = require('joi')

const questionSchema = Joi.object({
    question: Joi.string().min(3).max(500).required(),
    options: Joi.array().items(Joi.string().min(1).max(300)).min(2).max(6).required(),
    correctAnswer: Joi.number().integer().min(0).required()
})

const createLessonSchema = Joi.object({
    title: Joi.string().min(2).max(150).required(),
    videoUrl: Joi.string().uri().required(),
    order: Joi.number().integer().min(1).optional(),
    isRequired: Joi.boolean().optional(),
    quiz: Joi.object({
        title: Joi.string().min(2).max(150).required(),
        passPercentage: Joi.number().min(0).max(100).required(),
        attemptLimit: Joi.number().integer().min(1).max(3).default(3),
        questions: Joi.array().items(questionSchema).length(5).required()
    }).required()
})

module.exports = {
    createLessonSchema
}
