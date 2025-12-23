import { pool } from './db.mjs';

export default function setupRoutes(app) {
  app.get('/leaderboard', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT username, wins FROM users ORDER BY wins DESC LIMIT 10`
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching leaderboard:', error.message);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  app.get('/profile/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const result = await pool.query(
        `SELECT wins, total_games FROM users WHERE username = $1`,
        [username]
      );
      if (result.rows.length === 0) {
        return res.json({ wins: 0, totalGames: 0 });
      }
      const { wins, total_games } = result.rows[0];
      res.json({ wins, totalGames: total_games });
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.get('/profile/:username/recent', async (req, res) => {
    try {
      const { username } = req.params;
      const result = await pool.query(
        `SELECT g.player1, g.player2, g.winner, g.is_draw, g.created_at 
         FROM games g 
         WHERE g.player1 = $1 OR g.player2 = $1 
         ORDER BY g.created_at DESC LIMIT 3`,
        [username]
      );
      const recent = result.rows.map(row => ({
        opponent: row.player1 === username ? (row.player2 === 'Bot' ? 'Bot' : row.player2) : (row.player1 === 'Bot' ? 'Bot' : row.player1),
        result: row.is_draw ? 'Draw' : (row.winner === username ? 'Win' : 'Loss'),
        date: row.created_at.toISOString().split('T')[0]
      }));
      res.json(recent);
    } catch (error) {
      console.error(' Error fetching recent games:', error.message);
      res.status(500).json({ error: 'Failed to fetch recent games' });
    }
  });

  app.get('/health', async (req, res) => {
    try {
      const dbHealth = await pool.query('SELECT NOW() as current_time');
      res.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        activeGames: global.activeGames ? global.activeGames.size : 0,
        waitingQueue: global.waitingQueue ? global.waitingQueue.length : 0
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message
      });
    }
  });
}