import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return void res
      .status(400)
      .json({ error: 'Validation failed', details: err.flatten().fieldErrors });
  }

  if (err instanceof HttpError) {
    return void res.status(err.status).json({ error: err.message });
  }

  if (err && typeof err === 'object' && 'code' in err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return void res.status(409).json({ error: 'An employee with this email already exists' });
  }

  console.error(err);
  return void res.status(500).json({ error: 'Internal error' });
};
