const Enrollment = require('./enrollments.model')

function createEnrollment(data){
    return Enrollment.create(data)
}

function findByStudentAndCourse(studentId, courseId){
    return Enrollment.findOne({ studentId, courseId })
}

function findByStudent(studentId){
    return Enrollment.find({ studentId })
        .populate('courseId', 'title description status')
        .sort('-createdAt')
}

function findByStudentPaged(studentId, skip, limit){
    return Enrollment.find({ studentId })
        .populate('courseId', 'title description status')
        .sort('-createdAt -_id')
        .skip(skip)
        .limit(limit)
}

function countByStudent(studentId){
    return Enrollment.countDocuments({ studentId })
}

function updateStatus(id, status){
    return Enrollment.findByIdAndUpdate(id, { status }, { new: true })
}

function countByCourse(courseId){
    return Enrollment.countDocuments({ courseId })
}

function countAll(){
    return Enrollment.countDocuments()
}

module.exports = {
    createEnrollment,
    findByStudentAndCourse,
    findByStudent,
    findByStudentPaged,
    countByStudent,
    updateStatus,
    countByCourse,
    countAll
}
