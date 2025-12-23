import React, { useState, useEffect } from 'react';

const LeaderboardScreen = ({ onBackToGame, connectionStatus }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SOCKET_SERVER_URL}/leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      const ranked = data.map((player, index) => ({ 
        ...player, 
        rank: index + 1 
      }));
      setLeaderboard(ranked);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="screen leaderboard-screen">
        <header>
          <button onClick={onBackToGame}>← Back to Game</button>
          <h2>Connect 4 Leaderboard</h2>
          <span className={`connection-status ${connectionStatus}`}>
            {getConnectionStatusText()}
          </span>
        </header>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen leaderboard-screen">
      <header>
        <button onClick={onBackToGame}>← Back to Game</button>
        <h2>Connect 4 Leaderboard</h2>
        <span className={`connection-status ${connectionStatus}`}>
          {getConnectionStatusText()}
        </span>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="leaderboard-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Wins</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player) => (
              <tr key={player.rank} className={player.rank <= 3 ? `top-${player.rank}` : ''}>
                <td className="rank-cell">
                  {player.rank <= 3 && (
                    <span className="medal">
                      {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  )}
                  {player.rank}
                </td>
                <td className="player-cell">{player.username}</td>
                <td className="wins-cell">{player.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {leaderboard.length === 0 && !error && (
          <div className="empty-state">
            <p>No players yet. Be the first to play!</p>
          </div>
        )}

        <div className="leaderboard-actions">
          <button onClick={fetchLeaderboard} className="secondary-btn">
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardScreen;