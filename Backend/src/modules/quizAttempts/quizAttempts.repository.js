const QuizAttempt = require('./quizAttempts.model')

function createAttempt(data){
    return QuizAttempt.create(data)
}

function findByQuizAndStudent(quizId, studentId){
    return QuizAttempt.find({ quizId, studentId }).sort('attemptNo')
}

function countByQuizAndStudent(quizId, studentId){
    return QuizAttempt.countDocuments({ quizId, studentId })
}

function countPassed(quizId, studentId){
    return QuizAttempt.countDocuments({ quizId, studentId, passed: true })
}

function findByQuiz(quizId){
    return QuizAttempt.find({ quizId }).populate('studentId', 'name email').sort('-createdAt')
}

function deleteByQuiz(quizId){
    return QuizAttempt.deleteMany({ quizId })
}

function deleteByQuizIds(quizIds){
    return QuizAttempt.deleteMany({ quizId: { $in: quizIds } })
}

module.exports = {
    createAttempt,
    findByQuizAndStudent,
    countByQuizAndStudent,
    countPassed,
    findByQuiz,
    deleteByQuiz,
    deleteByQuizIds
}
