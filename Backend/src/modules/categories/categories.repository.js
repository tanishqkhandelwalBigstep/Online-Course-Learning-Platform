const Category = require('./categories.model')

function createCategory(data){
    return Category.create(data)
}

function findById(id){
    return Category.findById(id)
}

function findByName(name){
    return Category.findOne({ name })
}

function findAll(){
    return Category.find().sort('name')
}

module.exports = {
    createCategory,
    findById,
    findByName,
    findAll
}
