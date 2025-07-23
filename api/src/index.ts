// api/src/index.ts
import Fastify from 'fastify';
import { query } from './db';

const fastify = Fastify({ logger: true });

fastify.get('/', async () => {
  return { hello: 'world' };
});

// GET /games → returns today's games
fastify.get('/games', async (request, reply) => {
    const { date } = request.query as { date?: string };
  
    const result = await query(
      `
      SELECT id, home_team, away_team, home_score, away_score, date
      FROM game
      WHERE ($1::date IS NULL OR date::date = $1::date)
      ORDER BY date DESC;
      `,
      [date || null]
    );
  
    return result.rows;
  });

// GET /games/:id/plays → returns plays for a given game
// test w/ http://localhost:3001/games/nba20250722LALGSW/plays
fastify.get('/games/:id/plays', async (request, reply) => {
const { id } = request.params as { id: string };

try {
    const result = await query(
    `
    SELECT id, timestamp, description
    FROM play_update
    WHERE game_id = $1
    ORDER BY timestamp DESC
    `,
    [id]
    );

    return result.rows;
} catch (err) {
    fastify.log.error(err);
    reply.status(500).send({ error: 'Internal server error' });
}
});

fastify.listen({ port: 3001 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});