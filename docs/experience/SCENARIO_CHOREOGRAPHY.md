# SCENARIO CHOREOGRAPHY SPECIFICATION
**GridAssist Operations Theater — Scenario Choreography Layer**

---

## 1. Concept: Scenario Choreography vs Rendering Code

Scenario Choreography defines **when and how events occur in time**. It acts as the director's script for the simulation, specifying exact timestamped sequences before any canvas drawing code executes.

---

## 2. Master Storyboard: Single Span Line Break Scenario

```
TIMESTAMP   CHOREOGRAPHY STAGE               VISUAL & CAMERA BEHAVIOR                   UI & HUD STATE
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
T+0.0s      1. Baseline Flow                 Camera centered at 1.0x scale.             Header shows healthy.
                                             Green particles flow smoothly.              Panels collapsed.

T+1.5s      2. Ingestion & Flashing          Pole P-003 flashes amber once (150ms).      Briefing HUD slides down:
                                             Line P-002 -> P-003 stroke widens.         "Telemetry: P-003 POWER_LOST"

T+2.5s      3. Downstream Darkness Cascade   P-003, P-004, P-005 turn dark red (400ms). Particles halt on branch.
                                             Parallel branches remain 100% green.       Queue slides out: 1 Outage.

T+4.0s      4. AI Frontier Localization      Camera pans smoothly to span P002->P003.   Decision Card reveals:
                                             Span P002->P003 glows bright red.          "Fault Frontier Isolated.
                                             Non-affected branches dim to 15%.          Transformer Failure Rejected."

T+6.0s      5. Repair Dispatch               Blue repair marker CREW-BLR-01 moves       Ticket status -> IN_PROGRESS.
                                             along line to span P-002 -> P-003.         Timeline appends dispatch.

T+8.0s      6. Power Restoration             POWER_RESTORED packet arrives.             Ticket status -> VERIFIED.
                                             Dark nodes transition Red -> Green.        Briefing HUD updates:
                                             Particles resume floating downstream.      "Grid Restored & Verified."
```

---

## 3. Scenario Choreography Rules

1. **No Instant State Jumps:** Every state transition MUST have a visual lead-in stage (e.g. Amber Flash $\rightarrow$ Color Shift $\rightarrow$ Particle Halt $\rightarrow$ Frontier Glow).
2. **Camera Focus Follows Causality:** The camera automatically glides to the asset where the event is occurring.
3. **Information Delayed Until Visual Completion:** Decision Card text is revealed ONLY after the fault frontier red glow animation completes, ensuring the evaluator *sees* the fault before reading about it.
