import { FastifyInstance } from 'fastify';
import { query } from '../../db';

export default async function commentsRoutes(fastify: FastifyInstance) {
  // GET /games/:id/comments → returns comments for a given game
  fastify.get('/games/:id/comments', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await query(
      `
      SELECT id, text, created_at, parent_id, user_id
      FROM comment
      WHERE game_id = $1
      ORDER BY created_at DESC
      `,
      [id]
    );

    return result.rows;
  });

  // POST /comments → add new comments or replies
  fastify.post('/comments', async (request, reply) => {
    const { user_id, game_id, text, parent_id } = request.body as {
      user_id: string;
      game_id: string;
      text: string;
      parent_id?: string;
    };
  
    try {
      const result = await query(
        `
        INSERT INTO comment (user_id, game_id, text, parent_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at
        `,
        [user_id, game_id, text, parent_id || null]
      );
  
      return {
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to add comment' });
    }
  });
} 