import { FastifyInstance } from 'fastify';
import { query } from '../../db';

export default async function gamesRoutes(fastify: FastifyInstance) {
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

// Get metadata for a single game
fastify.get('/games/:id', async (request, reply) => {
  // Destructure the game ID from the URL params
  const { id } = request.params as { id: string };

  try {
    // Query the game by ID
    const result = await query(
      `
      SELECT id, home_team, away_team, home_score, away_score, date
      FROM game
      WHERE id = $1
      `,
      [id]
    );

    // If no game found, return 404
    if (result.rows.length === 0) {
      reply.status(404).send({ error: 'Game not found' });
      return;
    }

    // Return game data
    return result.rows[0];
  } catch (err) {
    // Log and return error if DB fails
    fastify.log.error(err);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

  // GET /games/:id/plays → returns plays for a given game
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
} 