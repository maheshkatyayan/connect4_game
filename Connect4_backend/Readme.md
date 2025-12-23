# Backend README

# 🎲 Dice Game - Backend Server

## 📋 Overview
Node.js backend server for the multiplayer dice board game featuring real-time communication, game state management, and WebSocket connections.

## 🏗️ Project Structure
backend/
├── server.js # Main server entry point
├── package.json # Dependencies and scripts
├── game-state.js # Game state management
├── socket-handlers/ # Socket event handlers

## 🚀 Quick Start

### Prerequisites
- Node.js v14 or higher
- npm

### Installation
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Debug mode
npm run debug

HTTP Routes
GET /health - Health check

GET /games - List active games

POST /game/create - Create new game