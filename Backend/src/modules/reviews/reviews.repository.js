const mongoose = require('mongoose')
const Review = require('./reviews.model')

function createReview(data){
    return Review.create(data)
}

function findByStudentAndCourse(studentId, courseId){
    return Review.findOne({ studentId, courseId })
}

function findByCourse(courseId){
    return Review.find({ courseId }).populate('studentId', 'name').sort('-createdAt')
}

function findByCoursePaged(courseId, skip, limit){
    return Review.find({ courseId })
        .populate('studentId', 'name')
        .sort('-createdAt -_id')
        .skip(skip)
        .limit(limit)
}

function countByCourse(courseId){
    return Review.countDocuments({ courseId })
}

async function getRatingSummary(courseId){
    const result = await Review.aggregate([
        { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
        { $group: { _id: '$courseId', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ])

    if (result.length === 0){
        return { averageRating: 0, totalReviews: 0 }
    }

    return {
        averageRating: Math.round(result[0].averageRating * 10) / 10,
        totalReviews: result[0].totalReviews
    }
}

module.exports = {
    createReview,
    findByStudentAndCourse,
    findByCourse,
    findByCoursePaged,
    countByCourse,
    getRatingSummary
}
