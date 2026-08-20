const bcrypt = require('bcryptjs')

async function createPassword(password){
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    return hash
}

async function comparePassword(password, hashedPassword){
    const result = await bcrypt.compare(password, hashedPassword)
    return result
}

module.exports = {
    createPassword,
    comparePassword
}
