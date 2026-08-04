# API_SPEC.md

# Part 1 — API Philosophy, Standards and Engineering Principles

---

# Overview

GridAssist exposes a RESTful API responsible for connecting every major subsystem of the platform.

The API is intentionally designed around operational workflows rather than CRUD operations.

Instead of exposing low-level database entities directly, every endpoint represents a meaningful business capability within the power distribution control system.

Examples include:

- Receiving telemetry
- Retrieving active incidents
- Dispatching simulation scenarios
- Updating repair workflow
- Viewing electrical network topology

The API is the single communication layer between the frontend, simulator and backend services.

No frontend component communicates directly with the database.

No module bypasses the API layer.

---

# API Design Goals

The API has been designed around five engineering goals.

## 1. Deterministic Behaviour

Given identical requests and identical system state, every endpoint must return identical responses.

No endpoint should produce non-deterministic behaviour.

Operational infrastructure must remain reproducible.

---

## 2. Explainability

Every response produced by GridAssist should be explainable.

Whenever localization or decision making occurs, the response should expose:

- supporting evidence
- assumptions
- confidence
- rejected alternatives

The API should never return opaque AI-generated conclusions.

---

## 3. Module Isolation

Every backend module owns its own responsibility.

Examples:

Telemetry Gateway

↓

Pole State Engine

↓

Localization Engine

↓

Incident Manager

↓

Ticket Manager

Each module exposes behaviour through the API rather than modifying unrelated modules directly.

---

## 4. Stateless Communication

Every HTTP request contains all information required to process that request.

The backend does not rely on client-side session state.

This simplifies deployment and horizontal scaling.

---

## 5. Operational Simplicity

Every endpoint exists because it supports an operational workflow described in the assignment.

Endpoints that exist only for convenience or debugging are intentionally excluded.

---

# API Versioning

Every public endpoint is versioned.

Current version:

```
/api/v1/
```

Example

```
POST /api/v1/telemetry

GET /api/v1/incidents
```

Future breaking changes should introduce

```
/api/v2/
```

without modifying previous versions.

---

# API Architecture

The API is divided into seven functional domains.

```
Telemetry

↓

Network

↓

Localization

↓

Incidents

↓

Tickets

↓

Simulator

↓

AI
```

Each domain corresponds to one backend module.

Cross-domain responsibilities are intentionally minimized.

---

# Communication Model

GridAssist uses synchronous REST APIs.

Reasons:

- Simple deployment
- Easy debugging
- Assignment requirements
- Excellent compatibility with Docker
- Frontend simplicity

Real-time dashboard updates are implemented using periodic polling rather than WebSockets.

Polling interval:

```
5 seconds
```

This satisfies the required localization SLA while reducing architectural complexity.

---

# Data Format

All requests and responses use JSON.

Content-Type

```
application/json
```

UTF-8 encoding is assumed.

---

# Timestamp Standard

All timestamps use UTC.

ISO-8601 format.

Example

```
2026-07-29T14:32:18Z
```

No endpoint should return locale-dependent date formats.

---

# Identifier Strategy

Every major entity uses UUIDs.

Examples

```
Pole

Transformer

Device

Incident

Ticket
```

Department identifiers such as

```
P-221

DT-0112

F-07-03
```

are stored separately as business identifiers.

Internal API communication always uses UUIDs.

---

# HTTP Methods

GridAssist follows conventional REST semantics.

GET

Read-only operations.

Never modifies state.

---

POST

Create new resources or submit operational events.

Examples

Telemetry

Simulator

AI Summary

---

PATCH

Partial state updates.

Used primarily for ticket workflow.

---

DELETE

Not exposed publicly.

Operational history should never be deleted through the API.

---

# Standard Response Envelope

Every endpoint follows a common response structure.

