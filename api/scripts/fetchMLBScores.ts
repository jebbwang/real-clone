// api/scripts/fetchMLBScores.ts
// ----------------------------
// 1.  Imports
import { request } from 'undici';          // Fast fetch in Node
import { query }   from '../src/db';       // Your PG helper
import { format, eachDayOfInterval } from 'date-fns';

// 2.  Config
const START = new Date('2025-07-01');
const END   = new Date('2025-07-31');

const MLB_URL = (d: Date) =>
  `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${format(
    d,
    'yyyyMMdd'  // Changed date format to match ESPN's expectation
  )}`;

// 3.  Main loader
async function loadMonth() {
  for (const day of eachDayOfInterval({ start: START, end: END })) {
    try {
      console.log(`⬇️  Fetching ${format(day, 'yyyy-MM-dd')} …`);
      
      // Make request with error handling
      const res = await request(MLB_URL(day));
      const { statusCode, body } = res;
      if (statusCode !== 200) {
        console.error(`Failed to fetch: ${statusCode}`);
        continue;
      }

      // Parse response with validation
      const text = await res.body.text();
      if (!text) {
        console.error('Empty response from ESPN');
        continue;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text.slice(0, 100) + '...');
        continue;
      }

      if (!data?.events?.length) {
        console.log('No games found for this date');
        continue;
      }

      // Process games
      for (const ev of data.events) {
        const comp = ev.competitions?.[0];
        if (!comp) continue;

        const gameId = comp.id;
        const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
        const away = comp.competitors?.find((c: any) => c.homeAway === 'away');

        if (!home || !away) {
          console.error('Missing team data:', comp);
          continue;
        }

        await query(
          `INSERT INTO game (id, date, home_team, away_team, home_score, away_score)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE
             SET home_score = EXCLUDED.home_score,
                 away_score = EXCLUDED.away_score`,
          [
            gameId,
            format(day, 'yyyy-MM-dd'),
            home.team.abbreviation,
            away.team.abbreviation,
            Number(home.score ?? 0),
            Number(away.score ?? 0)
          ]
        );
        console.log(`✅ Saved: ${away.team.abbreviation} @ ${home.team.abbreviation}`);
      }
    } catch (err) {
      console.error(`❌ Error processing ${format(day, 'yyyy-MM-dd')}:`, err);
    }
  }
  console.log('✅ Month import complete');
}

// 4.  Run
loadMonth().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});