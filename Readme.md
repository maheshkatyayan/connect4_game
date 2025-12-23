# Connect 4 Game

A full-stack multiplayer Connect 4 game built with React (frontend) and Node.js (backend), featuring real-time multiplayer gameplay, leaderboards, and bot opponents.

## 🎮 Project Overview

This is a complete Connect 4 implementation with:
- **Real-time Multiplayer**: WebSocket-based multiplayer gaming with Socket.io
- **Bot Opponent**: AI-powered bot for single-player games
- **Leaderboard System**: Track player statistics and rankings
- **Analytics Pipeline**: Kafka-based event tracking and analytics
- **Docker Support**: Containerized deployment for both frontend and backend
- **PostgreSQL Database**: Persistent game and player data storage

## 📁 Project Structure

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
│   ├── docker-compose.yml    # Backend Docker Compose config
│   └── package.json
│
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v14 or higher
- **npm** or **yarn**
- **Docker** and **Docker Compose** (optional, for containerized deployment)
- **PostgreSQL** (for database)
- **Kafka** (optional, for analytics pipeline)

### Installation & Running Locally

#### Frontend Setup

```bash
cd 4inrow_frontend

# Install dependencies
npm install

# Development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

#### Backend Setup

```bash
cd Connect4_backend

# Install dependencies
npm install

# Start the server (runs on http://localhost:3000)
npm start
```

### Environment Variables

Create a `.env` file in the `Connect4_backend` directory with the following variables:

```env
PORT=3000
NODE_ENV=development
Frontend_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/connect4
KAFKA_BROKER=localhost:9092
```

### Docker Deployment

#### Frontend (with Nginx)

```bash
cd 4inrow_frontend
docker-compose up --build
```

The frontend will be accessible at `http://localhost:80`

#### Backend (API + Analytics Worker)

```bash
cd Connect4_backend
docker-compose up --build
```

This runs:
- Express API server on port 3000
- Analytics worker for processing game events
- PostgreSQL database
- Kafka broker (if configured)

## 🎯 Core Features

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
- AI logic for single-player games
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

## 🔗 API Endpoints

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

## 🏗️ Tech Stack

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

## 📦 Dependencies

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

## 🎮 How to Play

1. **Welcome Screen**: Start by entering your name
2. **Game Mode Selection**: Choose between multiplayer or single-player (vs bot)
3. **Multiplayer**: Join the queue or create a private game
4. **Gameplay**: Click on columns to drop your pieces
5. **Winning**: Get 4 pieces in a row (horizontal, vertical, or diagonal)
6. **Leaderboard**: View player rankings and statistics

## 🔧 Development

### Running Tests

```bash
# Frontend
cd 4inrow_frontend
npm test

# Backend (if configured)
cd Connect4_backend
npm test
```

### Code Quality

```bash
# Frontend linting
cd 4inrow_frontend
npm run lint

# Backend (ESLint can be configured)
cd Connect4_backend
npm run lint
```

## 🐳 Docker Workflow

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

## 📊 Game Statistics

The system tracks:
- Total games played
- Wins and losses
- Win rate percentage
- Average game duration
- Opponent matchups

## 🔐 Security Considerations

- CORS configured for frontend-backend communication
- Environment variables for sensitive data
- Input validation on moves
- Database connection pooling
- WebSocket authentication ready

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in backend
- [ ] Configure PostgreSQL with production credentials
- [ ] Set appropriate `Frontend_URL` environment variable
- [ ] Enable HTTPS for WebSocket connections (wss)
- [ ] Configure Kafka for distributed analytics
- [ ] Set up backup strategy for database
- [ ] Configure monitoring and logging
- [ ] Deploy using Docker Compose or Kubernetes

## 🤝 Contributing

1. Clone the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Shantanu

## 🆘 Troubleshooting

### Frontend won't connect to backend
- Check `Frontend_URL` environment variable in backend
- Ensure CORS is properly configured
- Verify Socket.io client version matches server

### Database connection errors
- Verify PostgreSQL is running
- Check `DATABASE_URL` environment variable
- Ensure database user has proper permissions

### Docker issues
- Run `docker-compose down` then `docker-compose up --build`
- Check logs with `docker-compose logs`
- Verify Docker daemon is running

## 📞 Support

For issues or questions, please open an issue on the repository.

---

**Last Updated**: December 2025
