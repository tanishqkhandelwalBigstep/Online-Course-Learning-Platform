const coursesRepository = require('./courses.repository')
const categoriesRepository = require('../categories/categories.repository')
const sectionsRepository = require('../sections/sections.repository')
const lessonsRepository = require('../lessons/lessons.repository')
const quizzesRepository = require('../quizzes/quizzes.repository')
const questionsRepository = require('../questions/questions.repository')
const quizAttemptsRepository = require('../quizAttempts/quizAttempts.repository')
const progressRepository = require('../progress/progress.repository')
const enrollmentsRepository = require('../enrollments/enrollments.repository')
const reviewsRepository = require('../reviews/reviews.repository')
const { getPagination, buildMeta } = require('../../utils/pagination')
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../utils/error')

function assertOwnerOrAdmin(user, course, action){
    if (user.role !== 'admin' && course.instructorId.toString() !== user.id){
        throw new ForbiddenError(`You can only ${action} your own course`)
    }
}

async function createCourse(instructorId, data){
    const category = await categoriesRepository.findById(data.categoryId)
    if (!category){
        throw new BadRequestError('Invalid category')
    }

    const course = await coursesRepository.createCourse({
        instructorId,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        price: data.price,
        status: 'draft'
    })
    return course
}

async function getAllPublishedCourses(query){
    const { page, limit, skip } = getPagination(query)
    const criteria = {
        status: 'published',
        search: query && query.search,
        categoryId: query && query.category
    }

    const [items, total] = await Promise.all([
        coursesRepository.findPaged(criteria, skip, limit),
        coursesRepository.countByFilter(criteria)
    ])

    return { items, pagination: buildMeta(total, page, limit) }
}

async function getCourseById(courseId){
    const course = await coursesRepository.findByIdPopulated(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }
    return course
}

async function publishCourse(user, courseId){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    assertOwnerOrAdmin(user, course, 'publish')

    const sections = await sectionsRepository.findByCourse(courseId)
    const sectionIds = sections.map((section) => section._id)
    const lessonCount = await lessonsRepository.countBySectionIds(sectionIds)
    if (lessonCount < 1){
        throw new BadRequestError('Course must have at least one lesson before publishing')
    }

    return coursesRepository.updateById(courseId, { status: 'published' })
}

async function updateCourse(user, courseId, data){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    assertOwnerOrAdmin(user, course, 'update')

    if (data.categoryId){
        const category = await categoriesRepository.findById(data.categoryId)
        if (!category){
            throw new BadRequestError('Invalid category')
        }
    }

    const updates = {}
    for (const key of ['title', 'description', 'categoryId', 'thumbnailUrl', 'price']){
        if (data[key] !== undefined){
            updates[key] = data[key]
        }
    }

    return coursesRepository.updateById(courseId, updates)
}

async function deleteCourse(user, courseId){
    const course = await coursesRepository.findById(courseId)
    if (!course){
        throw new NotFoundError('Course not found')
    }

    assertOwnerOrAdmin(user, course, 'delete')

    const sections = await sectionsRepository.findByCourse(courseId)
    const sectionIds = sections.map((section) => section._id)
    const lessons = await lessonsRepository.findBySectionIds(sectionIds)
    const lessonIds = lessons.map((lesson) => lesson._id)
    const quizzes = await quizzesRepository.findByLessonIds(lessonIds)
    const quizIds = quizzes.map((quiz) => quiz._id)

    await questionsRepository.deleteByQuizIds(quizIds)
    await quizAttemptsRepository.deleteByQuizIds(quizIds)
    await quizzesRepository.deleteByLessonIds(lessonIds)
    await progressRepository.deleteByLessonIds(lessonIds)
    await lessonsRepository.deleteBySectionIds(sectionIds)
    await sectionsRepository.deleteByCourse(courseId)
    await enrollmentsRepository.deleteByCourse(courseId)
    await reviewsRepository.deleteByCourse(courseId)
    await coursesRepository.deleteById(courseId)

    return { deleted: true }
}

module.exports = {
    createCourse,
    getAllPublishedCourses,
    getCourseById,
    publishCourse,
    updateCourse,
    deleteCourse
}
