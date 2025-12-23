import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import WelcomeScreen from './components/WelcomeScreen';
import GameScreen from './components/GameScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import ProfileScreen from './components/ProfileScreen';
import FriendGameScreen from './components/Friendgamescreen';
import './App.css';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:5000';

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [username, setUsername] = useState('');
  const [gameId, setGameId] = useState(() => {
  const stored = localStorage.getItem('lastGameId');
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    return parsed.newGameId || null;
  } catch (e) {
    console.error('Invalid lastGameId in localStorage', e);
    return null;
  }
});

  const [opponent, setOpponent] = useState(null);
  const [playerData, setPlayerData] = useState({
    wins: 0,
    totalGames: 0,
    recentGames: []
  });
  const [socket, setSocket] = useState(null);
  const [isFriendGame, setIsFriendGame] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const handleSetGameId = (newGameId) => {
    console.log(`💾 Setting gameId: ${newGameId}`);
    setGameId(newGameId);
    if (newGameId) {
      localStorage.setItem('lastGameId',JSON.stringify({
    newGameId,
    username,
    leftAt: null
  }));
  const stored = localStorage.getItem('lastGameId');
  const data = JSON.parse(stored);
  console.log("Stored data after setting gameId:", data);
      console.log(`Saved gameId to localStorage: ${newGameId}`);
    } else {
      localStorage.removeItem('lastGameId');
      console.log('Removed gameId from localStorage');
    }
  };

  useEffect(() => {
    console.log('Initializing socket connection...');
    const newSocket = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      setConnectionStatus('connected');
      
      if (gameId && username) {
        console.log(`Auto-rejoin triggered: ${username} -> ${gameId}`);
        setTimeout(() => {
          newSocket.emit('rejoin', { gameId, username });
        }, 500);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setConnectionStatus('disconnected');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to server (attempt ${attemptNumber})`);
      setConnectionStatus('connected');
      
      if (gameId && username) {
        console.log(`Reconnection rejoin: ${username} -> ${gameId}`);
        setTimeout(() => {
          newSocket.emit('rejoin', { gameId, username });
        }, 500);
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Attempting to reconnect... (attempt ${attemptNumber})`);
      setConnectionStatus('reconnecting');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
      setConnectionStatus('error');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      setConnectionStatus('error');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('error');
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (username && currentScreen === 'profile') {
      fetchPlayerData(username);
    }
  }, [username, currentScreen]);

  useEffect(() => {
    console.log(`🎮 gameId state changed to: ${gameId}`);
  }, [gameId]);

  

  const fetchPlayerData = async (user) => {
    try {
      console.log(`Fetching player data for: ${user}`);
      const res = await fetch(`${SOCKET_SERVER_URL}/profile/${user}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      
      const data = await res.json();
      setPlayerData(prev => ({ ...prev, ...data, recentGames: [] }));

      const recentRes = await fetch(`${SOCKET_SERVER_URL}/profile/${user}/recent`);
      if (recentRes.ok) {
        const recent = await recentRes.json();
        setPlayerData(prev => ({ ...prev, recentGames: recent }));
      }
      
      console.log('Player data loaded successfully');
    } catch (err) {
      console.error('Failed to fetch player data:', err);
    }
  };

  const handleStartMatching = (user) => {
    console.log(`Starting quick match for: ${user}`);
    setUsername(user);
    setIsFriendGame(false);
    if (socket) {
      socket.emit('joinQueue', user);
    }
    setCurrentScreen('game');
  };

  const handleCreateFriendGame = (user) => {
    console.log(`Creating friend game for: ${user}`);
    setUsername(user);
    setIsFriendGame(true);
    setCurrentScreen('friend-game');
  };

  const handleJoinFriendGame = (user, joinGameId) => {
    console.log(`Joining friend game: ${user} -> ${joinGameId}`);
    setUsername(user);
    setIsFriendGame(true);
    handleSetGameId(joinGameId);
    setCurrentScreen('game');
  };

  const handleBackToWelcome = () => {
    console.log('Returning to welcome screen');
    setCurrentScreen('welcome');
    handleSetGameId(null);
    setOpponent(null);
    setIsFriendGame(false);
    if (socket) {
      socket.disconnect();
      setTimeout(() => {
        const newSocket = io(SOCKET_SERVER_URL, {
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });
        setSocket(newSocket);
      }, 100);
    }
  };

  const handleViewLeaderboard = () => {
    console.log('Viewing leaderboard');
    setCurrentScreen('leaderboard');
  };

  const handleViewProfile = () => {
    console.log('Viewing profile');
    setCurrentScreen('profile');
  };

  const handleBackToGame = () => {
    console.log(' Returning to game');
    setCurrentScreen('game');
  };

  const handleGameEnd = () => {
    console.log(' Game ended, updating stats');
    if (username) {
      fetchPlayerData(username);
    }
    setTimeout(() => {
      handleSetGameId(null);
    }, 30000);
  };

  const handleManualRejoin = () => {
    if (socket && gameId && username) {
      console.log(`Manual rejoin triggered: ${username} -> ${gameId}`);
      socket.emit('rejoin', { gameId, username });
      setCurrentScreen('game');
    } else {
      console.error('Cannot rejoin: missing socket, gameId, or username');
    }
  };

  return (
    <div className="App">
      {connectionStatus !== 'connected' && (
        <div className={`connection-banner ${connectionStatus}`}>
          <div className="banner-content">
            <span className="banner-text">
              {connectionStatus === 'connecting' && ' Connecting to server...'}
              {connectionStatus === 'reconnecting' && ' Reconnecting...'}
              {connectionStatus === 'disconnected' && ' Disconnected from server'}
              {connectionStatus === 'error' && ' Connection error'}
            </span>
            {connectionStatus === 'disconnected' && gameId && (
              <button onClick={handleManualRejoin} className="reconnect-btn">
                Reconnect
              </button>
            )}
          </div>
        </div>
      )}

      {currentScreen === 'welcome' && (
        <WelcomeScreen 
          onStartMatching={handleStartMatching}
          onCreateFriendGame={handleCreateFriendGame}
          onJoinFriendGame={handleJoinFriendGame}
          storedGameId={gameId}
          connectionStatus={connectionStatus}
        />
      )}
      
      {currentScreen === 'game' && (
        <GameScreen 
          username={username} 
          gameId={gameId}
          opponent={opponent}
          setGameId={handleSetGameId}
          setOpponent={setOpponent}
          socket={socket}
          isFriendGame={isFriendGame}
          onViewLeaderboard={handleViewLeaderboard}
          onViewProfile={handleViewProfile}
          onBackToWelcome={handleBackToWelcome}
          onGameEnd={handleGameEnd}
          connectionStatus={connectionStatus}
        />
      )}
      
      {currentScreen === 'friend-game' && (
        <FriendGameScreen 
          username={username}
          socket={socket}
          setGameId={handleSetGameId}
          setOpponent={setOpponent}
          onBackToWelcome={handleBackToWelcome}
          onGameStart={() => setCurrentScreen('game')}
          connectionStatus={connectionStatus}
        />
      )}
      
      {currentScreen === 'leaderboard' && (
        <LeaderboardScreen 
          onBackToGame={handleBackToGame} 
          connectionStatus={connectionStatus}
        />
      )}
      
      {currentScreen === 'profile' && (
        <ProfileScreen 
          username={username}
          playerData={playerData}
          onBackToGame={handleBackToGame}
          connectionStatus={connectionStatus}
        />
      )}

      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <div>Screen: {currentScreen}</div>
          <div>User: {username}</div>
          <div>Game: {gameId || 'None'}</div>
          <div>Status: {connectionStatus}</div>
          <div>Socket: {socket ? 'Connected' : 'Disconnected'}</div>
          {gameId && (
            <button 
              onClick={handleManualRejoin} 
              className="debug-rejoin-btn"
            >
              Debug: Rejoin
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;