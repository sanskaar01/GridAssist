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
  subtitle: 'Overhead Conductor Break on Span P-003 -> P-004',
  category: 'SPAN_FAULT',
  description: 'Demonstrates exact line span isolation on surveyed topology using the Fault Frontier principle.',
  targetTransformerCode: 'D-0101',
  steps: [
    {
      stepIndex: 0,
      label: 'Healthy Grid Baseline State',
      deviceCode: 'DEV-SUBSTATION-01',
      eventType: 'HEARTBEAT',
      sequenceNumber: 100,
      narration: {
        title: 'HEALTHY GRID BASELINE — ALL MONITORED FEEDERS OPERATING NORMALLY',
        detail: '33kV Substation SUB-01 and Distribution Transformer D-0101 energizing 47 poles. All current particles flowing.',
        algorithmicReason: 'Telemetry Engine confirms 100% energized status across all monitored distribution nodes.',
      },
      expectedState: {
        darkPoleCodes: [],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 1,
      label: 'Telemetry Received (P-004 POWER_LOST)',
      deviceCode: 'DEV-W084-D0101-P004',
      eventType: 'POWER_LOST',
      sequenceNumber: 101,
      narration: {
        title: 'TELEMETRY PACKET INGESTED — POLE P-004',
        detail: 'IoT Sensor DEV-W084-D0101-P004 emitted POWER_LOST (Seq #101). Parent Pole P-003 remains energized.',
        algorithmicReason: 'Telemetry Engine persists payload and updates Pole P-004 PoleState to DARK.',
        focusAssetId: 'P-004',
      },
      expectedState: {
        darkPoleCodes: ['P-004'],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 2,
      label: 'Subtree Outage Cascade (P-005 & P-006 DARK)',
      deviceCode: 'DEV-W084-D0101-P005',
      eventType: 'POWER_LOST',
      sequenceNumber: 102,
      narration: {
        title: 'DOWNSTREAM CASCADE CONFIRMED — POLES P-005 & P-006',
        detail: 'Child Poles P-005 and P-006 emitted POWER_LOST (Seq #102). Downstream subtree dark.',
        algorithmicReason: 'Grouping Engine aggregates 3 raw alerts into 1 single Located Fault candidate under P-003.',
        focusAssetId: 'P-004',
      },
      expectedState: {
        darkPoleCodes: ['P-004', 'P-005', 'P-006'],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 3,
      label: 'Fault Frontier Isolation & Decision Card',
      deviceCode: 'DEV-W084-D0101-P006',
      eventType: 'POWER_LOST',
      sequenceNumber: 103,
      narration: {
        title: 'FAULT FRONTIER ISOLATED — SPAN P-003 -> P-004',
        detail: 'Parent Pole P-003 is LIVE; Child Pole P-004 is DARK. Failed asset isolated as overhead span P-003 -> P-004.',
        algorithmicReason: 'Decision Engine evaluates evidence: Parent P-003 live, Child P-004 dark, parallel branches energized. Failed asset: Span P-003 -> P-004.',
        isolatedSpan: { parentCode: 'P-003', childCode: 'P-004' },
        incidentCreated: true,
        ticketCreated: true,
      },
      expectedState: {
        darkPoleCodes: ['P-004', 'P-005', 'P-006'],
        isolatedSpan: { parentCode: 'P-003', childCode: 'P-004' },
        incidentCreated: true,
        ticketCreated: true,
      },
    },
    {
      stepIndex: 4,
      label: 'Repair Ticket Generated & Crew Dispatched',
      deviceCode: 'DEV-W084-D0101-P004',
      eventType: 'POWER_LOST',
      sequenceNumber: 104,
      narration: {
        title: 'REPAIR TICKET GENERATED & CREW ASSIGNED',
        detail: 'Repair Ticket TCK-SPAN-D0101-P004 generated for Span P-003 -> P-004. Field unit CREW-BLR-01 assigned.',
        algorithmicReason: 'Ticket Manager synchronizes 1-to-1 ticket lifecycle with active operational incident.',
        isolatedSpan: { parentCode: 'P-003', childCode: 'P-004' },
        incidentCreated: true,
        ticketCreated: true,
      },
      expectedState: {
        darkPoleCodes: ['P-004', 'P-005', 'P-006'],
        isolatedSpan: { parentCode: 'P-003', childCode: 'P-004' },
        incidentCreated: true,
        ticketCreated: true,
      },
    },
    {
      stepIndex: 5,
      label: 'Lineman Repair Complete & Telemetry Restoration',
      deviceCode: 'DEV-W084-D0101-P004',
      eventType: 'POWER_RESTORED',
      sequenceNumber: 105,
      narration: {
        title: 'AUTOMATED TELEMETRY RESTORATION — TICKET VERIFIED & CLOSED',
        detail: 'Lineman CREW-BLR-01 completed conductor splice on Span P-003 -> P-004. IoT sensors emitted POWER_RESTORED.',
        algorithmicReason: 'Ticket Manager automatically verifies power telemetry restoration and closes ticket.',
      },
      expectedState: {
        darkPoleCodes: [],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
  ],
};

export const SCRIPT_TRANSFORMER_FAILURE: SimulationScript = {
  id: 'transformer-failure',
  title: '2. Distribution Transformer Blowout',
  subtitle: 'Distribution Transformer Output Failure on D-0102',
  category: 'DT_FAULT',
  description: 'Simulates transformer output failure resulting in a rapid cascading outage wave across all 20 downstream poles.',
  targetTransformerCode: 'D-0102',
  steps: [
    {
      stepIndex: 0,
      label: 'Healthy Grid Baseline State',
      deviceCode: 'DEV-SUBSTATION-01',
      eventType: 'HEARTBEAT',
      sequenceNumber: 300,
      narration: {
        title: 'HEALTHY GRID BASELINE — ALL MONITORED TRANSFORMERS OPERATING NORMALLY',
        detail: '33kV Substation SUB-01 (11.0 kV Feeder F-07) energizing Transformers D-0101 and D-0102. 47 poles active.',
        algorithmicReason: 'Telemetry Engine confirms 100% energized status across all monitored distribution nodes.',
      },
      expectedState: {
        darkPoleCodes: [],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 1,
      label: 'HT Fuse Fail on D-0102 (Root P-026 Voltage Loss)',
      deviceCode: 'DEV-W085-D0102-P026',
      eventType: 'POWER_LOST',
      sequenceNumber: 301,
      narration: {
        title: 'HT FUSE FAILURE ON D-0102 — ROOT POLE P-026 VOLTAGE LOSS',
        detail: 'HT fuse on Distribution Transformer D-0102 failed. Secondary output collapsed (230V -> 0V). Root Pole P-026 emitted POWER_LOST (Seq #301).',
        algorithmicReason: 'Telemetry Engine flags D-0102 secondary bus voltage drop (0 V). Upstream 11kV Feeder F-07 and Substation SUB-01 remain healthy (11.0 kV).',
        focusAssetId: 'D-0102',
      },
      expectedState: {
        darkPoleCodes: ['P-026'],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 2,
      label: 'Rapid Downstream Outage Cascade (20 Poles Dark)',
      deviceCode: 'DEV-W085-D0102-P027',
      eventType: 'POWER_LOST',
      sequenceNumber: 302,
      narration: {
        title: 'GLOBAL SUBTREE COLLAPSE — 20 POLES DARK UNDER D-0102',
        detail: 'Rapid sequential downstream telemetry wave propagates across P-026 -> P-027 -> ... -> P-045 over 400 ms. 20/20 poles dark. Parallel D-0101 normal.',
        algorithmicReason: 'Grouping Engine aggregates 20 raw alerts into 1 Located Fault card. Zero live poles exist downstream of D-0102.',
        focusAssetId: 'D-0102',
      },
      expectedState: {
        darkPoleCodes: ['P-026', 'P-027', 'P-028', 'P-029', 'P-030', 'P-031', 'P-032', 'P-033', 'P-034', 'P-035', 'P-036', 'P-037', 'P-038', 'P-039', 'P-040', 'P-041', 'P-042', 'P-043', 'P-044', 'P-045'],
        incidentCreated: true,
        ticketCreated: true,
      },
    },
    {
      stepIndex: 3,
      label: 'DT Output Failure Isolated & Reasoning Checklist',
      deviceCode: 'DEV-W085-D0102-P028',
      eventType: 'POWER_LOST',
      sequenceNumber: 303,
      narration: {
        title: 'FAULT ISOLATED — DISTRIBUTION TRANSFORMER OUTPUT FAILURE',
        detail: 'Decision Engine confirms Distribution Transformer Output Failure on D-0102 (Most Probable Cause: HT Fuse Blowout). Feeder F-07 and Parallel DT D-0101 live (11.0 kV / 230 V).',
        algorithmicReason: 'Reasoning Checklist: [✓] Feeder F-07 energized [✓] Parallel DT D-0101 energized [✓] Entire downstream network de-energized [✓] No internal Live -> Dark transition. Inference: Failure located at Distribution Transformer D-0102 (99.4% Confidence).',
        focusAssetId: 'D-0102',
      },
      expectedState: {
        darkPoleCodes: ['P-026', 'P-027', 'P-028', 'P-029', 'P-030', 'P-031', 'P-032', 'P-033', 'P-034', 'P-035', 'P-036', 'P-037', 'P-038', 'P-039', 'P-040', 'P-041', 'P-042', 'P-043', 'P-044', 'P-045'],
        incidentCreated: true,
        ticketCreated: true,
      },
    },
    {
      stepIndex: 4,
      label: 'Specialized HT Crew Dispatched (CREW-BLR-02)',
      deviceCode: 'DEV-W085-D0102-P026',
      eventType: 'POWER_LOST',
      sequenceNumber: 304,
      narration: {
        title: 'REPAIR TICKET GENERATED — CREW-BLR-02 DISPATCHED',
        detail: 'Repair Ticket TCK-DT-D0102 generated for Distribution Transformer D-0102. Specialized HT Crew CREW-BLR-02 assigned to Ward W-085 (PIN 560078).',
        algorithmicReason: 'Ticket Manager synchronizes 1-to-1 lifecycle with active incident. Specialized HT crew assigned for transformer output restoration.',
        focusAssetId: 'D-0102',
      },
      expectedState: {
        darkPoleCodes: ['P-026', 'P-027', 'P-028', 'P-029', 'P-030', 'P-031', 'P-032', 'P-033', 'P-034', 'P-035', 'P-036', 'P-037', 'P-038', 'P-039', 'P-040', 'P-041', 'P-042', 'P-043', 'P-044', 'P-045'],
        incidentCreated: true,
        ticketCreated: true,
      },
    },
    {
      stepIndex: 5,
      label: 'Sequential Wave Restoration & Automated Closure',
      deviceCode: 'DEV-W085-D0102-P026',
      eventType: 'POWER_RESTORED',
      sequenceNumber: 305,
      narration: {
        title: 'HT FUSE REPLACED — SEQUENTIAL TELEMETRY VERIFICATION & CLOSURE',
        detail: 'CREW-BLR-02 replaced HT fuse on D-0102. D-0102 energized -> Particles resume -> P-026 to P-045 restored green. Telemetry verified (0 de-energized telemetry remaining); Ticket CLOSED.',
        algorithmicReason: 'Telemetry Engine verifies all 20 poles report LIVE with 0 de-energized telemetry remaining. Ticket Manager converts status VERIFYING -> VERIFIED -> CLOSED.',
      },
      expectedState: {
        darkPoleCodes: [],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
  ],
};

export const SCRIPT_SENSOR_ANOMALY: SimulationScript = {
  id: 'sensor-failure',
  title: '3. Sensor Anomaly (False Alarm Blocked)',
  subtitle: 'Anomalous Telemetry Dropout on Sensor DEV-W084-D0101-P003',
  category: 'SENSOR_ANOMALY',
  description: 'Demonstrates GridAssist suppressing false alarms when downstream child poles remain energized.',
  targetTransformerCode: 'D-0101',
  steps: [
    {
      stepIndex: 0,
      label: 'Healthy Grid Baseline State',
      deviceCode: 'DEV-SUBSTATION-01',
      eventType: 'HEARTBEAT',
      sequenceNumber: 400,
      narration: {
        title: 'HEALTHY GRID BASELINE — ALL MONITORED POLES OPERATING NORMALLY',
        detail: '33kV Substation SUB-01 energizing 47 poles. All current particles flowing.',
        algorithmicReason: 'Telemetry Engine confirms 100% energized status across all monitored distribution nodes.',
      },
      expectedState: {
        darkPoleCodes: [],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 1,
      label: 'Telemetry Received (P-003 POWER_LOST, Children LIVE)',
      deviceCode: 'DEV-W084-D0101-P003',
      eventType: 'POWER_LOST',
      sequenceNumber: 401,
      narration: {
        title: 'TELEMETRY PACKET INGESTED — POLE P-003 POWER_LOST',
        detail: 'IoT Sensor DEV-W084-D0101-P003 emitted POWER_LOST (Seq #401). Downstream poles P-004 & P-005 report LIVE state (230 V). Device Health: Battery 14% (LOW).',
        algorithmicReason: 'Telemetry Engine receives telemetry. Conductor line remains energized (green) while sensor reports anomalous power loss.',
        focusAssetId: 'P-003',
      },
      expectedState: {
        darkPoleCodes: [],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 2,
      label: 'Topology Evaluation & Emergency Dispatch CANCELLED',
      deviceCode: 'DEV-W084-D0101-P003',
      eventType: 'POWER_LOST',
      sequenceNumber: 402,
      narration: {
        title: 'EMERGENCY DISPATCH CANCELLED — FALSE ALARM BLOCKED',
        detail: 'Telemetry reports power loss at P-003, but downstream energized poles (P-004, P-005) prove the conductor remains energized. EMERGENCY DISPATCH: ❌ CANCELLED.',
        algorithmicReason: 'Reasoning Checklist: [✓] Telemetry reports power loss at P-003 [✓] Downstream poles P-004 & P-005 report LIVE (230 V) [✓] Physical conductor current flow ACTIVE. Inference: Electrical topology contradicts telemetry; zero outage ticket generated.',
        focusAssetId: 'P-003',
      },
      expectedState: {
        darkPoleCodes: [],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 3,
      label: 'Sensor Resumes Normal Heartbeat Reporting',
      deviceCode: 'DEV-W084-D0101-P003',
      eventType: 'HEARTBEAT',
      sequenceNumber: 403,
      narration: {
        title: 'SENSOR RESUMES NORMAL HEARTBEAT REPORTING — SYSTEM NORMALIZED',
        detail: 'IoT Sensor DEV-W084-D0101-P003 resumes normal heartbeat reporting (Seq #403, 230 V). Amber warning ring cleared.',
        algorithmicReason: 'Telemetry Engine receives valid heartbeat packet. System normalized with zero false alarm ticket history.',
      },
      expectedState: {
        darkPoleCodes: [],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
  ],
};

export const SCRIPT_POWER_RESTORATION: SimulationScript = {
  id: 'power-restoration',
  title: '4. Field Power Restoration',
  subtitle: 'Automated Telemetry Verification & Ticket Closure',
  category: 'RESTORATION',
  description: 'Simulates premature lineman claim rejection followed by automated ticket verification upon push telemetry restoration.',
  targetTransformerCode: 'D-0101',
  steps: [
    {
      stepIndex: 0,
      label: 'Active Operational Outage (Span P-003 -> P-004)',
      deviceCode: 'DEV-W084-D0101-P004',
      eventType: 'POWER_LOST',
      sequenceNumber: 500,
      narration: {
        title: 'ACTIVE OUTAGE ON SPAN P-003 -> P-004 — CREW-BLR-01 DISPATCHED',
        detail: 'Overhead Conductor Break on Span P-003 -> P-004. Poles P-004, P-005, P-006 DARK (0 V). Ticket TCK-SPAN-D0101-P004 ASSIGNED to CREW-BLR-01.',
        algorithmicReason: 'Ticket Manager holds ticket in ASSIGNED state awaiting field repair and push telemetry restoration.',
        isolatedSpan: { parentCode: 'P-003', childCode: 'P-004' },
        focusAssetId: 'P-004',
      },
      expectedState: {
        darkPoleCodes: ['P-004', 'P-005', 'P-006'],
        isolatedSpan: { parentCode: 'P-003', childCode: 'P-004' },
        incidentCreated: true,
        ticketCreated: true,
      },
    },
    {
      stepIndex: 1,
      label: 'Lineman Claimed Complete — System Verification REJECTED',
      deviceCode: 'DEV-W084-D0101-P004',
      eventType: 'POWER_LOST',
      sequenceNumber: 501,
      narration: {
        title: 'LINEMAN CLAIMED REPAIR COMPLETE — VERIFICATION REJECTED',
        detail: 'CREW-BLR-01 pressed "Repair Complete". System enters VERIFYING state and waits for push telemetry restoration. Sensors still report 0 V; ticket closure REJECTED.',
        algorithmicReason: 'Requirement #4 Enforcement: Ticket Manager refuses to trust manual button clicks while network remains broken (0 V telemetry). Fault frontier glow remains active.',
        isolatedSpan: { parentCode: 'P-003', childCode: 'P-004' },
        focusAssetId: 'P-004',
      },
      expectedState: {
        darkPoleCodes: ['P-004', 'P-005', 'P-006'],
        isolatedSpan: { parentCode: 'P-003', childCode: 'P-004' },
        incidentCreated: true,
        ticketCreated: true,
      },
    },
    {
      stepIndex: 2,
      label: 'Repair Completed & Supply Restored (POWER_RESTORED)',
      deviceCode: 'DEV-W084-D0101-P004',
      eventType: 'POWER_RESTORED',
      sequenceNumber: 502,
      narration: {
        title: 'REPAIR COMPLETED & SUPPLY RESTORED — PUSH TELEMETRY INGESTED',
        detail: 'Repair completed and supply restored to span P-003 -> P-004. IoT sensors on poles P-004, P-005, P-006 emitted push POWER_RESTORED telemetry (230 V).',
        algorithmicReason: 'Telemetry Engine receives push POWER_RESTORED packets. Conductor line re-energized; particles resume.',
        focusAssetId: 'P-004',
      },
      expectedState: {
        darkPoleCodes: [],
        incidentCreated: false,
        ticketCreated: false,
      },
    },
    {
      stepIndex: 3,
      label: 'Automated Verification Checklist & Ticket CLOSED',
      deviceCode: 'DEV-W084-D0101-P004',
      eventType: 'POWER_RESTORED',
      sequenceNumber: 503,
      narration: {
        title: 'AUTOMATED TELEMETRY VERIFICATION COMPLETE — TICKET CLOSED',
        detail: 'Verification Checklist: [✓] POWER_RESTORED telemetry ingested [✓] 3/3 poles energized (230 V) [✓] Fault frontier removed [✓] Incident RESOLVED [✓] Ticket automatically CLOSED.',
        algorithmicReason: 'Localization Engine confirms Fault Frontier no longer exists. Ticket Manager converts status VERIFYING -> VERIFIED -> CLOSED.',
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
