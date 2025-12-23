import React, { useState, useEffect } from 'react';

const ProfileScreen = ({ username, onBackToGame, connectionStatus }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    wins: 0,
    totalGames: 0,
    recentGames: []
  });

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_SOCKET_SERVER_URL}/profile/${username}`);
        console.log("res",response);
        if (!response.ok) throw new Error('Failed to fetch player data');
        const data = await response.json();
        setStats({
          wins: data.wins || 0,
          totalGames: data.totalGames || 0,
          recentGames: data.recentGames || []
        });
      } catch (err) {
        console.error('Error fetching player data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchPlayerData();
    }
  }, [username]);

  const winRate = stats.totalGames > 0
    ? ((stats.wins / stats.totalGames) * 100).toFixed(1)
    : 0;

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

  const getResultColor = (result) => {
    switch (result.toLowerCase()) {
      case 'win': return 'win';
      case 'loss': return 'loss';
      case 'draw': return 'draw';
      default: return '';
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="screen profile-screen">
      <header>
        <button onClick={onBackToGame}>← Back to Game</button>
        <h2>Player Profile</h2>
        <span className={`connection-status ${connectionStatus}`}>
          {getConnectionStatusText()}
        </span>
      </header>

      <div className="profile-container">
        <div className="profile-header">
          <div className="avatar">
            {username?.charAt(0).toUpperCase()}
          </div>
          <h1>{username}</h1>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Wins</h3>
            <div className="stat-value">{stats.wins}</div>
          </div>

          <div className="stat-card">
            <h3>Total Games</h3>
            <div className="stat-value">{stats.totalGames}</div>
          </div>

          <div className="stat-card">
            <h3>Win Rate</h3>
            <div className="stat-value">{winRate}%</div>
          </div>
        </div>

        <div className="recent-games-section">
          <h3>Recent Games</h3>

          {stats.recentGames.length > 0 ? (
            <div className="recent-games-list">
              {stats.recentGames.map((game, index) => (
                <div key={index} className="recent-game-card">
                  <div className="game-opponent">
                    vs {game.opponent}
                  </div>
                  <div className="game-result">
                    <span className={`result-badge ${getResultColor(game.result)}`}>
                      {game.result}
                    </span>
                  </div>
                  <div className="game-date">
                    {game.date}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-recent-games">
              <p>No recent games played yet.</p>
              <p>Start playing to see your history here!</p>
            </div>
          )}
        </div>

        <div className="profile-actions">
          <button onClick={onBackToGame} className="primary-btn">
            Back to Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
