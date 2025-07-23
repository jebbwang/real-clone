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

// GET /games/:id/comments → returns comments for a given game
// test w/ http://localhost:3001/games/nba20250722LALGSW/comments
fastify.get('/games/:id/comments', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await query(
        `
        SELECT id, text, created_at
        FROM comment
        WHERE game_id = $1
        ORDER BY created_at DESC
        `,
        [id]
    );

    return result.rows;
});


// Define the POST /comments route to allow adding new comments or replies
fastify.post('/comments', async (request, reply) => {
    // Destructure the request body fields
    const { user_id, game_id, text, parent_id } = request.body as {
      user_id: string;
      game_id: string;
      text: string;
      parent_id?: string; // Optional field for replying to another comment
    };
  
    // Define a list of banned words (case-insensitive)
    const bannedWords = ['shit', 'fuck', 'bitch'];
    const lowerText = text.toLowerCase();
  
    // Check if the comment contains any banned words
    if (bannedWords.some((word) => lowerText.includes(word))) {
      // If profanity is found, return a 400 error
      return reply.status(400).send({ error: 'Profanity not allowed' });
    }
  
    try {
      // Insert the comment into the database
      const result = await query(
        `
        INSERT INTO comment (user_id, game_id, text, parent_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at
        `,
        [user_id, game_id, text, parent_id || null] // Use null if no parent_id is provided
      );
  
      // Return the inserted comment ID and creation timestamp
      return {
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
      };
    } catch (err) {
      // Log the error and return a 500 Internal Server Error
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to add comment' });
    }
  });

fastify.listen({ port: 3001 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});