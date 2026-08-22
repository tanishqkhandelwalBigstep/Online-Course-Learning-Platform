const Course = require('./courses.model')
const { buildSearchRegex } = require('../../utils/pagination')

function buildFilter({ search, status, instructorId, categoryId }){
    const filter = {}
    if (status){
        filter.status = status
    }
    if (instructorId){
        filter.instructorId = instructorId
    }
    if (categoryId){
        filter.categoryId = categoryId
    }
    const regex = buildSearchRegex(search)
    if (regex){
        filter.$or = [
            { title: regex },
            { description: regex }
        ]
    }
    return filter
}

function createCourse(data){
    return Course.create(data)
}

function findById(id){
    return Course.findById(id)
}

function findByIdPopulated(id){
    return Course.findById(id)
        .populate('categoryId', 'name')
        .populate('instructorId', 'name')
}

function findAllPublished(){
    return Course.find({ status: 'published' })
        .populate('categoryId', 'name')
        .populate('instructorId', 'name')
        .sort('-createdAt')
}

function findPaged(criteria, skip, limit){
    return Course.find(buildFilter(criteria))
        .populate('categoryId', 'name')
        .populate('instructorId', 'name')
        .sort('-createdAt -_id')
        .skip(skip)
        .limit(limit)
}

function countByFilter(criteria){
    return Course.countDocuments(buildFilter(criteria))
}

function findByInstructor(instructorId){
    return Course.find({ instructorId })
        .populate('categoryId', 'name')
        .sort('-createdAt')
}

function findByInstructorPaged(instructorId, skip, limit){
    return Course.find({ instructorId })
        .populate('categoryId', 'name')
        .sort('-createdAt -_id')
        .skip(skip)
        .limit(limit)
}

function countByInstructor(instructorId){
    return Course.countDocuments({ instructorId })
}

function updateById(id, data){
    return Course.findByIdAndUpdate(id, data, { new: true })
}

function deleteById(id){
    return Course.findByIdAndDelete(id)
}

function findAllCourses(){
    return Course.find()
        .populate('categoryId', 'name')
        .populate('instructorId', 'name')
        .sort('-createdAt')
}

function countAll(){
    return Course.countDocuments()
}

function countByStatus(status){
    return Course.countDocuments({ status })
}

module.exports = {
    createCourse,
    findById,
    findByIdPopulated,
    findAllPublished,
    findPaged,
    countByFilter,
    findByInstructor,
    findByInstructorPaged,
    countByInstructor,
    updateById,
    deleteById,
    findAllCourses,
    countAll,
    countByStatus
}
