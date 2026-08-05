# SIMULATOR.md

# GridAssist Fault Simulation Engine

Version: 1.0

Status: Approved

---

# Purpose

The GridAssist Fault Simulation Engine allows reviewers to evaluate the complete production pipeline without access to a real electrical distribution network.

Rather than injecting database records or manually creating incidents, the simulator behaves like a network of physical IoT devices.

Every simulated event enters the platform through the same telemetry ingestion pipeline used by production devices.

The simulator therefore validates the entire system, not individual components.

---

# Design Philosophy

The simulator exists for one purpose.

To reproduce realistic electrical failures while exercising every major subsystem of GridAssist.

A successful simulation should demonstrate:

Telemetry

↓

Pole State Update

↓

Localization

↓

Decision Engine

↓

Incident Creation

↓

Ticket Generation

↓

Operator Dashboard

↓

Repair Verification

The simulator must never bypass this pipeline.

---

# Engineering Principle

The simulator is treated as another telemetry producer.

It is not a privileged subsystem.

The simulator has no direct access to:

- Database
- Pole State
- Incident Manager
- Ticket Manager

All interaction occurs through:

POST /api/v1/telemetry

This guarantees production behaviour.

---

# Architecture

```

Operator

↓

Simulation Panel

↓

Scenario Generator

↓

Telemetry Generator

↓

POST /telemetry

↓

Production Pipeline

↓

Dashboard

```

Every simulation is indistinguishable from real field telemetry.

---

# Simulation Lifecycle

Every simulation follows the same operational sequence.

```

Scenario Selected

↓

Network Prepared

↓

Telemetry Generated

↓

Production Pipeline

↓

Incident Localized

↓

Operator Responds

↓

Repair Simulated

↓

Restoration Verified

↓

Ticket Closed

```

No shortcuts exist.

---

# Simulator Goals

The simulator must demonstrate:

✓ Correct localization

✓ Correct grouping

✓ Correct ticket creation

✓ Correct restoration verification

✓ Correct confidence estimation

✓ Explainable reasoning

The simulator is not intended to benchmark rendering performance.

---

# Scenario Categories

The simulator supports three categories of scenarios.

## Category 1

Infrastructure Failures

Examples:

- Span Fault
- Transformer Fault
- Feeder Fault

These represent genuine electrical failures.

---

## Category 2

Telemetry Problems

Examples:

- Duplicate Packets
- Delayed Packets
- Missing Heartbeats
- Silent Firmware Devices

These validate robustness.

---

## Category 3

Operational Conditions

Examples:

- Scheduled Maintenance
- Missing Device
- Unknown Topology

These validate decision making.

---

# Simulation Panel

The Simulation Panel is available from the operator dashboard.

Purpose:

Allow reviewers to create realistic operating conditions without using developer tools.

The simulator should require no API clients, Postman collections or command-line utilities.

Everything should be controllable from the interface.

---

# Simulation Controls

The panel contains the following controls.

Fault Type

Dropdown

Supported values:

- Span Fault
- Transformer Fault
- Feeder Fault
- Device Failure
- Scheduled Outage
- Telemetry Noise

---

Transformer

Dropdown

Lists all available transformers.

---

Fault Location

Dropdown

Lists poles belonging to the selected transformer.

---

Noise Injection

Checkboxes

Available options:

✓ Duplicate Packets

✓ Delayed Messages

✓ Packet Loss

✓ Silent Firmware

✓ Missing Device

Multiple noise conditions may be combined.

---

Simulation Speed

Options:

- Real Time
- Accelerated (5×)
- Instant

Accelerated mode is recommended for demonstrations.

---

Inject Scenario

Primary action button.

Starts the simulation.

---

Reset Network

Secondary action button.

Returns every simulated pole to its initial operational state.

Clears all generated incidents and tickets.

---

# User Experience Goals

The reviewer should be able to:

1. Select a scenario.
2. Click one button.
3. Watch the entire pipeline execute.

No additional configuration should be required.

---

# Simulator Constraints

The simulator must never:

- Write directly to PostgreSQL.
- Create incidents manually.
- Modify ticket state.
- Change Pole State directly.
- Skip telemetry validation.

Every event must follow the production path.

---

# Success Criteria

The simulator is considered complete when:

✓ Every scenario produces realistic telemetry.

✓ Every scenario exercises the production pipeline.

✓ Every incident appears naturally.

✓ Every ticket closes through telemetry verification.

✓ No simulator-specific backend logic exists.

---

# Summary

The GridAssist Simulator is an operational training and evaluation environment rather than a testing shortcut.

By forcing every simulated event through the production telemetry pipeline, the simulator validates the behaviour of the complete system exactly as reviewers are expected to evaluate it.
