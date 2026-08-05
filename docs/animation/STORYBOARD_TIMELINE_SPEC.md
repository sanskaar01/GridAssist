# STORYBOARD TIMELINE & INTERRUPT HANDLING SPECIFICATION
**GridAssist Operations Theater — Stage-by-Stage Motion Sequence & State Dependency**

---

## 1. Master Storyboard Stage Timeline Matrix

```
STAGE & TIMESTAMP          CANVAS MOTION BEHAVIOR                   DOM & UI ANIMATION                STATE BINDING & DEPENDENCY
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Stage 1: Baseline Flow     • Particles float smoothly at 45 px/s.   • Header SCADA LEDs green.        • FSM State: IDLE.
(T+0.0s)                   • Camera wide overview 1.0x.             • Side drawers collapsed.         • Dependency: Grid initialized.

Stage 2: Ingestion         • Target pole flashes Amber once (150ms).• Mission Briefing HUD slides down• FSM State: STAGE_LEAD_IN ->
(T+1.5s)                   • Span stroke widens to 3.5px.           • Header status -> Telemetry Recv.• TELEMETRY_INGESTION.

Stage 3: Outage Cascade    • Target pole turns Dark Red (#EF4444).  • Active Fault Queue drawer opens • FSM State: VISUAL_OUTAGE_CASCADE.
(T+2.5s)                   • Particles HALT instantly on branch.    • Outage counter badge increments.• Dependency: Stage 2 complete.
                           • Particles fade out (400ms).

Stage 4: AI Localization   • Camera auto-pans to span (650ms).      • Decision Evidence Card slides out• FSM State: AI_FRONTIER_LOCALIZATION.
(T+4.0s)                   • Span glows red (#EF4444, 16px blur).   • Evaluator reads evidence.       • Dependency: Camera pan finished.
                           • Unrelated branches dim to 15% opacity.

Stage 5: Repair Dispatch   • Blue crew marker moves along line.     • Repair Ticket status -> IN_PROG • FSM State: CREW_DISPATCH.
(T+6.0s)                   • Span glow pulses softly.               • Dispatch log entry appended.

Stage 6: Power Restored    • Restoration wave travels down branch.  • Briefing HUD updates -> Restored• FSM State: POWER_RESTORATION ->
(T+8.0s)                   • Nodes turn Green sequentially.         • Ticket status -> CLOSED.        • COMPLETED.
                           • Particles accelerate (90px/s -> 45px/s).
```

---

## 2. Exhaustive Interruption & Race Condition Contracts

### Contract A: User Clicks `[ NEXT STEP ]` Rapidly (Double Click)
- **Rule:** If presenter clicks `[ NEXT STEP ]` while a stage animation (e.g. 650ms camera pan or 400ms particle fade) is actively running:
  1. The current stage's animations snap to their final completed states instantly ($s \leftarrow s_{\text{target}}, dx \leftarrow dx_{\text{target}}$).
  2. The next stage's visual lead-in stage begins immediately without frame drop or animation overlap.
  3. No animations run concurrently across two different storyboard stages.

### Contract B: User Clicks `[ RESET GRID ]`
- **Rule:** Clicking `RESET GRID` overrides all active scenario playback:
  1. Cancel all active `requestAnimationFrame` interpolation loops.
  2. FSM state resets to `IDLE`.
  3. All nodes transition to `LIVE` green state over 300ms.
  4. Camera glides back to default overview bounds ($s = 1.0\times, dx = 50, dy = 30$) over 650ms.
  5. Mission Briefing HUD and Decision Card slide out of screen.

### Contract C: Presenter Toggles `AUTO PLAY`
- **Rule:** In `AUTO PLAY` mode, the Scenario FSM automatically advances to the next step when the current stage's visual animations finish **PLUS** a 1.5-second evaluation pause. Toggling `AUTO PLAY` off pauses automatic step advancement after the current step completes.
