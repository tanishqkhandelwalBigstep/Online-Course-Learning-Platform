const Section = require('./sections.model')

function createSection(data){
    return Section.create(data)
}

function findById(id){
    return Section.findById(id)
}

function findByCourse(courseId){
    return Section.find({ courseId }).sort('order')
}

function countByCourse(courseId){
    return Section.countDocuments({ courseId })
}

module.exports = {
    createSection,
    findById,
    findByCourse,
    countByCourse
}
