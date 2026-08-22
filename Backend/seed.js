const mongoose = require('mongoose')
const connectDatabase = require('./src/config/database')
const User = require('./src/modules/users/users.model')
const Category = require('./src/modules/categories/categories.model')
const Course = require('./src/modules/courses/courses.model')
const Section = require('./src/modules/sections/sections.model')
const Lesson = require('./src/modules/lessons/lessons.model')
const Quiz = require('./src/modules/quizzes/quizzes.model')
const Question = require('./src/modules/questions/questions.model')
const { createPassword } = require('./src/utils/hash')

const USERS = [
    { name: 'Admin', email: 'admin@tech.com', password: 'admin123', role: 'admin' },
    { name: 'Instructor', email: 'instructor@tech.com', password: 'instructor123', role: 'instructor' },
    { name: 'Student', email: 'user@tech.com', password: 'user123', role: 'student' }
]

const CATEGORY = { name: 'Web Development', description: 'Frontend and backend web development courses' }

const COURSE = {
    title: 'The Complete Web Developer Course',
    description: 'A hands-on journey through modern web development — JavaScript, React, Node.js and Express, and building REST APIs with MongoDB and authentication.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1200&q=80',
    price: 4999,
    sections: [
        {
            title: 'JavaScript Essentials',
            lessons: [
                {
                    title: 'Variables, Types and Operators',
                    video: 'https://www.youtube.com/watch?v=jS4aFq5-91M',
                    quiz: [
                        ['Which keyword declares a block-scoped constant?', ['var', 'let', 'const', 'static'], 2],
                        ['What does typeof null return?', ["'null'", "'object'", "'undefined'", "'number'"], 1],
                        ["What is the result of '5' + 3?", ['8', "'53'", '53', 'NaN'], 1],
                        ['Which operator compares both value and type?', ['==', '===', '=', '!='], 1],
                        ['var declarations are scoped to the enclosing...', ['block', 'function', 'module', 'class'], 1]
                    ]
                },
                {
                    title: 'Functions, Scope and Closures',
                    video: 'https://www.youtube.com/watch?v=n8mNX2YqkUs',
                    quiz: [
                        ['Arrow functions do NOT have their own...', ['parameters', 'this binding', 'return value', 'name'], 1],
                        ['A function passed to another function is a...', ['pure function', 'callback', 'closure', 'promise'], 1],
                        ['A closure gives a function access to its...', ['global scope only', 'outer function scope', 'callers scope', 'DOM'], 1],
                        ['A function with no return statement returns...', ['null', '0', 'undefined', "''"], 2],
                        ['The rest parameter syntax is...', ['...args', '*args', '&args', '[args]'], 0]
                    ]
                },
                {
                    title: 'Arrays, Objects and Iteration',
                    video: 'https://www.youtube.com/watch?v=Pdk1NX0y2SU',
                    quiz: [
                        ['Which method returns a new transformed array?', ['forEach', 'map', 'filter', 'push'], 1],
                        ['Which shallow-copies an object into a new one?', ['{...obj}', '[...obj]', 'obj.copy()', 'clone(obj)'], 0],
                        ['Object.keys(obj) returns...', ['the values', 'an array of keys', 'entries', 'a boolean'], 1],
                        ['reduce is used to...', ['sort', 'accumulate to one value', 'reverse', 'find an index'], 1],
                        ['Optional chaining is written as...', ['?.', '??', '!.', '&.'], 0]
                    ]
                }
            ]
        },
        {
            title: 'Frontend with React',
            lessons: [
                {
                    title: 'Components and JSX',
                    video: 'https://www.youtube.com/watch?v=nTeuhbP7wdE',
                    quiz: [
                        ['JSX compiles down to...', ['HTML', 'React.createElement calls', 'CSS', 'JSON'], 1],
                        ['React component names must start with...', ['a lowercase letter', 'an uppercase letter', 'an underscore', 'a number'], 1],
                        ['The correct JSX attribute for a CSS class is...', ['class', 'className', 'classname', 'css'], 1],
                        ['A component must return...', ['multiple roots', 'a single root or fragment', 'a string only', 'nothing'], 1],
                        ['JavaScript inside JSX is wrapped in...', ['{}', '()', '[]', '<>'], 0]
                    ]
                },
                {
                    title: 'State and the useState Hook',
                    video: 'https://www.youtube.com/watch?v=u6gSSpfsoOQ',
                    quiz: [
                        ['useState returns...', ['a value only', 'an array: [state, setter]', 'an object', 'a promise'], 1],
                        ['Calling the state setter triggers...', ['a page reload', 'a re-render', 'nothing', 'an error'], 1],
                        ['State updates are typically...', ['synchronous always', 'asynchronous and batched', 'ignored', 'blocking'], 1],
                        ['Initial state is passed as...', ['the argument to useState', 'a prop', 'a return value', 'context'], 0],
                        ['To update from previous state you pass the setter a...', ['value', 'function', 'promise', 'ref'], 1]
                    ]
                },
                {
                    title: 'Effects and Data Fetching',
                    video: 'https://www.youtube.com/watch?v=CgkZ7MvWUAA',
                    quiz: [
                        ['By default, useEffect runs...', ['after every render', 'never', 'before render', 'only on unmount'], 0],
                        ['The dependency array controls...', ['styling', 'when the effect re-runs', 'props', 'routing'], 1],
                        ['An empty dependency array [] means it runs...', ['every render', 'once on mount', 'never', 'on unmount only'], 1],
                        ['To clean up an effect you...', ['return a function', 'call cleanup()', 'use finally', 'do nothing'], 0],
                        ['Fetching data from an API is a...', ['pure render task', 'side effect', 'prop', 'state variable'], 1]
                    ]
                }
            ]
        },
        {
            title: 'Backend with Node & Express',
            lessons: [
                {
                    title: 'Node.js and the Event Loop',
                    video: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
                    quiz: [
                        ['Node.js is built on which engine?', ['SpiderMonkey', 'V8', 'Chakra', 'JavaScriptCore'], 1],
                        ["Node's I/O model is...", ['blocking', 'non-blocking and async', 'one thread per request', 'fully synchronous'], 1],
                        ['The event loop lets Node...', ['use many cores', 'handle many connections on one thread', 'access the GPU', 'run in parallel'], 1],
                        ['console.log writes to...', ['a file', 'stdout', 'the database', 'the network'], 1],
                        ['Node.js is best suited for...', ['CPU-heavy tasks', 'I/O-heavy tasks', 'image rendering', 'none'], 1]
                    ]
                },
                {
                    title: 'Building a Server with Express',
                    video: 'https://www.youtube.com/watch?v=G8uL0lFFoN0',
                    quiz: [
                        ['Express is a...', ['database', 'web framework for Node', 'template engine', 'test library'], 1],
                        ['app.listen() is used to...', ['define a route', 'start the server on a port', 'parse JSON', 'add middleware'], 1],
                        ['To parse JSON bodies you use...', ['express.json()', 'body-parser only', 'app.json()', 'req.parse()'], 0],
                        ['A route handler receives...', ['(req, res)', '(data)', '(err)', '(socket)'], 0],
                        ['To send a JSON response you call...', ['res.send only', 'res.json()', 'res.write()', 'res.end()'], 1]
                    ]
                },
                {
                    title: 'Routing and Middleware',
                    video: 'https://www.youtube.com/watch?v=fBzm9zja2Y8',
                    quiz: [
                        ['Middleware functions have access to...', ['req, res and next', 'only req', 'only res', 'the database'], 0],
                        ['Calling next() in middleware...', ['ends the response', 'passes control to the next middleware', 'throws', 'restarts the server'], 1],
                        ['Route parameters are read from...', ['req.params', 'req.query', 'req.body', 'req.headers'], 0],
                        ['Query-string values live in...', ['req.params', 'req.query', 'req.body', 'req.cookies'], 1],
                        ['Express error-handling middleware takes...', ['2 args', '3 args', '4 args', '1 arg'], 2]
                    ]
                }
            ]
        },
        {
            title: 'APIs, Databases & Auth',
            lessons: [
                {
                    title: 'REST APIs and HTTP Methods',
                    video: 'https://www.youtube.com/watch?v=H9M02of22z4',
                    quiz: [
                        ['Which method typically creates a resource?', ['GET', 'POST', 'DELETE', 'HEAD'], 1],
                        ['Which method is safe and fetches data?', ['POST', 'GET', 'PATCH', 'CONNECT'], 1],
                        ['HTTP 404 means...', ['Created', 'Not Found', 'Unauthorized', 'Server Error'], 1],
                        ['HTTP 201 means...', ['OK', 'Created', 'No Content', 'Forbidden'], 1],
                        ['REST resources are identified by...', ['verbs', 'URIs / endpoints', 'cookies', 'headers'], 1]
                    ]
                },
                {
                    title: 'MongoDB with Mongoose',
                    video: 'https://www.youtube.com/watch?v=qwfE7fSVaZM',
                    quiz: [
                        ['Mongoose is an ODM for...', ['MySQL', 'MongoDB', 'PostgreSQL', 'Redis'], 1],
                        ['A Mongoose schema defines...', ['routes', 'the document structure', 'middleware', 'ports'], 1],
                        ['To create a document you call...', ['Model.create()', 'Model.insert()', 'Model.add()', 'Model.new()'], 0],
                        ['References between documents use...', ['ObjectId with ref', 'foreign keys', 'SQL joins', 'symlinks'], 0],
                        ['populate() is used to...', ['delete documents', 'replace referenced ids with documents', 'validate input', 'create indexes'], 1]
                    ]
                },
                {
                    title: 'JWT Authentication Basics',
                    video: 'https://www.youtube.com/watch?v=ekRpc5YgVZU',
                    quiz: [
                        ['A JWT is made of three parts:', ['header, payload, signature', 'id, name, role', 'user, pass, salt', 'key, value, ttl'], 0],
                        ['Passwords should be stored as...', ['plain text', 'a bcrypt hash', 'base64', 'a cookie'], 1],
                        ['An access token is usually...', ['long-lived', 'short-lived', 'never expiring', 'stored in the URL'], 1],
                        ['A refresh token is used to...', ['encrypt data', 'obtain a new access token', 'hash passwords', 'store the user'], 1],
                        ['The Authorization header format is...', ['Bearer <token>', 'Token <token>', 'JWT <token>', 'Auth <token>'], 0]
                    ]
                }
            ]
        }
    ]
}

