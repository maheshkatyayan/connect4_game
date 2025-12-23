import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Validate ENV variables
console.log("missing url",process.env.DATABASE_URL);
const requiredEnvVars = [
  'DATABASE_URL',
];

const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(' Missing required environment variables:', missingEnvVars);
  throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

// Supabase PostgreSQL config
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, 
  },
  family: 4,
  max: 10,
});

pool.on('connect', () => {
  console.log(' Supabase PostgreSQL connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected Supabase pool error:', err.message);
});

// Connection test with retry
async function testConnectionWithRetry(maxRetries = 3, delay = 5000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      console.log(`Connected to Supabase DB (attempt ${attempt}/${maxRetries})`);
      client.release();
      return true;
    } catch (err) {
      lastError = err;
      console.error(`Connection attempt ${attempt} failed:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  console.error('All connection attempts failed:', lastError?.message);
  return false;
}

// Auto-test connection on startup
(async () => {
  await testConnectionWithRetry();
})();

// Initialize tables
export async function initDB() {
  try {
    console.log('Initializing database tables...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(50) PRIMARY KEY,
        wins INTEGER DEFAULT 0,
        total_games INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(50) UNIQUE NOT NULL,
        player1 VARCHAR(50) NOT NULL,
        player2 VARCHAR(50),
        winner VARCHAR(50),
        is_draw BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_events_log (
        id SERIAL PRIMARY KEY,
        event_type TEXT,
        game_id TEXT,
        payload JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_metrics (
        game_id TEXT,
        duration_seconds INT,
        played_at TIMESTAMP
      );
    `);

    await pool.query(`
  CREATE TABLE IF NOT EXISTS user_metrics (
  username TEXT PRIMARY KEY,
  games_played INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0
);

    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error(' Database initialization failed:', error.message);
    throw error;
  }
}


// Insert game
export async function insertGame(gameId, player1, player2, winner, isDraw) {
  try {
    const result = await pool.query(
      `INSERT INTO games (game_id, player1, player2, winner, is_draw)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING game_id`,
      [gameId, player1, player2, winner, isDraw]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new Error(`Game with ID ${gameId} already exists`);
    }
    throw error;
  }
}

// Update user stats (transaction-safe)
export async function updateUserStats(username, winsIncrement = 0, totalIncrement = 1) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `
      INSERT INTO users (username, wins, total_games)
      VALUES ($1, $2, $3)
      ON CONFLICT (username)
      DO UPDATE SET
        wins = users.wins + EXCLUDED.wins,
        total_games = users.total_games + EXCLUDED.total_games
      `,
      [username, winsIncrement, totalIncrement]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check
export async function checkDatabaseHealth() {
  try {
    const res = await pool.query('SELECT NOW()');
    return { healthy: true, time: res.rows[0].now };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

// Safe query wrapper
export async function safeQuery(text, params = []) {
  try {
    const res = await pool.query(text, params);
    return { success: true, data: res.rows };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// =====================
// Close pool
// =====================
export async function closePool() {
  await pool.end();
  console.log('Supabase database pool closed');
}

// Fix schema if needed (
export async function fixSchemaIfNeeded() {
  try {
    await pool.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS updated_at;
      ALTER TABLE games DROP COLUMN IF EXISTS updated_at;
    `);
    console.log(' Schema verified/fixed if needed');
  } catch (error) {
    console.error(' Schema fix failed:', error.message);
  }
}

export { pool };
