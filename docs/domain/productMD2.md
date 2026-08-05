Module 2 — System Scope and Functional Architecture
System Overview

GridAssist is designed as an end-to-end decision support platform for low-voltage (LT) electricity distribution networks. 
Rather than functioning as a simple fault detector, the platform continuously observes telemetry from pole-mounted IoT devices, 
interprets network state, identifies probable fault locations, assists operators in dispatching field crews, and automatically 
verifies successful restoration using telemetry.

The system follows the operational lifecycle of a real electricity distribution control room.

Observe
      ↓
Understand
      ↓
Decide
      ↓
Respond
      ↓
Verify
      ↓
Learn

Each stage represents an independent responsibility within the platform.
This separation ensures that every subsystem has a clearly defined purpose and can evolve independently without
affecting unrelated components.

System Responsibilities
1. Observation Layer

The Observation Layer is responsible for collecting all information entering the system.

This includes:

Pole telemetry events
Scheduled outage information
Pole registry and transformer registry data
Simulator-generated telemetry
Public outage reports (optional corroborative signal)

At this stage, no decisions are made.

The responsibility of this layer is limited to receiving, validating, and storing incoming observations.

2. Understanding Layer

The Understanding Layer converts raw observations into an internal representation of the electrical network.

Responsibilities include:

Event validation
Duplicate removal
Message ordering using per-device sequence numbers
Handling delayed telemetry
Maintaining the current energized state of every pole
Building or inferring network topology
Localizing probable faults
Classifying fault types
Estimating confidence
Filtering false alarms

This layer represents the analytical core of GridAssist.

It is responsible for answering one question:

What most likely happened in the electrical network?

3. Decision Layer

Once the network state has been interpreted, GridAssist evaluates whether operator action is required.

Responsibilities include:

Incident grouping
Priority calculation
Severity estimation
Crew dispatch recommendation
Confidence reporting
Incident explanation

Rather than exposing raw telemetry, this layer converts technical information into operational decisions.

4. Response Layer

The Response Layer manages the lifecycle of every detected incident.

Each localized fault becomes a tracked operational ticket.

The lifecycle follows:

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

A ticket is never automatically closed based on manual operator input.

Verification always depends on successful restoration telemetry received from the affected poles.

5. Learning Layer

The current implementation intentionally does not perform automatic topology learning.

However, GridAssist stores sufficient operational history to support future improvements, including:

Historical outage correlation
Reliability statistics
Repeated failure locations
Topology refinement
Predictive maintenance research

This separation allows future machine learning capabilities to be introduced without modifying the deterministic localization engine.

Core Functional Modules

GridAssist is organized into the following functional modules.

Telemetry Gateway

Receives telemetry from IoT devices.

Responsibilities:

HTTPS endpoint
Request validation
Authentication (future)
Event buffering
Burst handling

Output:

Validated telemetry events.

State Engine

Maintains the latest known state of every monitored pole.

Possible states include:

Energized
De-energized
Unknown
Offline

The State Engine represents the current health of the electrical network at any moment.

Topology Engine

Represents the physical electrical network.

For transformers with known topology:

Uses recorded parent relationships.

For transformers with missing topology:

Constructs an inferred radial tree using geographic proximity to the transformer and neighbouring poles.

The inferred topology is clearly distinguished from surveyed topology throughout the system.

Fault Classification Engine

Determines the most probable failure category.

Supported fault classes include:

Span fault
Distribution transformer fault
Feeder fault
Sensor failure
Scheduled outage
Unknown

Classification occurs before precise localization.

Fault Localization Engine

Localizes the probable failed asset.

Rather than locating failed poles, the engine identifies the failed electrical edge separating energized and de-energized regions.

Outputs include:

Probable failed span
GPS coordinates
PIN code
Downstream poles affected
Confidence
Supporting evidence
Noise Suppression Engine

Prevents false-positive incidents.

Responsibilities include:

Sensor failure detection
Scheduled outage validation
Duplicate suppression
Delayed message handling
Heartbeat monitoring
Debounce window enforcement

This module exists to satisfy the operational requirement of maintaining operator trust.

Incident Manager

Groups multiple telemetry events into a single operational incident.

A single physical fault should generate one incident regardless of the number of affected poles.

Responsibilities include:

Incident grouping
Incident merging
Severity estimation
Priority ordering
Incident history
Ticket Manager

Tracks the operational lifecycle of every incident.

Responsibilities include:

Ticket creation
Status updates
Crew assignment
Verification
Closure

The Ticket Manager operates independently from the localization algorithm.

AI Communication Assistant

Large Language Models are intentionally excluded from fault localization.

The AI assistant is limited to communication tasks.

Responsibilities include:

Incident summaries
Operator handover notes
Crew dispatch summaries

If AI services become unavailable, deterministic templates are used instead.

Operational correctness is never dependent on an LLM.

Simulator Engine

Generates realistic electrical network behaviour for evaluation.

Supported simulations include:

Span faults
Distribution transformer faults
Feeder faults
Sensor failures
Scheduled outages
Duplicate messages
Delayed telemetry
Missing telemetry
Device recovery
Power restoration

The simulator communicates with the same ingestion endpoint used by real telemetry devices, ensuring that simulated events exercise the complete production pipeline.

Architectural Principles

Every GridAssist module follows the following principles.

Single Responsibility

Each module performs one clearly defined task.

Explainability

Every automated decision must be traceable to observable evidence.

Deterministic Reasoning

Operational decisions are based on graph algorithms and measurable system state rather than probabilistic language model reasoning.

Graceful Degradation

When information is incomplete, the system reduces confidence and communicates assumptions rather than 
failing silently or presenting false certainty.

Operational Simplicity

Every component exists to reduce operator workload, improve trust, or shorten restoration time.

Features that do not contribute to operational decision-making are intentionally excluded from the product.
