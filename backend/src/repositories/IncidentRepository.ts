import { prisma } from '../utils/prisma.js';
import { Incident, IncidentStatus, FaultType, ConfidenceLevel, Prisma } from '@prisma/client';

export interface CreateIncidentData {
  faultType: FaultType;
  transformerId: string;
  suspectedParentPoleId?: string | null;
  suspectedChildPoleId?: string | null;
  confidence: ConfidenceLevel;
  evidence: Record<string, unknown>;
  assumptions: Record<string, unknown>;
  rejectedAlternatives: Record<string, unknown>;
  recommendedAction: string;
  affectedPoles: number;
  latitude: number;
  longitude: number;
  pincode: string;
  status?: IncidentStatus;
}

export interface UpdateIncidentData {
  confidence?: ConfidenceLevel;
  evidence?: Record<string, unknown>;
  assumptions?: Record<string, unknown>;
  rejectedAlternatives?: Record<string, unknown>;
  recommendedAction?: string;
  affectedPoles?: number;
  status?: IncidentStatus;
  lastObservedAt?: Date;
  resolvedAt?: Date | null;
}

export class IncidentRepository {
  async findActiveBySpan(
    transformerId: string,
    faultType: FaultType,
    suspectedParentPoleId: string | null,
    suspectedChildPoleId: string | null
  ): Promise<Incident | null> {
    return prisma.incident.findFirst({
      where: {
        transformerId,
        faultType,
        suspectedParentPoleId,
        suspectedChildPoleId,
        status: { in: [IncidentStatus.ACTIVE, IncidentStatus.VERIFYING] },
      },
    });
  }

  async findRecentResolvedBySpan(
    transformerId: string,
    faultType: FaultType,
    suspectedParentPoleId: string | null,
    suspectedChildPoleId: string | null,
    maxAgeMinutes: number = 10
  ): Promise<Incident | null> {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    return prisma.incident.findFirst({
      where: {
        transformerId,
        faultType,
        suspectedParentPoleId,
        suspectedChildPoleId,
        status: IncidentStatus.RESOLVED,
        resolvedAt: { gte: cutoffTime },
      },
      orderBy: { resolvedAt: 'desc' },
    });
  }

  async findActiveByTransformer(transformerId: string): Promise<Incident[]> {
    return prisma.incident.findMany({
      where: {
        transformerId,
        status: { in: [IncidentStatus.ACTIVE, IncidentStatus.VERIFYING] },
      },
    });
  }

  async create(data: CreateIncidentData): Promise<Incident> {
    return prisma.incident.create({
      data: {
        faultType: data.faultType,
        transformerId: data.transformerId,
        suspectedParentPoleId: data.suspectedParentPoleId,
        suspectedChildPoleId: data.suspectedChildPoleId,
        confidence: data.confidence,
        evidence: data.evidence as Prisma.InputJsonValue,
        assumptions: data.assumptions as Prisma.InputJsonValue,
        rejectedAlternatives: data.rejectedAlternatives as Prisma.InputJsonValue,
        recommendedAction: data.recommendedAction,
        affectedPoles: data.affectedPoles,
        latitude: data.latitude,
        longitude: data.longitude,
        pincode: data.pincode,
        status: data.status || IncidentStatus.ACTIVE,
      },
    });
  }

  async update(id: string, data: UpdateIncidentData): Promise<Incident> {
    return prisma.incident.update({
      where: { id },
      data: {
        ...(data.confidence ? { confidence: data.confidence } : {}),
        ...(data.evidence ? { evidence: data.evidence as Prisma.InputJsonValue } : {}),
        ...(data.assumptions ? { assumptions: data.assumptions as Prisma.InputJsonValue } : {}),
        ...(data.rejectedAlternatives ? { rejectedAlternatives: data.rejectedAlternatives as Prisma.InputJsonValue } : {}),
        ...(data.recommendedAction ? { recommendedAction: data.recommendedAction } : {}),
        ...(data.affectedPoles !== undefined ? { affectedPoles: data.affectedPoles } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.lastObservedAt ? { lastObservedAt: data.lastObservedAt } : {}),
        ...(data.resolvedAt !== undefined ? { resolvedAt: data.resolvedAt } : {}),
      },
    });
  }

  async findById(id: string): Promise<Incident | null> {
    return prisma.incident.findUnique({
      where: { id },
      include: {
        transformer: true,
        suspectedParentPole: true,
        suspectedChildPole: true,
        ticket: true,
      },
    });
  }

  async findAllActive(): Promise<Incident[]> {
    return prisma.incident.findMany({
      where: {
        status: { in: [IncidentStatus.ACTIVE, IncidentStatus.VERIFYING] },
      },
      include: {
        transformer: true,
        suspectedParentPole: true,
        suspectedChildPole: true,
      },
      orderBy: { detectedAt: 'desc' },
    });
  }
}
