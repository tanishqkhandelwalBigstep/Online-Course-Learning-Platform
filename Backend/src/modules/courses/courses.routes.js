const express = require('express')
const coursesController = require('./courses.controller')
const sectionsController = require('../sections/sections.controller')
const enrollmentsController = require('../enrollments/enrollments.controller')
const progressController = require('../progress/progress.controller')
const reviewsController = require('../reviews/reviews.controller')
const authenticate = require('../../middleware/authenticate')
const optionalAuthenticate = require('../../middleware/optionalAuthenticate')
const authorize = require('../../middleware/authorize')
const validate = require('../../middleware/validate')
const { createCourseSchema, updateCourseSchema } = require('./courses.validation')
const { createSectionSchema } = require('../sections/sections.validation')
const { createReviewSchema, updateReviewSchema } = require('../reviews/reviews.validation')

const router = express.Router()

router.get('/', coursesController.getAllCourses)
router.post('/', authenticate, authorize('instructor'), validate(createCourseSchema), coursesController.createCourse)
router.put('/:id/publish', authenticate, authorize('instructor', 'admin'), coursesController.publishCourse)

router.post('/:id/sections', authenticate, authorize('instructor', 'admin'), validate(createSectionSchema), sectionsController.createSection)
router.get('/:id/sections', optionalAuthenticate, sectionsController.getCourseSections)

router.post('/:id/enroll', authenticate, authorize('student'), enrollmentsController.enroll)
router.get('/:id/progress', authenticate, authorize('student', 'instructor', 'admin'), progressController.getCourseProgress)

router.post('/:id/reviews', authenticate, authorize('student'), validate(createReviewSchema), reviewsController.addReview)
router.put('/:id/reviews', authenticate, authorize('student'), validate(updateReviewSchema), reviewsController.updateReview)
router.delete('/:id/reviews', authenticate, authorize('student'), reviewsController.deleteReview)
router.get('/:id/reviews', reviewsController.getCourseReviews)

router.get('/:id', coursesController.getCourse)
router.put('/:id', authenticate, authorize('instructor', 'admin'), validate(updateCourseSchema), coursesController.updateCourse)
router.delete('/:id', authenticate, authorize('instructor', 'admin'), coursesController.deleteCourse)

module.exports = router
