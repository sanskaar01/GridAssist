# ENGINEERING_DECISIONS.md

# Engineering Decisions

This document records the major architectural and product decisions made during the design of GridAssist.

The assignment intentionally leaves several areas open to interpretation. Rather than attempting to implement 
every possible feature, GridAssist focuses on solving the operational problem described in the brief while remaining
understandable, explainable and achievable within the available development time.

---

# Guiding Principle

Every design decision was evaluated using one question:

> **Does this help an operator detect, understand or resolve a power fault faster?**

If the answer was **yes**, the feature was implemented.

If the answer was **no**, it was intentionally excluded.

The objective is not to build the largest system.

The objective is to build the most useful system.

---

# Decision 1 — No Authentication

## Decision

The operator console does not require user authentication.

## Reasoning

The assignment evaluates fault localization, telemetry processing, operator workflow and system reasoning.

Authentication is not mentioned as a requirement.

Implementing user accounts, JWT authentication and role management would significantly increase development complexity 
while providing little value during evaluation.

Control room software is commonly deployed inside secured organizational networks where authentication is handled externally.

For this prototype, immediate access to the dashboard better supports demonstration and evaluation.

---

# Decision 2 — Rolling Telemetry Storage

## Decision

Telemetry is stored only for a rolling operational window rather than permanently.

## Reasoning

The system only requires recent telemetry to determine current network state and verify restoration.

The assignment does not require historical analytics or long-term reporting.

A rolling telemetry window keeps the system lightweight while fully supporting localization, verification and simulation.

Historical telemetry beyond the operational window provides no additional value for the assessment.

---

# Decision 3 — No Historical Incident Archive

## Decision

The operator dashboard focuses exclusively on current operational incidents.

Historical archive views are intentionally omitted.

## Reasoning

Operators managing live outages require immediate situational awareness rather than historical browsing.

The assessment evaluates fault detection and response rather than historical reporting.

Removing archive functionality simplifies the interface and keeps operator attention focused on active work.

---

# Decision 4 — Interactive Fault Simulator

## Decision

The simulator allows reviewers to inject faults directly through the dashboard.

Replay functionality is intentionally omitted.

## Reasoning

The assignment specifies that reviewers will evaluate the system by injecting faults.

Allowing reviewers to create fresh scenarios directly provides a more realistic evaluation experience than 
replaying previously recorded simulations.

The simulator therefore generates live telemetry that passes through the complete production pipeline.

No simulator shortcuts bypass localization or ticket generation.

---

# Decision 5 — Simulator Controls

The simulator supports configurable operational scenarios rather than a single "Inject Fault" action.

Supported scenarios include:

- Span Fault
- Distribution Transformer Fault
- Feeder Fault
- Device Failure
- Scheduled Outage
- Duplicate Messages
- Delayed Telemetry
- Missing "Power Lost" Packet
- Silent Firmware Device

Each scenario produces telemetry that exercises a specific aspect of the localization engine.

This enables reviewers to validate deterministic behaviour under realistic operating conditions.

---

# Decision 6 — Decision Cards Are Not Database Entities

## Decision

Decision Cards are generated dynamically by the application and are not stored as a separate database table.

## Reasoning

A Decision Card represents the presentation of an Incident rather than an independent business object.

The underlying reasoning, confidence, assumptions and recommendations are stored as attributes of the Incident.

The user interface assembles these attributes into an explainable Decision Card.

This approach reduces unnecessary database complexity while preserving complete explainability.

---

# Decision 7 — Simplified Topology Inference

## Decision

GridAssist stores inferred electrical relationships using a single InferredEdge table.

Topology versioning and inference history are intentionally omitted.

## Reasoning

The objective of topology inference is to support localization when surveyed topology is unavailable.

Historical inference versions provide little operational value during the assessment while significantly
increasing implementation complexity.

A single inferred topology is sufficient for deterministic localization and confidence estimation.

---

# Decision 8 — Minimal, Purpose-Driven Database

The database contains only entities required to solve the operational problem.

Core entities include:

- Feeder
- Distribution Transformer
- Pole
- Device
- Telemetry
- Inferred Edge
- Incident
- Ticket
- Scheduled Outage
- Simulation Configuration

Each table represents a real operational object within the electricity distribution network.

No entity exists solely for convenience or presentation.

---

# Decision 9 — Operator-Centric Interface

The dashboard is designed for control room operators rather than software engineers.

Every screen answers the following questions:

- What happened?
- Where did it happen?
- How severe is it?
- Why does the system believe this?
- What should I do next?

Technical implementation details remain hidden unless they directly improve operational decision-making.

---

# Decision 10 — Trust Through Explainability

GridAssist does not ask operators to trust a black-box algorithm.

Instead, every recommendation includes:

- Supporting evidence
- Confidence level
- Assumptions
- Rejected alternatives
- Recommended action

The system explains not only what it believes, but also why alternative explanations were rejected.

This design philosophy improves transparency, operator confidence and accountability.

---

# Final Design Philosophy

GridAssist is intentionally focused.

Features that do not improve localization accuracy, operator understanding or repair workflow have been excluded.

Rather than maximizing feature count, the project maximizes operational usefulness, explainability and engineering clarity.

Every implemented component exists because it directly contributes to solving the problem described in the assignment.
