const express = require('express')
const cookieParser = require('cookie-parser')
const swaggerUi = require('swagger-ui-express')
const routes = require('./routes')
const openapiSpec = require('./docs/openapi')
const errorHandler = require('./middleware/errorHandler')
const { sendError } = require('./utils/response')

const app = express()

app.use(express.json())
app.use(cookieParser())

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec))

app.use('/api/v1', routes)

app.use((req, res) => {
    sendError(res, 404, 'Route not found')
})

app.use(errorHandler)

module.exports = app
