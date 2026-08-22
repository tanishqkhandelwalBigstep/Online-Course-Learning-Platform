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

## Seed / Sample Data

`node seed.js` is **idempotent and non-destructive** — it ensures a baseline dataset exists and is safe to re-run (it never drops the database; it skips anything already present).

It ensures three sample users:

| Role | Email | Password |
|------|-------|----------|
| admin | admin@tech.com | admin123 |
| instructor | instructor@tech.com | instructor123 |
| student | user@tech.com | user123 |

It also ensures one category (**Web Development**) and one published sample course created by the instructor — **"The Complete Web Developer Course"** — with **4 sections and 12 lessons**, each lesson having a real tutorial video URL and its own 5-question quiz (60 questions total). This baseline stays in the database until removed explicitly (e.g. `DELETE /api/v1/courses/:id`, which cascades).

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

## Pagination & Search

List endpoints accept `page` (default 1) and `limit` (default 10, max 100) query params and return a `meta.pagination` object:

```
{
  "success": true,
  "message": "...",
  "data": [ ... ],
  "meta": {
    "pagination": { "total": 42, "page": 1, "limit": 10, "totalPages": 5, "hasNextPage": true, "hasPrevPage": false }
  }
}
```

| Endpoint | Extra filters |
|----------|---------------|
| `GET /courses` | `search` (title/description), `category` (category id) |
| `GET /admin/users` | `search` (name/email), `role` |
| `GET /admin/courses` | `search` (title/description), `status` |
| `GET /instructor/courses` | — |
| `GET /my-courses` | — |
| `GET /courses/:id/reviews` | — (rating summary is over all reviews; the list is paginated) |

Search is case-insensitive and safe against regex special characters. Results use a stable sort (`createdAt` then `_id`) so pages never overlap.

## Logging

Logging is file-based via `src/utils/logger.js`:

- `logs/app.log` — application logs (INFO / WARN), timestamped.
- `logs/error.log` — error logs (ERROR), timestamped.

In development the same lines are also mirrored to stdout. Logging is disabled under `NODE_ENV=test`. The `logs/` directory is created automatically and is gitignored.

## Authentication

- Register and login return a short-lived **access token** and a long-lived **refresh token**. Both are also set as `httpOnly` cookies (`accessToken`, and `refreshToken` scoped to `/api/v1/auth`).
- `authenticate` reads the access token from the `accessToken` cookie or the `Authorization: Bearer` header, verifies it and loads the user.
- `authorize(...roles)` restricts a route to specific roles.
- `POST /api/v1/auth/refresh` exchanges a valid refresh token for a new access token. Refresh tokens are **stored in the database, rotated on every refresh, and revocable**. Reusing an already-rotated token triggers reuse detection and revokes all of that user's refresh tokens.
- `POST /api/v1/auth/logout` revokes the current refresh token and clears the cookies.

## Security

- `helmet` sets secure HTTP response headers (HSTS, no-sniff, frame-guard, and `X-Powered-By` removed).
- `cors` allows only the origins listed in `CORS_ORIGIN` (comma-separated) and permits credentials so cookie auth works from the frontend.
- `express-rate-limit` applies a global limit to `/api/v1` and a stricter limit to `/api/v1/auth`. Limits are configurable via `RATE_LIMIT_*` env vars and disabled under `NODE_ENV=test`.
- Access tokens are short-lived (default 15m) and refresh tokens long-lived (default 7d); both are configurable via env vars. Secrets are separate for access and refresh tokens.

## Current Status

- Database schema for all entities is implemented and matches the requirement document.
- Implemented features: authentication (access + refresh tokens), categories, courses, sections,
  lessons with quizzes, enrollment, progress tracking, quiz attempts with server-side scoring,
  reviews (rating only), instructor dashboard and admin dashboard.
- **Courses** carry a required `thumbnailUrl` and an `enrollment fee` (`price`, in ₹ INR, default 5000).
  Instructors/admins can **create, update, publish and delete** a course (delete cascades to its
  sections, lessons, quizzes, questions, attempts, enrollments, progress and reviews).
- **Lesson content is enrollment-gated:** `GET /courses/:id/sections` returns the lesson outline
  publicly, but each lesson's `videoUrl` and quiz are returned only to enrolled students, the owner
  instructor, or an admin. Taking a quiz still requires enrollment.
- **Reviews are rating-only (1–5):** enrolled students can add, update and delete their own rating
  (one per course); the list endpoint returns the average rating, total and a paginated list.
- Seed data has three users (one per role).
- Automated tests (unit + integration) are implemented and passing (see Testing below).
- Pagination and search are implemented on list endpoints (see Pagination & Search below);
  courses support `?search=` (case-insensitive) and `?category=<categoryId>`.

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






