# Technical Treasure Hunt - Backend API

A robust Node.js + Express + MongoDB backend for the Technical Treasure Hunt application, providing RESTful APIs for team management, quiz functionality, and real-time leaderboard support.

## Overview

The backend API powers the Technical Treasure Hunt platform, handling:
- Team registration and authentication
- Multi-round quiz and game management
- Question storage and retrieval
- Progress tracking and scoring
- Admin dashboard operations
- Real-time leaderboard updates (future)

**Technology Stack:**
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT (JWT future phase)
- **Real-time:** Socket.IO (future phase)

## Prerequisites

- **Node.js:** v18 or higher ([Download](https://nodejs.org/))
- **npm:** v9 or higher (comes with Node.js)
- **MongoDB Atlas:** Free cluster account ([Create](https://www.mongodb.com/cloud/atlas))
- **Git:** For cloning the repository

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Technical Treasure Hunt"
```

### 2. Navigate to Backend Directory
```bash
cd backend
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# (See Environment Variables section below)
```

### 5. Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose "Shared" (Free tier)
   - Select a cloud provider and region
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Set username and password
   - Remember these credentials for the connection string

4. **Whitelist IP Address**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (for development) or specify your IP
   - Confirm

5. **Get Connection String**
   - Click "Drivers" on your cluster
   - Choose "Node.js" driver
   - Copy the connection string
   - Replace `<username>`, `<password>`, and `<dbname>` with your values

### 6. Configure .env File
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/technical_treasure_hunt?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_here
ADMIN_PASSWORD=Jayy@admin.123
CORS_ORIGIN=http://localhost:5173
```

## Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` | Yes |
| `PORT` | Server port | `5000` | No (default: 5000) |
| `NODE_ENV` | Environment mode | `development` or `production` | No (default: development) |
| `JWT_SECRET` | Secret key for JWT tokens | Random strong string | No (for future phases) |
| `ADMIN_PASSWORD` | Admin dashboard password | `Jayy@admin.123` | No |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` | No |

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

Expected output:
```
╔═══════════════════════════════════════════╗
║   Technical Treasure Hunt Backend API     ║
╠═══════════════════════════════════════════╣
║  Server running at: http://localhost:5000
║  Environment: development
║  CORS Origin: http://localhost:5173
╚═══════════════════════════════════════════╝
[MongoDB] Connection event: connected
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Health Check
**Endpoint:** `GET /api/health`

Check server and database connectivity status.

**Response:**
```json
{
  "status": "ok",
  "message": "Server and database are healthy",
  "timestamp": "2025-11-17T10:30:45.123Z",
  "database": "connected",
  "uptime": 3600,
  "environment": "development"
}
```

**Status Codes:**
- `200 OK` - Server and database healthy
- `503 Service Unavailable` - Database connection issues

## Authentication API

### POST /api/auth/register
Register a new team.

**Request Body:**
```json
{
  "teamName": "Team Alpha",
  "teamId": "team_alpha_001",
  "password": "SecurePassword123",
  "members": ["Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince"]
}
```

**Parameters:**
- `teamName` (string, required) - Display name for the team
- `teamId` (string, required) - Unique team identifier
- `password` (string, required) - Team password (will be hashed)
- `members` (array of strings, required) - Team member names (minimum 3, maximum 4)

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Team registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "team": {
    "teamId": "team_alpha_001",
    "teamName": "Team Alpha",
    "isGuest": false,
    "currentRound": 0,
    "completedRounds": []
  }
}
```

**Status Codes:**
- `201 Created` - Team registered successfully
- `400 Bad Request` - Validation error (missing fields, insufficient members)
- `409 Conflict` - Team ID already registered
- `500 Internal Server Error` - Server error

### POST /api/auth/login
Login with team credentials (supports guest login with special credentials).

**Request Body:**
```json
{
  "teamId": "team_alpha_001",
  "password": "SecurePassword123"
}
```

**Parameters:**
- `teamId` (string, required) - Team identifier
- `password` (string, required) - Team password

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "team": {
    "teamId": "team_alpha_001",
    "teamName": "Team Alpha",
    "isGuest": false,
    "currentRound": 1,
    "completedRounds": [0]
  }
}
```

**Status Codes:**
- `200 OK` - Login successful
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid team ID or password
- `500 Internal Server Error` - Server error

### Guest Login
Use special credentials to access the application as a guest without registration:

**Guest Credentials:**
```json
{
  "teamId": "GUEST",
  "password": "guest@123"
}
```

**Guest Response (200 OK):**
```json
{
  "status": "success",
  "message": "Guest login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "team": {
    "teamId": "GUEST",
    "teamName": "Guest User",
    "isGuest": true,
    "currentRound": 0,
    "completedRounds": []
  }
}
```

### GET /api/auth/team/:teamId
Get team progress and details.

**URL Parameters:**
- `teamId` (string, required) - Team identifier

**Response (200 OK):**
```json
{
  "status": "success",
  "team": {
    "teamId": "team_alpha_001",
    "teamName": "Team Alpha",
    "members": [
      { "name": "Alice Johnson", "position": 1 },
      { "name": "Bob Smith", "position": 2 },
      { "name": "Charlie Brown", "position": 3 }
    ],
    "rounds": [
      {
        "roundNumber": 0,
        "status": "completed",
        "score": 45,
        "completedAt": "2025-11-17T10:30:45.123Z"
      }
    ],
    "completedRounds": [0],
    "currentRound": 1
  }
}
```

**Status Codes:**
- `200 OK` - Team data retrieved successfully
- `404 Not Found` - Team not found
- `500 Internal Server Error` - Server error

## JWT Token Usage

All authentication endpoints (`/register` and `/login`) return a JWT token in the response. Use this token for protected routes by including it in the `Authorization` header:

```
Authorization: Bearer <token>
```

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:5000/api/quiz/progress
```

**Token Expiration:**
- Tokens expire after 7 days
- Include the token in subsequent requests for protected endpoints
- Refresh token will be implemented in future phases

## Quiz API

### GET /api/quiz/:round/questions
Fetch all questions for a specific round.

**URL Parameters:**
- `round` (number, required) - Round number (0, 1, 2, or 3)
  - 0: Quiz Round
  - 1-3: Treasure Hunt Stages

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "roundNumber": 0,
    "totalQuestions": 50,
    "questions": [
      {
        "questionId": 1,
        "roundNumber": 0,
        "question": "Which Indian state has the highest literacy rate?",
        "options": ["Kerala", "Sikkim", "Goa", "Gujarat"],
        "difficulty": "easy",
        "points": 10
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK` - Questions retrieved successfully
- `400 Bad Request` - Invalid round number
- `404 Not Found` - No questions found for round
- `500 Internal Server Error` - Server error

### POST /api/quiz/:round/start
Start a round and initialize progress tracking.

**URL Parameters:**
- `round` (number, required) - Round number (0, 1, 2, or 3)

**Request Body:**
```json
{
  "teamId": "team_alpha_001",
  "duration": 1500
}
```

**Parameters:**
- `teamId` (string, required) - Team identifier
- `duration` (number, optional) - Round duration in seconds (default: 1500 for quiz, varies for treasure hunt)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "teamId": "team_alpha_001",
    "roundNumber": 0,
    "status": "in_progress",
    "currentQuestion": 0,
    "score": 0,
    "timeLeft": 1500,
    "message": "Round started successfully"
  }
}
```

**Status Codes:**
- `200 OK` - Round started successfully
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Team not found
- `500 Internal Server Error` - Server error

### POST /api/quiz/:round/submit
Submit an answer to a question.

**URL Parameters:**
- `round` (number, required) - Round number (0, 1, 2, or 3)

**Request Body:**
```json
{
  "teamId": "team_alpha_001",
  "questionId": 1,
  "answer": "Kerala",
  "timeTaken": 25
}
```

**Parameters:**
- `teamId` (string, required) - Team identifier
- `questionId` (number, required) - Question identifier
- `answer` (string, required) - Submitted answer
- `timeTaken` (number, optional) - Time taken to answer (in seconds)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "teamId": "team_alpha_001",
    "roundNumber": 0,
    "questionId": 1,
    "isCorrect": true,
    "pointsEarned": 10,
    "correctAnswer": "Kerala",
    "message": "Correct answer!"
  }
}
```

**Status Codes:**
- `200 OK` - Answer submitted successfully
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Team or question not found
- `500 Internal Server Error` - Server error

### POST /api/quiz/:round/complete
Complete a round and finalize scores.

**URL Parameters:**
- `round` (number, required) - Round number (0, 1, 2, or 3)

**Request Body:**
```json
{
  "teamId": "team_alpha_001",
  "totalTime": 1250,
  "timeAtLastSubmission": 1245
}
```

**Parameters:**
- `teamId` (string, required) - Team identifier
- `totalTime` (number, optional) - Total time spent on round (in seconds)
- `timeAtLastSubmission` (number, optional) - Time of last submission (in seconds)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "teamId": "team_alpha_001",
    "roundNumber": 0,
    "score": 450,
    "totalTime": 1250,
    "timeAtLastSubmission": 1245,
    "message": "Round completed successfully"
  }
}
```

**Status Codes:**
- `200 OK` - Round completed successfully
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Team not found
- `500 Internal Server Error` - Server error

### GET /api/quiz/:round/progress/:teamId
Get team's progress for a specific round.

**URL Parameters:**
- `round` (number, required) - Round number (0, 1, 2, or 3)
- `teamId` (string, required) - Team identifier

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "teamId": "team_alpha_001",
    "roundNumber": 0,
    "status": "in_progress",
    "currentQuestion": 15,
    "score": 145,
    "timeLeft": 700,
    "totalTimeSpent": 800,
    "timeAtLastSubmission": 795,
    "answersCount": 15,
    "completedAt": null
  }
}
```

