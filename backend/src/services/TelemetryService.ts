import { StatusCodes } from 'http-status-codes';
import { DeviceRepository } from '../repositories/DeviceRepository.js';
import { TelemetryRepository } from '../repositories/TelemetryRepository.js';
import { PoleStateRepository } from '../repositories/PoleStateRepository.js';
import { ProcessedTelemetryInput } from '../validators/TelemetryValidator.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { DeviceStatus, PoleStateStatus, TelemetryEventType } from '@prisma/client';

export interface TelemetryIngestResult {
  accepted: boolean;
  duplicate?: boolean;
  stale?: boolean;
  deviceId?: string;
  poleId?: string;
  sequenceNumber?: number;
}

export class TelemetryService {
  constructor(
    private deviceRepo = new DeviceRepository(),
    private telemetryRepo = new TelemetryRepository(),
    private poleStateRepo = new PoleStateRepository()
  ) {}

  async ingestTelemetry(input: ProcessedTelemetryInput): Promise<TelemetryIngestResult> {
    const startTime = Date.now();

    // Stage 1: Validate Device Existence
    const device = await this.deviceRepo.findByDeviceCode(input.deviceId);
    if (!device) {
      logger.warn({ deviceId: input.deviceId }, 'Telemetry rejected: Unknown device');
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'DEVICE_NOT_FOUND',
        `IoT device '${input.deviceId}' is not registered in network database`,
        'Verify device code matches registered pole device code'
      );
    }

    // Stage 2: Deduplicate Check (Device ID + Sequence Number)
    const existing = await this.telemetryRepo.findByDeviceAndSequence(device.id, input.sequenceNumber);
    if (existing) {
      logger.info(
        { deviceId: input.deviceId, sequenceNumber: input.sequenceNumber },
        'Duplicate telemetry packet detected and safely ignored'
      );
      return {
        accepted: true,
        duplicate: true,
        deviceId: device.deviceCode,
        poleId: device.poleId,
        sequenceNumber: input.sequenceNumber,
      };
    }

    // Stage 3: Sequence Validation & Stale Event Detection
    const latestEvent = await this.telemetryRepo.findLatestByDevice(device.id);
    const isStale = latestEvent ? input.sequenceNumber < latestEvent.sequenceNumber : false;

    // Stage 4: Persist Telemetry Event
    const telemetry = await this.telemetryRepo.create({
      deviceId: device.id,
      eventType: input.eventType,
      eventTimestamp: input.eventTimestamp,
      sequenceNumber: input.sequenceNumber,
      signalStrength: input.signalStrength,
      batteryLevel: input.batteryLevel,
      rawPayload: input.rawPayload as Record<string, unknown>,
    });

    // Stage 5: Update Device Communication Status
    await this.deviceRepo.updateStatus(
      device.id,
      DeviceStatus.ACTIVE,
      input.eventTimestamp,
      input.batteryLevel
    );

    // Stage 6: Update PoleState (Only if event is NOT stale)
    if (!isStale) {
      const targetPoleId = device.poleId;
      let nextState: PoleStateStatus;

      if (input.eventType === TelemetryEventType.POWER_LOST) {
        nextState = PoleStateStatus.DARK;
      } else if (input.eventType === TelemetryEventType.POWER_RESTORED) {
        nextState = PoleStateStatus.LIVE;
      } else {
        // HEARTBEAT / BOOT: maintain current state or default to LIVE
        const currentState = await this.poleStateRepo.findByPoleId(targetPoleId);
        nextState = currentState ? currentState.currentState : PoleStateStatus.LIVE;
      }

      await this.poleStateRepo.updateState(
        targetPoleId,
        nextState,
        input.eventType,
        input.eventTimestamp
      );
    } else {
      logger.warn(
        { deviceId: input.deviceId, sequenceNumber: input.sequenceNumber, latestSeq: latestEvent?.sequenceNumber },
        'Stale telemetry event persisted for audit but PoleState update skipped'
      );
    }

    const duration = Date.now() - startTime;
    logger.info(
      {
        deviceId: input.deviceId,
        eventType: input.eventType,
        sequenceNumber: input.sequenceNumber,
        isStale,
        durationMs: duration,
      },
      'Telemetry successfully processed'
    );

    return {
      accepted: true,
      stale: isStale,
      deviceId: device.deviceCode,
      poleId: device.poleId,
      sequenceNumber: telemetry.sequenceNumber,
    };
  }
}
