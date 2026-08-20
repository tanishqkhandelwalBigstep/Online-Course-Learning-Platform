jest.mock('../../src/modules/quizAttempts/quizAttempts.repository')
jest.mock('../../src/modules/quizzes/quizzes.repository')
jest.mock('../../src/modules/questions/questions.repository')
jest.mock('../../src/modules/lessons/lessons.repository')
jest.mock('../../src/modules/sections/sections.repository')
jest.mock('../../src/modules/courses/courses.repository')
jest.mock('../../src/modules/enrollments/enrollments.repository')
jest.mock('../../src/modules/progress/progress.service')

const quizAttemptsRepository = require('../../src/modules/quizAttempts/quizAttempts.repository')
const quizzesRepository = require('../../src/modules/quizzes/quizzes.repository')
const questionsRepository = require('../../src/modules/questions/questions.repository')
const lessonsRepository = require('../../src/modules/lessons/lessons.repository')
const sectionsRepository = require('../../src/modules/sections/sections.repository')
const enrollmentsRepository = require('../../src/modules/enrollments/enrollments.repository')
const progressService = require('../../src/modules/progress/progress.service')
const quizAttemptsService = require('../../src/modules/quizAttempts/quizAttempts.service')

const QUIZ_ID = 'quiz1'
const STUDENT_ID = 'student1'
const COURSE_ID = 'course1'

function buildQuestions(corrects){
    return corrects.map((correct, index) => ({
        _id: `q${index + 1}`,
        correctAnswer: correct
    }))
}

function buildAnswers(selected){
    return selected.map((option, index) => ({
        questionId: `q${index + 1}`,
        selectedOption: option
    }))
}

function wireHappyPath(quiz, questions){
    quizzesRepository.findById.mockResolvedValue(quiz)
    lessonsRepository.findById.mockResolvedValue({ _id: 'lesson1', sectionId: 'section1' })
    sectionsRepository.findById.mockResolvedValue({ _id: 'section1', courseId: COURSE_ID })
    enrollmentsRepository.findByStudentAndCourse.mockResolvedValue({ _id: 'enroll1' })
    questionsRepository.findByQuiz.mockResolvedValue(questions)
    quizAttemptsRepository.createAttempt.mockResolvedValue({})
    progressService.checkAndMarkCourseCompleted.mockResolvedValue()
}

