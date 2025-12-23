# Connect 4 Game

A full-stack multiplayer Connect 4 game built with React (frontend) and Node.js (backend), featuring real-time multiplayer gameplay, leaderboards, and bot opponents.

## Project Overview

This is a complete Connect 4 implementation with:
- **Real-time Multiplayer**: WebSocket-based multiplayer gaming with Socket.io
- **Bot Opponent**: bot for single-player games
- **Leaderboard System**: Track player statistics and rankings
- **Analytics Pipeline**: Kafka-based event tracking and analytics
- **Docker Support**: Containerized deployment for both frontend and backend
- **PostgreSQL Database**: Persistent game and player data storage

##  Project Structure

```
connect_4_game/
├── 4inrow_frontend/          # React frontend application
│   ├── src/
│   │   ├── components/       # React components (GameScreen, LeaderboardScreen, etc.)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile            # Docker image for frontend
│   ├── docker-compose.yml    # Frontend Docker Compose config
│   ├── nginx.conf            # Nginx configuration for production
│   ├── vite.config.js        # Vite build configuration
│   └── package.json
│
├── Connect4_backend/         # Node.js backend server
│   ├── server.js             # Express server entry point
│   ├── gameLogic.mjs         # Game rules and logic
│   ├── sockethandler.mjs     # WebSocket event handlers
│   ├── bot.mjs               # AI bot logic
│   ├── leaderboard.mjs       # Leaderboard API routes
│   ├── db.mjs                # Database initialization and queries
│   ├── kafka/                # Kafka producer/consumer configuration
│   ├── analytics/            # Analytics worker and consumer
│   ├── Dockerfile.api        # Docker image for API server
│   ├── Dockerfile.worker     # Docker image for analytics worker
│   ├── docker-compose.yml    # Backend Docker Compose config for 
│   └── package.json
│
└── README.md                 # This file
```

##  Getting Started

### Prerequisites

- **Node.js** v14 or higher
- **npm** or **yarn**
- **Docker** and **Docker Compose** (optional, for containerized deployment)
- **PostgreSQL** (for database)
- **Kafka** (for analytics pipeline)

### Installation & Running Locally

#### Frontend Setup

```bash
cd 4inrow_frontend

# Install dependencies
npm install

# Development server (runs on http://localhost:5173)
npm run dev
```

Create a `.env` file in the `4inrow_frontend` directory:
```env
VITE_SOCKET_SERVER_URL=http://localhost:5000
```


#### Backend Setup (Requires 3 Terminal Windows)

In your backend(Connect4_backend) go to kafkaClinet inside kafka folder and make sure to coment out the code
 
Comment out:

```js
**Important**: In `Connect4_backend/kafka/kafkaClient.mjs`, comment out the SSL and SASL configuration if running locally:

```js
// ssl: {
//   rejectUnauthorized: true,
//   ca: [Buffer.from(process.env.KAFKA_SSL_CA, 'base64').toString('utf8')],
// },
// sasl: {
//   mechanism: 'scram-sha-256',
//   username: process.env.KAFKA_USERNAME,
//   password: process.env.KAFKA_PASSWORD,
// }
```

#### (Open 3 Terminal Windows)

**Terminal 1: Start Kafka and Zookeeper**

```bash
cd Connect4_backend
docker-compose up --build
```

This runs:
- Kafka broker
- Zookeeper

**Terminal 2: Start API Server**

Open a new terminal:
```bash
cd Connect4_backend

# Install dependencies
npm install

# Start the API server (runs on http://localhost:5000)
node server.js
```

**Terminal 3: Start Analytics Consumer**

Open another new terminal:
```bash
cd Connect4_backend

# Start the analytics consumer/worker
node analytics/consumerStart.mjs
```




```env
PORT=5000
NODE_ENV=development
Frontend_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/connect4
KAFKA_BROKER=localhost:9092
```

##  Core Features

### 1. **Game Logic**
- Standard Connect 4 rules (7x6 grid, 4-in-a-row to win)
- Real-time turn management
- Win/draw detection
- Move validation

### 2. **Multiplayer Gameplay**
- Real-time WebSocket communication via Socket.io
- Game matching and queue management
- Simultaneous multi-game support
- Player turn notifications

### 3. **Bot Opponent**
-  logic for single-player games
- Strategic move selection
- Difficulty levels (basic implementation)

### 4. **Leaderboard System**
- Track player wins, losses, and statistics
- Ranking by win rate or total wins
- Game history retrieval
- Player profiles

### 5. **Analytics Pipeline**
- Kafka-based event streaming
- Game event tracking (moves, wins, etc.)
- Data persistence for analytics
- Consumer worker for processing events

### 6. **Database**
- PostgreSQL for persistent storage
- Player information and statistics
- Game history and results
- Leaderboard data

##  API Endpoints

### HTTP Routes (Leaderboard)

- `GET /leaderboard` - Fetch top players
- `GET /leaderboard/:playerId` - Get player stats
- `POST /leaderboard/record` - Record game result
- `GET /health` - Health check endpoint

### WebSocket Events

- `join_game` - Join waiting queue
- `create_private_game` - Create private game room
- `move` - Make a game move
- `leave_game` - Leave active game
- `game_result` - Receive game outcome

## Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Socket.io Client** - Real-time communication
- **CSS** - Styling

### Backend
- **Express.js** - Web framework
- **Socket.io** - WebSocket library
- **PostgreSQL** - Database
- **Kafka.js** - Event streaming
- **uuid** - Unique ID generation

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Container orchestration
- **Nginx** - Reverse proxy and web server

##  Dependencies

### Frontend
```
react@^19.1.1
react-dom@^19.1.1
socket.io-client@^4.8.1
```

### Backend
```
express@^5.1.0
socket.io@^4.8.1
cors@^2.8.5
pg@^8.16.3
kafkajs@^2.2.4
kafka-node@^5.0.0
dotenv@^17.2.3
uuid@^13.0.0
```

##  How to Play

1. **Welcome Screen**: Start by entering your name
2. **Game Mode Selection**: Choose between multiplayer or single-player (vs bot)
3. **Multiplayer**: Join the queue or create a private game
4. **Gameplay**: Click on columns to drop your pieces
5. **Winning**: Get 4 pieces in a row (horizontal, vertical, or diagonal)
6. **Leaderboard**: View player rankings and statistics

## Development

<!-- ### Running Tests

```bash
# Frontend
cd 4inrow_frontend
npm test

# Backend (if configured)
cd Connect4_backend
npm test
``` -->

<!-- ### Code Quality

```bash
# Frontend linting
cd 4inrow_frontend
npm run lint

# Backend (ESLint can be configured)
cd Connect4_backend
npm run lint
``` -->

##  Docker Workflow

### Build Images

```bash
# Build frontend image
cd 4inrow_frontend
docker build -t connect4-frontend:latest .

# Build backend API
cd Connect4_backend
docker build -f Dockerfile.api -t connect4-api:latest .

# Build analytics worker
docker build -f Dockerfile.worker -t connect4-worker:latest .
```

### Run with Docker Compose

```bash
# Frontend
cd 4inrow_frontend
docker-compose up -d

# Backend (includes DB and Kafka)
cd Connect4_backend
docker-compose up -d
```

### Check Logs

```bash
docker-compose logs -f <service-name>
```

## Game Statistics

The system tracks:
- Total games played
- Wins and losses
- Win rate percentage
- Average game duration
- Opponent matchups

## Security Considerations

- CORS configured for frontend-backend communication
- Environment variables for sensitive data
- Input validation on moves
- Database connection pooling
- WebSocket authentication ready
