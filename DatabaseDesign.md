# DATABASE.md

# Database Design

## Overview

GridAssist uses PostgreSQL as its primary relational database.

The database models the physical electrical distribution network, incoming telemetry, fault localization results, operational incidents and repair workflow.

The schema intentionally mirrors real-world entities rather than application screens.

Every table represents an operational object that exists within the electricity distribution system.

The database is normalized to reduce redundancy while remaining simple enough for rapid development and demonstration.

---

# Design Principles

The database follows five principles.

## Physical Entities First

Tables represent real-world infrastructure whenever possible.

Examples include:

- Feeders
- Distribution Transformers
- Poles
- Devices

rather than UI concepts.

---

## Single Source of Truth

Each entity has one authoritative table.

For example,

the current state of a pole is stored only once.

Other modules reference that state rather than duplicating it.

---

## Deterministic Relationships

Every foreign key represents a physical relationship within the electrical network.

Example:

```
Feeder

↓

Distribution Transformer

↓

Pole

↓

Device
```

---

## Explainability

The database preserves sufficient information to explain every localization decision.

Reasoning, assumptions and confidence are stored alongside incidents rather than hidden within application logic.

---

## Simplicity

Only entities required to solve the assignment are included.

Historical analytics, user authentication and administrative reporting are intentionally excluded.

---

# Entity Relationship Overview

```
Feeder
   │
   ▼
Distribution Transformer
   │
   ▼
Pole
   │
   ▼
Device
   │
   ▼
Telemetry

Telemetry
      │
      ▼
Incident
      │
      ▼
Ticket

Distribution Transformer
      │
      ▼
Inferred Edge

Scheduled Outage
```

---

# Table 1 — Feeders

Represents an 11kV feeder supplying one or more distribution transformers.

| Column | Type | Description |
|----------|------|-------------|
| id | UUID | Primary Key |
| feeder_code | VARCHAR | Department feeder identifier |
| name | VARCHAR | Human readable feeder name |
| substation | VARCHAR | Parent substation |
| status | VARCHAR | Active / Offline |
| created_at | TIMESTAMP | Creation timestamp |

Relationship

```
One Feeder

↓

Many Distribution Transformers
```

Index

```
PRIMARY KEY (id)

INDEX(feeder_code)
```

---

# Table 2 — Distribution Transformers

Represents each Distribution Transformer (DT).

| Column | Type |
|----------|------|
| id | UUID |
| feeder_id | UUID FK |
| transformer_code | VARCHAR |
| latitude | DOUBLE |
| longitude | DOUBLE |
| ward | VARCHAR |
| status | VARCHAR |
| created_at | TIMESTAMP |

Relationship

```
One Distribution Transformer

↓

Many Poles
```

Indexes

```
PRIMARY KEY(id)

INDEX(feeder_id)
```

---

# Table 3 — Poles

Represents every electrical pole.

This table is the core physical representation of the LT network.

| Column | Type |
|----------|------|
| id | UUID |
| transformer_id | UUID FK |
| parent_pole_id | UUID FK Nullable |
| sequence_number | INTEGER Nullable |
| latitude | DOUBLE |
| longitude | DOUBLE |
| ward | VARCHAR |
| pincode | VARCHAR Nullable |
| pole_type | VARCHAR |
| topology_source | ENUM(SURVEYED, INFERRED) |
| current_state | ENUM(LIVE,DARK,UNKNOWN,OFFLINE) |
| has_device | BOOLEAN |
| created_at | TIMESTAMP |

Notes

`parent_pole_id`

is NULL whenever topology is unavailable.

`sequence_number`

is NULL for unsurveyed transformers.

`current_state`

always reflects the latest known operational state.

Indexes

```
PRIMARY KEY(id)

INDEX(transformer_id)

INDEX(parent_pole_id)

INDEX(current_state)
```

---

# Table 4 — Devices

Represents IoT devices installed on poles.

A pole may exist without a telemetry device.

| Column | Type |
|----------|------|
| id | UUID |
| pole_id | UUID FK |
| device_code | VARCHAR |
| firmware_version | VARCHAR |
| battery_level | INTEGER |
| last_seen | TIMESTAMP |
| status | ENUM(ACTIVE,OFFLINE,FAILED) |
| installed_at | TIMESTAMP |

Relationship

```
One Pole

↓

Zero or One Device
```

Indexes

```
PRIMARY KEY(id)

UNIQUE(pole_id)
```

---

# Table 5 — Telemetry

Stores incoming telemetry events.

Only a rolling operational window is retained.

Historical telemetry is intentionally excluded from the scope of this project.

| Column | Type |
|----------|------|
| id | UUID |
| device_id | UUID FK |
| event_type | ENUM(POWER_LOST, POWER_RESTORED, HEARTBEAT) |
| event_timestamp | TIMESTAMP |
| received_timestamp | TIMESTAMP |
| sequence_number | INTEGER |
| signal_strength | INTEGER Nullable |
| battery_level | INTEGER Nullable |
| raw_payload | JSONB |

