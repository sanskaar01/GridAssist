import { IncidentRepository } from '../repositories/IncidentRepository.js';
import { TicketManager } from './TicketManager.js';
import { DecisionCard } from '../localization/DecisionEngine.js';
import { Incident, IncidentStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';

export interface TimelineEntry {
  timestamp: string;
  event: string;
  details?: string;
}

export class IncidentManager {
  constructor(
    private incidentRepo = new IncidentRepository(),
    private ticketManager = new TicketManager()
  ) {}

  async processDecisionCard(decisionCard: DecisionCard): Promise<Incident> {
    const {
      transformerId,
      faultType,
      confidence,
      evidence,
      assumptions,
      rejectedAlternatives,
      recommendedAction,
      affectedPolesCount,
      latitude,
      longitude,
      pincode,
    } = decisionCard;

    // Use actual UUIDs for DB Foreign Key relationships
    const parentPoleId = decisionCard.suspectedParentPoleId || null;
    const childPoleId = decisionCard.suspectedChildPoleId || null;

    let incident: Incident;

    // 1. Check for Active / Verifying Incident on same span
    const activeMatch = await this.incidentRepo.findActiveBySpan(
      transformerId,
      faultType,
      parentPoleId,
      childPoleId
    );

    if (activeMatch) {
      logger.info(
        { incidentId: activeMatch.id, transformerCode: decisionCard.transformerCode },
        'Active incident matched. Updating evidence and timeline.'
      );

      const currentEvidenceObj = (activeMatch.evidence as Record<string, any>) || {};
      const timeline: TimelineEntry[] = currentEvidenceObj.timeline || [];

      let updated = false;

      if (activeMatch.confidence !== confidence) {
        timeline.push({
          timestamp: new Date().toISOString(),
          event: 'Confidence Rating Changed',
          details: `Confidence updated from ${activeMatch.confidence} to ${confidence}`,
        });
        updated = true;
      }

      if (activeMatch.affectedPoles !== affectedPolesCount) {
        timeline.push({
          timestamp: new Date().toISOString(),
          event: 'Affected Pole Count Updated',
          details: `Affected poles changed from ${activeMatch.affectedPoles} to ${affectedPolesCount}`,
        });
        updated = true;
      }

      if (updated || timeline.length === 0) {
        timeline.push({
          timestamp: new Date().toISOString(),
          event: 'Observation Refreshed',
          details: 'Telemetry localization re-confirmed active fault frontier',
        });
      }

      incident = await this.incidentRepo.update(activeMatch.id, {
        confidence,
        affectedPoles: affectedPolesCount,
        evidence: { items: evidence, timeline },
        assumptions: { items: assumptions },
        rejectedAlternatives: { items: rejectedAlternatives },
        recommendedAction: recommendedAction.detail,
        lastObservedAt: new Date(),
      });
    } else {
      // 2. Check for Reopening Window (Recent Resolved Outage within 10 mins)
      const recentResolved = await this.incidentRepo.findRecentResolvedBySpan(
        transformerId,
        faultType,
        parentPoleId,
        childPoleId,
        10 // 10 minutes reopening window
      );

      if (recentResolved) {
        logger.info(
          { incidentId: recentResolved.id, transformerCode: decisionCard.transformerCode },
          'Recent resolved outage re-detected within window. Transitioning to REOPENED / ACTIVE.'
        );

        const currentEvidenceObj = (recentResolved.evidence as Record<string, any>) || {};
        const timeline: TimelineEntry[] = currentEvidenceObj.timeline || [];

        timeline.push({
          timestamp: new Date().toISOString(),
          event: 'Incident Reopened',
          details: 'Fault frontier re-observed on same span within 10-minute window',
        });

        incident = await this.incidentRepo.update(recentResolved.id, {
          status: IncidentStatus.ACTIVE,
          resolvedAt: null,
          lastObservedAt: new Date(),
          confidence,
          affectedPoles: affectedPolesCount,
          evidence: { items: evidence, timeline },
        });
      } else {
        // 3. Create New Operational Incident
        logger.info(
          { transformerCode: decisionCard.transformerCode, faultType },
          'Creating new persistent operational incident'
        );

        const initialTimeline: TimelineEntry[] = [
          {
            timestamp: new Date().toISOString(),
            event: 'Incident Created',
            details: decisionCard.explanation,
          },
        ];

        incident = await this.incidentRepo.create({
          faultType,
          transformerId,
          suspectedParentPoleId: parentPoleId,
          suspectedChildPoleId: childPoleId,
          confidence,
          evidence: { items: evidence, timeline: initialTimeline },
          assumptions: { items: assumptions },
          rejectedAlternatives: { items: rejectedAlternatives },
          recommendedAction: recommendedAction.detail,
          affectedPoles: affectedPolesCount,
          latitude,
          longitude,
          pincode,
          status: IncidentStatus.ACTIVE,
        });
      }
    }

    // Synchronize Ticket Workflow
    await this.ticketManager.syncTicketForIncident(incident);

    return incident;
  }

  async resolveUnmatchedIncidents(
    transformerId: string,
    activeDecisionCards: DecisionCard[]
  ): Promise<number> {
    const activeIncidents = await this.incidentRepo.findActiveByTransformer(transformerId);
    let resolvedCount = 0;

    for (const incident of activeIncidents) {
      const isMatched = activeDecisionCards.some(
        (card) =>
          card.faultType === incident.faultType &&
          card.suspectedParentPoleId === incident.suspectedParentPoleId &&
          card.suspectedChildPoleId === incident.suspectedChildPoleId
      );

      if (!isMatched && incident.status === IncidentStatus.ACTIVE) {
        logger.info({ incidentId: incident.id }, 'Incident no longer reported by localization. Transitioning to RESOLVED.');

        const currentEvidenceObj = (incident.evidence as Record<string, any>) || {};
        const timeline: TimelineEntry[] = currentEvidenceObj.timeline || [];

        timeline.push({
          timestamp: new Date().toISOString(),
          event: 'Incident Resolved',
          details: 'Fault frontier no longer observed in current network state',
        });

        const updatedIncident = await this.incidentRepo.update(incident.id, {
          status: IncidentStatus.RESOLVED,
          resolvedAt: new Date(),
          evidence: { ...currentEvidenceObj, timeline },
        });

        // Synchronize Ticket Workflow for telemetry verification
        await this.ticketManager.syncTicketForIncident(updatedIncident);

        resolvedCount++;
      }
    }

    return resolvedCount;
  }
}
