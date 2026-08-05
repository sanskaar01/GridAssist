# INTERACTION MODEL SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Interaction Paradigm: "DIRECT GRAPH MANIPULATION & GUIDED NARRATIVE"

GridAssist Phase 2 completely discards the static admin dashboard interaction model. Instead, it adopts a **Live Simulation Theater Model**:
- The user operates directly on the **Electrical Topology Canvas**.
- Clicking any node or span directly inspects its electrical branch.
- Guided demonstration controls act like media playback / presentation slide advancement controls (`[ STEP FORWARD ]`, `[ REPEAT STEP ]`, `[ AUTO PLAY ]`).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ USER ACTION                     IMMEDIATE SYSTEM RESPONSE                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. Press [ RUN DEMO ]        ──► Canvas auto-focuses on active feeder       │
│                                  Particle flow begins                       │
│ 2. Press [ NEXT STEP ]       ──► Direct step execution + camera pan          │
│                                  Span glow activates + dark propagation     │
│ 3. Click Pole Node P-003     ──► Dims unrelated branches to 15% opacity     │
│                                  Opens compact floating inspection card     │
│ 4. Hover over "?" Icon        ──► Displays sleek SCADA graph symbol overlay  │
│ 5. Press [ RESET GRID ]      ──► Restores all nodes to live green state     │
│                                  Particles resume flowing downstream        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Viewing Modes

### Mode A: Guided Demonstration Mode (Primary Default)
- Designed specifically for evaluator demonstrations and interviews.
- The system pauses execution at every step, allowing the evaluator to observe the physical event on the graph before advancing.
- Controls: `[ PREV STEP ]`, `[ NEXT STEP → ]`, `[ RESET GRID ]`.

### Mode B: Cinematic Auto Playback Mode (Secondary)
- Runs scenario steps continuously with synchronized delay timers ($T+1.5\text{s}$ per step).
- Ideal for hands-free video recording or ambient screen display.
- Controls: `[ PAUSE ]`, `[ RESUME ]`, `[ SPEED: 0.5x / 1x / 2x / 5x ]`.

---

## 3. On-Demand Information Layering (Decluttering Strategy)

To keep 85%+ of the screen clear for the electrical graph, secondary UI elements are hidden until explicitly summoned:

1. **SCADA Legend:** Hidden inside a floating `?` button on the bottom-right of the viewport. Hovering or clicking reveals an overlay card; moving the mouse away auto-collapses it.
2. **Developer Diagnostics:** Hidden inside a collapsible top-left diagnostic badge (`[ DIAGNOSTICS: OFF ]`).
3. **Active Fault Queue:** A slim 40px left-side bar that expands only when active incidents exist.
4. **Fault Assessment & Decision Card:** Slides out from the right margin when an active incident node or span is clicked.
5. **Timeline Log:** A thin 24px bottom ticker bar that expands on hover.

---

## 4. Keyboard Shortcuts

- `Spacebar`: Advance to Next Scenario Step (in Guided Mode) or Pause/Resume (in Auto Playback).
- `R`: Reset Grid to 100% healthy operational state.
- `1` .. `5`: Quick-select scenario scripts.
- `?` or `H`: Toggle SCADA Graph Symbol Legend.
- `Escape`: Deselect node / collapse slideout panels.
- `D`: Toggle Developer Diagnostics Overlay.
