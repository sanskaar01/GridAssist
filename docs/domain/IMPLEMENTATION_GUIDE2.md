# IMPLEMENTATION_GUIDE.md

# Part 2 — Engineering Roadmap & Implementation Tickets

---

# Overview

Implementation is divided into engineering epics.

Each epic represents a complete functional milestone.

Every implementation task must satisfy its own acceptance criteria before development proceeds to the next task.

Tasks should never be implemented out of order unless explicitly stated.

The implementation sequence has been designed to minimize integration issues and reduce AI-generated architectural drift.

---

# EPIC 1 — Project Foundation

Objective

Establish a stable development environment before implementing business logic.

Nothing in this phase performs fault localization.

Its purpose is to prepare the project structure.

---

## IMP-001 — Repository Skeleton

### Goal

Create the complete folder structure for the project.

### Deliverables

- Backend project
- Frontend project
- Documentation directory
- Docker configuration
- Environment template

### Files

backend/

frontend/

docs/

docker-compose.yml

README.md

.env.example

### Acceptance Criteria

✓ Project structure matches IMPLEMENTATION_GUIDE.md

✓ Backend starts

✓ Frontend starts

✓ Docker Compose executes successfully

---

## IMP-002 — Backend Foundation

### Goal

Create the Express application.

### Deliverables

- Express
- TypeScript
- Routing
- Error middleware
- Logging middleware

### APIs

GET /health

### Acceptance Criteria

✓ Server starts

✓ Health endpoint returns HTTP 200

✓ TypeScript compiles

✓ Docker build succeeds

---

## IMP-003 — Database Foundation

### Goal

Implement PostgreSQL and Prisma.

### Deliverables

- Prisma schema
- Database connection
- Migration system

### Tables

All documented entities

### Acceptance Criteria

✓ Prisma generates successfully

✓ Migrations execute

✓ Seed script runs

✓ Database connects

---

# Milestone

At the end of EPIC 1:

The complete development environment exists.

No business logic has been implemented.

---

# EPIC 2 — Network Registry

Objective

Create the digital representation of the electrical network.

---

## IMP-004 — Seed Network Data

### Goal

Populate the system with realistic Karnataka electricity network data.

### Tables

Feeder

Distribution Transformer

Pole

Device

### Deliverables

Seed script

Sample topology

Known topology

Missing topology

### Acceptance Criteria

✓ Seed script executes

✓ Poles visible in database

✓ Devices linked correctly

✓ Missing topology represented

---

## IMP-005 — Pole State Engine

### Goal

Create the live operational state table.

### Inputs

Telemetry

### Outputs

Current Pole State

### Tables

PoleState

### Acceptance Criteria

✓ Every Pole has one PoleState

✓ State updates correctly

✓ Offline state supported

✓ Unknown state supported

---

# Milestone

The electrical network now exists digitally.

No telemetry processing yet.

---

# EPIC 3 — Telemetry Processing

Objective

Build the ingestion pipeline.

---

## IMP-006 — Telemetry API

### Goal

Accept telemetry.

### Endpoint

POST /api/v1/telemetry

### Responsibilities

Validate

Persist

Update PoleState

Queue localization

Return HTTP202

### Acceptance Criteria

✓ Duplicate detection

✓ Sequence validation

✓ Timestamp validation

✓ Unknown device rejection

✓ HTTP202 returned

---

## IMP-007 — Processing Queue

### Goal

Create asynchronous processing.

### Responsibilities

Queue transformer jobs

Deduplicate jobs

Prioritize outages

### Acceptance Criteria

✓ Queue works

✓ Duplicate jobs merged

✓ Processing asynchronous

---

# Milestone

Telemetry enters the platform successfully.

Localization not yet implemented.

---

# EPIC 4 — Fault Localization

Objective

Implement deterministic localization.

---

## IMP-008 — Topology Engine

### Goal

Load surveyed and inferred topology.

### Inputs

Pole

InferredEdge

### Outputs

Electrical tree

### Acceptance Criteria

✓ Surveyed topology preferred

