const fs = require('fs')
const path = require('path')
const env = require('../config/env')

const logDir = path.join(__dirname, '../../logs')
const appLogPath = path.join(logDir, 'app.log')
const errorLogPath = path.join(logDir, 'error.log')

function ensureLogDir(){
    if (!fs.existsSync(logDir)){
        fs.mkdirSync(logDir, { recursive: true })
    }
}

function format(level, message){
    return `${new Date().toISOString()} [${level}] ${message}\n`
}

function output(level, filePath, message){
    if (env.nodeEnv === 'test'){
        return
    }

    const line = format(level, message)
    ensureLogDir()
    fs.appendFileSync(filePath, line)
}

function info(message){
    output('INFO', appLogPath, message)
}

function warn(message){
    output('WARN', appLogPath, message)
}

function error(message){
    output('ERROR', errorLogPath, message)
}

module.exports = {
    info,
    warn,
    error,
    logDir,
    appLogPath,
    errorLogPath
}
