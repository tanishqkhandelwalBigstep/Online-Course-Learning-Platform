const Course = require('./courses.model')

function createCourse(data){
    return Course.create(data)
}

function findById(id){
    return Course.findById(id)
}

function findAllPublished(){
    return Course.find({ status: 'published' })
        .populate('categoryId', 'name')
        .populate('instructorId', 'name')
        .sort('-createdAt')
}

function findByInstructor(instructorId){
    return Course.find({ instructorId })
        .populate('categoryId', 'name')
        .sort('-createdAt')
}

function updateById(id, data){
    return Course.findByIdAndUpdate(id, data, { new: true })
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
    findAllPublished,
    findByInstructor,
    updateById,
    findAllCourses,
    countAll,
    countByStatus
}
