Explainable Decision Engine
Philosophy

GridAssist is not designed to automatically replace operator judgment.

Instead, it functions as an explainable decision support platform that transforms raw telemetry into 
evidence-backed operational recommendations.

Rather than asking the operator to trust an algorithm, GridAssist exposes the reasoning behind every recommendation.

Every operational recommendation must answer five questions before a crew is dispatched.

Decision Model

Every detected incident is represented internally as a Decision Card.

A Decision Card is the smallest operational unit within GridAssist.

Unlike traditional alarm systems that generate isolated alerts, a Decision Card combines evidence, localization, 
confidence, operational context and recommended action into a single explainable object.

The purpose of a Decision Card is to reduce operator cognitive load while preserving transparency.

Decision Lifecycle

Every Decision Card progresses through the following reasoning pipeline.

Observe
      ↓
Interpret
      ↓
Classify
      ↓
Localize
      ↓
Evaluate Confidence
      ↓
Recommend Action
      ↓
Verify

Each stage contributes additional information to the final operational recommendation.

Structure of a Decision Card

Every Decision Card is composed of six independent sections.

1. Fault Summary

Provides a concise description of the detected incident.

Example

Probable Span Fault

Between Pole P22 and Pole P23

Ward 12

PIN 208002

The summary is intentionally brief so that operators can understand the incident within a few seconds.

2. Evidence

Every localization result must be supported by observable facts.

Evidence consists only of information directly available to the system.

Example

✓ Pole P22 reports energized

✓ Pole P23 reports de-energized

✓ Forty-three downstream poles also report outage

✓ No scheduled maintenance overlaps this event

No assumptions are included in this section.

Evidence represents measurable observations only.

3. Assumptions

Some localization decisions require incomplete network information.

Whenever the system relies on inferred information, it is explicitly disclosed.

Example

• Electrical topology inferred from surveyed GPS coordinates

• Pole P26 has no telemetry device

• PIN code estimated from nearest surveyed pole

Assumptions increase transparency and prevent false certainty.

4. Confidence Assessment

Confidence reflects the reliability of the localization result.

GridAssist intentionally avoids arbitrary percentages.

Instead, confidence is represented using operational categories.

Possible values include

High

Medium

Low

Every confidence assessment includes an explanation.

Example

Confidence

High

Reason

Surveyed topology available

Complete telemetry

No conflicting observations

or

Confidence

Medium

Reason

Topology inferred

One missing telemetry device

Confidence therefore communicates both certainty and the reason behind that certainty.

5. Alternative Hypotheses

One of the core principles of GridAssist is that engineering decisions should explain not only what was chosen,
but also what was rejected.

Every localization therefore evaluates alternative explanations before generating a recommendation.

Example

Rejected Possibilities

Transformer Fault

Reason

Another downstream branch remains energized.

────────────────────────────

Scheduled Outage

Reason

No scheduled maintenance matches the affected feeder.

────────────────────────────

Sensor Failure

Reason

Multiple downstream poles report identical outage patterns.

This section significantly improves operator trust by making the reasoning process transparent.

6. Recommended Action

The final section converts technical analysis into operational guidance.

Example

Recommended Action

Dispatch nearest maintenance crew.

Navigate to midpoint between Pole P22 and Pole P23.

Estimated inspection distance

18 metres.

Estimated affected poles

43

Recommendations are intentionally operational rather than technical.

The system communicates actions instead of algorithms.

Explainability Principles

GridAssist follows five explainability principles.

Observable Evidence

Every recommendation must be supported by measurable observations.

No recommendation should rely on hidden reasoning.

Honest Uncertainty

Incomplete information reduces confidence rather than producing false precision.

The operator should always understand what is known and what is assumed.

Root Cause Focus

The system identifies the most probable physical cause rather than reporting every observed symptom.

One conductor failure should produce one operational recommendation.

Reproducibility

The same telemetry input must always produce the same Decision Card.

Operational behaviour should remain deterministic.

Human-Centred Reasoning

Decision Cards are written for control-room operators rather than software engineers.

Information is presented using operational language instead of implementation details.

Why Decision Cards?

Traditional monitoring systems often overwhelm operators with raw telemetry and isolated alarms.

GridAssist instead presents a single evidence-backed operational recommendation.

This approach provides several advantages:

Multiple telemetry events are grouped into one operational incident.
Every recommendation includes supporting evidence.
Assumptions are explicitly disclosed.
Alternative explanations are documented.
Confidence is explained rather than estimated.
Operators can make informed dispatch decisions within seconds.

The objective is not to automate human judgment.

The objective is to support better human decisions.

Design Principle

GridAssist does not ask operators to trust the software.

GridAssist gives operators enough evidence to trust their own decisions.
