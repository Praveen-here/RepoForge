import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  // credentials: true lets the frontend send the login cookie with its requests.
  app.use(cors({ origin: config.appUrl, credentials: true }));
  app.use(cookieParser(config.auth.jwtSecret));
  app.use(express.json({ limit: '2mb' }));

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
