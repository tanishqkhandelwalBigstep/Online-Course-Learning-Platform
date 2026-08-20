const progressRepository = require('./progress.repository')
const lessonsRepository = require('../lessons/lessons.repository')
const sectionsRepository = require('../sections/sections.repository')
const coursesRepository = require('../courses/courses.repository')
const enrollmentsRepository = require('../enrollments/enrollments.repository')
const quizzesRepository = require('../quizzes/quizzes.repository')
const quizAttemptsRepository = require('../quizAttempts/quizAttempts.repository')
const { NotFoundError, ForbiddenError, ConflictError } = require('../../utils/error')

async function completeLesson(studentId, lessonId){
    const lesson = await lessonsRepository.findById(lessonId)
    if (!lesson){
        throw new NotFoundError('Lesson not found')
    }

    const section = await sectionsRepository.findById(lesson.sectionId)
    if (!section){
        throw new NotFoundError('Section not found')
    }

    const courseId = section.courseId
    const enrollment = await enrollmentsRepository.findByStudentAndCourse(studentId, courseId)
    if (!enrollment){
        throw new ForbiddenError('You must be enrolled in the course to complete its lessons')
    }

    const existing = await progressRepository.findByStudentAndLesson(studentId, lessonId)
    if (existing){
        throw new ConflictError('Lesson already completed')
    }

    const progress = await progressRepository.createProgress({
        studentId,
        lessonId
    })

    await checkAndMarkCourseCompleted(studentId, courseId)

    return progress
}

async function computeProgress(studentId, courseId){
    const sections = await sectionsRepository.findByCourse(courseId)
    const sectionIds = sections.map((section) => section._id)
    const lessons = await lessonsRepository.findBySectionIds(sectionIds)

    const requiredLessons = lessons.filter((lesson) => lesson.isRequired)
    const requiredLessonIds = requiredLessons.map((lesson) => lesson._id)

    const completedLessonRecords = await progressRepository.findCompletedLessons(studentId, requiredLessonIds)
    const completedRequiredLessons = completedLessonRecords.length

    const quizzes = await quizzesRepository.findByLessonIds(requiredLessonIds)
    let passedQuizzes = 0
    for (const quiz of quizzes){
        const passedCount = await quizAttemptsRepository.countPassed(quiz._id, studentId)
        if (passedCount > 0){
            passedQuizzes = passedQuizzes + 1
        }
    }

    const totalRequiredLessons = requiredLessons.length
    const totalQuizzes = quizzes.length
    const totalItems = totalRequiredLessons + totalQuizzes
    const completedItems = completedRequiredLessons + passedQuizzes
    const percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100)

    return {
        courseId,
        totalRequiredLessons,
        completedRequiredLessons,
        totalQuizzes,
        passedQuizzes,
        totalItems,
        completedItems,
        percentage
    }
}

async function getCourseProgress(studentId, courseId){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    return computeProgress(studentId, courseId)
}

async function checkAndMarkCourseCompleted(studentId, courseId){
    const enrollment = await enrollmentsRepository.findByStudentAndCourse(studentId, courseId)
    if (!enrollment){
        return
    }

    const progress = await computeProgress(studentId, courseId)
    if (progress.totalItems > 0 && progress.completedItems === progress.totalItems && enrollment.status !== 'completed'){
        await enrollmentsRepository.updateStatus(enrollment._id, 'completed')
    }
}

module.exports = {
    completeLesson,
    getCourseProgress,
    checkAndMarkCourseCompleted
}
