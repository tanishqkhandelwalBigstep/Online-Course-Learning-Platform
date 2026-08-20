const quizAttemptsRepository = require('./quizAttempts.repository')
const quizzesRepository = require('../quizzes/quizzes.repository')
const questionsRepository = require('../questions/questions.repository')
const lessonsRepository = require('../lessons/lessons.repository')
const sectionsRepository = require('../sections/sections.repository')
const coursesRepository = require('../courses/courses.repository')
const enrollmentsRepository = require('../enrollments/enrollments.repository')
const progressService = require('../progress/progress.service')
const { NotFoundError, ForbiddenError, BadRequestError } = require('../../utils/error')

async function getCourseIdForQuiz(quiz){
    const lesson = await lessonsRepository.findById(quiz.lessonId)
    if (!lesson){
        throw new NotFoundError('Lesson not found')
    }
    const section = await sectionsRepository.findById(lesson.sectionId)
    if (!section){
        throw new NotFoundError('Section not found')
    }
    return section.courseId
}

async function submitAttempt(studentId, quizId, answers){
    const quiz = await quizzesRepository.findById(quizId)
    if (!quiz){
        throw new NotFoundError('Quiz not found')
    }

    const courseId = await getCourseIdForQuiz(quiz)
    const enrollment = await enrollmentsRepository.findByStudentAndCourse(studentId, courseId)
    if (!enrollment){
        throw new ForbiddenError('You must be enrolled in the course to attempt this quiz')
    }

    const attemptsUsed = await quizAttemptsRepository.countByQuizAndStudent(quizId, studentId)
    if (attemptsUsed >= quiz.attemptLimit){
        throw new BadRequestError('You have reached the attempt limit for this quiz')
    }

    const questions = await questionsRepository.findByQuiz(quizId)
    const answerMap = {}
    answers.forEach((answer) => {
        answerMap[answer.questionId] = answer.selectedOption
    })

    let correct = 0
    questions.forEach((question) => {
        const selected = answerMap[question._id.toString()]
        if (selected !== undefined && selected === question.correctAnswer){
            correct = correct + 1
        }
    })

    const total = questions.length
    const score = total === 0 ? 0 : Math.round((correct / total) * 100)
    const passed = score >= quiz.passPercentage
    const attemptNo = attemptsUsed + 1

    await quizAttemptsRepository.createAttempt({
        quizId,
        studentId,
        score,
        passed,
        attemptNo
    })

    await progressService.checkAndMarkCourseCompleted(studentId, courseId)

    const allAttempts = await quizAttemptsRepository.findByQuizAndStudent(quizId, studentId)
    const bestScore = allAttempts.reduce((max, attempt) => (attempt.score > max ? attempt.score : max), 0)

    return {
        attemptNo,
        score,
        passed,
        bestScore,
        bestPassed: bestScore >= quiz.passPercentage,
        attemptsUsed: attemptNo,
        attemptsLeft: quiz.attemptLimit - attemptNo
    }
}

async function getResults(user, quizId){
    const quiz = await quizzesRepository.findById(quizId)
    if (!quiz){
        throw new NotFoundError('Quiz not found')
    }

    if (user.role === 'student'){
        const attempts = await quizAttemptsRepository.findByQuizAndStudent(quizId, user.id)
        const bestScore = attempts.reduce((max, attempt) => (attempt.score > max ? attempt.score : max), 0)
        return {
            quizId,
            attempts,
            bestScore,
            passed: bestScore >= quiz.passPercentage,
            attemptsUsed: attempts.length,
            attemptLimit: quiz.attemptLimit
        }
    }

    const courseId = await getCourseIdForQuiz(quiz)
    const course = await coursesRepository.findById(courseId)
    if (user.role !== 'admin' && course.instructorId.toString() !== user.id){
        throw new ForbiddenError('You can only view results for your own course')
    }

    const attempts = await quizAttemptsRepository.findByQuiz(quizId)
    return { quizId, attempts }
}

module.exports = {
    submitAttempt,
    getResults
}
