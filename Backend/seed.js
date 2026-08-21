const mongoose = require('mongoose')
const connectDatabase = require('./src/config/database')
const User = require('./src/modules/users/users.model')
const { createPassword } = require('./src/utils/hash')

const dummyUsers = [
    { name: 'Admin', email: 'admin@tech.com', password: 'admin123', role: 'admin' },
    { name: 'Instructor', email: 'instructor@tech.com', password: 'instructor123', role: 'instructor' },
    { name: 'Student', email: 'user@tech.com', password: 'user123', role: 'student' }
]

async function seed(){
    await connectDatabase()

    await mongoose.connection.dropDatabase()
    console.log('Database cleared')

    for (const user of dummyUsers){
        const hashedPassword = await createPassword(user.password)
        await User.create({ ...user, password: hashedPassword })
        console.log(`created ${user.role}: ${user.email}`)
    }

    await mongoose.disconnect()
    console.log('Seeding done')
}

seed().catch((err) => {
    console.error(err.message)
    process.exit(1)
})
