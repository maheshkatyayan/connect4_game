// server.mjs - Main Entry Point
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db.mjs';
import { fixSchemaIfNeeded } from './db.mjs';
import setupRoutes from './leaderboard.mjs';
import { waitingQueue, activeGames } from './sockethandler.mjs';
import setupSocketHandlers from './sockethandler.mjs';
import { ROWS, COLS, WIN_LENGTH } from './gameLogic.mjs';
import dotenv from 'dotenv';
import { connectProducer } from './kafka/producer.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
console.log("Frontend URL from env:", process.env.Frontend_URL);
const io = new Server(server, {
  
  cors: {
    origin: ["http://localhost:3001", "http://localhost:5173",`${process.env.Frontend_URL}`],
    methods: ['GET', 'POST'],
  },
});
console.log('CORS allowed origins:', ["http://localhost:3001", "http://localhost:5173",`${process.env.Frontend_URL}`]);
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB
await initDB();

// Setup routes
setupRoutes(app);

// Setup socket handlers (passes io, shared state, game constants)
setupSocketHandlers(io, { waitingQueue, activeGames, ROWS, COLS, WIN_LENGTH });
await connectProducer();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});