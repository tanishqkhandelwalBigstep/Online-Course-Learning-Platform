const Progress = require('./progress.model')

function createProgress(data){
    return Progress.create(data)
}

function findByStudentAndLesson(studentId, lessonId){
    return Progress.findOne({ studentId, lessonId })
}

function findCompletedLessons(studentId, lessonIds){
    return Progress.find({ studentId, lessonId: { $in: lessonIds } }).select('lessonId')
}

function deleteByLesson(lessonId){
    return Progress.deleteMany({ lessonId })
}

module.exports = {
    createProgress,
    findByStudentAndLesson,
    findCompletedLessons,
    deleteByLesson
}
