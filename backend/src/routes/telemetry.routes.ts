import { Router } from 'express';
import { TelemetryController } from '../controllers/TelemetryController.js';

export const telemetryRouter = Router();
const controller = new TelemetryController();

telemetryRouter.post('/', controller.ingest);
