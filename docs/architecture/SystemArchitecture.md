# SYSTEM ARCHITECTURE SPECIFICATION

## System Topology & Event Flow

```mermaid
sequenceDiagram
    autonumber
    actor Field as IoT Sensor / Pole
    participant API as Telemetry API
    participant TE as Telemetry Engine
    participant DB as PostgreSQL DB
    participant LE as Localization Engine
    participant DE as Decision Engine
    participant IM as Incident Manager
    participant TM as Ticket Manager
    actor Operator as Control Room UI

    Field->>API: POST /api/v1/telemetry (POWER_LOST)
    API->>TE: Validate Zod Schema Payload
    TE->>DB: Update PoleState -> DARK
    TE->>LE: Trigger Radial Tree Traversal
    LE->>DE: Isolated Candidate Fault Frontier
    DE->>DE: Generate Decision Card (Evidence & Rejected Hypotheses)
    DE->>IM: Process Decision Card
    IM->>DB: Create Operational Incident (Status: ACTIVE)
    IM->>TM: Sync Repair Ticket
    TM->>DB: Create Repair Ticket (Status: DETECTED)
    Operator->>DB: Poll GET /api/v1/dashboard (1.5s interval)
    DB-->>Operator: Return Grid Topology, Active Incidents & Tickets
```

## System Constraints & Guarantees
- **Pure Deterministic Reasoning:** Fault localization relies 100% on graph traversal of physical parent-child pole hierarchy. No random heuristics or probability guessing.
- **Architectural Honesty:** No UI state shortcuts. The frontend Operations Theater visualizes live database states exclusively.
- **Deduplication & Timeline Audit:** Repeated telemetry packets update evidence timelines without creating duplicate incident rows.
