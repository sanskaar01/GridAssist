# DEVELOPMENT_CONTRACT.md

# GridAssist Development Contract

Version: 1.0

Status: Mandatory

---

# Purpose

This document defines the engineering rules governing every implementation decision within GridAssist.

Unlike the architecture documents, which describe how the system works, this document defines **how contributors must write software**.

Every implementation, whether written by a human developer or an AI coding assistant, must comply with these rules.

If any implementation conflicts with this document, this document takes precedence.

---

# Engineering Philosophy

GridAssist is an engineering-first project.

The objective is not to maximise features.

The objective is to build an explainable, deterministic and maintainable operational platform.

Every implementation decision should satisfy the following question.

> Does this improve fault localization, operator understanding or operational workflow?

If the answer is **No**, the implementation should be rejected.

---

# The Ten Non-Negotiable Rules

## Rule 1

Telemetry is the only source of truth.

No module may manually change the operational state of the electrical network.

Pole State may only change after valid telemetry has been processed.

---

## Rule 2

Localization is deterministic.

No AI model may participate in:

- fault localization
- topology inference
- confidence calculation
- ticket verification

Graph algorithms alone determine engineering conclusions.

---

## Rule 3

Controllers contain zero business logic.

Controllers may only:

- receive requests
- validate requests
- call services
- return responses

Business rules belong exclusively inside services.

---

## Rule 4

Services own behaviour.

Repositories own persistence.

Repositories must never contain business logic.

---

## Rule 5

Every service owns exactly one responsibility.

Example:

Telemetry Service

✓ Validation

✓ Telemetry persistence

✓ Pole State update

✗ Incident creation

✗ Dashboard aggregation

---

## Rule 6

Every module owns its own data.

Modules must never directly modify another module's tables.

Communication occurs through services.

---

## Rule 7

No duplicated business logic.

Every algorithm must exist in one location only.

If the same code appears twice, implementation should be reconsidered.

---

## Rule 8

Explainability takes priority over optimisation.

Every engineering conclusion must be reproducible.

Every confidence value must be explainable.

Every recommendation must be supported by evidence.

---

## Rule 9

The frontend is a presentation layer.

React never:

- localizes faults
- calculates confidence
- infers topology
- verifies restoration

React visualizes backend decisions.

Nothing more.

---

## Rule 10

The simulator is another telemetry producer.

The simulator must never:

- insert database rows
- create incidents
- modify Pole State

Every simulated event must travel through the same production telemetry pipeline.

---

# TypeScript Standards

Strict mode must remain enabled.

Avoid `any`.

Prefer explicit types.

Interfaces should describe API contracts.

Enums should represent finite operational states.

Business logic should remain strongly typed.

---

# Express Standards

Routes contain no logic.

Controllers contain minimal logic.

Services contain engineering logic.

Repositories contain database operations.

Middleware contains cross-cutting concerns only.

---

# Prisma Standards

Every table documented in DATABASE.md must exist.

Relations must follow documented foreign keys.

No undocumented tables may be introduced.

No undocumented columns may be introduced.

Raw SQL should only be used when Prisma cannot express the required query.

---

# Folder Structure

The documented project structure is mandatory.

No feature may introduce arbitrary folders.

Backend

```
controllers/

services/

repositories/

routes/

middleware/

validators/

utils/

localization/

topology/

simulator/

ai/
```

Frontend

```
pages/

components/

hooks/

services/

types/

contexts/
```

---

# Naming Conventions

Classes

```
TelemetryService

IncidentManager

TopologyEngine
```

Interfaces

```
TelemetryRequest

IncidentResponse

PoleState
```

Controllers

```
TelemetryController

TicketController
```

Repositories

```
PoleRepository

IncidentRepository
```

Validators

```
TelemetryValidator
```

Never use abbreviations that reduce readability.

---

# API Rules

Every endpoint must:

- validate input
- return consistent JSON
- return standard HTTP codes
- never expose Prisma objects directly

Responses always follow the documented response envelope.

---

# Logging Standards

Every important operation should generate structured logs.

Required fields:

```
timestamp

service

operation

entityId

duration

result
```

Sensitive information must never appear in logs.

---

# Error Handling

Never throw generic errors.

Create domain-specific errors.

Examples:

```
DuplicateTelemetryError

InvalidTopologyError

TicketStateError
```

Every error should include:

- message
- code
- recommendation (when applicable)

---

# Validation

All validation occurs before business logic.

Every endpoint validates:

- UUIDs
- timestamps
- enums
- required fields
- numeric ranges

Invalid requests never reach services.

---

# Testing Rules

Every completed module must be manually tested before implementation continues.

Minimum test coverage includes:

✓ Happy path

✓ Invalid input

✓ Edge cases

✓ Duplicate requests

✓ Failure handling

---

# Git Rules

One implementation ticket = One commit.

Commit messages should describe behaviour.

Example:

```
feat: implement telemetry gateway

fix: prevent duplicate incident creation

refactor: extract topology service
```

Never combine unrelated work into one commit.

---

# AI Coding Rules

When implementing GridAssist:

DO NOT

- redesign architecture
- rename modules
- invent APIs
- invent database tables
- bypass documented workflows
- simplify deterministic algorithms into AI calls

If documentation appears incomplete,

stop and report the issue.

Do not invent a solution.

---

# Definition of Engineering Success

A completed implementation should satisfy all of the following:

✓ Matches architecture documents.

✓ Matches API specification.

✓ Matches database specification.

✓ Remains deterministic.

✓ Remains explainable.

✓ Passes acceptance criteria.

✓ Does not introduce undocumented behaviour.

---

# Final Principle

GridAssist is built around one central belief.

Operational systems should never ask operators to trust software blindly.

Instead, software should provide enough evidence that operators can confidently trust their own decisions.

Every implementation should reinforce this philosophy.
