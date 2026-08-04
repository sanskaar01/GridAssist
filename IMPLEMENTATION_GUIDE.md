# IMPLEMENTATION_GUIDE.md

# GridAssist — Implementation Guide

Version: 1.0

Status: Approved for Development

---

# Purpose

This document defines the implementation strategy for GridAssist.

Unlike the architecture documents, which explain **what the system is**, this guide explains **how the system will be built**.

It is the primary implementation contract for every engineer contributing to the project, whether human or AI.

No implementation should begin before understanding this document.

---

# Project Objective

GridAssist is an explainable decision support platform designed for electricity distribution control rooms.

The system ingests telemetry from IoT-enabled electrical poles, continuously maintains the operational state of the distribution network, localizes electrical faults using deterministic graph algorithms, groups related outages into operational incidents, manages repair workflows, automatically verifies restoration using telemetry, and provides operators with a clear, trustworthy interface for making dispatch decisions.

The project prioritizes:

- Explainability
- Determinism
- Simplicity
- Operational usefulness

over feature count.

---

# Engineering Philosophy

Every implementation decision should satisfy the following question:

> Does this help an operator detect, understand or resolve a power fault faster?

If the answer is **No**, the feature should not be implemented.

GridAssist intentionally avoids unnecessary complexity.

The objective is to solve the operational problem described in the assignment—not to demonstrate every possible technology.

---

# Implementation Philosophy

The project follows four implementation principles.

## 1. Build Infrastructure Before Behaviour

The development order always follows:

Database

↓

Backend

↓

Localization

↓

Dashboard

↓

Simulator

↓

AI

No frontend implementation should begin before the backend contracts are stable.

---

## 2. Complete One Module Before Starting Another

Modules should never be developed simultaneously.

Every module must:

- compile successfully
- satisfy its acceptance criteria
- pass manual testing
- be committed to Git

before the next module begins.

---

## 3. Respect Module Ownership

Each module owns one responsibility.

No module should modify another module's data directly.

Business logic must remain inside services.

Controllers remain thin.

Repositories remain persistence-only.

---

## 4. Architecture Is Frozen

The architecture documents represent approved engineering decisions.

During implementation:

- New endpoints should not be invented.
- Database tables should not be modified.
- Folder structure should not change.
- Module boundaries should remain unchanged.

If implementation reveals a genuine architectural issue, document it before making any modification.

---

# Repository Structure

The repository follows the following structure.

```

gridassist/

│

├── backend/

│ ├── src/

│ │ ├── controllers/

│ │ ├── routes/

│ │ ├── services/

│ │ ├── repositories/

│ │ ├── middleware/

│ │ ├── validators/

│ │ ├── localization/

│ │ ├── topology/

│ │ ├── simulator/

│ │ ├── ai/

│ │ ├── utils/

│ │ └── app.ts

│ │

│ ├── prisma/

│ ├── tests/

│ └── package.json

│

├── frontend/

│ ├── src/

│ │ ├── pages/

│ │ ├── components/

│ │ ├── hooks/

│ │ ├── services/

│ │ ├── contexts/

│ │ ├── types/

│ │ └── App.tsx

│ │

│ └── package.json

│

├── docs/

│

├── docker-compose.yml

├── README.md

└── .env.example

```

This structure must remain stable throughout development.

---

# Technology Stack

Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL

Frontend

- React
- TypeScript
- React Leaflet
- Tailwind CSS

Infrastructure

- Docker Compose

AI

- OpenAI-compatible API
- Single responsibility: Incident Summary Generation

Mapping

- OpenStreetMap
- Leaflet

No additional frameworks should be introduced unless strictly necessary.

---

# Module Dependency Graph

The implementation order follows dependency flow.

```

Database

↓

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

↓

React Dashboard

↓

Simulator

↓

AI Summary

```

No module may be implemented before its dependencies are complete.

---

# Development Phases

The project is divided into nine implementation phases.

## Phase 1

Project Foundation

- Repository structure
- Docker
- Express
- React
- Prisma
- PostgreSQL

---

## Phase 2

Network Registry

- Feeders
- Distribution Transformers
- Poles
- Devices
- Seed Data

---

## Phase 3

Telemetry Processing

- Telemetry API
- Validation
- Pole State
- Processing Queue

---

## Phase 4

Fault Localization

- Topology Engine
- Frontier Detection
- Confidence Calculation
- Incident Candidate

---

## Phase 5

Operational Workflow

- Incident Manager
- Ticket Manager
- Automatic Verification

---

## Phase 6

Operator Dashboard

- Incident List
- Network View
- Decision Card
- Ticket Controls

---

## Phase 7

Fault Simulator

- Scenario Generator
- Telemetry Producer
- Dashboard Controls

---

## Phase 8

AI Assistance

- Incident Summary Generation
- Fallback Templates

---

## Phase 9

Deployment

- Docker Compose
- Public Deployment
- Documentation
- Demo Video

---

# Development Rules

The following rules are mandatory throughout implementation.

## Rule 1

Never skip phases.

---

## Rule 2

Never build frontend components whose APIs do not yet exist.

---

## Rule 3

Every backend feature must be manually tested before frontend integration.

---

## Rule 4

Every completed module must be committed independently.

One module.

One commit.

---

## Rule 5

Every commit must leave the project in a runnable state.

The repository should never be broken between commits.

---

# Git Workflow

Every implementation module follows the same lifecycle.

```

Read Documentation

↓

Implement

↓

Manual Test

↓

Fix Bugs

↓

Commit

↓

Next Module

```

No module proceeds to the next stage until the previous stage passes testing.

---

# Definition of Done

A module is considered complete only if all of the following conditions are satisfied.

✓ TypeScript compiles successfully.

✓ No ESLint errors.

✓ Manual testing completed.

✓ Acceptance criteria satisfied.

✓ API matches API_SPEC.md.

✓ Database usage matches DATABASE.md.

✓ No undocumented behaviour introduced.

✓ Docker environment still starts successfully.

---

# Claude Development Contract

Every Claude implementation prompt begins with the following assumptions.

You are joining an existing software project.

The architecture has already been approved.

Your responsibility is implementation only.

You are not permitted to redesign:

- Database
- APIs
- Folder structure
- Service boundaries
- Ticket workflow
- Localization algorithm

Before implementing any module, read:

1. IMPLEMENTATION_GUIDE.md
2. DATABASE.md
3. API_SPEC.md
4. SYSTEM_DESIGN.md
5. ENGINEERING_DECISIONS.md

If documentation conflicts with implementation, stop and explain the conflict rather than inventing a solution.

---

# Implementation Success Criteria

GridAssist will be considered implementation-complete when all of the following are true.

- All documented modules exist.
- Docker Compose starts the complete application with one command.
- The simulator injects realistic telemetry.
- Localization creates explainable incidents.
- Tickets are automatically verified through telemetry.
- The operator dashboard reflects live network state.
- AI summaries are generated with graceful fallback.
- The application is deployed on a public URL.
- The repository contains complete documentation matching the implementation.

At this point, implementation transitions into testing, optimization and submission preparation.
