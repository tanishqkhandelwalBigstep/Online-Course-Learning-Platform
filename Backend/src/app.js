const express = require('express')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const swaggerUi = require('swagger-ui-express')
const routes = require('./routes')
const openapiSpec = require('./docs/openapi')
const env = require('./config/env')
const errorHandler = require('./middleware/errorHandler')
const { sendError } = require('./utils/response')

const app = express()

app.set('trust proxy', 1)

app.use(helmet({ contentSecurityPolicy: false }))

app.use(cors({
    origin(origin, callback){
        if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)){
            return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
    },
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

const generalLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.nodeEnv === 'test'
})

const authLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.nodeEnv === 'test'
})

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec))

app.use('/api/v1/auth', authLimiter)
app.use('/api/v1', generalLimiter)
app.use('/api/v1', routes)

app.use((req, res) => {
    sendError(res, 404, 'Route not found')
})

app.use(errorHandler)

module.exports = app
