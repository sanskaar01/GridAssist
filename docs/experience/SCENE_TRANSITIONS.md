# SCENE TRANSITIONS SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Cinematic Scene Transition Rules

State changes in GridAssist Phase 2 must follow strict cinematic transition curves:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENE TRANSITION TIMELINE                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Telemetry Ingestion (T+0ms): Node flash amber/red (150ms)                │
│ 2. Downstream Propagation (T+200ms): Child nodes transition red (400ms)    │
│ 3. Particle Flow Halting (T+300ms): Green particles fade to 0 opacity       │
│ 4. Fault Span Glow (T+500ms): Polyline red glow & dash offset activates    │
│ 5. Camera Auto-Focus (T+600ms): Matrix pan & scale interpolates to asset   │
│ 6. Briefing HUD Reveal (T+800ms): Slideout panel reveals deduction text     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Easing & Curves

- **Camera Pan Easing:** `cubic-bezier(0.25, 1, 0.5, 1)` (Quart Out).
- **Node Color Transition:** Linear RGB color interpolation over 300ms.
- **HUD Briefing Slide-In:** Framer Motion spring (`stiffness: 300`, `damping: 25`).
