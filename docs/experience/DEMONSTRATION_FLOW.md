# DEMONSTRATION FLOW SPECIFICATION
**GridAssist Operations Theater — Guided Demonstration Flow Engine**

---

## 1. Guided Mode Playback Architecture

Guided Demonstration Mode is the primary default experience for interviewers and evaluators:
- Step execution is strictly synchronous (`POST /api/v1/simulator/step-run`).
- The simulation pauses after each visual step, giving the presenter complete control over pacing.
- The `[ NEXT STEP → ]` prompt glows softly when the current step's visual animation finishes.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ GUIDED STEP CONTROL PIPELINE                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Presenter Clicks [ NEXT STEP → ]                                           │
│ └──► Trigger Synchronous API (POST /api/v1/simulator/step-run)              │
│      └──► Ingest Telemetry -> Run Graph Traversal -> Update DB State         │
│           └──► Trigger Canvas Animation Stage (Node flash -> Particle halt) │
│                └──► Auto-Pan Viewport Camera                                │
│                     └──► Reveal Mission Briefing HUD & Decision Card        │
│                          └──► Glow [ NEXT STEP → ] for Next Event           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Step Control Actions

- `NEXT STEP`: Advances to next scenario step synchronously.
- `PREV STEP`: Steps backward in narration history without re-triggering backend faults.
- `AUTO PLAY`: Toggles continuous 1.5-second automated playback mode.
- `RESET GRID`: Clears all active incidents/tickets and restores all nodes to live green state.
