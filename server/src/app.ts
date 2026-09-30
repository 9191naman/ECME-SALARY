import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { DB } from './db.js';
import { EmployeeRepo } from './repo/employeeRepo.js';
import { createEmployeeRoutes } from './routes/employeeRoutes.js';
import { EmployeeService } from './services/employeeService.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(db: DB, webDist?: string) {
  const app = express();
  const repo = new EmployeeRepo(db);
  const employeeService = new EmployeeService(repo);

  app.use(express.json());
  app.use('/api', createEmployeeRoutes(employeeService));

  if (webDist && fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
