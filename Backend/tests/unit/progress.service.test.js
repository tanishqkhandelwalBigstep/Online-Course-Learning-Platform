jest.mock('../../src/modules/progress/progress.repository')
jest.mock('../../src/modules/lessons/lessons.repository')
jest.mock('../../src/modules/sections/sections.repository')
jest.mock('../../src/modules/courses/courses.repository')
jest.mock('../../src/modules/enrollments/enrollments.repository')
jest.mock('../../src/modules/quizzes/quizzes.repository')
jest.mock('../../src/modules/quizAttempts/quizAttempts.repository')

const progressRepository = require('../../src/modules/progress/progress.repository')
const lessonsRepository = require('../../src/modules/lessons/lessons.repository')
const sectionsRepository = require('../../src/modules/sections/sections.repository')
const coursesRepository = require('../../src/modules/courses/courses.repository')
const enrollmentsRepository = require('../../src/modules/enrollments/enrollments.repository')
const quizzesRepository = require('../../src/modules/quizzes/quizzes.repository')
const quizAttemptsRepository = require('../../src/modules/quizAttempts/quizAttempts.repository')
const progressService = require('../../src/modules/progress/progress.service')

const STUDENT_ID = 'student1'
const COURSE_ID = 'course1'

function wireCourse({ lessons, completedLessonIds, quizzes, passedQuizIds }){
    sectionsRepository.findByCourse.mockResolvedValue([{ _id: 'section1' }])
    lessonsRepository.findBySectionIds.mockResolvedValue(lessons)
    progressRepository.findCompletedLessons.mockImplementation((studentId, requiredLessonIds) => {
        const ids = requiredLessonIds.map((id) => id.toString())
        return Promise.resolve(
            completedLessonIds.filter((id) => ids.includes(id)).map((id) => ({ lessonId: id }))
        )
    })
    quizzesRepository.findByLessonIds.mockResolvedValue(quizzes)
    quizAttemptsRepository.countPassed.mockImplementation((quizId) => {
        return Promise.resolve(passedQuizIds.includes(quizId.toString()) ? 1 : 0)
    })
    coursesRepository.findById.mockResolvedValue({ _id: COURSE_ID })
}

describe('progressService.getCourseProgress (progress calculation)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('counts required lessons plus their quizzes as total items', async () => {
        wireCourse({
            lessons: [
                { _id: 'l1', isRequired: true },
                { _id: 'l2', isRequired: true }
            ],
            completedLessonIds: ['l1'],
            quizzes: [{ _id: 'quizA' }, { _id: 'quizB' }],
            passedQuizIds: ['quizA']
        })

        const result = await progressService.getCourseProgress(STUDENT_ID, COURSE_ID)

        expect(result.totalRequiredLessons).toBe(2)
        expect(result.completedRequiredLessons).toBe(1)
        expect(result.totalQuizzes).toBe(2)
        expect(result.passedQuizzes).toBe(1)
        expect(result.totalItems).toBe(4)
        expect(result.completedItems).toBe(2)
        expect(result.percentage).toBe(50)
    })

    test('excludes non-required lessons from the totals', async () => {
        wireCourse({
            lessons: [
                { _id: 'l1', isRequired: true },
                { _id: 'l2', isRequired: false }
            ],
            completedLessonIds: ['l1'],
            quizzes: [{ _id: 'quizA' }],
            passedQuizIds: ['quizA']
        })

        const result = await progressService.getCourseProgress(STUDENT_ID, COURSE_ID)

        expect(result.totalRequiredLessons).toBe(1)
        expect(result.totalItems).toBe(2)
        expect(result.completedItems).toBe(2)
        expect(result.percentage).toBe(100)
    })

    test('returns 0 percent for a course with no required items', async () => {
        wireCourse({
            lessons: [],
            completedLessonIds: [],
            quizzes: [],
            passedQuizIds: []
        })

        const result = await progressService.getCourseProgress(STUDENT_ID, COURSE_ID)

        expect(result.totalItems).toBe(0)
        expect(result.percentage).toBe(0)
    })

    test('throws NotFound when the course does not exist', async () => {
        coursesRepository.findById.mockResolvedValue(null)

        await expect(
            progressService.getCourseProgress(STUDENT_ID, COURSE_ID)
        ).rejects.toThrow('Course not found')
    })
})

describe('progressService.checkAndMarkCourseCompleted (auto-completion)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('flips the enrollment to completed when every item is done', async () => {
        enrollmentsRepository.findByStudentAndCourse.mockResolvedValue({ _id: 'enroll1', status: 'active' })
        wireCourse({
            lessons: [{ _id: 'l1', isRequired: true }],
            completedLessonIds: ['l1'],
            quizzes: [{ _id: 'quizA' }],
            passedQuizIds: ['quizA']
        })
        enrollmentsRepository.updateStatus.mockResolvedValue({})

        await progressService.checkAndMarkCourseCompleted(STUDENT_ID, COURSE_ID)

        expect(enrollmentsRepository.updateStatus).toHaveBeenCalledWith('enroll1', 'completed')
    })

    test('does not flip when progress is incomplete', async () => {
        enrollmentsRepository.findByStudentAndCourse.mockResolvedValue({ _id: 'enroll1', status: 'active' })
        wireCourse({
            lessons: [{ _id: 'l1', isRequired: true }],
            completedLessonIds: [],
            quizzes: [{ _id: 'quizA' }],
            passedQuizIds: []
        })

        await progressService.checkAndMarkCourseCompleted(STUDENT_ID, COURSE_ID)

        expect(enrollmentsRepository.updateStatus).not.toHaveBeenCalled()
    })

    test('does nothing when the student is not enrolled', async () => {
        enrollmentsRepository.findByStudentAndCourse.mockResolvedValue(null)

        await progressService.checkAndMarkCourseCompleted(STUDENT_ID, COURSE_ID)

        expect(enrollmentsRepository.updateStatus).not.toHaveBeenCalled()
    })
})
