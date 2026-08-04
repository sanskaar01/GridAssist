# SINGLE SOURCE OF TRUTH (SSOT) MATRIX
**GridAssist Operations Theater — Experience Architecture Consolidation**

---

## 1. Subsystem Ownership & SSOT Designation

To eliminate duplicated responsibilities and conflicting specifications, every experience subsystem is assigned to **exactly one primary owner document**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SUBSYSTEM                   PRIMARY OWNER DOCUMENT (SSOT)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Viewport Camera & Pan-Zoom  ──► CAMERA_LANGUAGE.md                           │
│ Scenario Timeline & Stages  ──► SCENARIO_CHOREOGRAPHY.md                     │
│ Physical Motion & Velocity  ──► MOTION_LANGUAGE.md                           │
│ Screen Real Estate & Chrome  ──► UI_INFORMATION_HIERARCHY.md                 │
│ Selective Dimming & Focus   ──► VISUAL_ATTENTION_MODEL.md                    │
│ Electrical Network Layout   ──► NETWORK_TOPOLOGY_SPEC.md                     │
│ State Machine Transitions   ──► SCENARIO_STATE_MACHINE.md                    │
│ Guided Mode Control Flow    ──► DEMONSTRATION_FLOW.md                        │
│ Shot Framing & Lighting     ──► SCENARIO_CINEMATOGRAPHY.md                   │
│ Canvas 2D Implementation    ──► docs/operations-theater/POWER_FLOW_RENDERER.md
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Subsystem Ownership Boundary Rules

### A. Camera & Viewport Behavior
- **Primary Owner:** `CAMERA_LANGUAGE.md`
- **Scope:** Owns 2D transformation matrix math, zoom scale limits ($0.5\times \dots 2.5\times$), focus centroid formulas, and pan interpolation curves.
- **Rule:** No other document may redefine camera matrix math or scale multipliers. `SCENARIO_CINEMATOGRAPHY.md` references `CAMERA_LANGUAGE.md` for shot framing presets.

### B. Timeline & Storyboard Pacing
- **Primary Owner:** `SCENARIO_CHOREOGRAPHY.md`
- **Scope:** Owns exact timestamped stage transitions ($T+0\text{s} \dots T+8\text{s}$), event durations, and lead-in delays.
- **Rule:** Scenario scripts in `scenarioScripts.ts` MUST conform 1-to-1 with stage timings defined in `SCENARIO_CHOREOGRAPHY.md`.

### C. Motion Physics & Velocity
- **Primary Owner:** `MOTION_LANGUAGE.md`
- **Scope:** Owns physical particle velocity ($v = 45\,\text{px/s}$), instant halting physics, dark node pulse keyframe frequencies (1.8s), and forbidden motion anti-patterns.
- **Rule:** `POWER_FLOW_RENDERER.md` implements these velocity constants without altering their values.

### D. UI Information Hierarchy & Workspace Allocation
- **Primary Owner:** `UI_INFORMATION_HIERARCHY.md`
- **Scope:** Owns workspace percentage allocation (**85%+ Canvas Viewport**), Z-index layering, collapsible panel trigger rules, and developer diagnostics toggle.
- **Rule:** No UI panel may occupy default screen real estate unless explicitly authorized by `UI_INFORMATION_HIERARCHY.md`.

### E. Electrical Network Topology
- **Primary Owner:** `NETWORK_TOPOLOGY_SPEC.md`
- **Scope:** Owns the 47-node connected tree structure ($33\text{kV Substation} \rightarrow \text{Feeder F-07} \rightarrow \text{DT D-0101} \dots$), node coordinates, branch skews, and terminal pole crossarms.
- **Rule:** Replaces previous standalone mini-tree specifications across all rendering documents.
