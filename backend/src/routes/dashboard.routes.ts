import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController.js';

export const dashboardRouter = Router();
const controller = new DashboardController();

dashboardRouter.get('/', controller.getDashboardData);
