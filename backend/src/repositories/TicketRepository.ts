import { prisma } from '../utils/prisma.js';
import { Ticket, TicketStatus } from '@prisma/client';

export interface CreateTicketData {
  incidentId: string;
  assignedCrewId?: string | null;
  status?: TicketStatus;
}

export interface UpdateTicketData {
  status?: TicketStatus;
  assignedCrewId?: string | null;
  acknowledgedAt?: Date | null;
  assignedAt?: Date | null;
  resolvedAt?: Date | null;
  verifiedAt?: Date | null;
  closedAt?: Date | null;
}

export class TicketRepository {
  async findByIncidentId(incidentId: string): Promise<Ticket | null> {
    return prisma.ticket.findUnique({
      where: { incidentId },
      include: {
        incident: true,
        assignedCrew: true,
      },
    });
  }

  async findById(id: string): Promise<Ticket | null> {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        incident: true,
        assignedCrew: true,
      },
    });
  }

  async findAllActive(): Promise<Ticket[]> {
    return prisma.ticket.findMany({
      where: {
        status: { notIn: [TicketStatus.CLOSED] },
      },
      include: {
        incident: true,
        assignedCrew: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async create(data: CreateTicketData): Promise<Ticket> {
    return prisma.ticket.create({
      data: {
        incidentId: data.incidentId,
        assignedCrewId: data.assignedCrewId,
        status: data.status || TicketStatus.DETECTED,
      },
      include: {
        incident: true,
        assignedCrew: true,
      },
    });
  }

  async update(id: string, data: UpdateTicketData): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.assignedCrewId !== undefined ? { assignedCrewId: data.assignedCrewId } : {}),
        ...(data.acknowledgedAt !== undefined ? { acknowledgedAt: data.acknowledgedAt } : {}),
        ...(data.assignedAt !== undefined ? { assignedAt: data.assignedAt } : {}),
        ...(data.resolvedAt !== undefined ? { resolvedAt: data.resolvedAt } : {}),
        ...(data.verifiedAt !== undefined ? { verifiedAt: data.verifiedAt } : {}),
        ...(data.closedAt !== undefined ? { closedAt: data.closedAt } : {}),
      },
      include: {
        incident: true,
        assignedCrew: true,
      },
    });
  }
}
