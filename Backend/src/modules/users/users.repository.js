const User = require('./users.model')

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

module.exports = {
    createUser,
    findByEmail,
    findById,
    findAll
}
