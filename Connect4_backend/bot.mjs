import { findLowestRow, checkWin, isBoardFull } from './gameLogic.mjs';

export function botMove(gameId, activeGames) {
  try {
    if (!gameId || typeof gameId !== 'string') {
      throw new Error('Invalid gameId: must be a non-empty string');
    }

    if (!activeGames || !(activeGames instanceof Map)) {
      throw new Error('Invalid activeGames: must be a Map instance');
    }

    const game = activeGames.get(gameId);
    if (!game) {
      throw new Error(`Game not found with ID: ${gameId}`);
    }

    if (typeof game !== 'object' || game === null) {
      throw new Error('Invalid game object');
    }

    if (!Array.isArray(game.board)) {
      throw new Error('Invalid board: must be an array');
    }

    if (game.gameOver) {
      return { error: 'Game is already over' };
    }

    if (game.currentTurn !== 1) {
      return { error: 'Not bot\'s turn' };
    }

    const { board } = game;
    
    if (board.length !== 6 || !board.every(row => Array.isArray(row) && row.length === 7)) {
      throw new Error('Invalid board dimensions: expected 6x7 grid');
    }

    let moveCol = -1;

    try {
      for (let col = 0; col < 7; col++) {
        const row = findLowestRow(board, col);
        if (row !== -1) {
          const tempBoard = JSON.parse(JSON.stringify(board));
          tempBoard[row][col] = 'green';
          if (checkWin(tempBoard, row, col, 'green')) {
            moveCol = col;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error in bot win check:', error);
    }

    if (moveCol === -1) {
      try {
        for (let col = 0; col < 7; col++) {
          const row = findLowestRow(board, col);
          if (row !== -1) {
            const tempBoard = JSON.parse(JSON.stringify(board));
            tempBoard[row][col] = 'blue';
            if (checkWin(tempBoard, row, col, 'blue')) {
              moveCol = col;
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error in block check:', error);
      }
    }

    if (moveCol === -1) {
      try {
        const validCols = [];
        for (let col = 0; col < 7; col++) {
          if (findLowestRow(board, col) !== -1) validCols.push(col);
        }
        
        if (validCols.length === 0) {
          return { error: 'No valid moves available' };
        }
        
        moveCol = validCols[Math.floor(Math.random() * validCols.length)];
      } catch (error) {
        console.error('Error in random move selection:', error);
        for (let col = 0; col < 7; col++) {
          if (findLowestRow(board, col) !== -1) {
            moveCol = col;
            break;
          }
        }
        
        if (moveCol === -1) {
          throw new Error('No valid moves found after fallback');
        }
      }
    }

    if (moveCol < 0 || moveCol > 6) {
      throw new Error(`Invalid move column: ${moveCol}`);
    }

    const row = findLowestRow(board, moveCol);
    if (row === -1) {
      throw new Error(`Column ${moveCol} is full`);
    }

    if (row < 0 || row > 5) {
      throw new Error(`Invalid row position: ${row}`);
    }

    board[row][moveCol] = 'green';

    let winResult = false;
    try {
      winResult = checkWin(board, row, moveCol, 'green');
    } catch (error) {
      console.error('Error checking win condition:', error);
      winResult = false;
    }

    if (winResult) {
      game.gameOver = true;
      game.winner = 'Bot';
      return { 
        row, 
        col: moveCol, 
        win: true, 
        winner: 'Bot',
        color: 'green',
        currentTurn: null
      };
    }

    let isFull = false;
    try {
      isFull = isBoardFull(board);
    } catch (error) {
      console.error('Error checking board full:', error);
      isFull = false;
    }

    if (isFull) {
      game.gameOver = true;
      return { 
        row, 
        col: moveCol, 
        draw: true,
        color: 'green',
        currentTurn: null
      };
    }

    game.currentTurn = 0;
    
    try {
      activeGames.set(gameId, game);
    } catch (error) {
      console.error('Error updating active games:', error);
      return { error: 'Failed to update game state' };
    }

    return { 
      row, 
      col: moveCol, 
      color: 'green', 
      currentTurn: 0 
    };

  } catch (error) {
    console.error('Critical error in botMove:', error);
    
    return { 
      error: 'Bot move failed', 
      details: error.message,
      critical: true 
    };
  }
}

export function validateGameState(game) {
  if (!game || typeof game !== 'object') {
    return { valid: false, error: 'Game must be an object' };
  }

  if (!Array.isArray(game.board)) {
    return { valid: false, error: 'Game board must be an array' };
  }

  if (game.board.length !== 6 || !game.board.every(row => Array.isArray(row) && row.length === 7)) {
    return { valid: false, error: 'Board must be 6x7 grid' };
  }

  if (typeof game.currentTurn !== 'number' || (game.currentTurn !== 0 && game.currentTurn !== 1)) {
    return { valid: false, error: 'currentTurn must be 0 or 1' };
  }

  if (typeof game.gameOver !== 'boolean') {
    return { valid: false, error: 'gameOver must be a boolean' };
  }

  return { valid: true };
}