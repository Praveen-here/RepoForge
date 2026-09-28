import { HttpError } from '../utils/HttpError.js';

export function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
}

// Express 5 forwards errors thrown in async handlers here automatically.
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }
  if (err.code === 'ENOENT' && err.syscall === 'connect') {
    return res.status(503).json({ message: 'Docker is not running. Start Docker Desktop and try again.' });
  }
  if (err.code === 'ECONNREFUSED' && err.port === 5432) {
    return res.status(503).json({ message: 'The database is not reachable. Is PostgreSQL running?' });
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}