Indexes

```
PRIMARY KEY(id)

INDEX(device_id)

INDEX(event_timestamp)

INDEX(sequence_number)
```

---

# Table 6 — Inferred Edges

Represents inferred parent-child electrical relationships for transformers whose topology is unavailable.

Surveyed topology is never overwritten.

| Column | Type |
|----------|------|
| id | UUID |
| transformer_id | UUID FK |
| parent_pole_id | UUID FK |
| child_pole_id | UUID FK |
| confidence | ENUM(HIGH,MEDIUM,LOW) |

Purpose

The localization engine consults this table only when surveyed topology does not exist.

Indexes

```
PRIMARY KEY(id)

INDEX(transformer_id)
```

---

# Table 7 — Scheduled Outages

Represents planned maintenance windows.

| Column | Type |
|----------|------|
| id | UUID |
| scope | ENUM(FEEDER,TRANSFORMER) |
| target_id | VARCHAR |
| start_time | TIMESTAMP |
| end_time | TIMESTAMP |
| reason | TEXT |

Purpose

Prevents false-positive incidents during scheduled maintenance.

---

# Table 8 — Incidents

Represents one localized physical fault.

This table stores the engineering conclusion reached by the localization engine.

| Column | Type |
|----------|------|
| id | UUID |
| fault_type | ENUM(SPAN,DT,FEEDER,SENSOR,UNKNOWN) |
| transformer_id | UUID FK |
| suspected_parent_pole | UUID Nullable |
| suspected_child_pole | UUID Nullable |
| confidence | ENUM(HIGH,MEDIUM,LOW) |
| evidence | JSONB |
| assumptions | JSONB |
| rejected_alternatives | JSONB |
| recommended_action | TEXT |
| affected_poles | INTEGER |
| latitude | DOUBLE |
| longitude | DOUBLE |
| pincode | VARCHAR |
| status | ENUM(ACTIVE,VERIFYING,CLOSED) |
| detected_at | TIMESTAMP |

Purpose

Every row represents one physical operational problem.

Not one telemetry message.

Indexes

```
PRIMARY KEY(id)

INDEX(status)

INDEX(transformer_id)
```

---

# Table 9 — Tickets

Represents the operational workflow associated with an Incident.

| Column | Type |
|----------|------|
| id | UUID |
| incident_id | UUID FK |
| assigned_crew | VARCHAR Nullable |
| status | ENUM(DETECTED,ACKNOWLEDGED,ASSIGNED,RESOLVED,VERIFYING,VERIFIED,CLOSED) |
| acknowledged_at | TIMESTAMP Nullable |
| assigned_at | TIMESTAMP Nullable |
| resolved_at | TIMESTAMP Nullable |
| verified_at | TIMESTAMP Nullable |
| closed_at | TIMESTAMP Nullable |

Relationship

```
One Incident

↓

One Ticket
```

Verification always depends on telemetry.

Manual status updates cannot transition a ticket from VERIFYING to VERIFIED.

Indexes

```
PRIMARY KEY(id)

UNIQUE(incident_id)
```

---

# Data Ownership

| Table | Owned By |
|---------|----------|
| Feeders | Network Registry |
| Distribution Transformers | Network Registry |
| Poles | Network Registry |
| Devices | Device Registry |
| Telemetry | Telemetry Gateway |
| Inferred Edges | Topology Engine |
| Scheduled Outages | Outage Service |
| Incidents | Localization Engine |
| Tickets | Ticket Manager |

Each subsystem owns only its own data.

Modules communicate through defined APIs rather than directly modifying unrelated tables.

---

# Database Constraints

The following constraints are enforced.

- Every Device must belong to one Pole.
- Every Pole belongs to exactly one Distribution Transformer.
- Every Distribution Transformer belongs to exactly one Feeder.
- Every Incident creates exactly one Ticket.
- Surveyed topology is never modified by inference.
- Incident status and Ticket status remain synchronized through the Ticket Manager.

---

# Why PostgreSQL?

PostgreSQL was selected because the problem domain is inherently relational.

Electrical infrastructure naturally forms hierarchical relationships between feeders, transformers, poles and devices.

Additionally, PostgreSQL provides:

- Strong ACID guarantees
- Excellent relational modelling
- Native JSONB support for explainability metadata
- Mature indexing capabilities
- Simple Docker deployment
- Prisma compatibility

No graph database was selected because the assignment scale does not justify the additional operational complexity.

Graph traversal is performed in application memory after retrieving the required topology from PostgreSQL.

---

# Summary

The GridAssist database models the physical power distribution network, telemetry flow, localization results and repair workflow using a normalized relational schema.

The design prioritizes explainability, deterministic relationships and operational simplicity while remaining small enough to be fully implemented, tested and demonstrated within the scope of the assessment.