**Status Codes:**
- `200 OK` - Progress retrieved successfully
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Team or round progress not found
- `500 Internal Server Error` - Server error

## Admin API

All admin endpoints require authentication using the `x-admin-auth` header with hardcoded credentials:

```
x-admin-auth: {"adminId":"admin123","password":"Jayy@admin.123"}
```

Or use JWT Bearer token if admin JWT is implemented.

### GET /api/admin/rounds
Get all rounds with live team counts and status.

**Headers:**
```
x-admin-auth: {"adminId":"admin123","password":"Jayy@admin.123"}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "totalRounds": 4,
    "rounds": [
      {
        "id": "507f1f77bcf86cd799439011",
        "roundNumber": 0,
        "title": "Quiz Round",
        "description": "50-question quiz",
        "status": "live",
        "duration": 1500,
        "startedAt": "2025-11-18T10:00:00.000Z",
        "endedAt": null,
        "createdAt": "2025-11-17T10:00:00.000Z",
        "updatedAt": "2025-11-18T10:00:00.000Z",
        "stats": {
          "liveTeams": 12,
          "completedTeams": 5,
          "totalTeams": 17
        }
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK` - Rounds retrieved successfully
- `401 Unauthorized` - Invalid/missing admin credentials
- `500 Internal Server Error` - Server error

