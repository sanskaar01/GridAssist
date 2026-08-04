import { prisma } from '../utils/prisma.js';
import { PoleState, PoleStateStatus, TelemetryEventType } from '@prisma/client';

export class PoleStateRepository {
  async findByPoleId(poleId: string): Promise<PoleState | null> {
    return prisma.poleState.findUnique({
      where: { poleId },
    });
  }

  async updateState(
    poleId: string,
    currentState: PoleStateStatus,
    lastEvent: TelemetryEventType,
    lastEventTimestamp: Date
  ): Promise<PoleState> {
    // Update both PoleState table and Pole table's current_state column synchronously
    await prisma.pole.update({
      where: { id: poleId },
      data: { currentState },
    });

    return prisma.poleState.upsert({
      where: { poleId },
      create: {
        poleId,
        currentState,
        lastEvent,
        lastEventTimestamp,
      },
      update: {
        currentState,
        lastEvent,
        lastEventTimestamp,
        lastUpdated: new Date(),
      },
    });
  }
}
