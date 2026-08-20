# Online Learning Platform — Backend

REST API backend for an online learning / course management platform. Instructors create courses, sections, lessons and quizzes; students enroll, complete lessons, take quizzes and track progress.

## Tech Stack

- Node.js + Express (JavaScript, CommonJS)
- MongoDB + Mongoose
- JWT authentication with bcryptjs password hashing
- Joi request validation
- Environment variables via dotenv

## Architecture

Layered structure: routes to controllers to services to repositories to models.

- Routes define endpoints and attach middleware.
- Controllers read the request and send the response.
- Services hold the business logic and rules.
- Repositories are the only layer that touches the database.
- Models define the Mongoose schemas.

Business logic never lives in routes or controllers.

## Folder Structure

```
src/
├── config/            env.js, database.js
├── middleware/        authenticate.js, authorize.js, validate.js, errorHandler.js
├── utils/             asyncHandler.js, error.js, response.js, logger.js, hash.js, token.js
├── modules/
│   ├── auth/          register, login, logout
│   ├── users/         User model + repository
│   ├── categories/    Category model
│   ├── courses/       Course model
│   ├── sections/      Section model
│   ├── lessons/       Lesson model
│   ├── enrollments/   Enrollment model
│   ├── progress/      Progress model
│   ├── quizzes/       Quiz model
│   ├── questions/     Question model
│   ├── quizAttempts/  QuizAttempt model
│   └── reviews/       Review model
├── routes/            index.js
└── app.js
server.js
seed.js
```

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example`:

   ```
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/online_learning
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

3. Start MongoDB, then seed the database:

   ```
   node seed.js
   ```

4. Run the server:

   ```
   npm run dev
   ```

The server runs on the port from `.env` (default 3000). Base API URL: `http://localhost:3000/api/v1`.

## Seed / Sample Users

`node seed.js` clears the database and creates three users:

| Role | Email | Password |
|------|-------|----------|
| admin | admin@tech.com | admin123 |
| instructor | instructor@tech.com | instructor123 |
| student | user@tech.com | user123 |

## Database

See `Database_design.md` for the full schema and relationships.

## Response Format

Success:

```
{ "success": true, "message": "...", "data": ... }
```

Error:

```
{ "success": false, "message": "..." }
```

All errors go through a single centralized error handler.

## Logging

Logging is file-based via `src/utils/logger.js`:

- `logs/app.log` — application logs (INFO / WARN), timestamped.
- `logs/error.log` — error logs (ERROR), timestamped.

In development the same lines are also mirrored to stdout. Logging is disabled under `NODE_ENV=test`. The `logs/` directory is created automatically and is gitignored.

## Authentication

- JWT is returned on register/login and also set as an httpOnly cookie.
- `authenticate` reads the token from the cookie or the `Authorization: Bearer` header.
- `authorize(...roles)` restricts a route to specific roles.

## Current Status

- Database schema for all entities is implemented and matches the requirement document.
- Implemented features: authentication, categories, courses, sections, lessons with quizzes,
  enrollment, progress tracking, quiz attempts with server-side scoring, reviews with rating
  aggregation, instructor dashboard and admin dashboard.
- Seed data has three users (one per role).
- Automated tests (unit + integration) are implemented and passing (see Testing below).
- Pagination and search on list endpoints are planned but not yet implemented.

See `routes.txt` for the full list of available endpoints.

## Testing

Automated tests use Jest, Supertest and an in-memory MongoDB (`mongodb-memory-server`), so no running database is required.

```
npm test              # run unit + integration tests
npm run test:unit     # business-logic unit tests only
npm run test:integration
```

- Unit tests cover the core business calculations: quiz scoring, pass thresholds, attempt limits, best score, and course progress percentage / auto-completion.
- Integration tests cover every API endpoint: authentication, role-based authorization and request validation; the full learning workflow (course creation and publishing rules, enrollment, lesson completion, quiz attempts, progress, reviews and results); cascade deletes (lesson/quiz removing their questions, attempts and progress); the public catalog reads; and the instructor and admin dashboards. Edge cases such as malformed ids, not-found resources, duplicate constraints and out-of-range quiz answers are included.

The in-memory server will reuse a local `mongod` binary if one is installed; otherwise it downloads one on first run.

## Swagger Documentation
api-docs/#