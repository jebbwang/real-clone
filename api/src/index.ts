// api/src/index.ts
import Fastify from 'fastify';
import gamesRoutes from './routes/games';
import commentsRoutes from './routes/comments';
import websocketRoutes from './routes/websockets/index';
import testBroadcastRoute from './routes/test-broadcast';
import cors from '@fastify/cors';



// Declare that we're adding broadcast to Fastify
declare module 'fastify' {
  interface FastifyInstance {
    broadcast: (type: string, payload: any) => void;
  }
}

async function startServer() {
  // Create the Fastify instance
  const fastify = Fastify({ logger: true });

  // ✅ Register CORS *before* any routes
  await fastify.register(cors, {
    origin: 'http://localhost:3000',
  });

  // ✅ Register all plugins *before* any routes that use .broadcast
  await fastify.register(websocketRoutes);       // registers .broadcast
  console.log("🔍 broadcast exists:", typeof fastify.broadcast);
  await fastify.register(gamesRoutes);
  await fastify.register(commentsRoutes);
  await fastify.register(testBroadcastRoute);     // ⬅️ this now runs AFTER decorate

  // Sample test route
  fastify.get('/', async () => {
    return { hello: 'world' };
  });

  // Start the Fastify server
  await fastify.listen({ port: 3001 });
}

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});