Successful response

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Failure response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TELEMETRY",
    "message": "Sequence number is older than latest processed event."
  }
}
```

This keeps frontend error handling consistent across all endpoints.

---

# Metadata Object

The optional meta object contains request metadata.

Example

```json
{
  "meta": {
    "timestamp": "...",
    "version": "v1",
    "processingTimeMs": 18
  }
}
```

The frontend never relies on metadata for operational logic.

Metadata exists for diagnostics only.

---

# HTTP Status Codes

Only standard HTTP status codes are used.

| Code | Meaning |
|-------|----------|
| 200 | Successful read |
| 201 | Resource created |
| 202 | Accepted for processing |
| 204 | No content |
| 400 | Invalid request |
| 404 | Resource not found |
| 409 | State conflict |
| 422 | Validation failed |
| 500 | Internal error |

No custom HTTP status codes are introduced.

---

# Error Philosophy

Errors should always be actionable.

Bad

```
Something went wrong.
```

Good

```
Telemetry rejected.

Reason

Sequence number already processed.
```

Every error includes:

- code
- message
- recommendation (where applicable)

---

# Validation Strategy

Validation occurs before business logic.

Validation includes:

- Required fields
- Enum values
- Timestamp format
- UUID format
- Range validation
- Duplicate sequence detection

Invalid requests never reach the Localization Engine.

---

# Idempotency

Certain endpoints must be idempotent.

Example

Telemetry.

If the same telemetry packet is received multiple times,

the API must process it only once.

Identification is based on

```
Device ID

+

Sequence Number
```

Duplicate packets return

```
HTTP 200
```

without creating duplicate telemetry events.

This prevents retransmissions from producing duplicate incidents.

---

# Concurrency

Multiple telemetry events may arrive simultaneously.

The Telemetry Gateway must process requests safely without corrupting Pole State.

The latest valid sequence number always wins.

Older events are discarded.

---

# Ownership Rules

Every API endpoint has exactly one owning module.

| Endpoint Domain | Owner |
|-----------------|-------|
| Telemetry | Telemetry Gateway |
| Network | Topology Engine |
| Incidents | Incident Manager |
| Tickets | Ticket Manager |
| Simulator | Simulator Engine |
| AI | AI Communication Module |

Modules never update tables owned by another module directly.

Inter-module communication occurs through service interfaces.

---

# Security Assumptions

Authentication is intentionally excluded from this prototype.

The assignment assumes an internal operational deployment.

Consequently:

- No login endpoint exists.
- No JWT authentication is implemented.
- No user management exists.

This decision intentionally reduces implementation complexity while remaining aligned with the project requirements.

---

# Performance Targets

The API is designed to satisfy the following operational targets.

| Metric | Target |
|----------|---------|
| Dashboard Load | <2 seconds |
| Telemetry Ingestion | ≥500 messages/second |
| Fault Localization | <120 seconds |
| Ticket Verification | <120 seconds |

The implementation should measure these metrics rather than estimate them.

---

# API Contract Principles

Every endpoint in GridAssist follows the following rules.

1. Never expose internal database implementation details.

2. Never expose unnecessary fields.

3. Never perform hidden localization inside unrelated endpoints.

4. Every endpoint performs one clearly defined responsibility.

5. Every endpoint returns deterministic responses.

6. Every endpoint validates input before processing.

7. Every endpoint must remain independently testable.

---

# Development Guidelines for AI-Assisted Implementation

The implementation of this API follows several constraints.

When generating backend code:

- Do not introduce additional endpoints without justification.
- Do not bypass module boundaries.
- Do not access the database directly from route handlers.
- Route handlers should delegate all business logic to services.
- Services should remain independent and testable.
- Prisma should be the only component responsible for persistence.
- Localization logic must never exist inside controllers.
- Simulator requests must use the same ingestion pipeline as production telemetry.
- AI-generated summaries must never influence operational correctness.

These constraints are mandatory throughout implementation.

---

# Summary

The GridAssist API is intentionally designed around operational workflows rather than CRUD resources.

Every endpoint exists to support one stage of the fault detection and repair lifecycle.

Consistency, determinism, explainability and simplicity are treated as first-class engineering principles throughout the API design.
