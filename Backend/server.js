const app = require('./src/app')
const env = require('./src/config/env')
const connectDatabase = require('./src/config/database')
const logger = require('./src/utils/logger')

async function startServer(){
    await connectDatabase()
    app.listen(env.port, () => {
        logger.info(`Server running on port ${env.port}`)
    })
}

startServer().catch((err) => {
    logger.error(err.message)
    process.exit(1)
})
