// api/src/routes/test-broadcast.ts
import { FastifyInstance } from 'fastify';

type PlayType = 'three_pointer' | 'layup' | 'dunk' | 'timeout' | 'foul' | 'free_throw' | 'jump_shot' | 'block' | 'steal' | 'assist';

interface PlayUpdate {
  gameId: string;
  type: PlayType;
  description: string;
  player?: string;
  team: 'LAL' | 'GSW';
  score?: {
    LAL: number;
    GSW: number;
  };
  timestamp: string;
}

export default async function testBroadcastRoute(fastify: FastifyInstance) {
  fastify.get('/test-broadcast/:gameId', async (request, reply) => {
    const { gameId } = request.params as { gameId: string };

    if (typeof fastify.broadcast !== 'function') {
      fastify.log.error('❌ fastify.broadcast is not available');
      reply.status(500).send({ error: 'Broadcast method not ready' });
      return;
    }

    let lakers = 0;
    let warriors = 0;

    const plays: Partial<PlayUpdate>[] = [
      {
        type: 'three_pointer',
        description: "Curry pulls up from DEEP... BANG! A three-pointer from way downtown!",
        player: "Stephen Curry",
        team: 'GSW',
        score: { LAL: lakers, GSW: (warriors += 3) }
      },
      {
        type: 'block',
        description: "Davis with a HUGE block on Wiggins! Sends it into the third row!",
        player: "Anthony Davis",
        team: 'LAL'
      },
      {
        type: 'dunk',
        description: "LeBron with a MONSTER slam! Throws it down with authority!",
        player: "LeBron James",
        team: 'LAL',
        score: { LAL: (lakers += 2), GSW: warriors }
      },
      {
        type: 'timeout',
        description: "Warriors call a full timeout to regroup",
        team: 'GSW'
      },
      {
        type: 'steal',
        description: "Green with the defensive play, picks Westbrook's pocket!",
        player: "Draymond Green",
        team: 'GSW'
      },
      {
        type: 'layup',
        description: "Thompson with a smooth finger roll off the glass!",
        player: "Klay Thompson",
        team: 'GSW',
        score: { LAL: lakers, GSW: (warriors += 2) }
      },
      {
        type: 'foul',
        description: "Shooting foul on Green, sends Davis to the line",
        player: "Draymond Green",
        team: 'GSW'
      },
      {
        type: 'free_throw',
        description: "Davis sinks both free throws",
        player: "Anthony Davis",
        team: 'LAL',
        score: { LAL: (lakers += 2), GSW: warriors }
      },
      {
        type: 'assist',
        description: "Beautiful no-look pass from James to Davis for the finish!",
        player: "LeBron James",
        team: 'LAL',
        score: { LAL: (lakers += 2), GSW: warriors }
      }
    ];

    let playIndex = 0;

    const interval = setInterval(() => {
      if (playIndex < plays.length) {
        const play = plays[playIndex];
        fastify.broadcast('playUpdate', {
          gameId,
          ...play,
          timestamp: new Date().toISOString()
        });
        playIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return { message: "Started broadcasting test updates" };
  });
}