describe('quizAttemptsService.submitAttempt (server-side scoring)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('scores a fully correct attempt as 100 and passes', async () => {
        const quiz = { _id: QUIZ_ID, lessonId: 'lesson1', passPercentage: 60, attemptLimit: 3 }
        const questions = buildQuestions([0, 1, 2, 3, 0])
        wireHappyPath(quiz, questions)
        quizAttemptsRepository.countByQuizAndStudent.mockResolvedValue(0)
        quizAttemptsRepository.findByQuizAndStudent.mockResolvedValue([{ score: 100 }])

        const result = await quizAttemptsService.submitAttempt(STUDENT_ID, QUIZ_ID, buildAnswers([0, 1, 2, 3, 0]))

        expect(result.score).toBe(100)
        expect(result.passed).toBe(true)
        expect(result.attemptNo).toBe(1)
    })

    test('rounds a partial score (3 of 5 correct = 60) and applies pass threshold', async () => {
        const quiz = { _id: QUIZ_ID, lessonId: 'lesson1', passPercentage: 60, attemptLimit: 3 }
        const questions = buildQuestions([0, 0, 0, 0, 0])
        wireHappyPath(quiz, questions)
        quizAttemptsRepository.countByQuizAndStudent.mockResolvedValue(0)
        quizAttemptsRepository.findByQuizAndStudent.mockResolvedValue([{ score: 60 }])

        const result = await quizAttemptsService.submitAttempt(STUDENT_ID, QUIZ_ID, buildAnswers([0, 0, 0, 1, 1]))

        expect(result.score).toBe(60)
        expect(result.passed).toBe(true)
    })

    test('marks attempt as failed when score is below passPercentage', async () => {
        const quiz = { _id: QUIZ_ID, lessonId: 'lesson1', passPercentage: 80, attemptLimit: 3 }
        const questions = buildQuestions([0, 0, 0, 0, 0])
        wireHappyPath(quiz, questions)
        quizAttemptsRepository.countByQuizAndStudent.mockResolvedValue(0)
        quizAttemptsRepository.findByQuizAndStudent.mockResolvedValue([{ score: 40 }])

        const result = await quizAttemptsService.submitAttempt(STUDENT_ID, QUIZ_ID, buildAnswers([0, 0, 1, 1, 1]))

        expect(result.score).toBe(40)
        expect(result.passed).toBe(false)
    })

    test('reports the best score across all attempts, not just the latest', async () => {
        const quiz = { _id: QUIZ_ID, lessonId: 'lesson1', passPercentage: 60, attemptLimit: 3 }
        const questions = buildQuestions([0, 0, 0, 0, 0])
        wireHappyPath(quiz, questions)
        quizAttemptsRepository.countByQuizAndStudent.mockResolvedValue(1)
        quizAttemptsRepository.findByQuizAndStudent.mockResolvedValue([{ score: 100 }, { score: 20 }])

        const result = await quizAttemptsService.submitAttempt(STUDENT_ID, QUIZ_ID, buildAnswers([0, 1, 1, 1, 1]))

        expect(result.score).toBe(20)
        expect(result.bestScore).toBe(100)
        expect(result.bestPassed).toBe(true)
        expect(result.attemptNo).toBe(2)
    })

    test('enforces the attempt limit', async () => {
        const quiz = { _id: QUIZ_ID, lessonId: 'lesson1', passPercentage: 60, attemptLimit: 3 }
        const questions = buildQuestions([0, 0, 0, 0, 0])
        wireHappyPath(quiz, questions)
        quizAttemptsRepository.countByQuizAndStudent.mockResolvedValue(3)

        await expect(
            quizAttemptsService.submitAttempt(STUDENT_ID, QUIZ_ID, buildAnswers([0, 0, 0, 0, 0]))
        ).rejects.toThrow('attempt limit')
        expect(quizAttemptsRepository.createAttempt).not.toHaveBeenCalled()
    })

    test('rejects an attempt from a student not enrolled in the course', async () => {
        const quiz = { _id: QUIZ_ID, lessonId: 'lesson1', passPercentage: 60, attemptLimit: 3 }
        quizzesRepository.findById.mockResolvedValue(quiz)
        lessonsRepository.findById.mockResolvedValue({ _id: 'lesson1', sectionId: 'section1' })
        sectionsRepository.findById.mockResolvedValue({ _id: 'section1', courseId: COURSE_ID })
        enrollmentsRepository.findByStudentAndCourse.mockResolvedValue(null)

        await expect(
            quizAttemptsService.submitAttempt(STUDENT_ID, QUIZ_ID, buildAnswers([0, 0, 0, 0, 0]))
        ).rejects.toThrow('enrolled')
    })

    test('throws when the quiz does not exist', async () => {
        quizzesRepository.findById.mockResolvedValue(null)

        await expect(
            quizAttemptsService.submitAttempt(STUDENT_ID, QUIZ_ID, buildAnswers([0]))
        ).rejects.toThrow('Quiz not found')
    })

    test('ignores unanswered questions when scoring', async () => {
        const quiz = { _id: QUIZ_ID, lessonId: 'lesson1', passPercentage: 20, attemptLimit: 3 }
        const questions = buildQuestions([0, 0, 0, 0, 0])
        wireHappyPath(quiz, questions)
        quizAttemptsRepository.countByQuizAndStudent.mockResolvedValue(0)
        quizAttemptsRepository.findByQuizAndStudent.mockResolvedValue([{ score: 20 }])

        const result = await quizAttemptsService.submitAttempt(STUDENT_ID, QUIZ_ID, buildAnswers([0]))

        expect(result.score).toBe(20)
        expect(result.passed).toBe(true)
    })
})
