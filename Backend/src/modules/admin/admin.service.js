const usersRepository = require('../users/users.repository')
const coursesRepository = require('../courses/courses.repository')
const enrollmentsRepository = require('../enrollments/enrollments.repository')
const categoriesRepository = require('../categories/categories.repository')
const { createPassword } = require('../../utils/hash')
const { getPagination, buildMeta } = require('../../utils/pagination')
const { ConflictError } = require('../../utils/error')

async function createUser(data){
    const existing = await usersRepository.findByEmail(data.email)
    if (existing){
        throw new ConflictError('Email is already registered')
    }

    const hashedPassword = await createPassword(data.password)
    const user = await usersRepository.createUser({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role
    })

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
    }
}

async function getAllUsers(query){
    const { page, limit, skip } = getPagination(query)
    const criteria = {
        search: query && query.search,
        role: query && query.role
    }

    const [items, total] = await Promise.all([
        usersRepository.findPaged(criteria, skip, limit),
        usersRepository.countByFilter(criteria)
    ])

    return { items, pagination: buildMeta(total, page, limit) }
}

async function getAllCourses(query){
    const { page, limit, skip } = getPagination(query)
    const criteria = {
        search: query && query.search,
        status: query && query.status
    }

    const [items, total] = await Promise.all([
        coursesRepository.findPaged(criteria, skip, limit),
        coursesRepository.countByFilter(criteria)
    ])

    return { items, pagination: buildMeta(total, page, limit) }
}

async function getOverview(){
    const users = await usersRepository.findAll()
    const students = users.filter((user) => user.role === 'student').length
    const instructors = users.filter((user) => user.role === 'instructor').length
    const admins = users.filter((user) => user.role === 'admin').length

    const totalCourses = await coursesRepository.countAll()
    const publishedCourses = await coursesRepository.countByStatus('published')
    const draftCourses = await coursesRepository.countByStatus('draft')
    const totalEnrollments = await enrollmentsRepository.countAll()
    const categories = await categoriesRepository.findAll()

    return {
        users: {
            total: users.length,
            students,
            instructors,
            admins
        },
        courses: {
            total: totalCourses,
            published: publishedCourses,
            draft: draftCourses
        },
        totalEnrollments,
        totalCategories: categories.length
    }
}

module.exports = {
    createUser,
    getAllUsers,
    getAllCourses,
    getOverview
}
