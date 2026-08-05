# SCENARIO RUNTIME ARCHITECTURE SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Scenario Runtime Core Responsibilities

The **Scenario Runtime Engine** coordinates step execution between the frontend controller and the backend services. It ensures:
1. **Zero Fake State:** Every scenario step executes real telemetry payloads through production backend APIs.
2. **Synchronous Step Execution:** Evaluators can trigger `POST /api/v1/simulator/step-run` to execute single steps synchronously.
3. **Pluggable Scenario Architecture:** Adding a new simulation scenario requires creating ONLY a new declarative script definition (`SimulationScript`). Zero code changes to renderer, layout engine, or Express controllers.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO RUNTIME ENGINE ARCHITECTURE                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Declarative Script Schema (scenarioScripts.ts)                              │
│   ├── Script ID, Title, Category, Description                               │
│   └── Array of Steps:                                                       │
│       ├── Ingested Telemetry (deviceCode, eventType, sequenceNumber)        │
│       ├── Mission Briefing Narration (title, detail, algorithmicReason)     │
│       └── Expected System Benchmarks                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Frontend Simulation Store (useSimulationStore.ts - Zustand)                │
│   ├── State: isGuidedMode, currentStepIndex, isExecutingStep                │
│   └── Actions: executeNextStep(), executePreviousStep(), resetGrid()        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Backend Synchronous API (/api/v1/simulator/step-run)                       │
│   └── SimulatorController -> TelemetryService -> Localization -> Decision   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Declarative Script Contract

```typescript
export interface ScenarioStepNarration {
  title: string;
  detail: string;
  algorithmicReason: string;
  focusAssetId?: string;
  isolatedSpan?: { parentCode: string; childCode: string };
  incidentCreated?: boolean;
  ticketCreated?: boolean;
}

export interface ScenarioStep {
  stepIndex: number;
  label: string;
  deviceCode: string;
  eventType: 'POWER_LOST' | 'POWER_RESTORED' | 'HEARTBEAT';
  sequenceNumber: number;
  narration: ScenarioStepNarration;
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
  steps: ScenarioStep[];
}
```

---

## 3. Pluggable Extension Model

To add a future scenario (e.g. `storm-cascade-scenario.ts`):
1. Create a script file in `frontend/src/simulator/scenarios/`.
2. Register the script object in `ALL_SCRIPTS` array.
3. The UI automatically populates the dropdown, generates timeline progress indicators, and binds step narration without requiring any modifications to `ElectricalTopologyCanvas.tsx` or Express controllers!
