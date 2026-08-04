import { TelemetryEventType } from '@prisma/client';

export interface TelemetryStep {
  deviceCode: string;
  eventType: TelemetryEventType;
  sequenceNumber: number;
  batteryLevel?: number;
  signalStrength?: number;
  delayMs?: number;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  targetTransformerCode: string;
  expectedFaultType: 'SPAN' | 'DT' | 'SENSOR';
  steps: TelemetryStep[];
}

export const SCENARIO_SINGLE_SPAN_FAULT: SimulationScenario = {
  id: 'single-span-fault',
  name: '1. Single Span Fault (P-002 -> P-003)',
  description: 'Simulates physical line conductor break on span between Pole P-002 and P-003 beneath Transformer D-0101.',
  targetTransformerCode: 'D-0101',
  expectedFaultType: 'SPAN',
  steps: [
    { deviceCode: 'DEV-W084-D0101-P003', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 101, batteryLevel: 88, delayMs: 400 },
    { deviceCode: 'DEV-W084-D0101-P004', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 102, batteryLevel: 87, delayMs: 400 },
    { deviceCode: 'DEV-W084-D0101-P005', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 103, batteryLevel: 86, delayMs: 400 },
    { deviceCode: 'DEV-W084-D0101-P006', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 104, batteryLevel: 85, delayMs: 400 },
  ],
};

export const SCENARIO_MULTIPLE_SPAN_FAULTS: SimulationScenario = {
  id: 'multiple-span-faults',
  name: '2. Multiple Simultaneous Span Faults',
  description: 'Simulates independent line breaks on two separate feeder branches beneath Transformer D-0101.',
  targetTransformerCode: 'D-0101',
  expectedFaultType: 'SPAN',
  steps: [
    // Branch A outage
    { deviceCode: 'DEV-W084-D0101-P003', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 201, delayMs: 300 },
    { deviceCode: 'DEV-W084-D0101-P004', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 202, delayMs: 300 },
    // Branch B outage
    { deviceCode: 'DEV-W084-D0101-P015', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 203, delayMs: 400 },
    { deviceCode: 'DEV-W084-D0101-P016', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 204, delayMs: 400 },
  ],
};

export const SCENARIO_TRANSFORMER_FAILURE: SimulationScenario = {
  id: 'transformer-failure',
  name: '3. Distribution Transformer Failure (D-0102)',
  description: 'Simulates total transformer HT fuse blowout resulting in simultaneous dark telemetry across all 35 downstream poles.',
  targetTransformerCode: 'D-0102',
  expectedFaultType: 'DT',
  steps: [
    { deviceCode: 'DEV-W084-D0102-P001', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 301, delayMs: 200 },
    { deviceCode: 'DEV-W084-D0102-P002', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 302, delayMs: 200 },
    { deviceCode: 'DEV-W084-D0102-P003', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 303, delayMs: 200 },
    { deviceCode: 'DEV-W084-D0102-P004', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 304, delayMs: 200 },
    { deviceCode: 'DEV-W084-D0102-P005', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 305, delayMs: 200 },
  ],
};

export const SCENARIO_SENSOR_FAILURE: SimulationScenario = {
  id: 'sensor-failure',
  name: '4. Sensor Anomaly (Isolated Dark Pole)',
  description: 'Simulates single dark telemetry packet on pole while all downstream children remain live (sensor hardware failure).',
  targetTransformerCode: 'D-0101',
  expectedFaultType: 'SENSOR',
  steps: [
    { deviceCode: 'DEV-W084-D0101-P003', eventType: TelemetryEventType.POWER_LOST, sequenceNumber: 401, delayMs: 500 },
  ],
};

export const SCENARIO_POWER_RESTORATION: SimulationScenario = {
  id: 'power-restoration',
  name: '5. Field Power Restoration',
  description: 'Simulates line repair completion by dispatching POWER_RESTORED telemetry to trigger automatic ticket verification & closure.',
  targetTransformerCode: 'D-0101',
  expectedFaultType: 'SPAN',
  steps: [
    { deviceCode: 'DEV-W084-D0101-P003', eventType: TelemetryEventType.POWER_RESTORED, sequenceNumber: 501, delayMs: 300 },
    { deviceCode: 'DEV-W084-D0101-P004', eventType: TelemetryEventType.POWER_RESTORED, sequenceNumber: 502, delayMs: 300 },
    { deviceCode: 'DEV-W084-D0101-P005', eventType: TelemetryEventType.POWER_RESTORED, sequenceNumber: 503, delayMs: 300 },
    { deviceCode: 'DEV-W084-D0101-P006', eventType: TelemetryEventType.POWER_RESTORED, sequenceNumber: 504, delayMs: 300 },
  ],
};

export const ALL_SCENARIOS: SimulationScenario[] = [
  SCENARIO_SINGLE_SPAN_FAULT,
  SCENARIO_MULTIPLE_SPAN_FAULTS,
  SCENARIO_TRANSFORMER_FAILURE,
  SCENARIO_SENSOR_FAILURE,
  SCENARIO_POWER_RESTORATION,
];

export function getScenarioById(id: string): SimulationScenario | null {
  return ALL_SCENARIOS.find((s) => s.id === id) || null;
}
