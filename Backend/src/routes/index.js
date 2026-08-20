const express = require('express')
const authRoutes = require('../modules/auth/auth.routes')
const categoryRoutes = require('../modules/categories/categories.routes')
const courseRoutes = require('../modules/courses/courses.routes')
const sectionRoutes = require('../modules/sections/sections.routes')
const enrollmentRoutes = require('../modules/enrollments/enrollments.routes')
const lessonRoutes = require('../modules/lessons/lessons.routes')
const dashboardRoutes = require('../modules/dashboards/dashboards.routes')
const quizRoutes = require('../modules/quizzes/quizzes.routes')
const adminRoutes = require('../modules/admin/admin.routes')

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/categories', categoryRoutes)
router.use('/courses', courseRoutes)
router.use('/sections', sectionRoutes)
router.use('/my-courses', enrollmentRoutes)
router.use('/lessons', lessonRoutes)
router.use('/instructor', dashboardRoutes)
router.use('/quizzes', quizRoutes)
router.use('/admin', adminRoutes)

module.exports = router
