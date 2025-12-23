import {pool} from '../db.mjs';

export const processGameEvent = async (event) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    //  Log raw event
    await client.query(
      `INSERT INTO game_events_log (event_type, game_id, payload)
       VALUES ($1, $2, $3)`,
      [event.eventType, event.gameId, event]
    );

    // Metrics on GAME_ENDED
    if (event.eventType === 'GAME_ENDED') {
      //  const { startedAt, endedAt, players, winner, isDraw } = event.payload;
     // console.log("AnalyticsWorker - Processing GAME_ENDED for game:", event);
      //  Proper validation
      if (!event.startedAt || !event.endedAt) {
        throw new Error('Missing game timestamps');
      }

      const start = new Date(event.startedAt);
      const end = new Date(event.endedAt);

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        throw new Error('Invalid game timestamps');
      }

       const duration = Math.floor((end - start) / 1000);
       console.log("Inserting game metrics for game:", event.gameId, "Duration (s):", duration);
      await client.query(
        `INSERT INTO game_metrics (game_id, duration_seconds, played_at)
         VALUES ($1, $2, $3)`,
        [event.gameId, duration, event.endedAt]
      );

const players = [event.player1, event.player2];
console.log("Updating user metrics for players:", players);

for (const player of players) {
  if (!player || typeof player !== 'string') continue;
  console.log("Updating metrics for player:", player);
  const win = !event.isDraw && player === event.winner;
  const loss = !event.isDraw && player !== event.winner;
  const draw = event.isDraw;

  await client.query(
    `INSERT INTO user_metrics (username, games_played, wins, losses, draws)
     VALUES ($1, 1, $2, $3, $4)
     ON CONFLICT (username)
     DO UPDATE SET
       games_played = user_metrics.games_played + 1,
       wins = user_metrics.wins + EXCLUDED.wins,
       losses = user_metrics.losses + EXCLUDED.losses,
       draws = user_metrics.draws + EXCLUDED.draws`,
    [
      player,
      win ? 1 : 0,
      loss ? 1 : 0,
      draw ? 1 : 0
    ]
  );
}


    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Analytics error:', err);
  } finally {
    client.release();
  }
};
