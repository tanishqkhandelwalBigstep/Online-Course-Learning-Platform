const User = require('./users.model')
const { buildSearchRegex } = require('../../utils/pagination')

function buildFilter({ search, role }){
    const filter = {}
    if (role){
        filter.role = role
    }
    const regex = buildSearchRegex(search)
    if (regex){
        filter.$or = [
            { name: regex },
            { email: regex }
        ]
    }
    return filter
}

function createUser(data){
    return User.create(data)
}

function findByEmail(email){
    return User.findOne({ email })
}

function findById(id){
    return User.findById(id)
}

function findAll(){
    return User.find().select('-password')
}

function findPaged(criteria, skip, limit){
    return User.find(buildFilter(criteria))
        .select('-password')
        .sort('-createdAt -_id')
        .skip(skip)
        .limit(limit)
}

function countByFilter(criteria){
    return User.countDocuments(buildFilter(criteria))
}

module.exports = {
    createUser,
    findByEmail,
    findById,
    findAll,
    findPaged,
    countByFilter
}
