import { ALL_SCENARIOS, getScenarioById, SimulationScenario } from './scenarios/index.js';
import { TelemetryService } from '../services/TelemetryService.js';
import { LocalizationEngine } from '../localization/LocalizationEngine.js';
import { DecisionEngine } from '../localization/DecisionEngine.js';
import { IncidentManager } from '../services/IncidentManager.js';
import { TicketManager } from '../services/TicketManager.js';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { PoleStateStatus } from '@prisma/client';

export type SimulationState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export class SimulationRunner {
  private state: SimulationState = 'IDLE';
  private currentScenario: SimulationScenario | null = null;
  private currentStepIndex: number = 0;
  private speedMultiplier: number = 1.0;
  private injectedEventsCount: number = 0;
  private timer: NodeJS.Timeout | null = null;

  private telemetryService = new TelemetryService();
  private localizationEngine = new LocalizationEngine();
  private decisionEngine = new DecisionEngine();
  private incidentManager = new IncidentManager();
  private ticketManager = new TicketManager();

  getStatus() {
    return {
      state: this.state,
      scenarioId: this.currentScenario?.id || null,
      scenarioName: this.currentScenario?.name || null,
      currentStep: this.currentStepIndex,
      totalSteps: this.currentScenario?.steps.length || 0,
      injectedEventsCount: this.injectedEventsCount,
      speedMultiplier: this.speedMultiplier,
    };
  }

  getScenarios() {
    return ALL_SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      targetTransformerCode: s.targetTransformerCode,
      stepsCount: s.steps.length,
    }));
  }

  async runScenario(scenarioId: string, speed: number = 1.0): Promise<void> {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario '${scenarioId}' not found`);
    }

    if (this.state === 'RUNNING') {
      this.stop();
    }

    this.currentScenario = scenario;
    this.currentStepIndex = 0;
    this.speedMultiplier = Math.max(0.5, Math.min(5.0, speed));
    this.state = 'RUNNING';

    logger.info({ scenarioId: scenario.id, speedMultiplier: this.speedMultiplier }, 'Starting simulation scenario execution');

    this.scheduleNextStep();
  }

  async executeSingleStep(scenarioId: string, stepIndex: number): Promise<any> {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario '${scenarioId}' not found`);
    }

    if (stepIndex < 0 || stepIndex >= scenario.steps.length) {
      throw new Error(`Invalid step index ${stepIndex} for scenario '${scenarioId}'`);
    }

    this.currentScenario = scenario;
    this.currentStepIndex = stepIndex;

    const step = scenario.steps[stepIndex];
    logger.info({ scenarioId, stepIndex, step }, 'Executing single scenario step synchronously');

    await this.executeStep(step);
    this.injectedEventsCount++;

    if (this.currentStepIndex >= scenario.steps.length - 1) {
      this.state = 'COMPLETED';
    } else {
      this.state = 'PAUSED';
    }

    return {
      status: this.getStatus(),
      executedStep: step,
    };
  }

  pause() {
    if (this.state === 'RUNNING') {
      if (this.timer) clearTimeout(this.timer);
      this.state = 'PAUSED';
      logger.info('Simulation paused');
    }
  }

  resume() {
    if (this.state === 'PAUSED' && this.currentScenario) {
      this.state = 'RUNNING';
      logger.info('Simulation resumed');
      this.scheduleNextStep();
    }
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.state = 'IDLE';
    logger.info('Simulation stopped');
  }

  async resetGrid(): Promise<void> {
    this.stop();

    logger.info('Resetting electrical grid to healthy operational state...');

    try {
      // 1. Restore all PoleState to LIVE and update Pole.currentState to LIVE
      await prisma.poleState.updateMany({
        data: {
          currentState: PoleStateStatus.LIVE,
          lastEvent: null,
          lastEventTimestamp: null,
        },
      });

      await prisma.pole.updateMany({
        data: {
          currentState: PoleStateStatus.LIVE,
        },
      });

      // 2. Clear Active Incidents & Tickets
      await prisma.ticket.deleteMany({});
      await prisma.incident.deleteMany({});
    } catch (dbErr) {
      logger.warn({ dbErr }, 'Database offline during reset operation. State reset performed in-memory.');
    }

    this.currentScenario = null;
    this.currentStepIndex = 0;
    this.injectedEventsCount = 0;
    this.state = 'IDLE';

    logger.info('Grid reset complete. All monitored feeders operating normally.');
  }

  private scheduleNextStep() {
    if (this.state !== 'RUNNING' || !this.currentScenario) return;

    if (this.currentStepIndex >= this.currentScenario.steps.length) {
      this.state = 'COMPLETED';
      logger.info({ scenarioId: this.currentScenario.id }, 'Simulation scenario execution completed!');
      return;
    }

    const step = this.currentScenario.steps[this.currentStepIndex];
    const delay = Math.max(100, Math.floor((step.delayMs || 500) / this.speedMultiplier));

    this.timer = setTimeout(async () => {
      try {
        await this.executeStep(step);
        this.currentStepIndex++;
        this.injectedEventsCount++;
        this.scheduleNextStep();
      } catch (err) {
        logger.error({ err, stepIndex: this.currentStepIndex }, 'Error executing simulation step');
        this.stop();
      }
    }, delay);
  }

  private async executeStep(step: any) {
    try {
      let device = await prisma.device.findUnique({
        where: { deviceCode: step.deviceCode },
        include: { pole: true },
      });

      if (!device) {
        // Fallback to find any active device
        device = await prisma.device.findFirst({
          include: { pole: true },
        });
      }

      if (!device) {
        logger.warn({ deviceCode: step.deviceCode }, 'Simulation step skipped: no devices available');
        return;
      }

      const deviceId = device.deviceCode;
      const poleId = device.poleId;
      const transformerId = device.pole.transformerId;

      // 1. INGEST TELEMETRY via Production Telemetry Engine
      await this.telemetryService.ingestTelemetry({
        deviceId,
        poleId,
        eventType: step.eventType,
        sequenceNumber: step.sequenceNumber,
        eventTimestamp: new Date(),
        batteryLevel: step.batteryLevel || 90,
        signalStrength: -75,
        firmwareVersion: '1.4.2',
        rawPayload: step as Record<string, unknown>,
      });

      // 2. TRIGGER PRODUCTION LOCALIZATION ENGINE
      const candidates = await this.localizationEngine.localizeTransformer(transformerId);

      // 3. TRIGGER DECISION ENGINE & INCIDENT MANAGER
      const decisionCards = [];
      for (const candidate of candidates) {
        const card = this.decisionEngine.createDecisionCard(candidate);
        decisionCards.push(card);

        const incident = await this.incidentManager.processDecisionCard(card);
        await this.ticketManager.syncTicketForIncident(incident);
      }

      // 4. TRIGGER RESOLUTION CHECK FOR UNMATCHED OUTAGES
      await this.incidentManager.resolveUnmatchedIncidents(device.pole.transformerId, decisionCards);
    } catch (dbErr) {
      logger.warn({ dbErr, step }, 'Database unavailable during step execution');
    }
  }
}

export const simulatorRunner = new SimulationRunner();
