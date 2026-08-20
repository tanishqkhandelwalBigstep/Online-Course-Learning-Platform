const coursesRepository = require('../courses/courses.repository')
const sectionsRepository = require('../sections/sections.repository')
const lessonsRepository = require('../lessons/lessons.repository')
const quizzesRepository = require('../quizzes/quizzes.repository')
const questionsRepository = require('../questions/questions.repository')
const enrollmentsRepository = require('../enrollments/enrollments.repository')
const { getPagination, buildMeta } = require('../../utils/pagination')
const { NotFoundError, ForbiddenError } = require('../../utils/error')

async function getInstructorOverview(instructorId){
    const courses = await coursesRepository.findByInstructor(instructorId)

    let publishedCourses = 0
    let draftCourses = 0
    let totalEnrollments = 0

    for (const course of courses){
        if (course.status === 'published'){
            publishedCourses = publishedCourses + 1
        } else {
            draftCourses = draftCourses + 1
        }
        totalEnrollments = totalEnrollments + await enrollmentsRepository.countByCourse(course._id)
    }

    return {
        totalCourses: courses.length,
        publishedCourses,
        draftCourses,
        totalEnrollments
    }
}

async function getInstructorCourses(instructorId, query){
    const { page, limit, skip } = getPagination(query)

    const [courses, total] = await Promise.all([
        coursesRepository.findByInstructorPaged(instructorId, skip, limit),
        coursesRepository.countByInstructor(instructorId)
    ])

    const items = []
    for (const course of courses){
        const sections = await sectionsRepository.findByCourse(course._id)
        const sectionIds = sections.map((section) => section._id)
        const lessonCount = await lessonsRepository.countBySectionIds(sectionIds)
        const enrollmentCount = await enrollmentsRepository.countByCourse(course._id)

        items.push({
            course,
            sectionCount: sections.length,
            lessonCount,
            enrollmentCount
        })
    }

    return { items, pagination: buildMeta(total, page, limit) }
}

async function getInstructorCourseDetail(user, courseId){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    if (user.role !== 'admin' && course.instructorId.toString() !== user.id){
        throw new ForbiddenError('You can only view your own course')
    }

    const sections = await sectionsRepository.findByCourse(courseId)
    const sectionsDetail = []

    for (const section of sections){
        const lessons = await lessonsRepository.findBySectionId(section._id)
        const lessonsDetail = []

        for (const lesson of lessons){
            const quiz = await quizzesRepository.findByLesson(lesson._id)
            let questions = []
            if (quiz){
                questions = await questionsRepository.findByQuiz(quiz._id)
            }
            lessonsDetail.push({ lesson, quiz, questions })
        }

        sectionsDetail.push({ section, lessons: lessonsDetail })
    }

    return { course, sections: sectionsDetail }
}

module.exports = {
    getInstructorOverview,
    getInstructorCourses,
    getInstructorCourseDetail
}
