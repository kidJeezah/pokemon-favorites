import { env } from './config/env.js';
import { createApp } from './app.js';
import { migrate } from './db/migrate.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// One retry absorbs managed-Postgres wake-up latency on Render.
try {
  await migrate();
} catch (err) {
  console.error('Migration failed, retrying in 3s…', err);
  await sleep(3000);
  await migrate();
}

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
