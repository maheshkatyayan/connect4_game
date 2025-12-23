import React, { useState, useEffect, useRef } from 'react';

const GameScreen = ({ 
  username, 
  gameId, 
  opponent, 
  setGameId, 
  setOpponent, 
  socket, 
  isFriendGame,
  onViewLeaderboard, 
  onViewProfile, 
  onBackToWelcome, 
  onGameEnd,
  connectionStatus 
}) => {
  // Helper function for deep copying the board
  const createDeepCopy = (board) => {
    return board.map(row => [...row]);
  };

  const [board, setBoard] = useState(Array(6).fill().map(() => Array(7).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState('');
  const [gameStatus, setGameStatus] = useState('waiting');
  const [shareGameId, setShareGameId] = useState('');
  
  const hasAttemptedRejoin = useRef(false);

  const rejoinGame = () => {
    if (!socket || !gameId || !username) {
      console.error('Cannot rejoin: missing socket, gameId, or username');
      setError('Cannot rejoin: Missing connection information');
      return;
    }

    console.log(`MANUAL REJOIN: Emitting rejoin for ${username} to game ${gameId}`);
    hasAttemptedRejoin.current = true;
    socket.emit('rejoin', { gameId, username });
  };

  useEffect(() => {
    if (!socket) {
      console.log('No socket connection');
      return;
    }

    console.log('GameScreen mounted with:', {
      username,
      gameId,
      opponent,
      isFriendGame,
      connectionStatus
    });

    if (gameId && username && !hasAttemptedRejoin.current) {
      console.log('AUTO-REJOIN: Attempting auto-rejoin on mount');
      setTimeout(() => {
        socket.emit('rejoin', { gameId, username });
      }, 1000);
    }

    const eventHandlers = {
      waiting: (data) => {
        console.log('Waiting for opponent...');
        setWaiting(true);
        setGameStatus('waiting');
      },

      matched: (data) => {
        console.log('Matched with opponent:', data);
        setWaiting(false);
        setGameId(data.gameId);
        setOpponent(data.opponent);
        setGameStatus('playing');
      },

      gameStart: (data) => {
        console.log('Game started:', data);
        setWaiting(false);
        setGameId(data.gameId);
        setBoard(data.board ? createDeepCopy(data.board) : Array(6).fill().map(() => Array(7).fill(null)));
        setCurrentPlayer(0);
        const userIndex = data.players.findIndex(p => p.username === username);
        setPlayerIndex(userIndex);
        setGameOver(false);
        setWinner(null);
        setIsDraw(false);
        setOpponent(data.players[1 - userIndex].username);
        setGameStatus('playing');
        hasAttemptedRejoin.current = false;
      },

      friendGameCreated: (data) => {
        console.log('Friend game created:', data);
        setWaiting(false);
        setGameId(data.gameId);
        setShareGameId(data.gameId);
        setGameStatus('waiting-friend');
      },

      friendGameStarted: (data) => {
        console.log('👥 Friend game started:', data);
        setWaiting(false);
        setBoard(data.board ? createDeepCopy(data.board) : Array(6).fill().map(() => Array(7).fill(null)));
        setCurrentPlayer(0);
        const userIndex = data.players.findIndex(p => p.username === username);
        setPlayerIndex(userIndex);
        setOpponent(data.players[1 - userIndex].username);
        setGameStatus('playing');
        hasAttemptedRejoin.current = false;
      },

      moveMade: (data) => {
        console.log('Move made:', data);
        console.log('Current board before update:', board);
        
        setBoard(prevBoard => {
          console.log('Previous board in setter:', prevBoard);
          const newBoard = createDeepCopy(prevBoard);
          newBoard[data.row][data.col] = data.color;
          console.log('New board after move:', newBoard);
          return newBoard;
        });
        setCurrentPlayer(data.currentTurn);
      },

      gameOver: (data) => {
        console.log('Game over:', data);
        setGameOver(true);
        setGameStatus('finished');
        if (data.draw) {
          setIsDraw(true);
        } else {
          setWinner(data.winner);
        }
        onGameEnd();
      },

      rejoinSuccess: (data) => {
        console.log('REJOIN SUCCESS:', data);
        console.log('Rejoined game state:', data);
        setBoard(createDeepCopy(data.board));
        setCurrentPlayer(data.currentTurn);
        setGameOver(data.gameOver || false);
        
        if (data.players) {
          const userIndex = data.players.findIndex(p => p.username === username);
          setPlayerIndex(userIndex);
          if (data.players[1 - userIndex]) {
            setOpponent(data.players[1 - userIndex].username);
          }
        }
        
        setGameStatus(data.gameOver ? 'finished' : 'playing');
        setWaiting(false);
        
        if (data.gameId) {
          setGameId(data.gameId);
        }
        
        setError('Successfully rejoined game!');
        setTimeout(() => setError(''), 3000);
      },

      rejoinError: (data) => {
        console.error('REJOIN ERROR:', data);
        setError('Rejoin failed: ' + data.message);
        setTimeout(() => setError(''), 5000);
      },

      opponentReconnected: (data) => {
        console.log('Opponent reconnected:', data);
        setError(`${data.username} reconnected`);
        setTimeout(() => setError(''), 3000);
      },

      invalidMove: (data) => {
        setError(data.message);
        setTimeout(() => setError(''), 3000);
      },

      error: (data) => {
        setError(data.message);
        setTimeout(() => setError(''), 3000);
      }
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    socket.on('connect', () => {
      console.log(' Socket connected - checking if we should rejoin');
      if (gameId && username && connectionStatus === 'connected') {
        console.log(' Connection restored - attempting auto-rejoin');
        setTimeout(() => {
          socket.emit('rejoin', { gameId, username });
        }, 1500);
      }
    });

    return () => {
      console.log('Cleaning up GameScreen event listeners');
      Object.keys(eventHandlers).forEach(event => {
        socket.off(event);
      });
      socket.off('connect');
    };
  }, [socket, username, gameId, connectionStatus]);
 

  useEffect(() => {
  const handleBeforeUnload = () => {
    const stored = localStorage.getItem('lastGameId');
    if (!stored) return;

    const data = JSON.parse(stored);
    if (data.newGameId === gameId) {
      localStorage.setItem(
        'lastGameId',
        JSON.stringify({
          ...data,
          leftAt: Date.now(),
        })
      );
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [gameId]);


  const makeMove = (col) => {
    if (gameOver || waiting || currentPlayer !== playerIndex || !socket || !gameId) return;
    if (gameStatus !== 'playing') return;
    
    console.log(`Making move in column ${col}`);
    socket.emit('makeMove', { gameId, col });
  };

  const restartGame = () => {
    console.log('Restarting game');
    setBoard(Array(6).fill().map(() => Array(7).fill(null)));
    setCurrentPlayer(0);
    setPlayerIndex(0);
    setGameOver(false);
    setWinner(null);
    setIsDraw(false);
    setWaiting(true);
    setError('');
    setGameStatus('waiting');
    hasAttemptedRejoin.current = false;
    
    if (isFriendGame) {
      onBackToWelcome();
    } else {
      socket.emit('joinQueue', username);
    }
  };

  const copyGameId = () => {
    navigator.clipboard.writeText(shareGameId);
    setError('Game ID copied to clipboard!');
    setTimeout(() => setError(''), 2000);
  };

  const getPlayerName = (index) => {
    if (!opponent) return index === 0 ? username : 'Bot';
    return index === playerIndex ? username : opponent;
  };

  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'waiting':
        return 'Looking for opponent...';
      case 'waiting-friend':
        return 'Waiting for friend to join...';
      case 'playing':
        return `${getPlayerName(currentPlayer)}'s Turn`;
      case 'finished':
        if (isDraw) return "It's a Draw!";
        return `${winner} Wins!`;
      default:
        return 'Connecting...';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'reconnecting': return 'Reconnecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="screen game-screen">
      <header className="game-header">
        <button onClick={onBackToWelcome} className="back-btn">← Menu</button>
        <h2>4 in a Row {opponent ? `vs ${opponent}` : 'vs Bot'}</h2>
        <div className="header-buttons">
          <button onClick={onViewLeaderboard}>Leaderboard</button>
          <button onClick={onViewProfile}>Profile</button>
          {/* <div className={`connection-status ${connectionStatus}`}>
            <div className={`status-dot ${connectionStatus}`}></div>
            {getConnectionStatusText()}
          </div> */}
        </div>
      </header>

      <div style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
        Game: {gameId} | Player: {username} | Status: {gameStatus}
      </div>

      {gameStatus === 'waiting-friend' && shareGameId && (
        <div className="friend-game-share">
          <h3>Share this Game ID with your friend:</h3>
          <div className="game-id-display">
            <code>{shareGameId}</code>
            <button onClick={copyGameId} className="copy-btn">Copy</button>
          </div>
          <p>Your friend can join by entering this ID</p>
        </div>
      )}

      {error && (
        <div className={`message ${error.includes('copied') || error.includes('Successfully') ? 'success' : 'error'}`}>
          {error}
        </div>
      )}
      
      <div className="game-info">
        <h3 className={gameStatus === 'playing' ? 'active-turn' : ''}>
          {getStatusMessage()}
        </h3>
        {gameStatus === 'playing' && (
          <div className="player-indicator">
            <span className={`player-badge ${currentPlayer === playerIndex ? 'you' : 'opponent'}`}>
              {currentPlayer === playerIndex ? 'Your Turn' : "Opponent's Turn"}
            </span>
          </div>
        )}
      </div>

      <div className="board">
        {board.map((row, r) => (
          <div key={r} className="row">
            {row.map((cell, c) => (
              <div
                key={c}
                className={`cell ${cell || ''} ${!gameOver && currentPlayer === playerIndex ? 'clickable' : ''}`}
                onClick={() => makeMove(c)}
              >
                {cell && <div className={`disc ${cell}`}></div>}
              </div>
            ))}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="result-overlay">
          <div className="result-content">
            <h2>{isDraw ? 'Draw!' : `${winner} Wins!`}</h2>
            {winner && <p className="win-message">
              {winner === username ? 'Congratulations! 🎉' : 'Better luck next time!'}
            </p>}
            
            <div className="result-buttons">
              <button onClick={restartGame} className="primary-btn">
                {isFriendGame ? 'Back to Menu' : 'Play Again'}
              </button>
              
              {(isFriendGame || connectionStatus !== 'connected') && (
                <button onClick={rejoinGame} className="secondary-btn">
                  Rejoin Game
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="game-actions">
        {!gameOver && gameStatus === 'playing' && (
          <button onClick={restartGame} className="secondary-btn" disabled={waiting}>
            {isFriendGame ? 'Leave Game' : 'Cancel Game'}
          </button>
        )}
        
        <button onClick={rejoinGame} className="secondary-btn" style={{marginTop: '10px'}}>
          Debug: Force Rejoin
        </button>
      </div>
    </div>
  );
};

export default GameScreen;