import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TicketManager } from '../services/TicketManager.js';
import { sendSuccess } from '../utils/response.js';
import { TicketStatus } from '@prisma/client';
import { z } from 'zod';

const UpdateTicketStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  crewId: z.string().optional(),
});

export class TicketController {
  constructor(private ticketManager = new TicketManager()) {}

  getTickets = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tickets = await this.ticketManager.getAllActiveTickets();
      sendSuccess(res, tickets, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };

  getTicketById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const ticket = await this.ticketManager.getTicketById(id);
      if (!ticket) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: { code: 'TICKET_NOT_FOUND', message: `Ticket '${id}' not found` },
        });
        return;
      }
      sendSuccess(res, ticket, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, crewId } = UpdateTicketStatusSchema.parse(req.body);

      // Pass isSystemAction = false to enforce manual verification restrictions
      const updatedTicket = await this.ticketManager.transitionTicketStatus(id, status, crewId, false);

      sendSuccess(res, updatedTicket, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };
}
