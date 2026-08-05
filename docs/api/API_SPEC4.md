# API_SPEC.md

# Part 4 — Edge Cases, Reliability, Development Constraints and Implementation Rules

---

# Overview

The GridAssist API has been intentionally designed for deterministic behaviour under imperfect real-world conditions.

The electricity distribution network operates in an environment where telemetry may be delayed, duplicated, incomplete or contradictory.

Therefore, the API implementation must prioritise correctness, resilience and explainability over convenience.

The following engineering rules are mandatory during implementation.

---

# Edge Case Handling

## Duplicate Telemetry

Problem

A device retransmits the same packet because the previous acknowledgement was lost.

Example

POWER_LOST

Sequence Number

```
281
```

is received twice.

Expected Behaviour

Only the first packet updates Pole State.

Subsequent packets with the same Device ID and Sequence Number are ignored.

No duplicate incident should ever be created.

---

## Out-of-Order Telemetry

Problem

The network delivers an older telemetry packet after a newer one.

Example

```
Sequence 40

↓

Sequence 41

↓

Sequence 39
```

Expected Behaviour

Sequence 39 is rejected.

Pole State remains unchanged.

---

## Delayed Telemetry

Problem

Telemetry arrives several minutes after the outage has already been localized.

Expected Behaviour

Delayed packets may update telemetry history but must never create historical incidents.

Localization always operates on the latest Pole State.

---

## Simultaneous Outages

Problem

Two independent faults occur on different transformers at the same time.

Expected Behaviour

Each transformer is processed independently.

Independent Incidents are created.

No localization result should ever span multiple transformers.

---

## Multiple Faults Under One Transformer

Problem

More than one conductor fails beneath the same transformer.

Expected Behaviour

Localization identifies multiple Live → Dark frontiers.

Each frontier generates an independent Incident.

The Localization Engine must never merge physically separate failures.

---

## Device Failure

Problem

A telemetry device stops transmitting while downstream poles remain energized.

Expected Behaviour

The system classifies this as a probable Device Failure.

No operational Incident is generated.

---

## Missing Device

Problem

Approximately 9% of poles contain no telemetry device.

Expected Behaviour

Localization expands the possible fault span.

Confidence decreases.

Localization must never fabricate observations.

---

## Scheduled Maintenance

Problem

A scheduled outage overlaps with incoming Power Lost telemetry.

Expected Behaviour

The Scheduled Outage Service is consulted before creating an Incident.

If the outage matches:

No operational Incident is generated.

If observed behaviour exceeds the scheduled scope or duration:

Generate an Incident with reduced confidence and note the conflict in the evidence.

---

## Silent Firmware Devices

Problem

Firmware version 1.2 may never send a POWER_LOST event.

Expected Behaviour

Missing heartbeat windows are interpreted as possible outages only after the configured timeout.

A single missed heartbeat must never create an Incident.

---

## Duplicate Incident Prevention

Problem

Localization executes multiple times while an Incident is already active.

Expected Behaviour

Update the existing Incident.

Never create duplicate Tickets.

---

## Ticket Verification

Problem

The operator marks a Ticket as Resolved before power is actually restored.

Expected Behaviour

The Ticket enters VERIFYING.

Only restoration telemetry transitions it to VERIFIED.

Manual verification is prohibited.

---

# Failure Recovery

## Localization Failure

If the Localization Engine throws an exception:

- Preserve Telemetry.
- Preserve Pole State.
- Return the transformer to the Processing Queue.
- Retry processing.

The operator must never see partially created Incidents.

---

## AI Service Failure

If AI summary generation fails:

Fallback immediately to deterministic template generation.

Example

```
Probable span fault detected.

Location:

Between Pole P22 and Pole P23.

Confidence:

High.

Affected Poles:

43.
```

The AI service must never block operational workflows.

---

## Database Failure

If persistence fails:

Reject the request.

Return HTTP 500.

Do not update Pole State in memory unless persistence succeeds.

Database consistency takes priority over availability.

---

## Simulator Failure

If the simulator generates invalid telemetry:

Reject the scenario.

Never inject malformed events into production processing.

The simulator must obey the same validation rules as real devices.

---

# Reliability Rules

The backend follows the following guarantees.

## At Most One Active Incident Per Fault

Repeated localization of the same physical fault updates the existing Incident.

It never creates duplicates.

---

## One Incident Creates One Ticket

Every operational Incident owns exactly one Ticket.

Ticket creation is automatic.

---

## Every Ticket References One Incident

Tickets never exist independently.

---

## Pole State Is Always Derived From Telemetry

Manual updates are prohibited.

---

## Frontend Never Modifies Engineering State

The frontend only:

- reads dashboard data
- acknowledges tickets
- assigns crews
- marks repairs complete

The frontend never:

- changes Pole State
- triggers localization
- modifies topology

---

# API Timeout Strategy

Target response times:

| Endpoint | Target |
|-----------|---------|
| Telemetry | <100 ms |
| Dashboard | <2 s |
| Network | <2 s |
| Incident Details | <500 ms |
| Ticket Update | <300 ms |
| Simulator | <300 ms |

If localization requires longer processing,

return

```
202 Accepted
```

rather than blocking the request.

---

# Logging Strategy

Every service should emit structured logs.

Minimum fields:

```
timestamp

service

operation

entityId

duration

result
```

Sensitive information must never be logged.

---

# Development Constraints

The following rules are mandatory for implementation.

## Controllers

Controllers should:

- validate requests
- call services
- return responses

Controllers must never contain business logic.

---

## Services

Services implement all business rules.

Services communicate with repositories.

Services must remain independently testable.

---

## Repositories

Repositories are responsible only for persistence.

No engineering decisions belong inside repositories.

---

## React Frontend

React must never:

- compute localization
- calculate confidence
- infer topology
- merge incidents
- verify restoration

The frontend only visualizes backend decisions.

---

## AI Usage

LLMs may only be used for:

- incident summaries
- operator-friendly language

LLMs must never:

- localize faults
- classify telemetry
- infer topology
- determine confidence
- close tickets

---

## Simulator

The simulator is treated as another telemetry producer.

It must always use:

```
POST /api/v1/telemetry
```

The simulator may never:

- write directly to the database
- modify Pole State
- create Incidents
- create Tickets

---

# Code Generation Rules for Claude

Claude must follow these implementation constraints.

- Generate TypeScript only.
- Use Express.js.
- Use Prisma ORM.
- Follow the documented database schema.
- Follow the documented API contracts exactly.
- Do not invent additional endpoints.
- Do not move business logic into controllers.
- Keep services modular.
- Write production-ready code with clear typing.
- Add comprehensive comments only where reasoning is non-obvious.
- Prefer readability over cleverness.
- Do not introduce unnecessary abstractions.
- Do not implement features outside the documented scope.

---

# Final Engineering Principles

GridAssist follows five non-negotiable engineering principles.

1. Every telemetry message enters through one gateway.

2. Every localization decision is deterministic.

3. Every operational recommendation is explainable.

4. Every Ticket is verified using telemetry.

5. Every backend module owns exactly one responsibility.

---

# Summary

The GridAssist API is intentionally conservative.

Rather than exposing a large number of endpoints or relying on hidden application behaviour, every service performs one clearly defined responsibility.

The combination of strict validation, deterministic processing, asynchronous localization, clear ownership and explainable reasoning creates a backend architecture that is reliable, maintainable and aligned with the operational needs of electricity distribution control rooms.