### PUT /api/admin/rounds/:id/live
Set a round to live status. Ensures only one round is live at a time.

**URL Parameters:**
- `id` - Round MongoDB ID or round number (0, 1, 2, 3)

**Headers:**
```
x-admin-auth: {"adminId":"admin123","password":"Jayy@admin.123"}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "roundNumber": 0,
    "title": "Quiz Round",
    "status": "live",
    "startedAt": "2025-11-18T10:00:00.000Z",
    "message": "Round 0 is now live"
  }
}
```

**Status Codes:**
- `200 OK` - Round set to live successfully
- `400 Bad Request` - Invalid round ID/number
- `401 Unauthorized` - Invalid/missing admin credentials
- `404 Not Found` - Round not found
- `500 Internal Server Error` - Server error

### PUT /api/admin/rounds/:id/end
End a round.

**URL Parameters:**
- `id` - Round MongoDB ID or round number (0, 1, 2, 3)

**Headers:**
```
x-admin-auth: {"adminId":"admin123","password":"Jayy@admin.123"}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "roundNumber": 0,
    "title": "Quiz Round",
    "status": "ended",
    "endedAt": "2025-11-18T11:00:00.000Z",
    "message": "Round 0 has ended"
  }
}
```

**Status Codes:**
- `200 OK` - Round ended successfully
- `400 Bad Request` - Invalid round ID/number
- `401 Unauthorized` - Invalid/missing admin credentials
- `404 Not Found` - Round not found
- `500 Internal Server Error` - Server error

