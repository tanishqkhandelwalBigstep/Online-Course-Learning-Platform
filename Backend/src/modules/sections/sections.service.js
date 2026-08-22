const sectionsRepository = require('./sections.repository')
const coursesRepository = require('../courses/courses.repository')
const lessonsRepository = require('../lessons/lessons.repository')
const quizzesRepository = require('../quizzes/quizzes.repository')
const enrollmentsRepository = require('../enrollments/enrollments.repository')
const { NotFoundError, ForbiddenError } = require('../../utils/error')

async function canViewContent(user, course){
    if (!user){
        return false
    }
    if (user.role === 'admin'){
        return true
    }
    if (user.role === 'instructor' && course.instructorId.toString() === user.id){
        return true
    }
    if (user.role === 'student'){
        const enrollment = await enrollmentsRepository.findByStudentAndCourse(user.id, course._id)
        return Boolean(enrollment)
    }
    return false
}

async function createSection(user, courseId, data){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    if (user.role !== 'admin' && course.instructorId.toString() !== user.id){
        throw new ForbiddenError('You can only add sections to your own course')
    }

    let order = data.order
    if (!order){
        const count = await sectionsRepository.countByCourse(courseId)
        order = count + 1
    }

    const section = await sectionsRepository.createSection({
        courseId,
        title: data.title,
        order
    })
    return section
}

async function getCourseSections(courseId, user){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    const unlocked = await canViewContent(user, course)

    const sections = await sectionsRepository.findByCourse(courseId)

    const result = []
    for (const section of sections){
        const lessons = await lessonsRepository.findBySectionId(section._id)
        const lessonsOut = []
        for (const lesson of lessons){
            const quiz = await quizzesRepository.findByLesson(lesson._id)
            const lessonData = {
                _id: lesson._id,
                title: lesson.title,
                order: lesson.order,
                isRequired: lesson.isRequired,
                hasQuiz: Boolean(quiz)
            }
            if (unlocked){
                lessonData.videoUrl = lesson.videoUrl
                lessonData.quiz = quiz
                    ? {
                        _id: quiz._id,
                        title: quiz.title,
                        passPercentage: quiz.passPercentage,
                        attemptLimit: quiz.attemptLimit
                    }
                    : null
            }
            lessonsOut.push(lessonData)
        }
        result.push({ section, lessons: lessonsOut, locked: !unlocked })
    }
    return result
}

module.exports = {
    createSection,
    getCourseSections
}
