import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';
import { telemetryRouter } from './routes/telemetry.routes.js';
import { ticketRouter } from './routes/tickets.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { simulatorRouter } from './routes/simulator.routes.js';

export function createApp(): Express {
  const app = express();

  // Core Middleware
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(requestLogger);

  // Infrastructure Routes
  app.use('/health', healthRouter);

  // API Domain Routes
  app.use('/api/v1/telemetry', telemetryRouter);
  app.use('/api/v1/tickets', ticketRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/simulator', simulatorRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
