// sockethandler.mjs
import {
  createGame,
  checkWin,
  isBoardFull,
  endGame,
  validateMove
} from './gameLogic.mjs';

import { insertGame, updateUserStats } from './db.mjs';
import { botMove } from './bot.mjs';

export const waitingQueue = [];
export const activeGames = new Map();
export const friendGames = new Map();
export const playerGameMap = new Map();

export default function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    /* ==================== SAFE EMIT HELPERS ==================== */

    const safeEmit = (event, data, target = socket) => {
      if (target?.emit) target.emit(event, data);
    };

    const safeRoomEmit = (room, event, data) => {
      if (room) io.to(room).emit(event, data);
    };

    /* ==================== FRIEND GAME ==================== */

    socket.on('createFriendGame', (username) => {
      if (!username) return;

      const player = { socketId: socket.id, username };
      const game = createGame(player, null);

      game.isFriendGame = true;
      game.started = false;
      game.forfeitTimer = null;
      game.disconnectedPlayer = null;

      activeGames.set(game.gameId, game);
      socket.join(game.gameId);

      safeEmit('friendGameCreated', {
        gameId: game.gameId,
        players: game.players
      });
    });

    socket.on('joinFriendGame', ({ gameId, username }) => {
      const game = activeGames.get(gameId);
      if (!game || game.started) return;

      const player2 = { socketId: socket.id, username, color: 'green' };
      game.players[1] = player2;
      game.started = true;

      socket.join(gameId);

      safeRoomEmit(gameId, 'gameStart', {
        gameId,
        players: game.players,
        board: game.board
      });
    });

    /* ==================== MATCHMAKING ==================== */

    socket.on('joinQueue', (username) => {
      if (!username) return;

      const player = { socketId: socket.id, username };
      waitingQueue.push(player);

      safeEmit('waiting', { message: 'Searching opponent...' });

      if (waitingQueue.length >= 2) {
        const p1 = waitingQueue.shift();
        const p2 = waitingQueue.shift();

        const game = createGame(p1, p2);
        game.forfeitTimer = null;
        game.disconnectedPlayer = null;

        activeGames.set(game.gameId, game);

        io.to(p1.socketId).socketsJoin(game.gameId);
        io.to(p2.socketId).socketsJoin(game.gameId);

        safeRoomEmit(game.gameId, 'gameStart', {
          gameId: game.gameId,
          players: game.players,
          board: game.board
        });
      } else {
        socket.timeoutId = setTimeout(() => {
          const index = waitingQueue.findIndex(p => p.socketId === socket.id);
          if (index === -1) return;

          const solo = waitingQueue.splice(index, 1)[0];
          const game = createGame(solo, null);

          game.forfeitTimer = null;
          game.disconnectedPlayer = null;

          activeGames.set(game.gameId, game);

          io.to(solo.socketId).socketsJoin(game.gameId);

          safeEmit('matched', { opponent: 'Bot', gameId: game.gameId }, io.to(solo.socketId));

          safeRoomEmit(game.gameId, 'gameStart', {
            gameId: game.gameId,
            players: game.players,
            board: game.board
          });
        }, 10000);
      }
    });

    /* ==================== GAME MOVES ==================== */

    socket.on('makeMove', ({ gameId, col }) => {
      const game = activeGames.get(gameId);
      if (!game || game.gameOver) return;

      const playerIndex = game.currentTurn;
      const player = game.players[playerIndex];
      if (player.socketId !== socket.id) return;

      const valid = validateMove(game.board, col, playerIndex,gameId);
      if (!valid.valid) return;

      game.board[valid.row][col] = player.color;
      if (checkWin(game.board, valid.row, col, player.color)) {
        game.gameOver = true;
        
        endGame(gameId, activeGames, { insertGame, updateUserStats }, player.username, false);
        safeRoomEmit(gameId, 'gameOver', { winner: player.username, board: game.board });
        return;
      }

      if (isBoardFull(game.board)) {
        game.gameOver = true;
        endGame(gameId, activeGames, { insertGame, updateUserStats }, null, true);
        safeRoomEmit(gameId, 'gameOver', { draw: true, board: game.board });
        return;
      }

      game.currentTurn = 1 - playerIndex;

      safeRoomEmit(gameId, 'moveMade', {
        row: valid.row,
        col,
        color: player.color,
        currentTurn: game.currentTurn
      });

      if (game.players[game.currentTurn].username === 'Bot') {
        setTimeout(() => {
          const result = botMove(gameId, activeGames);
          if (result?.win || result?.draw) {
            safeRoomEmit(gameId, 'gameOver', result);
          } else {
            safeRoomEmit(gameId, 'moveMade', result);
          }
        }, 1000);
      }
    });

    /* ==================== REJOIN ==================== */

    socket.on('rejoin', ({ gameId, username }) => {
      if (!gameId || !username) return;

      const game = activeGames.get(gameId);
      if (!game || game.gameOver) return;

      const idx = game.players.findIndex(p => p.username === username);
      if (idx === -1) return;

      const player = game.players[idx];
      player.socketId = socket.id;
      player.disconnectedAt = null;

      if (game.forfeitTimer) {
        clearTimeout(game.forfeitTimer);
        game.forfeitTimer = null;
      }

      game.disconnectedPlayer = null;
      playerGameMap.delete(username);

      socket.join(gameId);

      safeEmit('rejoinSuccess', {
        board: game.board,
        players: game.players,
        currentTurn: game.currentTurn,
        gameId
      });

      const opponent = game.players[1 - idx];
      if (opponent?.socketId) {
        safeEmit('opponentReconnected', {}, io.to(opponent.socketId));
      }
    });

    /* ==================== DISCONNECT (30s FORFEIT) ==================== */

    socket.on('disconnect', () => {
      const gameId = findGameBySocket(socket.id);
      if (!gameId) return;

      const game = activeGames.get(gameId);
      if (!game || game.gameOver) return;

      const idx = game.players.findIndex(p => p.socketId === socket.id);
      if (idx === -1) return;

      const player = game.players[idx];
      if (player.username === 'Bot') return;

      const opponent = game.players[1 - idx];

      player.socketId = null;
      player.disconnectedAt = Date.now();
      playerGameMap.set(player.username, gameId);

      game.disconnectedPlayer = player.username;

      if (opponent?.socketId) {
        safeEmit(
          'opponentDisconnected',
          { username: player.username, waitTime: 30 },
          io.to(opponent.socketId)
        );
      }

      if (game.forfeitTimer) clearTimeout(game.forfeitTimer);

      game.forfeitTimer = setTimeout(() => {
        if (
          !game.gameOver &&
          game.disconnectedPlayer === player.username
        ) {
          game.gameOver = true;
          endGame(gameId, activeGames, { insertGame, updateUserStats }, opponent.username, false);

          safeRoomEmit(gameId, 'gameOver', {
            winner: opponent.username,
            reason: 'opponent_left',
            board: game.board
          });
        }
      }, 30000);
    });
  });
}

/* HELPERS*/

function findGameBySocket(socketId) {
  for (const [id, game] of activeGames) {
    if (game.players.some(p => p.socketId === socketId)) {
      return id;
    }
  }
  return null;
}
