import React, { useState, useEffect } from 'react';

const WelcomeScreen = ({ 
  onStartMatching, 
  onCreateFriendGame, 
  onJoinFriendGame, 
  storedGameId,
  connectionStatus 
}) => {
  const [inputUsername, setInputUsername] = useState('');
  const [showGameOptions, setShowGameOptions] = useState(false);
  const [joinGameId, setJoinGameId] = useState('');
  const [hasStoredGame, setHasStoredGame] = useState(false);

  // useEffect(() => {
  //   if (storedGameId) {
  //     console.log(`Found stored game ID: ${storedGameId}`);
  //     setHasStoredGame(true);
  //   } else {
  //     setHasStoredGame(false);
  //   }
  // }, [storedGameId]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputUsername.trim()) {
      console.log(`Username submitted: ${inputUsername.trim()}`);
      setShowGameOptions(true);
    }
  const stored = localStorage.getItem('lastGameId');
  const data = JSON.parse(stored);
  console.log("handle welcome:", data.leftAt);
  console.log("handle welcome username:", inputUsername.trim(),data.username , Date.now(),data.leftAt + 30000);

  if(inputUsername.trim()==data.username && Date.now()<data.leftAt + 30000){
    setHasStoredGame(true);
  }else{
    setHasStoredGame(false);
  }
 
 
  };

  const handleQuickMatch = () => {
    console.log(`Starting quick match for: ${inputUsername.trim()}`);
    onStartMatching(inputUsername.trim());
  };

  const handleCreateFriendGame = () => {
    console.log(`Creating friend game for: ${inputUsername.trim()}`);
    onCreateFriendGame(inputUsername.trim());
  };

  const handleJoinFriendGame = () => {
    if (joinGameId.trim()) {
      console.log(`Joining friend game: ${inputUsername.trim()} -> ${joinGameId.trim()}`);
      onJoinFriendGame(inputUsername.trim(), joinGameId.trim());
    }
  };

  const handleRejoinGame = () => {
    if (inputUsername.trim() && storedGameId) {
      console.log(`Rejoining stored game: ${inputUsername.trim()} -> ${storedGameId}`);
      onJoinFriendGame(inputUsername.trim(), storedGameId);
    }
  };

  const handleBack = () => {
    console.log('Going back to username input');
    setShowGameOptions(false);
    setJoinGameId('');
  };

  // const getConnectionStatusText = () => {
  //   switch (connectionStatus) {
  //     case 'connected': return 'Connected';
  //     case 'connecting': return 'Connecting...';
  //     case 'reconnecting': return 'Reconnecting...';
  //     case 'disconnected': return 'Disconnected';
  //     case 'error': return 'Connection Error';
  //     default: return 'Unknown';
  //   }
  // };

  if (showGameOptions) {
    return (
      <div className="screen welcome-screen">
        <header>
          <button onClick={handleBack} className="back-btn">← Back</button>
          <h2>Welcome, {inputUsername}!</h2>
          {/* <span className={`connection-status ${connectionStatus}`}>
            {getConnectionStatusText()}
          </span> */}
        </header>
        
        <div className="welcome-content">
          <p className="choose-mode">Choose how you want to play:</p>
          
          {hasStoredGame && (
            <div className="game-option rejoin-option">
              <div className="option-header">
                <span className="option-icon">R</span>
                <h3>Rejoin Previous Game</h3>
              </div>
              <p className="option-description">
                Continue your last game where you left off
              </p>
              <div className="game-id-display small">
                <code>{storedGameId}</code>
              </div>
              <button 
                onClick={handleRejoinGame} 
                className="primary-btn rejoin-btn"
                disabled={!inputUsername.trim()}
              >
                Rejoin Game
              </button>
              <div className="option-note">
                <small>You have 30 seconds to rejoin after disconnecting</small>
              </div>
            </div>
          )}
          
          <div className="game-options-grid">
            <div className="game-option">
              <div className="option-header">
                <span className="option-icon">G</span>
                <h3>Quick Match</h3>
              </div>
              <p className="option-description">
                Play against a random opponent or bot
              </p>
              <button 
                onClick={handleQuickMatch} 
                className="primary-btn"
                disabled={!inputUsername.trim()}
              >
                Find Opponent
              </button>
              <div className="option-note">
                <small>Bot will join if no player found in 10 seconds</small>
              </div>
            </div>

            {/* <div className="game-option">
              <div className="option-header">
                <span className="option-icon">👥</span>
                <h3>Play with Friend</h3>
              </div>
              <p className="option-description">
                Create a private game and share the ID
              </p>
              <button 
                onClick={handleCreateFriendGame} 
                className="secondary-btn"
                disabled={!inputUsername.trim()}
              >
                Create Game
              </button>
              <div className="option-note">
                <small>Perfect for playing with specific friends</small>
              </div>
            </div>

            <div className="game-option">
              <div className="option-header">
                <span className="option-icon">🔗</span>
                <h3>Join Friend Game</h3>
              </div>
              <p className="option-description">
                Enter a game ID to join your friend's game
              </p>
              <div className="join-game-input">
                <input
                  type="text"
                  placeholder="Enter Game ID"
                  value={joinGameId}
                  onChange={(e) => setJoinGameId(e.target.value)}
                  className="game-id-input"
                />
                <button 
                  onClick={handleJoinFriendGame} 
                  disabled={!joinGameId.trim() || !inputUsername.trim()}
                  className="secondary-btn join-btn"
                >
                  Join Game
                </button>
              </div>
              <div className="option-note">
                <small>Get the Game ID from your friend</small>
              </div>
            </div> */}
          </div>

          <div className="connection-info">
            <div className={`status-indicator ${connectionStatus}`}>
              <div className="status-dot"></div>
              {/* <span>Server: {getConnectionStatusText()}</span> */}
            </div>
            {connectionStatus !== 'connected' && (
              <p className="connection-warning">
                 Please ensure you're connected to play online
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen welcome-screen">
      <div className="welcome-header">
        <h1>4 in a Row</h1>
        <p className="subtitle">Connect four discs to win!</p>
        
        {hasStoredGame && (
          <div className="rejoin-hint">
            <span className="hint-icon">💡</span>
            <p>You have a game in progress! Enter your username to rejoin.</p>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="username-form">
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter your username"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            required
            maxLength={20}
            className="username-input"
          />
          <button 
            type="submit" 
            className="primary-btn continue-btn"
            disabled={!inputUsername.trim()}
          >
            Continue →
          </button>
        </div>
        {inputUsername.trim() && (
          <p className="username-preview">Welcome, <strong>{inputUsername}</strong>!</p>
        )}
      </form>

      <div className="game-features">
        <div className="feature">
          <span className="feature-icon">🎯</span>
          <div className="feature-text">
            <strong>Smart Bot</strong>
            <p>Competitive AI with strategic moves</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">👥</span>
          <div className="feature-text">
            <strong>Play with Friends</strong>
            <p>Private games with shareable IDs</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">🏆</span>
          <div className="feature-text">
            <strong>Leaderboard</strong>
            <p>Track your rank and statistics</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">🔁</span>
          <div className="feature-text">
            <strong>Auto-Rejoin</strong>
            <p>Continue games after disconnection</p>
          </div>
        </div>
      </div>

      <div className="connection-status-footer">
        <div className={`status-indicator ${connectionStatus}`}>
          <div className="status-dot"></div>
          {/* <span>Server: {getConnectionStatusText()}</span> */}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;