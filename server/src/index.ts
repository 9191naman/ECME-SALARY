import path from 'node:path';
import { openDb } from './db.js';
import { createApp } from './app.js';
import { seedIfEmpty } from './seed.js';

const db = openDb(process.env.DB_FILE ?? 'salary.db');
if (process.env.AUTO_SEED !== 'false') seedIfEmpty(db); // makes one-click deploys demo-ready
const port = Number(process.env.PORT ?? 3001);
createApp(db, path.resolve(process.env.WEB_DIST ?? '../web/dist')).listen(port, () =>
  console.log(`API on :${port}`),
);
