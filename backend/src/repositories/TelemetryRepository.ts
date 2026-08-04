import { prisma } from '../utils/prisma.js';
import { Telemetry, TelemetryEventType, Prisma } from '@prisma/client';

export interface CreateTelemetryData {
  deviceId: string;
  eventType: TelemetryEventType;
  eventTimestamp: Date;
  sequenceNumber: number;
  signalStrength?: number;
  batteryLevel?: number;
  rawPayload: Record<string, unknown>;
}

export class TelemetryRepository {
  async findByDeviceAndSequence(deviceId: string, sequenceNumber: number): Promise<Telemetry | null> {
    return prisma.telemetry.findFirst({
      where: {
        deviceId,
        sequenceNumber,
      },
    });
  }

  async findLatestByDevice(deviceId: string): Promise<Telemetry | null> {
    return prisma.telemetry.findFirst({
      where: { deviceId },
      orderBy: { sequenceNumber: 'desc' },
    });
  }

  async create(data: CreateTelemetryData): Promise<Telemetry> {
    return prisma.telemetry.create({
      data: {
        deviceId: data.deviceId,
        eventType: data.eventType,
        eventTimestamp: data.eventTimestamp,
        sequenceNumber: data.sequenceNumber,
        signalStrength: data.signalStrength,
        batteryLevel: data.batteryLevel,
        rawPayload: data.rawPayload as Prisma.InputJsonValue,
      },
    });
  }
}
