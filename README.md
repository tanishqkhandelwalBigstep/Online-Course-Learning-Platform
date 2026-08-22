# Online Learning Platform

A full-stack online learning and course management platform currently under development.

The platform is designed to support different user roles and provide functionality for creating, managing, and consuming online courses. The backend is currently implemented, while the frontend will be added later.

## Project Status

**Current stage:** Backend development completed / Frontend not yet implemented.

### Planned Platform

The platform will support:

* **Admins** — manage users and platform-level data
* **Instructors** — create and manage courses, sections, lessons, and quizzes
* **Students** — enroll in courses, complete lessons, take quizzes, and track progress

## Tech Stack

### Backend

* Node.js
* Express.js
* JavaScript (CommonJS)
* MongoDB
* Mongoose
* JWT authentication
* bcryptjs
* Joi validation
* dotenv

### Frontend

**Planned**

The frontend will be implemented separately and connected to the backend REST API.

## Project Structure

```text
Course_learning/
│
├── .gitignore
├── README.md
│
└── Backend/
    ├── README.md
    ├── package.json
    ├── package-lock.json
    ├── server.js
    ├── seed.js
    ├── postman/
    ├── src/
    └── tests/
```

> The repository is currently **backend-only**. A frontend will be planned and built from scratch in a later stage and will consume the backend REST API.

## Backend

The backend provides the REST API for the online learning platform.

It follows a layered architecture:

```text
Routes
   ↓
Controllers
   ↓
Services
   ↓
Repositories
   ↓
Models
   ↓
MongoDB
```

### Main Backend Features

* User registration and login
* JWT-based authentication
* Role-based authorization
* User management
* Category management (admin)
* Course management — create/update/delete (instructor/admin), thumbnail URL, enrollment fee (₹, default 5000)
* Course search (case-insensitive) and category filtering, with pagination
* Section management
* Lesson management (lesson content and quizzes are enrollment-gated)
* Course enrollment
* Lesson progress tracking
* Quiz management
* Quiz attempts and server-side scoring
* Course reviews and rating aggregation
* Instructor dashboard
* Admin dashboard
* Request validation
* Centralized error handling
* API documentation with Swagger

For detailed backend information, architecture, setup instructions, and API details, see:

`Backend/README.md`

## Backend Setup

Navigate to the backend directory:

```bash
cd Backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file based on `.env.example`.

Example:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/online_learning
NODE_ENV=development

JWT_SECRET=your_jwt_secret_here
JWT_ACCESS_SECRET=your_access_token_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=30
```

Start MongoDB and run the backend:

```bash
npm run dev
```

The API will run on:

```text
http://localhost:3000/api/v1
```

## Authentication

The backend uses JWT-based authentication with **access + refresh tokens**.

* A short-lived **access token** and a long-lived **refresh token** are returned on register/login and also set as `httpOnly` cookies.
* Protected requests send the access token via the `accessToken` cookie or the `Authorization: Bearer <token>` header.
* `POST /api/v1/auth/refresh` exchanges a valid refresh token for a new access token (refresh tokens are stored in the database and rotated on use).
* `POST /api/v1/auth/logout` revokes the refresh token and clears the cookies.

Role-based authorization is handled through middleware.

Supported roles currently include:

* Admin
* Instructor
* Student

## Database

The backend uses MongoDB with Mongoose.

The platform contains entities for:

* Users
* Categories
* Courses
* Sections
* Lessons
* Enrollments
* Progress
* Quizzes
* Questions
* Quiz Attempts
* Reviews

## API Documentation

Swagger API documentation is available through the backend API documentation endpoint.

Once the backend is running, the API documentation can be accessed through the configured Swagger endpoint.

## Testing

Backend unit tests are located inside:

```text
Backend/tests/
```

Run the test suite using the configured npm test command.

## Future Development

The next major stage of the project is the frontend.

The planned frontend will provide interfaces for:

* User authentication
* Course browsing
* Course enrollment
* Learning and lesson completion
* Quiz attempts
* Progress tracking
* Reviews and ratings
* Instructor course management
* Instructor dashboard
* Admin dashboard

The frontend will consume the REST APIs provided by the backend.

## Repository

This repository contains the complete development work for the Online Learning Platform.

The project is currently focused on backend implementation, with frontend development planned as the next stage.
