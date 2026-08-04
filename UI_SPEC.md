# UI_SPEC.md

# GridAssist Operator Console

Version: 1.0

Status: Approved

---

# Purpose

The GridAssist Operator Console is the primary interface used by electricity distribution control room operators.

Its purpose is not to expose technical system internals.

Its purpose is to help an operator answer five questions within seconds.

1. What happened?
2. Where did it happen?
3. How serious is it?
4. Why does the system believe this?
5. What should happen next?

Every UI decision should improve the operator's ability to answer these questions.

---

# Design Philosophy

The interface is intentionally designed for operational decision making rather than engineering inspection.

The operator is assumed to:

- work under time pressure
- manage multiple simultaneous incidents
- have limited technical knowledge of software
- understand electrical operations
- require confidence before dispatching repair crews

The interface therefore prioritizes clarity over density.

---

# Primary User

Primary User

Control Room Operator

Responsibilities

- Monitor incoming faults
- Assign repair crews
- Track restoration
- Verify operational status
- Escalate severe incidents

The operator is not expected to interpret telemetry packets or debug software.

---

# Secondary User

Field Engineer / Lineman

Responsibilities

- Receive repair ticket
- Navigate to suspected fault
- Repair infrastructure
- Mark repair complete

The field engineer interacts only with ticket information.

---

# Information Hierarchy

Information should appear in order of operational importance.

Priority 1

Current active incidents

Priority 2

Fault location

Priority 3

Severity

Priority 4

Recommended action

Priority 5

Engineering explanation

Priority 6

Historical information

---

# Dashboard Layout

The dashboard consists of four primary regions.

--------------------------------------------------------

Top Navigation Bar

--------------------------------------------------------

Incident Panel

|

|

Network Map

|

|

|

Decision Card

--------------------------------------------------------

Bottom Status Bar

--------------------------------------------------------

Every region has one responsibility.

---

# Top Navigation Bar

Purpose

Provide immediate operational awareness.

Displays

- GridAssist logo
- Current date & time
- System Health
- Healthy Devices
- Offline Devices
- Active Incidents
- Simulator Status

Items intentionally omitted

- User Profile
- Notifications
- Settings
- Theme Switcher

Reason

The assignment evaluates operational workflows.

Administrative functionality is outside scope.

---

# Incident Panel

Purpose

Provide a prioritized list of operational incidents.

Incidents are sorted by:

1. Severity
2. Affected Poles
3. Detection Time

Alphabetical ordering is prohibited.

---

Each Incident Card displays:

- Fault Type
- Confidence Badge
- Transformer ID
- Ward
- PIN Code
- Affected Poles
- Detection Time
- Current Ticket Status

Clicking an incident updates:

- Network Map
- Decision Card

---

# Incident Colors

Critical

Red

High

Orange

Medium

Yellow

Low

Blue

Closed incidents never appear in the active list.

---

# Confidence Badges

Confidence is communicated using language rather than percentages alone.

Examples

HIGH

"Surveyed topology confirms the fault location."

MEDIUM

"Location inferred using geographical topology."

LOW

"Missing telemetry increases uncertainty."

The operator should understand why confidence changes.

---

# Network Map

Purpose

Visualize the affected electrical network.

Technology

React Leaflet

OpenStreetMap

---

The map displays:

- Poles
- Electrical spans
- Distribution transformers
- Feeders
- Active fault location
- Repair destination

---

Pole Colors

Green

Live

Red

Dark

Gray

Unknown

Blue

Offline Device

---

Fault Span

The suspected failed span is highlighted using a thick red line.

This is the primary visual focus.

---

Navigation Marker

The map also displays a navigation marker.

This marker represents the GPS coordinates sent to the repair crew.

The navigation point is calculated from the localized fault span.

---

Decision Card

Purpose

Explain why the system reached its conclusion.

The Decision Card is the most important component in the application.

It transforms engineering reasoning into operational understanding.

---

Each Decision Card contains

Location

Fault Type

Confidence

Evidence

Rejected Alternatives

Assumptions

Recommended Action

AI Summary

---

Example

---------------------------------------------------

Probable Span Fault

Between

Pole P22

↓

Pole P23

Confidence

HIGH

Evidence

• P22 remained LIVE

• P23 reported POWER_LOST

• 43 downstream poles dark

Rejected Alternatives

• Transformer failure rejected

• Sensor failure rejected

Recommended Action

Dispatch Crew

Estimated Location

12.847391

77.633182

---------------------------------------------------

---

Why Evidence Matters

Operators should never trust software blindly.

Showing evidence allows operators to validate the recommendation before dispatching a repair crew.

---

Why Rejected Alternatives Matter

Showing only the final answer creates black-box behaviour.

Instead,

GridAssist explains why competing hypotheses were rejected.

Example

Rejected

Transformer Failure

Reason

Several upstream poles remain energized.

This increases operator trust.

---

Bottom Status Bar

Purpose

Provide operational awareness without distracting from active incidents.

Displays

- Last Telemetry Received
- Queue Status
- Localization Engine Status
- AI Service Status
- Database Status

This allows operators to quickly distinguish infrastructure failures from software failures.

---

Loading States

Every component defines an explicit loading state.

Dashboard

Skeleton cards

Map

Loading overlay

Decision Card

Placeholder sections

No blank screens are permitted.

---

Empty States

When no incidents exist:

Display

"No active electrical faults detected."

Show current healthy device count.

Do not display empty tables.

---

Error States

If the backend becomes unavailable:

Display

"Unable to communicate with GridAssist backend."

The application must not silently fail.

---

Polling Behaviour

The dashboard refreshes every five seconds.

Only changed data should update.

The map should not fully re-render.

Camera position should remain stable unless a new incident is selected.

---

Accessibility

The interface should remain usable under stressful operational conditions.

Requirements

- Large click targets
- High contrast colors
- Readable typography
- Keyboard accessibility where practical
- Consistent spacing
- Avoid information overload

---

Features Intentionally Excluded

The following features are deliberately omitted.

- User authentication
- Historical analytics dashboards
- Battery trend graphs
- Firmware management
- Device configuration
- Notification center
- Export to PDF
- CSV downloads
- Theme customization
- Role management

Reason

These features do not improve operational fault localization or repair workflow.

Their exclusion keeps the interface focused on the assignment objectives.

---

Summary

The GridAssist Operator Console is designed as an operational decision-support interface.

Every screen element exists because it helps operators detect, understand or resolve electrical faults more effectively.

The interface intentionally favors clarity, explainability and operational trust over feature richness or visual complexity.
