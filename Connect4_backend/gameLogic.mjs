import { emitGameEvent } from './kafka/producer.mjs';
export const ROWS = 6;
export const COLS = 7;
export const WIN_LENGTH = 4;


export function createGame(player1, player2) {
  try {
    if (!player1 || typeof player1 !== 'object') {
      throw new Error('Invalid player1: must be an object');
    }

    if (!player1.username || typeof player1.username !== 'string') {
      throw new Error('Invalid player1: username is required and must be a string');
    }

    if (player2 && (typeof player2 !== 'object' || !player2.username || typeof player2.username !== 'string')) {
      throw new Error('Invalid player2: must be an object with a username string');
    }

    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    
    if (!Array.isArray(board) || board.length !== ROWS || !board.every(row => Array.isArray(row) && row.length === COLS)) {
      throw new Error('Failed to create valid game board');
    }

    const players = [
      { 
        ...player1, 
        color: 'blue',
        username: player1.username.trim(),
        disconnectedAt: null,
        forfeitTimeout: null
      },
      player2 ? { 
        ...player2, 
        color: 'green',
        username: player2.username.trim(),
        disconnectedAt: null,
        forfeitTimeout: null
      } : { 
        username: 'Bot', 
        color: 'green', 
        socketId: null,
        disconnectedAt: null,
        forfeitTimeout: null
      }
    ];

    if (players[0].timeoutId) {
      try {
        clearTimeout(players[0].timeoutId);
      } catch (timeoutError) {
        console.warn('Failed to clear player timeout:', timeoutError.message);
      }
    }

  const startedAt = new Date().toISOString();

const game = {
  gameId,
  board,
  players,
  currentTurn: 0,
  started: !!player2,
  gameOver: false,
  createdBy: player1.username,
  createdAt: startedAt,
  startedAt // ✅ STORE IT
};
try{
emitGameEvent({
  eventType: 'GAME_STARTED',
  gameId,
  players,
  startedAt,
  timestamp: startedAt
});}catch(e){
  console.error('Failed to emit GAME_STARTED event:', e.message);
}


    //console.log(`Game created: ${gameId} with players: ${players[0].username} vs ${players[1]?.username || 'Bot'}`);
    return game;

  } catch (error) {
    console.error('Failed to create game:', error.message);
    throw new Error(`Game creation failed: ${error.message}`);
  }
}

export function findLowestRow(board, col) {
  try {
    if (!Array.isArray(board)) {
      throw new Error('Invalid board: must be an array');
    }

    if (board.length !== ROWS || !board.every(row => Array.isArray(row) && row.length === COLS)) {
      throw new Error(`Invalid board dimensions: expected ${ROWS}x${COLS}`);
    }

    if (typeof col !== 'number' || col < 0 || col >= COLS) {
      throw new Error(`Invalid column: must be between 0 and ${COLS - 1}`);
    }

    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        return row;
      }
    }
    
    return -1;

  } catch (error) {
    console.error('Error in findLowestRow:', error.message);
    return -1;
  }
}

