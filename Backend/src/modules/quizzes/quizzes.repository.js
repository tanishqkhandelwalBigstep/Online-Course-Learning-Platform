const Quiz = require('./quizzes.model')

function createQuiz(data){
    return Quiz.create(data)
}

function findByLesson(lessonId){
    return Quiz.findOne({ lessonId })
}

function findByLessonIds(lessonIds){
    return Quiz.find({ lessonId: { $in: lessonIds } })
}

function findById(id){
    return Quiz.findById(id)
}

function deleteById(id){
    return Quiz.findByIdAndDelete(id)
}

function deleteByLessonIds(lessonIds){
    return Quiz.deleteMany({ lessonId: { $in: lessonIds } })
}

module.exports = {
    createQuiz,
    findByLesson,
    findByLessonIds,
    findById,
    deleteById,
    deleteByLessonIds
}