### GET /api/admin/teams
Get all teams with their progress and statistics.

**Headers:**
```
x-admin-auth: {"adminId":"admin123","password":"Jayy@admin.123"}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "totalTeams": 25,
    "teams": [
      {
        "id": "507f1f77bcf86cd799439012",
        "teamId": "team_alpha_001",
        "teamName": "Team Alpha",
        "members": [
          { "name": "Alice Johnson", "position": 1 },
          { "name": "Bob Smith", "position": 2 }
        ],
        "createdAt": "2025-11-17T10:00:00.000Z",
        "stats": {
          "totalScore": 450,
          "currentRound": 1,
          "completedRounds": [0],
          "roundProgress": [
            {
              "roundNumber": 0,
              "status": "completed",
              "score": 450,
              "answersCount": 50
            }
          ]
        }
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK` - Teams retrieved successfully
- `401 Unauthorized` - Invalid/missing admin credentials
- `500 Internal Server Error` - Server error

### GET /api/admin/teams/:id
Get a specific team by MongoDB ID or teamId.

**URL Parameters:**
- `id` - Team MongoDB ID or teamId string

**Headers:**
```
x-admin-auth: {"adminId":"admin123","password":"Jayy@admin.123"}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "teamId": "team_alpha_001",
    "teamName": "Team Alpha",
    "members": [
      { "name": "Alice Johnson", "position": 1 },
      { "name": "Bob Smith", "position": 2 }
    ],
    "createdAt": "2025-11-17T10:00:00.000Z",
    "updatedAt": "2025-11-18T10:00:00.000Z",
    "stats": {
      "totalScore": 450,
      "currentRound": 1,
      "completedRounds": [0],
      "roundProgress": [
        {
          "roundNumber": 0,
          "status": "completed",
          "score": 450,
          "timeLeft": 0,
          "answersCount": 50,
          "answers": [
            {
              "questionId": 1,
              "question": "Which Indian state...",
              "answer": "Kerala",
              "correctAnswer": "Kerala",
              "isCorrect": true,
              "timestamp": "2025-11-18T10:05:30.000Z",
              "timeTaken": 25
            }
          ]
        }
      ]
    }
  }
}
```

**Status Codes:**
- `200 OK` - Team retrieved successfully
- `401 Unauthorized` - Invalid/missing admin credentials
- `404 Not Found` - Team not found
- `500 Internal Server Error` - Server error

### PUT /api/admin/teams/:id
Update team (name and/or members).

**URL Parameters:**
- `id` - Team MongoDB ID or teamId string

**Headers:**
```
x-admin-auth: {"adminId":"admin123","password":"Jayy@admin.123"}
```