export function checkWin(board, row, col, color) {
  try {
    if (!Array.isArray(board)) {
      throw new Error('Invalid board: must be an array');
    }

    if (board.length !== ROWS || !board.every(row => Array.isArray(row) && row.length === COLS)) {
      throw new Error(`Invalid board dimensions: expected ${ROWS}x${COLS}`);
    }

    if (typeof row !== 'number' || row < 0 || row >= ROWS) {
      throw new Error(`Invalid row: must be between 0 and ${ROWS - 1}`);
    }

    if (typeof col !== 'number' || col < 0 || col >= COLS) {
      throw new Error(`Invalid column: must be between 0 and ${COLS - 1}`);
    }

    if (typeof color !== 'string' || !color) {
      throw new Error('Invalid color: must be a non-empty string');
    }

    if (board[row][col] !== color) {
      console.warn(`Checking win for color ${color} at position where actual color is ${board[row][col]}`);
    }

    const checkDirection = (rowDelta, colDelta) => {
      let count = 1;

      for (let d = 1; d < WIN_LENGTH; d++) {
        const newRow = row + rowDelta * d;
        const newCol = col + colDelta * d;
        
        if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS) break;
        if (board[newRow][newCol] !== color) break;
        
        count++;
      }

      for (let d = 1; d < WIN_LENGTH; d++) {
        const newRow = row - rowDelta * d;
        const newCol = col - colDelta * d;
        
        if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS) break;
        if (board[newRow][newCol] !== color) break;
        
        count++;
      }

      return count >= WIN_LENGTH;
    };

    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];

    for (const [rowDelta, colDelta] of directions) {
      if (checkDirection(rowDelta, colDelta)) {
        //console.log(`Win detected for ${color} at (${row}, ${col})`);
        return color;
      }
    }

    return null;

  } catch (error) {
    console.error('Error in checkWin:', error.message);
    return null;
  }
}

export function isBoardFull(board) {
  try {
    if (!Array.isArray(board)) {
      throw new Error('Invalid board: must be an array');
    }

    if (board.length !== ROWS || !board.every(row => Array.isArray(row))) {
      throw new Error(`Invalid board: expected ${ROWS} rows`);
    }

    const isFull = board[0].every(cell => cell !== null);
    
    if (isFull) {
      //console.log('📦 Board is full - game is a draw');
    }
    
    return isFull;

  } catch (error) {
    console.error('Error in isBoardFull:', error.message);
    return false;
  }
}

export function validateMove(board, col, currentPlayer,gameId) {
  try {
    if (!Array.isArray(board)) {
      return { valid: false, error: 'Invalid board' };
    }

    if (typeof col !== 'number' || col < 0 || col >= COLS) {
      return { valid: false, error: `Invalid column: must be between 0 and ${COLS - 1}` };
    }

    if (typeof currentPlayer !== 'number' || (currentPlayer !== 0 && currentPlayer !== 1)) {
      return { valid: false, error: 'Invalid current player: must be 0 or 1' };
    }

    const lowestRow = findLowestRow(board, col);
    
    if (lowestRow === -1) {
      return { valid: false, error: 'Column is full' };
    }
    try{
    emitGameEvent({
  eventType: 'MOVE_MADE',
  gameId: gameId,
  playerIndex: currentPlayer,
  column: col,
  timestamp: new Date().toISOString()
});}catch(e){
  console.error('Failed to emit MOVE_MADE event:', e.message);
}
  // //console.log("validate move called",col);
    return { valid: true, row: lowestRow };

  } catch (error) {
    console.error('Error in validateMove:', error.message);
    return { valid: false, error: 'Move validation failed' };
  }
}