✓ Inferred topology supported

✓ Missing topology handled

---

## IMP-009 — Localization Engine

### Goal

Detect fault frontier.

### Responsibilities

Classify faults

Find frontier

Calculate affected poles

Locate failed span

Estimate confidence

### Acceptance Criteria

✓ Span localization

✓ Transformer faults

✓ Feeder faults

✓ Multiple simultaneous faults

✓ Unknown topology

✓ Missing devices

---

## IMP-010 — Decision Engine

### Goal

Transform localization into explainable reasoning.

### Outputs

Evidence

Assumptions

Rejected alternatives

Recommended action

Confidence

### Acceptance Criteria

✓ Decision Card generated

✓ Evidence populated

✓ Confidence explanation produced

---

# Milestone

GridAssist successfully detects and explains faults.

---

# EPIC 5 — Incident & Ticket Workflow

Objective

Transform engineering conclusions into operational workflows.

---

## IMP-011 — Incident Manager

### Goal

Create and maintain incidents.

### Responsibilities

Create

Merge duplicates

Update

Close

### Acceptance Criteria

✓ Duplicate incidents prevented

✓ Active incidents updated

✓ Closed incidents preserved

---

## IMP-012 — Ticket Manager

### Goal

Implement repair workflow.

### Workflow

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

### Acceptance Criteria

✓ Invalid transitions rejected

✓ Verification automatic

✓ Manual verification impossible

---

# Milestone

Complete repair workflow operational.

---

# EPIC 6 — Operator Dashboard

Objective

Create the operator-facing interface.

---

## IMP-013 — Dashboard

Components

Incident List

Statistics

Decision Card

Ticket Controls

### Acceptance Criteria

✓ Dashboard loads

✓ Incident updates visible

✓ Polling every 5 seconds

---

## IMP-014 — Network View

Components

React Leaflet

Poles

Electrical Lines

Fault Span

Crew Destination

### Acceptance Criteria

✓ Network rendered

✓ Fault highlighted

✓ Midpoint navigation generated

---

# Milestone

Operator can monitor and manage faults.

---

# EPIC 7 — Simulator

Objective

Allow reviewers to test the system.

---

## IMP-015 — Scenario Engine

Supported Scenarios

Span Fault

Transformer Fault

Feeder Fault

Duplicate Messages

Delayed Messages

Dead Device

Silent Firmware

Scheduled Maintenance

### Acceptance Criteria

✓ Simulator generates telemetry

✓ Uses production Telemetry API

✓ No direct database writes

---

# Milestone

Entire pipeline testable.

---

# EPIC 8 — AI Summary

Objective

Provide operator-friendly summaries.

---

## IMP-016 — Incident Summary

### Goal

Generate human-readable incident descriptions.

### Fallback

Template summary

### Acceptance Criteria

✓ AI summary produced

✓ Fallback works

✓ Localization unaffected

---

# EPIC 9 — Deployment

Objective

Prepare production-ready submission.

---

## IMP-017 — Deployment

Tasks

Docker

Public deployment

Environment variables

README

Demo video

### Acceptance Criteria

✓ docker compose up works

✓ Public URL available

✓ One-command startup

✓ Reviewer can run system without modification

---

# Final Implementation Checklist

Before submission verify:

✓ All documentation matches implementation.

✓ API matches API_SPEC.md.

✓ Database matches DATABASE.md.

✓ Simulator exercises the production pipeline.

✓ Ticket verification is telemetry-driven.

✓ Localization remains deterministic.

✓ AI only generates summaries.

✓ Public deployment works.

✓ Docker Compose works.

✓ README is complete.

✓ Repository is clean.

✓ No undocumented features exist.

---

# Implementation Order Summary

```

Project Foundation

↓

Database

↓

Network Registry

↓

Telemetry

↓

Queue

↓

Localization

↓

Decision Engine

↓

Incidents

↓

Tickets

↓

Dashboard

↓

Simulator

↓

AI

↓

Deployment

```

Implementation must always follow this sequence.

Skipping dependencies is not permitted.