**Request Body:**
```json
{
  "teamName": "Team Alpha Updated",
  "members": [
    { "name": "Alice Johnson", "position": 1 },
    { "name": "Bob Smith", "position": 2 },
    { "name": "Charlie Brown", "position": 3 }
  ]
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "teamId": "team_alpha_001",
    "teamName": "Team Alpha Updated",
    "members": [
      { "name": "Alice Johnson", "position": 1 },
      { "name": "Bob Smith", "position": 2 },
      { "name": "Charlie Brown", "position": 3 }
    ],
    "message": "Team updated successfully"
  }
}
```

**Status Codes:**
- `200 OK` - Team updated successfully
- `401 Unauthorized` - Invalid/missing admin credentials
- `404 Not Found` - Team not found
- `500 Internal Server Error` - Server error

### DELETE /api/admin/teams/:id
Delete a team.

**URL Parameters:**
- `id` - Team MongoDB ID or teamId string

**Headers:**
```
x-admin-auth: {"adminId":"admin123","password":"Jayy@admin.123"}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "teamId": "team_alpha_001",
    "teamName": "Team Alpha",
    "message": "Team deleted successfully"
  }
}
```

**Status Codes:**
- `200 OK` - Team deleted successfully
- `401 Unauthorized` - Invalid/missing admin credentials
- `404 Not Found` - Team not found
- `500 Internal Server Error` - Server error

### POST /api/admin/teams/:id/reset-round/:roundNumber
Reset team progress for a specific round.

**URL Parameters:**
- `id` - Team MongoDB ID or teamId string
- `roundNumber` - Round number (0, 1, 2, 3)

**Headers:**
```
x-admin-auth: {"adminId":"admin123","password":"Jayy@admin.123"}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "teamId": "team_alpha_001",
    "roundNumber": 0,
    "message": "Round 0 has been reset for team team_alpha_001"
  }
}
```

**Status Codes:**
- `200 OK` - Round reset successfully
- `400 Bad Request` - Invalid round number
- `401 Unauthorized` - Invalid/missing admin credentials
- `404 Not Found` - Team or round not found
- `500 Internal Server Error` - Server error

### GET /api/admin/leaderboard
Get leaderboard for all teams or a specific round.

**Query Parameters:**
- `roundNumber` (optional) - Round number (0, 1, 2, 3) to get leaderboard for specific round

**Headers:**
```
x-admin-auth: {"adminId":"admin123","password":"Jayy@admin.123"}
```

**Response (200 OK) - All teams:**
```json
{
  "status": "success",
  "data": {
    "roundNumber": "all",
    "teamCount": 25,
    "leaderboard": [
      {
        "rank": 1,
        "teamId": "team_alpha_001",
        "teamName": "Team Alpha",
        "totalScore": 950,
        "roundCount": 2
      },
      {
        "rank": 2,
        "teamId": "team_beta_001",
        "teamName": "Team Beta",
        "totalScore": 850,
        "roundCount": 2
      }
    ]
  }
}
```

**Response (200 OK) - Specific round:**
```json
{
  "status": "success",
  "data": {
    "roundNumber": 0,
    "teamCount": 25,
    "leaderboard": [
      {
        "rank": 1,
        "teamId": "team_alpha_001",
        "teamName": "Team Alpha",
        "score": 450,
        "status": "completed",
        "timeSpent": 1250
      },
      {
        "rank": 2,
        "teamId": "team_beta_001",
        "teamName": "Team Beta",
        "score": 420,
        "status": "completed",
        "timeSpent": 1300
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK` - Leaderboard retrieved successfully
- `400 Bad Request` - Invalid round number
- `401 Unauthorized` - Invalid/missing admin credentials
- `500 Internal Server Error` - Server error

### Additional Endpoints
The following endpoints will be implemented in future phases:

- **Authentication APIs** (Phase 2)
  - `POST /api/auth/register` - Team registration
  - `POST /api/auth/login` - Team login
  - `POST /api/auth/logout` - Team logout

