// Import Fastify and WebSocket
import { FastifyInstance } from 'fastify';
import websocketPlugin from '@fastify/websocket';
import fp from 'fastify-plugin';

export default fp(async function websocketRoutes (fastify: FastifyInstance) {
  await fastify.register(websocketPlugin);

  const clients = new Set<WebSocket>();

  // make broadcast visible to the parent
  fastify.decorate('broadcast', (type: string, payload: any) => {
    const msg = JSON.stringify({ type, payload });
    for (const c of clients) if (c.readyState === 1 /* WebSocket.OPEN */) c.send(msg);
  });

  fastify.get('/ws', { websocket: true }, socket => {
    clients.add(socket);
    socket.on('close',   () => clients.delete(socket));
    socket.on('message', (m: string) => fastify.log.info(`client: ${m}`));
  });
});