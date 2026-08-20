const coursesRepository = require('./courses.repository')
const categoriesRepository = require('../categories/categories.repository')
const sectionsRepository = require('../sections/sections.repository')
const lessonsRepository = require('../lessons/lessons.repository')
const { getPagination, buildMeta } = require('../../utils/pagination')
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../utils/error')

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
    const course = await coursesRepository.findById(courseId)
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

    if (user.role !== 'admin' && course.instructorId.toString() !== user.id){
        throw new ForbiddenError('You can only publish your own course')
    }

    const sections = await sectionsRepository.findByCourse(courseId)
    const sectionIds = sections.map((section) => section._id)
    const lessonCount = await lessonsRepository.countBySectionIds(sectionIds)
    if (lessonCount < 1){
        throw new BadRequestError('Course must have at least one lesson before publishing')
    }

    return coursesRepository.updateById(courseId, { status: 'published' })
}

module.exports = {
    createCourse,
    getAllPublishedCourses,
    getCourseById,
    publishCourse
}