export async function endGame(gameId, activeGames, { insertGame, updateUserStats }, winner = null, isDraw = false) {
  try {
    if (!gameId || typeof gameId !== 'string') {
      throw new Error('Invalid gameId: must be a non-empty string');
    }

    if (!activeGames || !(activeGames instanceof Map)) {
      throw new Error('Invalid activeGames: must be a Map instance');
    }

    if (!insertGame || typeof insertGame !== 'function') {
      throw new Error('Invalid insertGame: must be a function');
    }

    if (!updateUserStats || typeof updateUserStats !== 'function') {
      throw new Error('Invalid updateUserStats: must be a function');
    }

    if (typeof isDraw !== 'boolean') {
      throw new Error('Invalid isDraw: must be a boolean');
    }

    const game = activeGames.get(gameId);
    if (!game) {
      console.warn(`Game ${gameId} not found in active games`);
      return;
    }

    const { players } = game;
    
    if (!Array.isArray(players) || players.length < 2) {
      throw new Error('Invalid game: missing players');
    }

    const player1 = players[0].username;
    const player2 = players[1].username;

    if (!player1 || typeof player1 !== 'string') {
      throw new Error('Invalid player1 username');
    }

    let finalWinner = winner;
    let finalIsDraw = isDraw;

    if (winner === null && !isDraw) {
      if (game.gameOver && game.winner) {
        finalWinner = game.winner;
      } else {
        console.warn('Winner not specified for endGame, defaulting to draw');
        finalIsDraw = true;
      }
    }

    try {
  //console.log("end game called",gameId,player1, player2, finalWinner, finalIsDraw,game);
  await emitGameEvent({
  eventType: 'GAME_ENDED',
  gameId,
  player1,
  finalWinner,
  finalIsDraw,
  startedAt: game.startedAt,
  endedAt: new Date().toISOString(),
  timestamp: new Date().toISOString()
});
      await insertGame(gameId, player1, player2, finalWinner, finalIsDraw);
      console.log(`Game ${gameId} recorded in database`);
    } catch (dbError) {
      console.error('Failed to insert game record:', dbError.message);
    }

    try {
      let p1Wins = 0, p2Wins = 0;

      if (!finalIsDraw && finalWinner) {
        if (finalWinner === player1) {
          p1Wins = 1;
          //console.log(`🏆 ${player1} won the game`);
        } else if (finalWinner === player2) {
          p2Wins = 1;
          //console.log(`🏆 ${player2} won the game`);
        }
      } else if (finalIsDraw) {
        //console.log(`🤝 Game ended in a draw`);
      }

      try {
        await updateUserStats(player1, p1Wins, 1);
        //console.log(`✅ Updated stats for ${player1}`);
      } catch (p1Error) {
        console.error(`Failed to update stats for ${player1}:`, p1Error.message);
      }

      if (player2 !== 'Bot') {
        try {
          await updateUserStats(player2, p2Wins, 1);
          //console.log(`✅ Updated stats for ${player2}`);
        } catch (p2Error) {
          console.error(`Failed to update stats for ${player2}:`, p2Error.message);
        }
      } else {
        //console.log(`Skipping stats update for Bot`);
      }

    } catch (statsError) {
      console.error('Failed to update user statistics:', statsError.message);
    }

    try {
      activeGames.delete(gameId);
      //console.log(`Removed game ${gameId} from active games`);
    } catch (deleteError) {
      console.error('Failed to remove game from active games:', deleteError.message);
    }

  } catch (error) {
    console.error('Critical error in endGame:', error.message);
  }
}

export function validateGameState(game) {
  try {
    if (!game || typeof game !== 'object') {
      return { valid: false, error: 'Game must be an object' };
    }

    const requiredFields = ['gameId', 'board', 'players', 'currentTurn', 'started', 'gameOver'];
    const missingFields = requiredFields.filter(field => !(field in game));
    
    if (missingFields.length > 0) {
      return { valid: false, error: `Missing required fields: ${missingFields.join(', ')}` };
    }

    if (!Array.isArray(game.board)) {
      return { valid: false, error: 'Board must be an array' };
    }

    if (game.board.length !== ROWS || !game.board.every(row => Array.isArray(row) && row.length === COLS)) {
      return { valid: false, error: `Board must be ${ROWS}x${COLS}` };
    }

    if (!Array.isArray(game.players) || game.players.length !== 2) {
      return { valid: false, error: 'Players array must contain exactly 2 players' };
    }

    if (typeof game.currentTurn !== 'number' || (game.currentTurn !== 0 && game.currentTurn !== 1)) {
      return { valid: false, error: 'currentTurn must be 0 or 1' };
    }

    if (typeof game.started !== 'boolean') {
      return { valid: false, error: 'started must be a boolean' };
    }

    if (typeof game.gameOver !== 'boolean') {
      return { valid: false, error: 'gameOver must be a boolean' };
    }

    return { valid: true };

  } catch (error) {
    return { valid: false, error: `Validation error: ${error.message}` };
  }
}

export const GAME_CONSTANTS = {
  ROWS,
  COLS,
  WIN_LENGTH
};