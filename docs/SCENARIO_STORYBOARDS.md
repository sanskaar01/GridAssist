# SCENARIO STORYBOARDS SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## Overview

Every simulation scenario is engineered as a **cinematic visual storyboard**. The visualization itself must tell the complete story of the outage, fault localization, and power restoration without requiring the user to read long paragraphs of text.

---

## Scenario 1: Single Span Overhead Conductor Break

### Visual Narrative
1. **Scene 1 (Healthy Baseline):** Feeder A and Distribution Transformers D-0101 & D-0102 are fully energized. Emerald particles (`#6EE7B7`) flow smoothly downstream along all 45 monitored poles.
2. **Scene 2 (Line Conductor Break):** Conductor break occurs on span $P_{002} \rightarrow P_{003}$. Span $P_{002} \rightarrow P_{003}$ flashes amber once, then turns into a thick, glowing red dashed polyline (`#EF4444`).
3. **Scene 3 (Downstream Darkness Cascade):** Nodes $P_{003}, P_{004}, P_{005}, P_{006}$ turn red sequentially from top to bottom. Power flow particles halt instantly beyond node $P_{002}$. Parallel branch $P_{007} \rightarrow P_{008}$ remains fully green with particles flowing.
4. **Scene 4 (AI Fault Frontier Isolation):** Camera pans smoothly to center on span $P_{002} \rightarrow P_{003}$. Unrelated branches dim to 20% opacity. Decision card slides in from the right: *Fault Frontier Isolated: Overhead Span P-002 -> P-003*.
5. **Scene 5 (Crew Dispatch & Restoration):** Blue repair marker `CREW-BLR-01` animates toward span $P_{002} \rightarrow P_{003}$. Telemetry restoration packet arrives. Red span glow fades, nodes transition back to green, power particles resume flowing downstream, and repair ticket closes automatically.

```
SCENARIO 1 TIMELINE & VISUAL FLOW:
T+0.0s [Healthy Flow] ───────► T+0.5s [Span P002->P003 Flash] ───────► T+1.0s [Downstream Dark Cascade]
                                                                                   │
T+3.0s [Ticket Closed & Flow Resumed] ◄─── T+2.5s [Crew Dispatched] ◄─── T+1.5s [AI Fault Frontier Isolated]
```

---

## Scenario 2: Multiple Independent Branch Faults

### Visual Narrative
1. **Scene 1:** Two separate line breaks occur on independent spur branches ($P_{002} \rightarrow P_{003}$ on Feeder Branch 1, and $P_{011} \rightarrow P_{012}$ under DT-0102).
2. **Scene 2:** Two distinct glowing red spans appear simultaneously on opposite sides of the grid topology.
3. **Scene 3:** Two independent dark pole clusters form beneath each respective failed span.
4. **Scene 4:** The Active Fault Queue displays two separate rows. Selecting Incident 1 highlights Branch 1 while dimming Branch 2; selecting Incident 2 reverses the highlight.

---

## Scenario 3: Distribution Transformer Blowout

### Visual Narrative
1. **Scene 1 (Transformer Fuse Blowout):** HT fuse on Distribution Transformer D-0102 blows out due to severe overload.
2. **Scene 2 (Global Subtree Loss):** Yellow transformer square D-0102 flashes crimson red with a 24px radial blur aura.
3. **Scene 3 (Total Subtree Darkness):** ALL 20 downstream poles beneath D-0102 turn crimson red simultaneously.
4. **Scene 4 (Global Particle Halt):** Power flow particles disappear across the ENTIRE sub-graph of D-0102, while neighboring transformer D-0101 remains 100% green and energized.
5. **Scene 5 (AI Decision Card):** Decision card reveals: *Distribution Transformer Failure (D-0102) — 20 Poles Affected*.

---

## Scenario 4: Sensor Anomaly (False Alarm Blocked)

### Visual Narrative
1. **Scene 1 (Telemetry Dropout):** IoT Sensor on Pole $P_{003}$ emits `POWER_LOST` telemetry.
2. **Scene 2 (Single Node Anomaly):** Pole $P_{003}$ turns amber (`#F59E0B`) with a warning badge.
3. **Scene 3 (Line Continuity Maintained):** Downstream child poles ($P_{004}, P_{005}$) **REMAIN EMERALD GREEN**.
4. **Scene 4 (Unbroken Power Flow):** Power flow particles **CONTINUE FLOATING THROUGH** child poles $P_{004}$ and $P_{005}$, proving physical continuity.
5. **Scene 5 (False Alarm Rejected):** No fault span glows red. Zero incident created. Decision Panel displays: *Sensor Anomaly Flagged — Downstream poles remain energized. False alarm blocked.*

---

## Scenario 5: Storm Cascade

### Visual Narrative
1. **Scene 1:** Severe weather event begins. Span A fails at $T+0\text{s}$.
2. **Scene 2:** 15 seconds later, high winds cause Span B on Feeder 2 to break.
3. **Scene 3:** 30 seconds later, DT-0102 HT fuse trips.
4. **Scene 4:** The topology map dynamically expands red fault zones while the timeline ticker records escalating events sequentially.

---

## Scenario 6: Field Power Restoration

### Visual Narrative
1. **Scene 1:** Lineman completes physical repair and emits `POWER_RESTORED` telemetry.
2. **Scene 2:** Dark nodes transition Green sequentially from root to leaf poles.
3. **Scene 3:** Power flow particles resume drifting down restored line segments.
4. **Scene 4:** Red fault span glow fades away. Ticket status transitions `VERIFYING` $\rightarrow$ `VERIFIED` $\rightarrow$ `CLOSED`.
