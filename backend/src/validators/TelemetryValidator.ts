import { z } from 'zod';
import { TelemetryEventType } from '@prisma/client';

// Accepts both camelCase and snake_case payloads from IoT hardware/simulator
export const TelemetryInputSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required').optional(),
  device_id: z.string().min(1, 'Device ID is required').optional(),
  poleId: z.string().optional(),
  pole_id: z.string().optional(),
  event: z.string().min(1, 'Event type is required').optional(),
  event_type: z.string().min(1, 'Event type is required').optional(),
  sequenceNumber: z.coerce.number().int().nonnegative().optional(),
  seq: z.coerce.number().int().nonnegative().optional(),
  sequence_number: z.coerce.number().int().nonnegative().optional(),
  eventTimestamp: z.string().optional(),
  ts: z.string().optional(),
  event_timestamp: z.string().optional(),
  battery: z.coerce.number().optional(),
  battery_mv: z.coerce.number().optional(),
  batteryLevel: z.coerce.number().optional(),
  signalStrength: z.coerce.number().optional(),
  rssi: z.coerce.number().optional(),
  firmwareVersion: z.string().optional(),
  fw: z.string().optional(),
}).transform((data) => {
  const deviceId = data.deviceId || data.device_id;
  const rawEvent = (data.event || data.event_type || 'HEARTBEAT').toUpperCase();
  const sequenceNumber = data.sequenceNumber ?? data.sequence_number ?? data.seq;
  const rawTimestamp = data.eventTimestamp || data.event_timestamp || data.ts;

  if (!deviceId) {
    throw new Error('Missing device identifier');
  }
  if (sequenceNumber === undefined) {
    throw new Error('Missing sequence number');
  }

  // Normalize event type to Prisma TelemetryEventType enum
  let eventType: TelemetryEventType;
  if (rawEvent === 'POWER_LOST' || rawEvent === 'POWER_OFF') {
    eventType = TelemetryEventType.POWER_LOST;
  } else if (rawEvent === 'POWER_RESTORED' || rawEvent === 'POWER_ON') {
    eventType = TelemetryEventType.POWER_RESTORED;
  } else {
    eventType = TelemetryEventType.HEARTBEAT;
  }

  let eventTimestamp: Date;
  if (rawTimestamp) {
    const parsed = new Date(rawTimestamp);
    eventTimestamp = isNaN(parsed.getTime()) ? new Date() : parsed;
  } else {
    eventTimestamp = new Date();
  }

  const batteryLevel = data.battery ?? data.batteryLevel ?? (data.battery_mv ? Math.min(100, Math.floor((data.battery_mv / 3600) * 100)) : undefined);
  const signalStrength = data.signalStrength ?? data.rssi;
  const firmwareVersion = data.firmwareVersion ?? data.fw;

  return {
    deviceId,
    poleId: data.poleId || data.pole_id,
    eventType,
    sequenceNumber,
    eventTimestamp,
    batteryLevel,
    signalStrength,
    firmwareVersion,
    rawPayload: data,
  };
});

export type ProcessedTelemetryInput = z.infer<typeof TelemetryInputSchema>;
