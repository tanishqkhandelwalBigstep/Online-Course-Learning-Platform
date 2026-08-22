const asyncHandler = require('../../utils/asyncHandler')
const sectionsService = require('./sections.service')
const { sendSuccess } = require('../../utils/response')

const createSection = asyncHandler(async (req, res) => {
    const section = await sectionsService.createSection(req.user, req.params.id, req.body)
    return sendSuccess(res, 201, 'Section created successfully', section)
})

const getCourseSections = asyncHandler(async (req, res) => {
    const sections = await sectionsService.getCourseSections(req.params.id, req.user)
    return sendSuccess(res, 200, 'Sections fetched successfully', sections)
})

module.exports = {
    createSection,
    getCourseSections
}
