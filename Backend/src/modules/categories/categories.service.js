const categoriesRepository = require('./categories.repository')
const { ConflictError } = require('../../utils/error')

async function createCategory(data){
    const existing = await categoriesRepository.findByName(data.name)
    if (existing){
        throw new ConflictError('Category already exists')
    }

    const category = await categoriesRepository.createCategory({
        name: data.name,
        description: data.description
    })
    return category
}

async function getAllCategories(){
    return categoriesRepository.findAll()
}

module.exports = {
    createCategory,
    getAllCategories
}
