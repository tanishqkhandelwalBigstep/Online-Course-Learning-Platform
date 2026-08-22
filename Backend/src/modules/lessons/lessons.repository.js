const Lesson = require('./lessons.model')

function createLesson(data){
    return Lesson.create(data)
}

function findById(id){
    return Lesson.findById(id)
}

function findBySectionId(sectionId){
    return Lesson.find({ sectionId }).sort('order')
}

function findBySectionIds(sectionIds){
    return Lesson.find({ sectionId: { $in: sectionIds } }).sort('order')
}

function countBySectionId(sectionId){
    return Lesson.countDocuments({ sectionId })
}

function countBySectionIds(sectionIds){
    return Lesson.countDocuments({ sectionId: { $in: sectionIds } })
}

function deleteById(id){
    return Lesson.findByIdAndDelete(id)
}

function deleteBySectionIds(sectionIds){
    return Lesson.deleteMany({ sectionId: { $in: sectionIds } })
}

module.exports = {
    createLesson,
    findById,
    findBySectionId,
    findBySectionIds,
    countBySectionId,
    countBySectionIds,
    deleteById,
    deleteBySectionIds
}
