const successResponse = {
    description: 'Success',
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: {}
                }
            }
        }
    }
}

const errorResponse = {
    description: 'Error',
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string' }
                }
            }
        }
    }
}

const responses = {
    200: successResponse,
    201: successResponse,
    400: errorResponse,
    401: errorResponse,
    403: errorResponse,
    404: errorResponse,
    409: errorResponse
}

const idParam = {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string' },
    description: 'MongoDB ObjectId'
}

const openapiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Online Learning Platform API',
        version: '1.0.0',
        description: 'REST API for the online learning platform. Login first, click Authorize, paste the token from data.token, then try any protected route.'
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Local server' }
    ],
    tags: [
        { name: 'Auth' },
        { name: 'Categories' },
        { name: 'Courses' },
        { name: 'Sections' },
        { name: 'Lessons' },
        { name: 'Enrollment' },
        { name: 'Progress' },
        { name: 'Quizzes' },
        { name: 'Reviews' },
        { name: 'Instructor' },
        { name: 'Admin' },
        { name: 'System' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    security: [{ bearerAuth: [] }],
    paths: {
        '/health': {
            get: {
                tags: ['System'],
                summary: 'Health check',
                security: [],
                responses: { 200: successResponse }
            }
        },
        '/api/v1/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new student',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'email', 'password'],
                                properties: {
                                    name: { type: 'string', example: 'Test Student' },
                                    email: { type: 'string', example: 'test1@example.com' },
                                    password: { type: 'string', example: 'pass123' }
                                }
                            }
                        }
                    }
                },
                responses
            }
        },
        '/api/v1/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login and receive a JWT (also set as cookie)',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', example: 'admin@tech.com' },
                                    password: { type: 'string', example: 'admin123' }
                                }
                            }
                        }
                    }
                },
                responses
            }
        },
        '/api/v1/auth/refresh': {
            post: {
                tags: ['Auth'],
                summary: 'Exchange a refresh token for a new access token (rotates the refresh token)',
                security: [],
                requestBody: {
                    required: false,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    refreshToken: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses
            }
        },
        '/api/v1/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Logout (revokes the refresh token and clears cookies)',
                security: [],
                responses
            }
        },
        '/api/v1/categories': {
            get: {
                tags: ['Categories'],
                summary: 'List all categories',
                security: [],
                responses: { 200: successResponse }
            },
            post: {
                tags: ['Categories'],
                summary: 'Create a category (admin only)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name'],
                                properties: {
                                    name: { type: 'string', example: 'Programming' },
                                    description: { type: 'string', example: 'Coding courses' }
                                }
                            }
                        }
                    }
                },
                responses
            }
        },
        '/api/v1/courses': {
            get: {
                tags: ['Courses'],
                summary: 'List published courses',
                security: [],
                responses: { 200: successResponse }
            },
            post: {
                tags: ['Courses'],
                summary: 'Create a course as draft (instructor only)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['title', 'description', 'categoryId'],
                                properties: {
                                    title: { type: 'string', example: 'Python 101' },
                                    description: { type: 'string', example: 'Learn Python from scratch' },
                                    categoryId: { type: 'string', example: 'PASTE_categoryId' }
                                }
                            }
                        }
                    }
                },
                responses
            }
        },
        '/api/v1/courses/{id}': {
            get: {
                tags: ['Courses'],
                summary: 'Get a single course',
                security: [],
                parameters: [idParam],
                responses
            }
        },
        '/api/v1/courses/{id}/publish': {
            put: {
                tags: ['Courses'],
                summary: 'Publish a course (owner instructor or admin, needs >=1 lesson)',
                parameters: [idParam],
                responses
            }
        },
        '/api/v1/courses/{id}/sections': {
            get: {
                tags: ['Sections'],
                summary: 'List sections with their lessons',
                security: [],
                parameters: [idParam],
                responses
            },
            post: {
                tags: ['Sections'],
                summary: 'Add a section to a course (owner instructor or admin)',
                parameters: [idParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['title'],
                                properties: {
                                    title: { type: 'string', example: 'Getting Started' },
                                    order: { type: 'integer', example: 1 }
                                }
                            }
                        }
                    }
                },
                responses
            }
        },
        '/api/v1/sections/{id}/lessons': {
            post: {
                tags: ['Lessons'],
                summary: 'Add a lesson with its quiz of exactly 5 questions (owner instructor or admin)',
                parameters: [idParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['title', 'videoUrl', 'quiz'],
                                properties: {
                                    title: { type: 'string', example: 'Variables and Types' },
                                    videoUrl: { type: 'string', example: 'https://youtu.be/abcdef' },
                                    isRequired: { type: 'boolean', example: true },
                                    quiz: {
                                        type: 'object',
                                        required: ['title', 'passPercentage', 'attemptLimit', 'questions'],
                                        properties: {
                                            title: { type: 'string', example: 'Variables Quiz' },
                                            passPercentage: { type: 'integer', example: 60 },
                                            attemptLimit: { type: 'integer', example: 3 },
                                            questions: {
                                                type: 'array',
                                                minItems: 5,
                                                maxItems: 5,
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        question: { type: 'string' },
                                                        options: { type: 'array', items: { type: 'string' } },
                                                        correctAnswer: { type: 'integer' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            example: {
                                title: 'Variables and Types',
                                videoUrl: 'https://youtu.be/abcdef',
                                isRequired: true,
                                quiz: {
                                    title: 'Variables Quiz',
                                    passPercentage: 60,
                                    attemptLimit: 3,
                                    questions: [
                                        { question: 'What is a variable?', options: ['storage', 'loop', 'function'], correctAnswer: 0 },
                                        { question: 'Which is a number type?', options: ['str', 'int', 'bool'], correctAnswer: 1 },
                                        { question: 'What does len() do?', options: ['length', 'loop', 'delete'], correctAnswer: 0 },
                                        { question: 'Boolean values are?', options: ['yes/no', 'true/false', '1/0 only'], correctAnswer: 1 },
                                        { question: 'Comments start with?', options: ['//', '#', '--'], correctAnswer: 1 }
                                    ]
                                }
                            }
                        }
                    }
                },
                responses
            }
        },
        '/api/v1/lessons/{id}/complete': {
            post: {
                tags: ['Progress'],
                summary: 'Mark a lesson complete (enrolled student)',
                parameters: [idParam],
                responses
            }
        },
        '/api/v1/courses/{id}/enroll': {
            post: {
                tags: ['Enrollment'],
                summary: 'Enroll in a published course (student)',
                parameters: [idParam],
                responses
            }
        },
        '/api/v1/my-courses': {
            get: {
                tags: ['Enrollment'],
                summary: 'List the courses the student is enrolled in',
                responses: { 200: successResponse }
            }
        },
        '/api/v1/courses/{id}/progress': {
            get: {
                tags: ['Progress'],
                summary: 'Get course progress (student own, instructor or admin with studentId)',
                parameters: [
                    idParam,
                    { name: 'studentId', in: 'query', required: false, schema: { type: 'string' } }
                ],
                responses
            }
        },
        '/api/v1/quizzes/{id}': {
            get: {
                tags: ['Quizzes'],
                summary: 'Get a quiz to take, without correct answers (enrolled student)',
                parameters: [idParam],
                responses
            }
        },
        '/api/v1/quizzes/{id}/attempts': {
            post: {
                tags: ['Quizzes'],
                summary: 'Submit a quiz attempt, scored on the server (student)',
                parameters: [idParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['answers'],
                                properties: {
                                    answers: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                questionId: { type: 'string' },
                                                selectedOption: { type: 'integer' }
                                            }
                                        }
                                    }
                                }
                            },
                            example: {
                                answers: [
                                    { questionId: 'PASTE_questionId_1', selectedOption: 0 },
                                    { questionId: 'PASTE_questionId_2', selectedOption: 1 },
                                    { questionId: 'PASTE_questionId_3', selectedOption: 0 },
                                    { questionId: 'PASTE_questionId_4', selectedOption: 1 },
                                    { questionId: 'PASTE_questionId_5', selectedOption: 1 }
                                ]
                            }
                        }
                    }
                },
                responses
            }
        },
        '/api/v1/quizzes/{id}/results': {
            get: {
                tags: ['Quizzes'],
                summary: 'Get quiz results (student own, instructor or admin all)',
                parameters: [idParam],
                responses
            }
        },
        '/api/v1/courses/{id}/reviews': {
            get: {
                tags: ['Reviews'],
                summary: 'List reviews for a course with average rating',
                security: [],
                parameters: [idParam],
                responses
            },
            post: {
                tags: ['Reviews'],
                summary: 'Add a review (enrolled student, one per course)',
                parameters: [idParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['rating'],
                                properties: {
                                    rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                                    comment: { type: 'string', example: 'Really helpful course!' }
                                }
                            }
                        }
                    }
                },
                responses
            }
        },
        '/api/v1/instructor/overview': {
            get: {
                tags: ['Instructor'],
                summary: 'Instructor dashboard summary',
                responses: { 200: successResponse }
            }
        },
        '/api/v1/instructor/courses': {
            get: {
                tags: ['Instructor'],
                summary: 'List the instructor own courses with counts',
                responses: { 200: successResponse }
            }
        },
        '/api/v1/instructor/courses/{id}': {
            get: {
                tags: ['Instructor'],
                summary: 'Full nested course detail (owner instructor or admin)',
                parameters: [idParam],
                responses
            }
        },
        '/api/v1/admin/overview': {
            get: {
                tags: ['Admin'],
                summary: 'Admin dashboard summary',
                responses: { 200: successResponse }
            }
        },
        '/api/v1/admin/users': {
            get: {
                tags: ['Admin'],
                summary: 'List all users (admin)',
                responses: { 200: successResponse }
            },
            post: {
                tags: ['Admin'],
                summary: 'Create a user with any role, including instructor (admin)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'email', 'password', 'role'],
                                properties: {
                                    name: { type: 'string', example: 'New Instructor' },
                                    email: { type: 'string', example: 'instr2@example.com' },
                                    password: { type: 'string', example: 'pass123' },
                                    role: { type: 'string', enum: ['student', 'instructor', 'admin'], example: 'instructor' }
                                }
                            }
                        }
                    }
                },
                responses
            }
        },
        '/api/v1/admin/courses': {
            get: {
                tags: ['Admin'],
                summary: 'List all courses of any status (admin)',
                responses: { 200: successResponse }
            }
        }
    }
}

module.exports = openapiSpec
