const quizzesRepository = require('./quizzes.repository')
const questionsRepository = require('../questions/questions.repository')
const quizAttemptsRepository = require('../quizAttempts/quizAttempts.repository')
const lessonsRepository = require('../lessons/lessons.repository')
const sectionsRepository = require('../sections/sections.repository')
const coursesRepository = require('../courses/courses.repository')
const enrollmentsRepository = require('../enrollments/enrollments.repository')
const { NotFoundError, ForbiddenError } = require('../../utils/error')

async function getQuizForStudent(studentId, quizId){
    const quiz = await quizzesRepository.findById(quizId)
    if (!quiz){
        throw new NotFoundError('Quiz not found')
    }

    const lesson = await lessonsRepository.findById(quiz.lessonId)
    if (!lesson){
        throw new NotFoundError('Lesson not found')
    }

    const section = await sectionsRepository.findById(lesson.sectionId)
    if (!section){
        throw new NotFoundError('Section not found')
    }

    const enrollment = await enrollmentsRepository.findByStudentAndCourse(studentId, section.courseId)
    if (!enrollment){
        throw new ForbiddenError('You must be enrolled in the course to view this quiz')
    }

    const questions = await questionsRepository.findByQuiz(quizId)
    const safeQuestions = questions.map((question) => ({
        _id: question._id,
        question: question.question,
        options: question.options
    }))

    return {
        quiz: {
            _id: quiz._id,
            lessonId: quiz.lessonId,
            title: quiz.title,
            passPercentage: quiz.passPercentage,
            attemptLimit: quiz.attemptLimit
        },
        questions: safeQuestions
    }
}

async function deleteQuiz(user, quizId){
    const quiz = await quizzesRepository.findById(quizId)
    if (!quiz){
        throw new NotFoundError('Quiz not found')
    }

    const lesson = await lessonsRepository.findById(quiz.lessonId)
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
        throw new ForbiddenError('You can only delete quizzes from your own course')
    }

    await questionsRepository.deleteByQuiz(quizId)
    await quizAttemptsRepository.deleteByQuiz(quizId)
    await quizzesRepository.deleteById(quizId)

    return { deleted: true }
}

module.exports = {
    getQuizForStudent,
    deleteQuiz
}
