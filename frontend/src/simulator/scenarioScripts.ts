export interface StepNarration {
  title: string;
  detail: string;
  algorithmicReason: string;
  focusAssetId?: string;
  isolatedSpan?: { parentCode: string; childCode: string };
  incidentCreated?: boolean;
  ticketCreated?: boolean;
}

export interface ScriptStep {
  stepIndex: number;
  label: string;
  deviceCode: string;
  eventType: 'POWER_LOST' | 'POWER_RESTORED' | 'HEARTBEAT';
  sequenceNumber: number;
  narration: StepNarration;
  expectedState: {
    darkPoleCodes: string[];
    isolatedSpan?: { parentCode: string; childCode: string };
    incidentCreated: boolean;
    ticketCreated: boolean;
  };
}

export interface SimulationScript {
  id: string;
  title: string;
  subtitle: string;
  category: 'SPAN_FAULT' | 'DT_FAULT' | 'SENSOR_ANOMALY' | 'MULTI_FAULT' | 'RESTORATION';
  description: string;
  targetTransformerCode: string;
  steps: ScriptStep[];
}

export const SCRIPT_SINGLE_SPAN_FAULT: SimulationScript = {
  id: 'single-span-fault',
  title: '1. Single Span Line Break',
  subtitle: 'Conductor Break on Branch P-002 -> P-003',
  category: 'SPAN_FAULT',
  description: 'Demonstrates exact line span isolation on surveyed topology using the Fault Frontier principle.',
  targetTransformerCode: 'D-0101',
  steps: [
    {
      stepIndex: 0,
      label: 'Telemetry Received (P-003 POWER_LOST)',
      deviceCode: 'DEV-W084-D0101-P003',
      eventType: 'POWER_LOST',
      sequenceNumber: 101,
      narration: {
        title: 'TELEMETRY PACKET INGESTED — POLE P-003',
        detail: 'IoT Sensor DEV-W084-D0101-P003 emitted POWER_LOST (Seq #101). Sensor battery: 88%.',
        algorithmicReason: 'Telemetry Engine persists payload and updates Pole P-003 PoleState to DARK.',
        focusAssetId: 'P-003',
      },
      expectedState: {
        darkPoleCodes: ['P-003'],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 1,
      label: 'Subtree Outage Propagation (P-004 DARK)',
      deviceCode: 'DEV-W084-D0101-P004',
      eventType: 'POWER_LOST',
      sequenceNumber: 102,
      narration: {
        title: 'DOWNSTREAM CASCADE CONFIRMED — POLE P-004',
        detail: 'Child Pole P-004 emitted POWER_LOST (Seq #102), matching upstream outage timeline.',
        algorithmicReason: 'Localization Engine traverses radial tree graph outward from Transformer D-0101.',
        focusAssetId: 'P-004',
      },
      expectedState: {
        darkPoleCodes: ['P-003', 'P-004'],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 2,
      label: 'Fault Frontier Isolation & Decision Card',
      deviceCode: 'DEV-W084-D0101-P005',
      eventType: 'POWER_LOST',
      sequenceNumber: 103,
      narration: {
        title: 'FAULT FRONTIER ISOLATED — SPAN P-002 -> P-003',
        detail: 'Parent Pole P-002 is LIVE; Child Pole P-003 is DARK. Failed asset isolated as overhead span P-002 -> P-003.',
        algorithmicReason: 'Decision Engine evaluates evidence, rejecting DT failure because parallel branches remain energized.',
        isolatedSpan: { parentCode: 'P-002', childCode: 'P-003' },
        incidentCreated: true,
        ticketCreated: true,
      },
      expectedState: {
        darkPoleCodes: ['P-003', 'P-004', 'P-005'],
        isolatedSpan: { parentCode: 'P-002', childCode: 'P-003' },
        incidentCreated: true,
        ticketCreated: true,
      },
    },
    {
      stepIndex: 3,
      label: 'Repair Ticket & Crew Dispatch',
      deviceCode: 'DEV-W084-D0101-P006',
      eventType: 'POWER_LOST',
      sequenceNumber: 104,
      narration: {
        title: 'REPAIR TICKET GENERATED & CREW ASSIGNED',
        detail: 'Repair Ticket generated for Span P-002 -> P-003. Field unit CREW-BLR-01 assigned.',
        algorithmicReason: 'Ticket Manager synchronizes 1-to-1 ticket lifecycle with active operational incident.',
        isolatedSpan: { parentCode: 'P-002', childCode: 'P-003' },
        incidentCreated: true,
        ticketCreated: true,
      },
      expectedState: {
        darkPoleCodes: ['P-003', 'P-004', 'P-005', 'P-006'],
        isolatedSpan: { parentCode: 'P-002', childCode: 'P-003' },
        incidentCreated: true,
        ticketCreated: true,
      },
    },
  ],
};

export const SCRIPT_TRANSFORMER_FAILURE: SimulationScript = {
  id: 'transformer-failure',
  title: '2. Distribution Transformer Blowout',
  subtitle: 'Total Power Loss on Transformer D-0102',
  category: 'DT_FAULT',
  description: 'Simulates total HT fuse blowout resulting in simultaneous dark telemetry across all downstream poles.',
  targetTransformerCode: 'D-0102',
  steps: [
    {
      stepIndex: 0,
      label: 'Root Telemetry Received (P-010 POWER_LOST)',
      deviceCode: 'DEV-W084-D0102-P001',
      eventType: 'POWER_LOST',
      sequenceNumber: 301,
      narration: {
        title: 'TRANSFORMER D-0102 OUTPUT LOST',
        detail: 'Root Pole P-010 beneath Transformer D-0102 emitted POWER_LOST (Seq #301).',
        algorithmicReason: 'Localization Engine detects total collapse of root electrical output.',
        focusAssetId: 'D-0102',
      },
      expectedState: {
        darkPoleCodes: ['P-010'],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 1,
      label: 'Global Subtree Loss (35 Poles Dark)',
      deviceCode: 'DEV-W084-D0102-P002',
      eventType: 'POWER_LOST',
      sequenceNumber: 302,
      narration: {
        title: 'GLOBAL TRANSFORMER FAULT CONFIRMED',
        detail: 'All monitored poles under Transformer D-0102 report dark with zero live poles remaining.',
        algorithmicReason: 'FaultClassifier identifies 100% outage signature, rejecting single span hypotheses.',
        incidentCreated: true,
        ticketCreated: true,
      },
      expectedState: {
        darkPoleCodes: ['P-010', 'P-011', 'P-012', 'P-013'],
        incidentCreated: true,
        ticketCreated: true,
      },
    },
  ],
};

export const SCRIPT_SENSOR_ANOMALY: SimulationScript = {
  id: 'sensor-failure',
  title: '3. Sensor Anomaly (False Alarm Blocked)',
  subtitle: 'Isolated Telemetry Dropout on Pole P-003',
  category: 'SENSOR_ANOMALY',
  description: 'Demonstrates GridAssist ignoring false alarms when downstream child poles remain energized.',
  targetTransformerCode: 'D-0101',
  steps: [
    {
      stepIndex: 0,
      label: 'Isolated Telemetry (P-003 DARK, Children LIVE)',
      deviceCode: 'DEV-W084-D0101-P003',
      eventType: 'POWER_LOST',
      sequenceNumber: 401,
      narration: {
        title: 'SENSOR ANOMALY DETECTED — FALSE ALARM BLOCKED',
        detail: 'Pole P-003 emitted POWER_LOST, but all downstream child poles (P-004, P-005) remain LIVE.',
        algorithmicReason: 'FaultClassifier rejects line fault as physically impossible. Sensor hardware error flagged; zero incident created.',
        focusAssetId: 'P-003',
      },
      expectedState: {
        darkPoleCodes: ['P-003'],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
  ],
};

export const SCRIPT_POWER_RESTORATION: SimulationScript = {
  id: 'power-restoration',
  title: '4. Field Power Restoration',
  subtitle: 'Telemetry Restoration & Automatic Verification',
  category: 'RESTORATION',
  description: 'Simulates lineman repair completion and automatic ticket verification via power telemetry.',
  targetTransformerCode: 'D-0101',
  steps: [
    {
      stepIndex: 0,
      label: 'Telemetry Restoration Ingested',
      deviceCode: 'DEV-W084-D0101-P003',
      eventType: 'POWER_RESTORED',
      sequenceNumber: 501,
      narration: {
        title: 'POWER RESTORATION TELEMETRY RECEIVED',
        detail: 'IoT sensor on Pole P-003 emitted POWER_RESTORED (Seq #501). Line energized.',
        algorithmicReason: 'Telemetry Engine updates PoleState to LIVE.',
        focusAssetId: 'P-003',
      },
      expectedState: {
        darkPoleCodes: [],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 1,
      label: 'Automatic Ticket Verification & Closure',
      deviceCode: 'DEV-W084-D0101-P004',
      eventType: 'POWER_RESTORED',
      sequenceNumber: 502,
      narration: {
        title: 'AUTOMATIC TELEMETRY VERIFICATION & TICKET CLOSURE',
        detail: 'Fault frontier no longer observed. Incident RESOLVED; Ticket automatically verified and CLOSED.',
        algorithmicReason: 'TicketManager converts status VERIFYING -> VERIFIED -> CLOSED based strictly on telemetry restoration.',
        incidentCreated: false,
        ticketCreated: false,
      },
      expectedState: {
        darkPoleCodes: [],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
  ],
};

export const ALL_SCRIPTS: SimulationScript[] = [
  SCRIPT_SINGLE_SPAN_FAULT,
  SCRIPT_TRANSFORMER_FAILURE,
  SCRIPT_SENSOR_ANOMALY,
  SCRIPT_POWER_RESTORATION,
];

export function getScriptById(id: string): SimulationScript {
  return ALL_SCRIPTS.find((s) => s.id === id) || SCRIPT_SINGLE_SPAN_FAULT;
}
