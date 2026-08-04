import { Router } from 'express';
import { TicketController } from '../controllers/TicketController.js';

export const ticketRouter = Router();
const controller = new TicketController();

ticketRouter.get('/', controller.getTickets);
ticketRouter.get('/:id', controller.getTicketById);
ticketRouter.patch('/:id/status', controller.updateStatus);
