import express, { type ErrorRequestHandler } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { ZodError } from 'zod';
import type { DB } from './db.js';
import { EmployeeRepo } from './repo/employeeRepo.js';
import { employeeInput, listQuery } from './domain/validation.js';
import { COUNTRIES, COUNTRY_CODES } from './domain/countries.js';
import { buildInsights } from './insights.js';

class HttpError extends Error {
  constructor(
    public status: number,
    msg: string,
  ) {
    super(msg);
  }
}

export function createApp(db: DB, webDist?: string) {
  const repo = new EmployeeRepo(db);
  const app = express();
  app.use(express.json());

  const id = (s: string) => {
    const n = Number(s);
    if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'Invalid id');
    return n;
  };

  app.get('/api/health', (_q, r) => r.json({ ok: true }));
  app.get('/api/meta', (_q, r) =>
    r.json({ countries: COUNTRIES, countryCodes: COUNTRY_CODES, departments: repo.departments() }),
  );
  app.get('/api/employees', (q, r) => r.json(repo.list(listQuery.parse(q.query))));
  app.get('/api/employees/:id', (q, r) => {
    const e = repo.get(id(q.params.id));
    if (!e) throw new HttpError(404, 'Employee not found');
    r.json(e);
  });
  app.post('/api/employees', (q, r) =>
    r.status(201).json(repo.create(employeeInput.parse(q.body))),
  );
  app.put('/api/employees/:id', (q, r) => {
    const e = repo.update(id(q.params.id), employeeInput.parse(q.body));
    if (!e) throw new HttpError(404, 'Employee not found');
    r.json(e);
  });
  app.delete('/api/employees/:id', (q, r) => {
    if (!repo.remove(id(q.params.id))) throw new HttpError(404, 'Employee not found');
    r.status(204).end();
  });
  app.get('/api/insights', (q, r) => {
    const c = q.query.country;
    if (c !== undefined && !COUNTRY_CODES.includes(c as never))
      throw new HttpError(400, 'Unknown country');
    r.json(buildInsights(repo, c as never));
  });

  if (webDist && fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get(/^\/(?!api).*/, (_q, r) => r.sendFile(path.join(webDist, 'index.html')));
  }

  const onError: ErrorRequestHandler = (err, _q, res, _n) => {
    if (err instanceof ZodError)
      return void res
        .status(400)
        .json({ error: 'Validation failed', details: err.flatten().fieldErrors });
    if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE')
      return void res.status(409).json({ error: 'An employee with this email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  };
  app.use(onError);
  return app;
}