- **Quiz APIs** (Phase 3)
  - `GET /api/quiz/round/:roundNumber/questions` - Fetch round questions
  - `POST /api/quiz/answer` - Submit answer
  - `GET /api/quiz/progress/:teamId` - Get team progress

- **Admin APIs** (Phase 4)
  - `POST /api/admin/round/live` - Set round as live
  - `POST /api/admin/round/end` - End round
  - `GET /api/admin/leaderboard` - Get leaderboard data
  - `CRUD /api/admin/teams` - Team management

- **Leaderboard APIs** (Phase 5)
  - `GET /api/leaderboard` - Get real-time leaderboard
  - WebSocket events for live updates

## Project Structure

```
backend/
├── routes/              # API route definitions
│   └── health.js       # Health check endpoints
├── controllers/         # Business logic layer (future)
├── models/             # Mongoose schemas
│   ├── Team.js        # Team model with progress tracking
│   ├── Round.js       # Round management model
│   ├── Question.js    # Question storage model
│   └── index.js       # Model exports
├── utils/             # Utility functions
│   └── db.js         # MongoDB connection logic
├── server.js          # Express app entry point
├── package.json       # Node.js dependencies
├── .env              # Environment variables (local)
├── .env.example       # Environment template
├── .gitignore         # Git ignore rules
└── README.md         # This file
```

## MongoDB Collections

### Teams Collection
Stores team information with embedded progress tracking for all rounds.

**Schema:**
```javascript
{
  teamId: String (unique, indexed),
  teamName: String,
  password: String,
  members: [{ name: String, position: Number }],
  rounds: [{
    roundNumber: Number (0-3),
    status: String (not_started|in_progress|completed),
    currentQuestion: Number,
    score: Number (indexed),
    timeLeft: Number,
    answers: [{ questionId, answer, isCorrect, timestamp, timeTaken }],
    startedAt: Date,
    completedAt: Date
  }],
  createdAt: Date (indexed),
  updatedAt: Date
}
```

**Indexes:**
- Unique index on `teamId`
- Index on `rounds.score` (descending) for leaderboard queries
- Index on `rounds.timeLeft` (ascending) for time-based sorting
- Index on `createdAt` for registration time queries

### Rounds Collection
Manages round lifecycle and status (pending, live, ended).

**Schema:**
```javascript
{
  roundNumber: Number (unique, 0-3),
  status: String (pending|live|ended),
  title: String,
  description: String,
  duration: Number,
  startedAt: Date,
  endedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- Unique index on `roundNumber`
- Compound index on `status` and `roundNumber`

### Questions Collection
Stores quiz questions for all rounds.

**Schema:**
```javascript
{
  questionId: Number (indexed),
  roundNumber: Number (0-3, indexed),
  question: String,
  options: [String],
  answer: String,
  points: Number,
  difficulty: String (easy|medium|hard),
  category: String,
  createdAt: Date
}
```

**Indexes:**
- Compound unique index on `roundNumber` and `questionId`
- Index on `roundNumber` for round-based queries
- Index on `difficulty` for filtering

### Teams Collection - Round Progress Structure

Each team document contains an embedded `rounds` array for tracking progress:

```javascript
rounds: [{
  roundNumber: Number (0-3),
  status: String (not_started|in_progress|completed),
  currentQuestion: Number,
  score: Number (indexed for leaderboard),
  timeLeft: Number,
  totalTimeSpent: Number,
  timeAtLastSubmission: Number,
  answers: [{
    questionId: Number,
    question: String,
    answer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    timestamp: Date,
    timeTaken: Number
  }],
  startedAt: Date,
  completedAt: Date
}]
```

**Performance Indexes on Teams:**
- Unique index on `teamId` for fast team lookup
- Index on `rounds.score` (descending) for leaderboard queries
- Index on `rounds.timeLeft` (ascending) for time-based sorting
- Index on `createdAt` for registration time queries
- Compound index on `rounds.roundNumber` for round-specific queries

## Development Guidelines

### Code Style
- Use ES6+ syntax (async/await, arrow functions, const/let)
- Consistent indentation (2 spaces)
- Meaningful variable and function names
- Comments for complex logic

## Development Guidelines

### Code Style
- Use ES6+ syntax (async/await, arrow functions, const/let)
- Consistent indentation (2 spaces)
- Meaningful variable and function names
- Comments for complex logic

### Admin Authentication

The Admin API uses hardcoded credentials for authentication:

**Credentials:**
- Admin ID: `admin123`
- Password: `Jayy@admin.123`

**Authentication Methods:**

1. **Header-based (Recommended):**
```
x-admin-auth: {"adminId":"admin123","password":"Jayy@admin.123"}
```

2. **Bearer Token (JWT):**
```
Authorization: Bearer <jwt_admin_token>
```

**Example cURL requests:**

```bash
# Using header authentication
curl -X GET http://localhost:5000/api/admin/rounds \
  -H "x-admin-auth: {\"adminId\":\"admin123\",\"password\":\"Jayy@admin.123\"}"