async function ensureUser(data){
    const existing = await User.findOne({ email: data.email })
    if (existing){
        console.log(`user exists: ${data.email} (${data.role})`)
        return existing
    }
    const password = await createPassword(data.password)
    const user = await User.create({ name: data.name, email: data.email, password, role: data.role })
    console.log(`created user: ${data.email} (${data.role})`)
    return user
}

async function ensureCategory(data){
    const existing = await Category.findOne({ name: data.name })
    if (existing){
        console.log(`category exists: ${data.name}`)
        return existing
    }
    const category = await Category.create(data)
    console.log(`created category: ${data.name}`)
    return category
}

async function ensureCourse(instructor, category){
    const existing = await Course.findOne({ instructorId: instructor._id, title: COURSE.title })
    if (existing){
        console.log(`course exists: "${COURSE.title}" (skipping content)`)
        return existing
    }

    const course = await Course.create({
        instructorId: instructor._id,
        categoryId: category._id,
        title: COURSE.title,
        description: COURSE.description,
        thumbnailUrl: COURSE.thumbnailUrl,
        price: COURSE.price,
        status: 'published'
    })
    console.log(`created course: "${COURSE.title}"`)

    let lessonCount = 0
    let sectionOrder = 1
    for (const sectionData of COURSE.sections){
        const section = await Section.create({ courseId: course._id, title: sectionData.title, order: sectionOrder })
        let lessonOrder = 1
        for (const lessonData of sectionData.lessons){
            const lesson = await Lesson.create({
                sectionId: section._id,
                title: lessonData.title,
                videoUrl: lessonData.video,
                order: lessonOrder,
                isRequired: true
            })
            const quiz = await Quiz.create({
                lessonId: lesson._id,
                title: `Quiz: ${lessonData.title}`,
                passPercentage: 60,
                attemptLimit: 3
            })
            const questions = lessonData.quiz.map(([question, options, correctAnswer]) => ({
                quizId: quiz._id,
                question,
                options,
                correctAnswer
            }))
            await Question.insertMany(questions)
            lessonOrder = lessonOrder + 1
            lessonCount = lessonCount + 1
        }
        sectionOrder = sectionOrder + 1
    }
    console.log(`  added ${COURSE.sections.length} sections and ${lessonCount} lessons with quizzes`)
    return course
}

async function seed(){
    await connectDatabase()

    const users = {}
    for (const userData of USERS){
        const user = await ensureUser(userData)
        users[userData.role] = user
    }

    const category = await ensureCategory(CATEGORY)
    await ensureCourse(users.instructor, category)

    await mongoose.disconnect()
    console.log('Seed complete. Baseline data is stored and safe to re-run (idempotent).')
}

seed().catch((err) => {
    console.error(err.message)
    process.exit(1)
})
