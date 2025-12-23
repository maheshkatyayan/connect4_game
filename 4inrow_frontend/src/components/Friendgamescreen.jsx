import React, { useState, useEffect } from 'react';

const FriendGameScreen = ({ 
  username, 
  socket, 
  setGameId, 
  setOpponent, 
  onBackToWelcome, 
  onGameStart,
  connectionStatus 
}) => {
  const [status, setStatus] = useState('creating');
  const [gameId, setLocalGameId] = useState('');
  const [error, setError] = useState('');
  const [gameExists, setGameExists] = useState(null);

  useEffect(() => {
    if (!socket || !username) return;

    socket.emit('createFriendGame', username);

    const eventHandlers = {
      friendGameCreated: (data) => {
        setStatus('created');
        setLocalGameId(data.gameId);
        setGameId(data.gameId);
        setError('');
      },

      friendGameStarted: (data) => {
        setOpponent(data.players[1].username);
        onGameStart();
      },

      error: (data) => {
        setError(data.message);
        setStatus('error');
      },

      gameExists: (data) => {
        setGameExists(data);
        if (data.exists && data.canJoin) {
          setError('Game is ready to join!');
        } else if (data.exists && !data.canJoin) {
          setError(data.message || 'Game cannot be joined');
        } else {
          setError(data.message || 'Game not found');
        }
        setTimeout(() => setError(''), 3000);
      }
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.keys(eventHandlers).forEach(event => {
        socket.off(event);
      });
    };
  }, [socket, username, setGameId, setOpponent, onGameStart]);

  const copyGameId = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId);
      setError('Game ID copied to clipboard!');
      setTimeout(() => setError(''), 2000);
    }
  };

  const checkGameExists = () => {
    if (gameId && socket) {
      socket.emit('checkGameExists', gameId);
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

  if (status === 'creating') {
    return (
      <div className="screen friend-game-screen">
        <header>
          <button onClick={onBackToWelcome} className="back-btn">← Back</button>
          <h2>Creating Friend Game...</h2>
          <span className={`connection-status ${connectionStatus}`}>
            {getConnectionStatusText()}
          </span>
        </header>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Setting up your game...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="screen friend-game-screen">
        <header>
          <button onClick={onBackToWelcome} className="back-btn">← Back</button>
          <h2>Error Creating Game</h2>
        </header>
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={onBackToWelcome} className="primary-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen friend-game-screen">
      <header>
        <button onClick={onBackToWelcome} className="back-btn">← Back</button>
        <h2>Play with Friend</h2>
        <span className={`connection-status ${connectionStatus}`}>
          {getConnectionStatusText()}
        </span>
      </header>

      <div className="friend-game-content">
        <div className="success-message">
          <h3>🎮 Game Created Successfully!</h3>
          <p>Share this Game ID with your friend:</p>
        </div>

        <div className="game-id-section">
          <div className="game-id-display large">
            <code>{gameId}</code>
            <button 
              onClick={copyGameId} 
              className="copy-btn primary"
              disabled={!gameId}
            >
              Copy ID
            </button>
          </div>
        </div>

        <div className="instructions">
          <h4>How to play with a friend:</h4>
          <ol>
            <li>Share the Game ID above with your friend</li>
            <li>Your friend enters the Game ID on the main menu</li>
            <li>Game starts automatically when they join</li>
            <li>You'll be player 1 (blue discs)</li>
          </ol>
        </div>

        <div className="waiting-message">
          <div className="spinner"></div>
          <p>Waiting for friend to join...</p>
          <p className="waiting-note">This game will expire if no one joins within 30 minutes</p>
        </div>

        {error && (
          <div className={`message ${error.includes('copied') ? 'success' : 'error'}`}>
            {error}
          </div>
        )}

        <div className="action-buttons">
          <button 
            onClick={checkGameExists} 
            className="secondary-btn"
            disabled={!gameId}
          >
            Check Game Status
          </button>
          <button onClick={onBackToWelcome} className="secondary-btn">
            Cancel Game
          </button>
        </div>

        {gameExists && (
          <div className="game-status-info">
            <h4>Game Status:</h4>
            <p>Exists: {gameExists.exists ? 'Yes' : 'No'}</p>
            <p>Can Join: {gameExists.canJoin ? 'Yes' : 'No'}</p>
            {gameExists.createdBy && <p>Created by: {gameExists.createdBy}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendGameScreen;