Fault Localization Strategy
Overview

GridAssist localizes electrical faults by reasoning about the observed state of the electrical network rather than attempting to directly detect broken conductors.

Pole-mounted IoT devices report only the condition of individual poles.

They do not observe the electrical line connecting two poles.

Consequently, the system must infer the condition of electrical spans (edges) from observations made at poles (nodes).

This distinction forms the core of the localization strategy.

The Engineering Problem

Each telemetry device reports the state of a single pole.

Possible observations include:

Power Lost
Power Restored
Heartbeat

However, the physical failure usually occurs between poles.

For example:

P1 ───── P2 ───── P3 ───── P4

      LIVE     LIVE    DARK    DARK

No sensor reports:

"The wire between P2 and P3 has broken."

Instead,

the system receives:

P3 → power_lost

P4 → power_lost

The objective is therefore not to identify failed poles.

The objective is to identify the most probable failed electrical span responsible for the observed outage.

Fundamental Observation

Power distribution networks are radial.

Electricity flows outward from the transformer.

When a conductor fails,

all downstream poles lose power,

while upstream poles remain energized.

This creates a measurable boundary:

LIVE

↓

LIVE

↓

LIVE

↓

DARK

↓

DARK

↓

DARK

The fault is inferred to exist on the electrical span separating the last energized pole from the first de-energized pole.

GridAssist refers to this transition as the Fault Frontier.

Fault Frontier Principle

A Fault Frontier is defined as:

The electrical edge connecting the last known energized pole to the first known de-energized pole.

Every localized span fault originates from identifying this frontier.

The frontier represents the transition between two regions:

Known Energized Region

↓

Fault Frontier

↓

Known De-energized Region

This allows GridAssist to infer edge failures using only node observations.

Root Cause Reasoning

GridAssist intentionally avoids treating every dark pole as an independent incident.

Instead,

the system searches for the single physical cause responsible for multiple observed symptoms.

Example:

P1  LIVE

P2  LIVE

P3  DARK

P4  DARK

P5  DARK

P6  DARK

Although four poles report loss of power,

only one conductor is assumed to have failed.

The resulting incident therefore represents one operational problem rather than four separate alerts.

This significantly reduces operator alarm fatigue.

Localization Pipeline

Localization occurs in several deterministic stages.

Stage 1

Update Pole State

Incoming telemetry updates the current energized state of each monitored pole.

No localization occurs during this stage.

Stage 2

Build Current Network View

The latest pole states are projected onto the electrical topology.

This produces a complete snapshot of the network.

Stage 3

Classify Failure Type

Before localizing a span,

GridAssist first determines the most probable failure category.

Possible categories include:

Span Fault
Distribution Transformer Fault
Feeder Fault
Sensor Failure
Scheduled Outage
Unknown

Different fault categories require different localization strategies.

Stage 4

Search for Fault Frontier

If the failure is classified as a span fault,

the topology is traversed from the transformer toward downstream poles.

Every transition from

LIVE

↓

DARK

is recorded.

Each transition becomes a candidate fault frontier.

Stage 5

Generate Candidate Spans

Each identified frontier becomes a candidate failed span.

Additional evidence is collected for every candidate.

Evidence includes:

downstream outage size
topology quality
missing telemetry
neighbouring observations
scheduled outage overlap
Stage 6

Confidence Assessment

Every candidate receives a confidence assessment based on available evidence.

Confidence is intentionally represented using operational categories rather than arbitrary percentages.

Possible values include:

High
Medium
Low

Every confidence level is accompanied by an explanation.

Stage 7

Incident Creation

The highest confidence candidate becomes the operational incident.

All downstream dark poles are grouped into this incident.

The resulting ticket represents one physical repair activity.

Known vs Inferred Topology

GridAssist distinguishes between two fundamentally different situations.

Surveyed Network

Where parent relationships are available,

the recorded electrical tree is trusted.

Localization confidence is naturally higher.

Inferred Network

Where topology is unavailable,

GridAssist constructs an inferred radial tree using surveyed GPS coordinates.

Because this topology represents an engineering assumption rather than surveyed infrastructure,

confidence is reduced.

The user interface clearly communicates this distinction.

Why Graph Algorithms Instead of AI?

Fault localization is intentionally implemented using deterministic graph reasoning.

This decision was made for four reasons.

Explainability

Every localization result can be reproduced.

Performance

Graph traversal is computationally inexpensive and satisfies the required response time.

Determinism

The same telemetry always produces the same localization result.

Trust

Operational infrastructure should not depend on probabilistic language model reasoning for safety-critical decisions.

Large Language Models are therefore excluded from localization.

Failure Scenarios

GridAssist accounts for several real-world situations.

Missing Devices

If a pole does not contain a telemetry device,

the localization engine expands the possible fault region rather than claiming precise localization.

Sensor Failure

If a single pole reports power loss while downstream poles remain energized,

the observation is treated as a probable device failure rather than a power outage.

Scheduled Outage

Scheduled maintenance is verified before incident creation.

Matching outages suppress operational alerts.

Duplicate Messages

Duplicate telemetry does not affect localization.

Delayed Messages

Delayed telemetry updates the network state but cannot independently generate historical incidents.

Missing Topology

Localization remains operational using inferred topology,

although confidence is reduced.

Computational Complexity

Localization is performed independently for each transformer.

Given N poles supplied by a transformer,

network traversal operates in:

O(N)

This satisfies the required operational performance while remaining computationally inexpensive for real-time operation.

Engineering Principles

The localization engine follows four engineering principles.

Root Cause Before Symptoms

One physical failure should produce one operational incident.

Explain Every Decision

Every localization result must be supported by observable evidence.

Honest Uncertainty

Incomplete information reduces confidence rather than producing false precision.

Deterministic First

Graph reasoning is preferred over probabilistic reasoning whenever the available information permits deterministic inference.
