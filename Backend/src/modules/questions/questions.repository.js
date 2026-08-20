const Question = require('./questions.model')

function createMany(questions){
    return Question.insertMany(questions)
}

function findByQuiz(quizId){
    return Question.find({ quizId })
}

function countByQuiz(quizId){
    return Question.countDocuments({ quizId })
}

function deleteByQuiz(quizId){
    return Question.deleteMany({ quizId })
}

module.exports = {
    createMany,
    findByQuiz,
    countByQuiz,
    deleteByQuiz
}
