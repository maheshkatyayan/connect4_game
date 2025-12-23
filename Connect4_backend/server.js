// server.mjs
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initDB, fixSchemaIfNeeded } from './db.mjs';
import setupRoutes from './leaderboard.mjs';
import setupSocketHandlers, { waitingQueue, activeGames } from './sockethandler.mjs';
import { ROWS, COLS, WIN_LENGTH } from './gameLogic.mjs';
import { connectProducer } from './kafka/producer.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);


const normalize = (url) => url?.replace(/\/$/, '');

const FRONTEND_URL = normalize(process.env.Frontend_URL);

console.log('Frontend URL from env:', FRONTEND_URL);

const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5173',
  FRONTEND_URL,
];

console.log('CORS allowed origins:', allowedOrigins);


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(normalize(origin))) {
        return callback(null, true);
      }
      console.log('Blocked by CORS (HTTP):', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});


await initDB();
await fixSchemaIfNeeded();


setupRoutes(app);


setupSocketHandlers(io, { waitingQueue, activeGames, ROWS, COLS, WIN_LENGTH });


await connectProducer()
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
