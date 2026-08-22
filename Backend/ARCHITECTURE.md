# Architecture — Online Learning Platform (Backend)

This document describes the backend architecture: the layered structure, the request lifecycle, the middleware pipeline, and the authentication flow. The repository is currently **backend-only**; a frontend will be built separately and will consume this REST API. All diagrams use Mermaid and render on GitHub.

## 1. Tech stack

- **Runtime:** Node.js + Express (plain JavaScript, CommonJS)
- **Database:** MongoDB via Mongoose
- **Auth:** JWT access + refresh tokens (refresh tokens are stored in the DB and rotated), bcrypt password hashing
- **Validation:** Joi
- **Security:** helmet, cors, express-rate-limit, httpOnly cookies
- **Docs:** Swagger / OpenAPI (`/api-docs`), Postman collection
- **Tests:** Jest + Supertest + mongodb-memory-server

## 2. High-level system context

```mermaid
flowchart LR
    client["API clients<br/>(Swagger UI, Postman, future frontend)"]
    subgraph server["Express API server"]
        api["REST API<br/>/api/v1"]
        docs["Swagger UI<br/>/api-docs"]
        health["Health<br/>/health"]
    end
    db[("MongoDB<br/>(Mongoose)")]
    logs["Log files<br/>logs/app.log<br/>logs/error.log"]

    client -->|HTTPS + JSON, cookies / Bearer| api
    client --> docs
    client --> health
    api -->|queries| db
    api -->|info / warn / error| logs
```

## 3. Layered architecture

A request flows down through the layers; only the repository layer talks to the database, and business logic lives only in services.

```mermaid
flowchart TD
    subgraph edge["App-level middleware"]
        mw["helmet -> cors -> json -> cookieParser -> rate limit"]
    end

    routes["Routes<br/>define endpoints, attach middleware"]
    controllers["Controllers<br/>read request, call service, send response"]
    services["Services<br/>business logic and rules"]
    repositories["Repositories<br/>the only layer that touches the DB"]
    models["Models<br/>Mongoose schemas"]
    db[("MongoDB")]

    mw --> routes
    routes -->|authenticate / optionalAuthenticate / authorize / validate| controllers
    controllers --> services
    services --> repositories
    repositories --> models
    models --> db

    errorHandler["Centralized error handler<br/>maps typed errors -> HTTP status"]
    controllers -.->|thrown errors via asyncHandler| errorHandler
    services -.->|typed errors| errorHandler
    errorHandler -.->|logs errors| logfile["logs/error.log"]
```

**Rules enforced by this design**

- Business logic never lives in routes or controllers — only in services.
- Only repositories/models touch the database.
- Controllers are thin and wrapped in `asyncHandler`, so thrown errors flow to one central error handler.
- Errors are thrown as typed classes (`BadRequestError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError` 404, `ConflictError` 409).
- Every response uses the standard envelope: `{ success, message, data, meta? }`.

## 4. Request lifecycle

Example: an enrolled student submits a quiz attempt (`POST /api/v1/quizzes/:id/attempts`).

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant MW as Middleware
    participant R as Route
    participant Ctrl as Controller
    participant Svc as Service
    participant Repo as Repository
    participant DB as MongoDB
    participant EH as Error handler

    C->>MW: POST /quizzes/:id/attempts (cookie/Bearer + answers)
    MW->>MW: helmet, cors, json, cookieParser, rate limit
    MW->>R: forward
    R->>R: authenticate (verify access token)
    R->>R: authorize('student')
    R->>R: validate(submitAttemptSchema)
    R->>Ctrl: submitAttempt
    Ctrl->>Svc: submitAttempt(studentId, quizId, answers)
    Svc->>Repo: load quiz, questions, enrollment, prior attempts
    Repo->>DB: queries
    DB-->>Repo: documents
    Repo-->>Svc: data
    Svc->>Svc: check enrollment + attempt limit
    Svc->>Svc: score on the server, compute best score
    Svc->>Repo: create attempt, update progress
    Repo->>DB: writes
    Svc-->>Ctrl: result
    Ctrl-->>C: 201 { success, message, data }
    Note over Ctrl,EH: any thrown error skips to EH -> standard error JSON
```

### Enrollment-gated content

`GET /api/v1/courses/:id/sections` uses **optional authentication**: the lesson outline (titles, order, whether a quiz exists) is public, but each lesson's `videoUrl` and quiz are included only when the requester is an **enrolled student, the owner instructor, or an admin**.

```mermaid
flowchart TD
    req["GET /courses/:id/sections"] --> opt["optionalAuthenticate<br/>(sets req.user if a valid token is present)"]
    opt --> svc["sections.service.getCourseSections(courseId, user)"]
    svc --> check{"enrolled student, owner instructor, or admin?"}
    check -->|yes| full["Return outline + videoUrl + quiz (locked: false)"]
    check -->|no| outline["Return outline only (locked: true)"]