# Using Bearer token
curl -X GET http://localhost:5000/api/admin/rounds \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Error Handling
- Always use try-catch for async operations
- Return appropriate HTTP status codes
- Log errors with timestamps
- Provide helpful error messages to clients

### API Response Format
All API responses should follow this structure:

**Success Response:**
```json
{
  "status": "success",
  "data": { /* actual data */ },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Description of the error",
  "code": "ERROR_CODE"
}
```

### Database Queries
- Use indexes for frequently queried fields
- Limit query results when appropriate
- Use projection to retrieve only needed fields
- Implement caching for frequently accessed data (future)

## Troubleshooting

### MongoDB Connection Errors

**Error: "Failed to connect to MongoDB Atlas"**
- Verify MONGODB_URI in .env file
- Check username and password in connection string
- Ensure IP is whitelisted in MongoDB Atlas Network Access
- Verify database name exists in the URI

**Error: "ENOTFOUND cluster.mongodb.net"**
- Check internet connection
- Verify cluster name in connection string
- Ensure MongoDB Atlas cluster is running (not paused)

### Port Already in Use

**Error: "EADDRINUSE: address already in use :::5000"**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or change PORT in .env
PORT=5001
```

### CORS Issues

**Error: "Access to XMLHttpRequest blocked by CORS policy"**
- Verify CORS_ORIGIN in .env matches frontend URL
- Check browser console for specific origin rejection
- Restart backend server after changing CORS_ORIGIN

### Environment Variables Not Loading

**Error: "process.env.MONGODB_URI is undefined"**
- Ensure .env file exists in backend root directory
- Verify variable names match exactly (case-sensitive)
- Restart Node.js server after modifying .env
- Do not commit .env file to version control

## Future Enhancements

### Phase 2: Authentication APIs
- Team registration with validation
- Team login with JWT tokens
- Session management
- Password hashing with bcryptjs

### Phase 3: Quiz/Game APIs
- Question fetching and validation
- Answer submission and scoring
- Progress tracking
- Time management
- Real-time quiz state management

### Phase 4: Admin Dashboard APIs
- Team CRUD operations
- Round lifecycle management
- Leaderboard generation
- Question management
- Admin authentication

### Phase 5: Real-time Features
- Socket.IO integration for live updates
- Real-time leaderboard streaming
- Live team notifications
- WebSocket event handlers

### Phase 6: Performance & Scale
- Database query optimization
- Caching with Redis
- Load balancing
- Monitoring and logging
- Rate limiting enhancement

## Support

For issues, questions, or suggestions, please contact the development team or create an issue in the repository.

## License

MIT License - See LICENSE file for details

---

**Last Updated:** November 17, 2025  
**Backend Version:** 1.0.0
