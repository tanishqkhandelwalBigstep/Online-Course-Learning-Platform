const fs = require('fs')

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test_jwt_secret'
process.env.JWT_EXPIRES_IN = '1h'
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/online_learning_test'

if (!process.env.MONGOMS_SYSTEM_BINARY){
    const candidates = ['/opt/homebrew/bin/mongod', '/usr/local/bin/mongod', '/usr/bin/mongod']
    const found = candidates.find((candidate) => fs.existsSync(candidate))
    if (found){
        process.env.MONGOMS_SYSTEM_BINARY = found
    }
}
