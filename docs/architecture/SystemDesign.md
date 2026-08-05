# SYSTEM_DESIGN.md

# GridAssist System Design

## Overview

GridAssist is an event-driven decision support platform designed to assist electricity distribution control rooms in detecting, localizing, managing and verifying power distribution faults.

Unlike traditional monitoring systems that expose raw telemetry directly to operators, GridAssist transforms thousands of low-level device events into a small number of explainable operational decisions.

The system continuously observes the electrical network, updates its understanding of network state, localizes probable failures, recommends operator actions and automatically verifies successful restoration.

Every component of the system exists to answer one question:

> **What should the operator do next, and why?**

---

# End-to-End Information Flow

Every event follows the same lifecycle inside GridAssist.

```
Pole Device
        │
        ▼
Telemetry API
        │
        ▼
Validation Layer
        │
        ▼
Pole State Engine
        │
        ▼
Topology Engine
        │
        ▼
Fault Classification
        │
        ▼
Fault Localization
        │
        ▼
Decision Engine
        │
        ▼
Incident Manager
        │
        ▼
Ticket Manager
        │
        ▼
Operator Dashboard
        │
        ▼
Repair Completed
        │
        ▼
Restoration Telemetry
        │
        ▼
Automatic Verification
        │
        ▼
Ticket Closed
```

The same pipeline is used for both simulated telemetry and real telemetry.

No special logic exists for the simulator.

This ensures that the simulator exercises the complete production system rather than bypassing internal processing.

---

# Stage 1 — Observation

The system begins by observing the electrical network.

Incoming observations may originate from multiple sources.

Supported observation sources include:

- Pole telemetry
- Heartbeat messages
- Power loss events
- Power restoration events
- Scheduled outage feed
- Fault simulator
- Historical pole registry

At this stage, GridAssist performs no reasoning.

Its responsibility is limited to collecting observations.

---

# Stage 2 — Validation

Incoming observations are validated before entering the processing pipeline.

Validation performs:

- schema validation
- duplicate detection
- sequence validation
- stale event rejection
- malformed payload rejection
- timestamp normalization

Invalid events never influence network state.

---

# Stage 3 — Network State Update

Validated telemetry updates the current state of every monitored pole.

Each pole exists in one of four possible operational states.

```
Energized

De-energized

Unknown

Offline
```

The Pole State Engine represents the current understanding of the electrical network.

Downstream modules never read telemetry directly.

Instead, they operate on this continuously updated network state.

---

# Stage 4 — Network Topology

The updated pole states are projected onto the electrical topology.

GridAssist supports two topology modes.

## Surveyed Topology

Uses recorded parent-child relationships provided by the electricity department.

This produces high-confidence localization.

---

## Inferred Topology

Where parent relationships are unavailable, GridAssist constructs an inferred radial tree using surveyed GPS coordinates and transformer location.

Because inferred topology represents an engineering assumption rather than surveyed infrastructure, localization confidence is reduced accordingly.

---

# Stage 5 — Fault Classification

Before attempting localization, the system determines the most probable category of failure.

Supported categories include:

- Span Fault
- Distribution Transformer Fault
- Feeder Fault
- Scheduled Outage
- Sensor Failure
- Unknown

Classification prevents unnecessary localization and simplifies downstream reasoning.

---

# Stage 6 — Fault Localization

If the event represents a physical network fault, GridAssist searches for the transition between energized and de-energized regions.

Rather than identifying failed poles, the localization engine identifies the most probable failed electrical span separating these regions.

The localization result includes:

- failed span
- GPS coordinates
- PIN code
- downstream poles affected
- confidence level
- supporting evidence

---

# Stage 7 — Decision Generation

The localization result is transformed into an explainable operational recommendation.

This recommendation is represented internally as a Decision Card.

Every Decision Card answers five operational questions.

```
What happened?

Where?

Why?

How certain are we?

What should the operator do?
```

The Decision Card becomes the primary object presented to the operator.

---

# Stage 8 — Incident Management

Multiple telemetry observations caused by the same physical failure are grouped into a single operational incident.

Example:

```
P23

Power Lost

↓

P24

Power Lost

↓

P25

Power Lost
```

These observations generate one incident rather than three independent alerts.

Incident grouping significantly reduces alarm fatigue and reflects the physical reality that multiple downstream outages often originate from a single upstream failure.

---

# Stage 9 — Ticket Lifecycle

Every incident automatically creates a repair ticket.

The ticket progresses through the following lifecycle.

```
Detected

↓

Acknowledged

↓

Crew Assigned

↓

Resolved (Claimed)

↓

Verifying

↓

Verified

↓

Closed
```

GridAssist intentionally separates **Resolved** from **Verified**.

A repair is considered complete only after restoration telemetry confirms that power has returned to the affected network.

---

# Stage 10 — Automatic Verification

Restoration is verified using telemetry rather than manual confirmation.

Once all affected poles report successful restoration within the verification window, the ticket transitions automatically to Verified and subsequently Closed.

If restoration telemetry is incomplete or contradictory, the ticket remains in Verifying until sufficient evidence is available.

This behaviour prevents premature closure of unresolved incidents.

---

# System State Model

Throughout operation, GridAssist maintains several independent representations of the electrical network.

| State | Purpose |
|--------|---------|
| Pole State | Current operational status of every pole |
| Topology State | Electrical relationship between poles |
| Incident State | Active operational incidents |
| Ticket State | Repair workflow status |
| Simulator State | Active simulated faults |

Separating these states allows individual modules to evolve independently while maintaining a consistent view of system behaviour.

---

# Internal Data Flow

The platform follows a strictly unidirectional processing pipeline.

```
Observations

↓

State Update

↓

Reasoning

↓

Decision

↓

Action

↓

Verification
```

Each module depends only on the output of the previous stage.

Modules never bypass intermediate processing.

This architecture improves maintainability, simplifies debugging and ensures deterministic behaviour.

---

# Design Principles

GridAssist follows the following system-level design principles.

## Single Source of Truth

Network state is maintained centrally within the Pole State Engine.

No module independently tracks energized status.

---

## Deterministic Processing

Given identical telemetry and identical topology, GridAssist always produces identical localization results.

Operational behaviour is fully reproducible.

---

## Explainable Reasoning

Every recommendation is accompanied by supporting evidence, assumptions and confidence.

The operator is never expected to trust a black-box decision.

---

## Graceful Degradation

Incomplete information reduces confidence rather than preventing localization.

Where uncertainty exists, the system communicates the uncertainty explicitly.

---

## Human-Centred Operation

GridAssist exists to reduce operator workload.

Every feature is evaluated based on one question:

> Does this help an operator make a better decision faster?

Features that do not improve operational decision-making are intentionally excluded.

---

# Summary

GridAssist transforms raw telemetry into operational decisions through a structured sequence of observation, reasoning, localization, decision generation and automatic verification.

By separating these responsibilities into independent stages, the platform remains explainable, deterministic and resilient to incomplete information while providing operators with trustworthy recommendations during power distribution faults.
