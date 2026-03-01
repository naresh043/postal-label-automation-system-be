# Postal Label Automation API

A production-ready Express.js REST API for member management, authentication, dashboard metrics, and asynchronous postal label PDF generation.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [How to Start the Backend](#how-to-start-the-backend)
- [Environment Variables (.env)](#environment-variables-env)
- [MongoDB Connection Guide](#mongodb-connection-guide)
- [API Documentation](#api-documentation)
- [Authentication & Authorization](#authentication--authorization)
- [Error Handling](#error-handling)
- [API Versioning](#api-versioning)
- [Scripts](#scripts)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)
- [Best Practices Used](#best-practices-used)
- [Future Improvements](#future-improvements)
- [License](#license)

## Project Overview

This backend powers a postal label automation workflow:

- Manages members and their printable address data.
- Generates unique label codes (`LM-xx`, `NAD-xx`) using atomic counters.
- Supports secure user authentication using JWT.
- Provides dashboard statistics for member counts.
- Generates printable label PDFs asynchronously via a job queue and worker process.

Typical frontend integration:

- Admin dashboard (React/Vue/Angular) for authentication, member CRUD, print selection, and PDF job tracking.

Core features:

- Member CRUD + toggle print permission.
- Auto-increment label code generation by prefix.
- Queue-based PDF generation (`waiting -> active -> completed/failed`).
- Job polling and file download endpoints.

## Tech Stack

- Runtime: `Node.js`
- Framework: `Express.js`
- Database: `MongoDB`
- ODM: `Mongoose`
- Authentication: `JWT` (`jsonwebtoken`) + `bcryptjs`
- PDF/Rendering: `Puppeteer`, `chromium`, `pdf-lib`
- File/Data Utilities: `xlsx`, `mammoth`
- Config & Middleware: `dotenv`, `cors`, `express.json()`

## Folder Structure

```text
postal-label-automation-system/
+-- config/
¦   +-- db.js
+-- controllers/
¦   +-- authController.js
¦   +-- dashboardController.js
¦   +-- labelController.js
¦   +-- labelsController.js
¦   +-- memberController.js
+-- models/
¦   +-- CounterModel.js
¦   +-- Member.js
¦   +-- PdfJob.js
¦   +-- UserModel.js
+-- queue/
¦   +-- pdfQueue.js
+-- routes/
¦   +-- authRoutes.js
¦   +-- dashboardRoutes.js
¦   +-- labelRoutes.js
¦   +-- labels.js
¦   +-- memberRoutes.js
+-- storage/
¦   +-- labels/
+-- utils/
¦   +-- browser.js
¦   +-- generateLabelHTML.js
¦   +-- generatePDF.js
+-- workers/
¦   +-- pdfWorker.js
+-- .env
+-- package.json
+-- server.js
```

Key folders:

- `controllers/`: Request handlers and business logic.
- `routes/`: API endpoint definitions and route grouping.
- `models/`: Mongoose schemas/models for MongoDB collections.
- `middlewares/`: Recommended place for auth guards, validation, and global error middleware (create this folder if missing).
- `utils/`: Reusable helpers (browser launch, HTML/PDF utilities).
- `config/`: App configuration such as DB connection.

## Prerequisites

- `Node.js` 18+ (recommended: LTS)
- `npm` (or `yarn`)
- MongoDB:
  - Local MongoDB server, or
  - MongoDB Atlas cluster

## How to Start the Backend

1. Clone repository

```bash
git clone <your-repo-url>
cd postal-label-automation-system
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

Create/update `.env` in the project root.

4. Run API server (development)

```bash
npm run dev
```

5. Run API server (production)

```bash
npm start
```

6. Run PDF worker (required for async PDF jobs)

```bash
npm run worker
```

For development worker with auto-reload:

```bash
npm run workerdev
```

## Environment Variables (.env)

Use the following template:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/postal_labels
JWT_SECRET=replace_with_strong_secret
CLIENT_URL=http://localhost:5173

# Worker controls
ENABLE_PDF_WORKER=false
PDF_WORKER_CONCURRENCY=1
PDF_QUEUE_POLL_INTERVAL_MS=1000

# Puppeteer controls (optional)
PUPPETEER_EXECUTABLE_PATH=
PUPPETEER_HEADLESS=true
```

Variable details:

- `PORT`: API server port.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret key used for signing JWTs.
- `CLIENT_URL`: Frontend origin for CORS/cookie config.
- `ENABLE_PDF_WORKER`: If `true`, worker starts inside API process.
- `PDF_WORKER_CONCURRENCY`: Number of parallel worker loops.
- `PDF_QUEUE_POLL_INTERVAL_MS`: Queue polling interval.
- `PUPPETEER_EXECUTABLE_PATH`: Optional Chromium path override.
- `PUPPETEER_HEADLESS`: `true` or `false` for headless mode.

Important:

- Current code checks `ENABLE_PDF_WORKER` (not `ENABLE_WORKER`).
- Keep `.env` out of version control.

## MongoDB Connection Guide

### Local MongoDB setup

1. Install MongoDB Community Server.
2. Start MongoDB service.
3. Use connection string:

```env
MONGO_URI=mongodb://127.0.0.1:27017/postal_labels
```

### MongoDB Atlas setup

1. Create cluster in Atlas.
2. Create DB user (username/password).
3. Add your IP in Network Access.
4. Get connection string from Atlas UI.
5. Replace placeholders and set in `.env`.

Example:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/postal_labels?retryWrites=true&w=majority
```

### Mongoose connection code

```js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Error", error);
    process.exit(1);
  }
};
```

### Common MongoDB errors and fixes

- `MongooseServerSelectionError`: URI incorrect, DB not running, or Atlas IP not whitelisted.
- `Authentication failed`: invalid Atlas username/password.
- `querySrv ENOTFOUND`: malformed Atlas hostname.
- `ECONNREFUSED 127.0.0.1:27017`: local MongoDB service is not running.

## API Documentation

Base URL (versioned):

```text
http://localhost:3000/api/v1
```

Compatibility note:

- Current code mounts routes at `/api` and `/api/auth`.
- If `/api/v1` is not yet configured in `server.js`, replace `/api/v1` with `/api` and `/api/v1/auth` with `/api/auth`.

### Authentication Routes

#### `POST /api/v1/auth/signup`

Create a new user.

Request:

```json
{
  "username": "admin",
  "password": "StrongPassword123"
}
```

Success response:

```json
{
  "message": "Signup successful"
}
```

#### `POST /api/v1/auth/login`

Authenticate and receive JWT.

Request:

```json
{
  "username": "admin",
  "password": "StrongPassword123"
}
```

Success response:

```json
{
  "message": "Login successful",
  "token": "<jwt-token>"
}
```

#### `POST /api/v1/auth/logout`

Logout endpoint.

Success response:

```json
{
  "message": "Logout successful"
}
```

### Member Routes

#### `POST /api/v1/members`

Create a member.

Request (example):

```json
{
  "prefix": "LM",
  "name": "John Doe",
  "phone": "9876543210",
  "addressLine1": "Street 1",
  "city": "Chennai",
  "state": "TN",
  "pincode": "600001"
}
```

Success response:

```json
{
  "_id": "...",
  "labelCode": "LM-01",
  "name": "John Doe",
  "isAllowedToPrint": true
}
```

#### `GET /api/v1/members`

Get all members.

#### `GET /api/v1/members/printlabelmembers`

Get members allowed for printing.

#### `PUT /api/v1/members/:id`

Update member details.

#### `PATCH /api/v1/members/:id/toggle-print`

Toggle `isAllowedToPrint`.

Success response:

```json
{
  "message": "Print permission updated",
  "isAllowedToPrint": false
}
```

#### `DELETE /api/v1/members/:id`

Delete member.

#### `GET /api/v1/members/next-code?prefix=LM`

Preview next label code.

Success response:

```json
{
  "labelCode": "LM-42"
}
```

### Dashboard Routes

#### `GET /api/v1/dashboard`

Get total, NAD, and LM member counts.

Response:

```json
{
  "totalMembers": 120,
  "nadMembers": 45,
  "lmMembers": 75
}
```

### Label/PDF Routes

#### `POST /api/v1/labels/jobs`

Queue async label PDF generation.

Request:

```json
{
  "memberIds": ["65f...", "65a..."]
}
```

Response (`202 Accepted`):

```json
{
  "message": "PDF generation job queued.",
  "jobId": "...",
  "statusUrl": "/api/labels/jobs/<jobId>",
  "downloadUrl": "/api/labels/jobs/<jobId>/download"
}
```

#### `GET /api/v1/labels/jobs/:jobId`

Poll job status.

Response (example):

```json
{
  "jobId": "...",
  "status": "active",
  "progress": 60,
  "attemptsMade": 1,
  "maxAttempts": 3
}
```

#### `GET /api/v1/labels/jobs/:jobId/download`

Download generated PDF when status is `completed`.

#### `POST /api/v1/labels`

Legacy/backward-compatible enqueue endpoint.

## Authentication & Authorization

### JWT generation

On successful login, server signs:

```js
jwt.sign({ userId: user._id }, process.env.JWT_SECRET)
```

### Cookie handling

Current implementation returns token in JSON body.

Recommended cookie-based pattern:

```js
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

### Protected routes

Current routes are not guarded by JWT middleware.

Recommended middleware example:

```js
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
```

Apply with:

```js
router.get("/members", authMiddleware, getMembers);
```

## Error Handling

Current behavior:

- Controller-level `try/catch` with JSON error responses.
- Validation checks for required fields and invalid inputs.
- Auth-specific errors for invalid credentials and missing users.

Recommended improvement:

- Add centralized global error middleware to standardize errors.

Example:

```js
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
  });
});
```

## API Versioning

Use URI versioning:

```text
/api/v1
```

Why:

- Avoid breaking existing clients.
- Enable gradual migrations.
- Keep v1 stable while introducing v2.

Future strategy:

- Keep existing features in `/api/v1`.
- Add breaking changes only in `/api/v2`.
- Maintain both versions during migration window.

## Scripts

From `package.json`:

- `npm run dev`: Start API with nodemon.
- `npm start`: Start API with Node.
- `npm run worker`: Start PDF worker.
- `npm run workerdev`: Start PDF worker with nodemon.
- `npm test`: Placeholder (currently not configured).

## Common Issues & Troubleshooting

### MongoDB not connecting

- Verify `MONGO_URI`.
- Confirm local MongoDB service is running.
- Atlas: whitelist IP and validate DB user credentials.

### JWT invalid / expired

- Ensure same `JWT_SECRET` is used for sign and verify.
- Ensure token is sent correctly (cookie or `Authorization: Bearer <token>`).

### CORS issues

- Configure explicit origin and credentials:

```js
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
```

### Port conflicts

- Change `.env` `PORT`.
- Stop conflicting process on the same port.

### Worker not processing jobs

- Use `ENABLE_PDF_WORKER=true` if running worker inside API process.
- Or run separate worker process with `npm run worker`.
- Ensure environment variable names match code exactly.

## Best Practices Used

- MVC-oriented separation (`routes`, `controllers`, `models`).
- Atomic counter strategy for unique label code generation.
- Async job-based PDF generation to avoid request timeouts.
- Environment-driven configuration via `.env`.
- Reusable utilities for browser lifecycle and PDF HTML generation.

## Future Improvements

- Add Redis/BullMQ for distributed queue processing.
- Implement API rate limiting (`express-rate-limit`).
- Add Swagger/OpenAPI documentation.
- Add request validation (`Joi`/`Zod`) middleware.
- Add structured logging and monitoring.
- Add unit/integration tests and CI pipeline.

## License

This project can be licensed under the MIT License.

If you want strict alignment with current `package.json`, update the license field and add a `LICENSE` file accordingly.
