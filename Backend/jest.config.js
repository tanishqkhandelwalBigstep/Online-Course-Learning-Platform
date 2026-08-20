module.exports = {
    projects: [
        {
            displayName: 'unit',
            testEnvironment: 'node',
            setupFiles: ['<rootDir>/tests/setup/env.js'],
            testMatch: ['<rootDir>/tests/unit/**/*.test.js']
        },
        {
            displayName: 'integration',
            testEnvironment: 'node',
            setupFiles: ['<rootDir>/tests/setup/env.js'],
            setupFilesAfterEnv: ['<rootDir>/tests/setup/db.js'],
            testMatch: ['<rootDir>/tests/integration/**/*.test.js']
        }
    ]
}
