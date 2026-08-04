import { Router } from 'express';
import { SimulatorController } from '../controllers/SimulatorController.js';

export const simulatorRouter = Router();
const controller = new SimulatorController();

simulatorRouter.get('/scenarios', controller.getScenarios);
simulatorRouter.get('/status', controller.getStatus);
simulatorRouter.post('/run', controller.run);
simulatorRouter.post('/step-run', controller.stepRun);
simulatorRouter.post('/pause', controller.pause);
simulatorRouter.post('/resume', controller.resume);
simulatorRouter.post('/stop', controller.stop);
simulatorRouter.post('/reset', controller.reset);
