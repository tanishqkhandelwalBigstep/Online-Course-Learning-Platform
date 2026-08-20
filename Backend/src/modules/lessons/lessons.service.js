const lessonsRepository = require('./lessons.repository')
const sectionsRepository = require('../sections/sections.repository')
const coursesRepository = require('../courses/courses.repository')
const quizzesRepository = require('../quizzes/quizzes.repository')
const questionsRepository = require('../questions/questions.repository')
const quizAttemptsRepository = require('../quizAttempts/quizAttempts.repository')
const progressRepository = require('../progress/progress.repository')
const { NotFoundError, ForbiddenError, BadRequestError } = require('../../utils/error')

async function createLesson(user, sectionId, data){
    const section = await sectionsRepository.findById(sectionId)
    if (!section){
        throw new NotFoundError('Section not found')
    }

    const course = await coursesRepository.findById(section.courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    if (user.role !== 'admin' && course.instructorId.toString() !== user.id){
        throw new ForbiddenError('You can only add lessons to your own course')
    }

    data.quiz.questions.forEach((item) => {
        if (item.correctAnswer >= item.options.length){
            throw new BadRequestError('correctAnswer index is out of range for a question')
        }
    })

    let order = data.order
    if (!order){
        const count = await lessonsRepository.countBySectionId(sectionId)
        order = count + 1
    }

    const lesson = await lessonsRepository.createLesson({
        sectionId,
        title: data.title,
        videoUrl: data.videoUrl,
        order,
        isRequired: data.isRequired
    })

    const quiz = await quizzesRepository.createQuiz({
        lessonId: lesson._id,
        title: data.quiz.title,
        passPercentage: data.quiz.passPercentage,
        attemptLimit: data.quiz.attemptLimit
    })

    const questionsToCreate = data.quiz.questions.map((item) => ({
        quizId: quiz._id,
        question: item.question,
        options: item.options,
        correctAnswer: item.correctAnswer
    }))
    const questions = await questionsRepository.createMany(questionsToCreate)

    return { lesson, quiz, questions }
}

async function deleteLesson(user, lessonId){
    const lesson = await lessonsRepository.findById(lessonId)
    if (!lesson){
        throw new NotFoundError('Lesson not found')
    }

    const section = await sectionsRepository.findById(lesson.sectionId)
    if (!section){
        throw new NotFoundError('Section not found')
    }

    const course = await coursesRepository.findById(section.courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    if (user.role !== 'admin' && course.instructorId.toString() !== user.id){
        throw new ForbiddenError('You can only delete lessons from your own course')
    }

    const quiz = await quizzesRepository.findByLesson(lessonId)
    if (quiz){
        await questionsRepository.deleteByQuiz(quiz._id)
        await quizAttemptsRepository.deleteByQuiz(quiz._id)
        await quizzesRepository.deleteById(quiz._id)
    }

    await progressRepository.deleteByLesson(lessonId)
    await lessonsRepository.deleteById(lessonId)

    return { deleted: true }
}

module.exports = {
    createLesson,
    deleteLesson
}