```

## 5. Authentication & token flow

Access tokens are short-lived; refresh tokens are long-lived, stored in the database, rotated on every use, and revocable. Passwords are bcrypt-hashed.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant Auth as Auth service
    participant DB as RefreshToken store

    C->>Auth: POST /auth/login (email, password)
    Auth->>Auth: verify password (bcrypt)
    Auth->>DB: store refresh token record (jti)
    Auth-->>C: access token + refresh token (body + httpOnly cookies)

    Note over C: access token used on every request<br/>(accessToken cookie or Authorization: Bearer)

    C->>Auth: POST /auth/refresh (refresh token)
    Auth->>DB: find token by jti
    alt valid and not revoked
        Auth->>DB: revoke old jti, store new jti (rotation)
        Auth-->>C: new access + refresh token
    else revoked (reuse detected)
        Auth->>DB: revoke ALL of the user's tokens
        Auth-->>C: 401 Unauthorized
    end

    C->>Auth: POST /auth/logout
    Auth->>DB: revoke refresh token
    Auth-->>C: clear cookies
```

## 6. Module map

Each feature is a self-contained module using the `<module>.<layer>.js` convention.

```mermaid
flowchart TB
    subgraph app["src/app.js — Express app + middleware pipeline"]
        idx["routes/index.js — mounts modules under /api/v1"]
    end

    idx --> auth["auth<br/>register, login, refresh, logout (+ refreshToken store)"]
    idx --> categories["categories"]
    idx --> courses["courses<br/>CRUD + publish; hosts enroll, progress, sections, reviews sub-routes"]
    idx --> sections["sections<br/>(enrollment-gated content)"]
    idx --> lessons["lessons<br/>(+ lesson complete)"]
    idx --> enrollments["enrollments<br/>(/my-courses)"]
    idx --> quizzes["quizzes<br/>(hosts attempt routes)"]
    idx --> dashboards["dashboards<br/>(instructor)"]
    idx --> admin["admin"]

    subgraph shared["Shared building blocks"]
        config["config/ (env, database)"]
        middleware["middleware/ (authenticate, optionalAuthenticate, authorize, validate, errorHandler)"]
        utils["utils/ (token, hash, response, error, logger, pagination, asyncHandler)"]
        docs["docs/openapi.js"]
    end

    auth --> shared
    courses --> shared
    quizzes --> shared
    admin --> shared
```

Supporting model/helper modules referenced by the features above: `users`, `progress`, `questions`, `quizAttempts`, `reviews`.

## 7. Cross-cutting concerns

| Concern | Where it lives |
|---------|----------------|
| Security headers | `helmet` (app-level) |
| CORS (allow-list + credentials) | `cors` (app-level, `CORS_ORIGIN`) |
| Rate limiting | `express-rate-limit` (global on `/api/v1`, stricter on `/api/v1/auth`) |
| Authentication | `middleware/authenticate.js` (verifies access token) |
| Optional authentication | `middleware/optionalAuthenticate.js` (used for gated public reads) |
| Authorization (RBAC) | `middleware/authorize.js` (`authorize(...roles)`) |
| Request validation | `middleware/validate.js` (Joi schemas per module) |
| Error handling | `middleware/errorHandler.js` + `utils/error.js` |
| Responses | `utils/response.js` (`sendSuccess` / `sendError`, with optional `meta`) |
| Pagination & search | `utils/pagination.js` |
| Logging | `utils/logger.js` (file-based: `logs/app.log` / `logs/error.log`) |
| API docs | `docs/openapi.js` served at `/api-docs` |

## 8. Domain rules (enforced in services)

- Only **published** courses can be enrolled in; duplicate enrollment is prevented.
- **Course creation** is instructor-only; **update / publish / delete** are owner-instructor-or-admin. Deleting a course cascades to its sections, lessons, quizzes, questions, attempts, enrollments, progress and reviews.
- **Category creation** is admin-only.
- **Lesson content** (`videoUrl`) and **quiz access** require enrollment (or course ownership / admin).
- **Quiz scoring** is performed on the server; attempt limits are enforced and the best score is kept; `correctAnswer` is never exposed to students.
- **Reviews** are rating-only (1–5), by enrolled students, one per course, updatable/deletable by the owner; the list returns an aggregated average.
- **Progress** is computed from completed required lessons plus passed quizzes; enrollment flips to `completed` at 100%.

## 9. Data layer

The full entity model, relationships, and the ER diagram are documented in [Database_design.md](Database_design.md). In short: `User`, `Category`, `Course → Section → Lesson`, `Quiz → Question`, `Enrollment`, `Progress`, `QuizAttempt`, `Review`, and `RefreshToken`. References always live on the child pointing up to its parent.
