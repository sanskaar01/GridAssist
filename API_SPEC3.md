# API_SPEC.md

# Part 3 — Internal Services, Simulator and State Management

---

# Overview

Not every operation inside GridAssist should be exposed as a public API.

Several services exist purely to coordinate internal processing.

These services are implementation details and must never be directly callable by the frontend.

The frontend is intentionally designed as a read-only consumer of operational state.

---

# Internal Architecture

The backend is divided into independent services.

```

Telemetry Gateway
↓
Pole State Engine
↓
Processing Queue
↓
Topology Engine
↓
Localization Engine
↓
Decision Engine
↓
Incident Manager
↓
Ticket Manager
↓
Dashboard Service

```

Each service owns one responsibility.

Services communicate only through well-defined interfaces.

---

# Processing Queue

The Processing Queue exists to separate telemetry ingestion from fault localization.

Incoming telemetry is accepted immediately.

Localization occurs asynchronously.

This design ensures that bursts of incoming telemetry do not block API requests.

---

## Queue Behaviour

Incoming telemetry follows the pipeline:

```

Receive Request

↓

Validate

↓

Persist Telemetry

↓

Update Pole State

↓

Queue Transformer

↓

Return HTTP 202

```

At this point the request lifecycle ends.

Localization continues independently.

---

## Queue Item

Every queue item contains only the minimum information required.

```

Transformer ID

Event Timestamp

Priority

```

The Localization Engine retrieves the latest Pole State directly from the database.

The queue never stores telemetry payloads.

---

## Queue Deduplication

Suppose twenty poles belonging to the same transformer lose power simultaneously.

Without deduplication:

```

DT-14

DT-14

DT-14

DT-14

DT-14

```

Five localization jobs would execute.

Instead:

```

DT-14

```

One localization run processes the latest network state.

This dramatically reduces unnecessary computation.

---

# Queue Priority

Higher priority is assigned to:

• Newly detected outages

Lower priority:

• Heartbeats

• Restoration confirmations

The Localization Engine always processes outage detection before routine maintenance traffic.

---

# Telemetry Gateway

The Telemetry Gateway owns all incoming telemetry.

Responsibilities:

• Validate requests

• Reject malformed payloads

• Detect duplicate packets

• Update Pole State

• Push localization requests

The gateway never performs engineering reasoning.

---

# Pole State Engine

The Pole State Engine maintains the latest operational status of every monitored pole.

It does not store historical telemetry.

Instead it stores the latest known truth.

Possible states:

```

LIVE

DARK

UNKNOWN

OFFLINE

```

Only the Telemetry Gateway is allowed to modify Pole State.

---

# Topology Engine

The Topology Engine provides electrical relationships between poles.

When surveyed topology exists:

Surveyed topology is always preferred.

When topology is unavailable:

The engine loads inferred edges.

The Localization Engine should not know where the topology originated.

It simply receives a tree.

---

# Localization Engine

The Localization Engine is the heart of GridAssist.

Input:

Pole State

+

Topology

Output:

Incident Candidate

The engine performs:

• Fault classification

• Frontier detection

• Confidence evaluation

• Affected pole calculation

• GPS localization

• PIN lookup

The engine never creates Tickets.

The engine never updates Dashboard data.

Its only output is an Incident Candidate.

---

# Decision Engine

The Decision Engine transforms localization output into operator-friendly reasoning.

Responsibilities:

• Generate evidence list

• Generate assumptions

• Generate rejected alternatives

• Calculate confidence

• Generate recommended action

The Decision Engine does not perform localization.

It explains localization.

---

# Incident Manager

The Incident Manager owns Incident lifecycle.

Responsibilities:

• Create Incident

• Merge duplicate incidents

• Detect repeated localization

• Update Incident status

• Close Incident

No other service creates incidents.

---

# Duplicate Incident Detection

Suppose:

Localization executes twice.

Both runs identify:

```

Between

P22

↓

P23

```

The Incident Manager must detect this.

Only one Incident exists.

Existing Incident is updated.

No duplicate Ticket is created.

---

# Ticket Manager

The Ticket Manager owns operational workflow.

Valid transitions:

```

Detected

↓

Acknowledged

↓

Assigned

↓

Resolved

↓

Verifying

↓

Verified

↓

Closed

```

No shortcut transitions are allowed.

---

# Automatic Verification

Operator presses:

Resolved

↓

Ticket enters

Verifying

↓

Telemetry confirms restoration

↓

Verified

↓

Closed

The operator never manually sets

Verified.

---

# Verification Window

Immediately closing a ticket after one restoration message is unsafe.

GridAssist waits for a verification window.

Example:

120 seconds

During this period:

All affected poles should report restoration.

If some remain dark:

Ticket stays in Verifying.

---

# Simulator Service

The Simulator behaves exactly like physical devices.

It never inserts database rows directly.

Instead it generates telemetry.

```

Simulator

↓

Telemetry API

↓

Normal Processing Pipeline

```

This guarantees the production pipeline is always tested.

---

# Simulator Scenarios

Supported scenarios:

• Span Fault

• Transformer Fault

• Feeder Fault

• Dead Device

• Missing Device

• Duplicate Messages

• Delayed Messages

• Silent Firmware Device

• Scheduled Maintenance

Each scenario generates realistic telemetry patterns.

---

# AI Service

GridAssist contains exactly one AI-assisted capability.

Incident Summary Generation.

Input:

Structured Incident

Output:

Operator Summary

Example:

```

Probable span fault between P22 and P23.

Approximately 43 downstream poles affected.

High confidence.

Dispatch nearest maintenance crew.

```

The AI service never influences engineering correctness.

If unavailable:

Fallback:

Template-generated summary.

---

# State Ownership

Every service owns exactly one state.

| Service | Owns |
|----------|------|
| Telemetry Gateway | Telemetry |
| Pole State Engine | Pole State |
| Topology Engine | Electrical Graph |
| Localization Engine | Incident Candidate |
| Decision Engine | Operational Reasoning |
| Incident Manager | Incidents |
| Ticket Manager | Tickets |
| Dashboard Service | Read Models |

No service modifies another service's state directly.

---

# Concurrency Rules

Localization must never execute simultaneously for the same transformer.

If a transformer is already being processed:

Additional queue requests merge into the existing job.

This prevents race conditions.

---

# Failure Recovery

If Localization fails:

Incident is not created.

Telemetry remains stored.

Transformer returns to queue.

Retry occurs automatically.

The operator never sees partial incidents.

---

# AI Development Constraints

When implementing this architecture:

DO NOT

• Localize inside controllers

• Update Ticket inside Localization

• Modify Pole State from Dashboard

• Allow Simulator to bypass Telemetry

• Allow AI to determine fault location

• Create incidents directly from telemetry routes

Always preserve service boundaries.

---

# Summary

The backend architecture intentionally separates ingestion, reasoning, localization, explanation and operational workflow.

Every service performs one responsibility.

Communication flows in one direction only.

This design minimizes coupling, improves testability and significantly reduces the risk of race conditions and duplicate incidents.
