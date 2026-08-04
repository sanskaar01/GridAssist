import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../utils/prisma.js';
import { IncidentRepository } from '../repositories/IncidentRepository.js';
import { TicketRepository } from '../repositories/TicketRepository.js';
import { DecisionEngine } from '../localization/DecisionEngine.js';
import { sendSuccess } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export class DashboardController {
  private incidentRepo = new IncidentRepository();
  private ticketRepo = new TicketRepository();
  private decisionEngine = new DecisionEngine();

  getDashboardData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    try {
      let transformers: any[] = [];
      let activeIncidents: any[] = [];
      let activeTickets: any[] = [];
      let crews: any[] = [];
      let totalTelemetryEvents = 0;
      let totalPoles = 0;
      let darkPoles = 0;
      let dbStatus: 'HEALTHY' | 'OFFLINE' = 'HEALTHY';

      try {
        // 1. Fetch Transformers with Poles, PoleStates, and InferredEdges
        transformers = await prisma.distributionTransformer.findMany({
          include: {
            poles: {
              include: {
                poleState: true,
                device: true,
              },
            },
            inferredEdges: true,
          },
        });

        // 2. Fetch Active Incidents & Active Tickets
        activeIncidents = await this.incidentRepo.findAllActive();
        activeTickets = await this.ticketRepo.findAllActive();
        crews = await prisma.crew.findMany();

        // 3. Pipeline Metrics
        totalTelemetryEvents = await prisma.telemetry.count();
        totalPoles = await prisma.pole.count();
        darkPoles = await prisma.poleState.count({ where: { currentState: 'DARK' } });
      } catch (dbErr) {
        dbStatus = 'OFFLINE';
        logger.warn({ dbErr }, 'Database server offline or initializing. Returning fallback control room state.');
      }

      // Build decision cards for active incidents
      const activeIncidentsWithCards = activeIncidents.map((incident) => {
        const parentCode = incident.suspectedParentPole?.code || (incident.suspectedParentPoleId ? `P-${incident.suspectedParentPoleId.substring(0, 6)}` : null);
        const childCode = incident.suspectedChildPole?.code || (incident.suspectedChildPoleId ? `P-${incident.suspectedChildPoleId.substring(0, 6)}` : null);
        const transformerCode = incident.transformer?.transformerCode || 'D-0101';

        const candidateSpan: any = {
          transformerId: incident.transformerId,
          transformerCode,
          faultType: incident.faultType,
          suspectedParentPoleId: incident.suspectedParentPoleId,
          suspectedParentPoleCode: parentCode,
          suspectedChildPoleId: incident.suspectedChildPoleId,
          suspectedChildPoleCode: childCode,
          latitude: incident.latitude,
          longitude: incident.longitude,
          pincode: incident.pincode,
          affectedPolesCount: incident.affectedPoles,
          affectedPoleIds: [],
          confidence: incident.confidence,
          evidence: ((incident.evidence as any)?.items as string[]) || [],
          assumptions: ((incident.assumptions as any)?.items as string[]) || [],
          rejectedAlternatives: ((incident.rejectedAlternatives as any)?.items as any[]) || [],
          explanation: `Fault detected at transformer span ${parentCode || 'DT'} to ${childCode || 'Root'}`,
        };

        const decisionCard = this.decisionEngine.createDecisionCard(candidateSpan);
        return {
          ...incident,
          decisionCard,
        };
      });

      const responsePayload = {
        systemStatus: {
          telemetry: 'HEALTHY',
          localization: 'HEALTHY',
          incidentEngine: 'HEALTHY',
          ticketEngine: 'HEALTHY',
          database: dbStatus,
          simulator: 'READY',
        },
        pipeline: {
          telemetryEventsReceived: totalTelemetryEvents,
          localizedFaults: activeIncidents.length,
          activeIncidentsCount: activeIncidents.length,
          openTicketsCount: activeTickets.length,
          totalMonitoredPoles: totalPoles,
          darkPolesCount: darkPoles,
        },
        transformers,
        activeIncidents: activeIncidentsWithCards,
        activeTickets,
        crews,
      };

      sendSuccess(res, responsePayload, StatusCodes.OK, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  };
}
