# FLOATING SCADA HELP BUTTON & CONTEXTUAL LEGEND SPECIFICATION
**GridAssist Operations Theater — Unencumbered Canvas Real Estate Architecture**

---

## 1. Architectural Mandate & Replacement Rules

- **Mandate:** **PERMANENT LEGENDS ARE STRICTLY FORBIDDEN ON THE CANVAS.**
- **Replacement:** The permanent 8-line graph legend block in the bottom-left corner of `ElectricalTopologyCanvas.tsx` is completely removed.
- **New Floating Help Toggle:** Replaced by a compact, floating SCADA industrial `(?)` help button anchored to the canvas UI overlay.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FLOATING SCADA HELP BUTTON & DRAWERS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Top Right Overlay Anchor:                                                   │
│ ┌───────────────────┐                                                       │
│ │ [ ? Graph Legend ]│ ──► Floating Glass Button (34px x 34px)               │
│ └─────────┬─────────┘                                                       │
│           │ Mouse Hover / Click Toggle                                      │
│           ▼                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ GRAPH SYMBOLS & TOPOLOGY LEGEND CARD                                    │ │
│ │ • Substation 33kV Diamond (#3B82F6)                                      │ │
│ │ • Distribution Transformer Square (#F59E0B)                              │ │
│ │ • Live Pole Node (#10B981)                                              │ │
│ │ • Outage Dark Pole Node (#EF4444)                                        │ │
│ │ • Sensor Anomaly Warning (#F59E0B)                                      │ │
│ │ • Power Flow Particle Motion (#6EE7B7)                                  │ │
│ │ • Fault Frontier Glow Polyline (#EF4444)                                 │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Exhaustive Interaction Model & Animation Curves

### A. Idle State (Closed)
- **Visual Appearance:** Compact floating circular/square button ($34\text{px} \times 34\text{px}$) with a glowing blue/amber border (`#3B82F6`), rendering a crisp `?` icon.
- **Position:** Absolute anchored top-right canvas margin (`top: 16px, right: 16px, z-index: 1000`).
- **Canvas Impact:** Consumes **< 0.1%** of canvas workspace, granting 99.9% view to the topology graph.

### B. Mouse Hover Event (`onMouseEnter`)
- **Trigger:** Presenter hovers mouse cursor over the `(?)` button.
- **Action:** Legend panel slides out smoothly from right to left using Framer Motion.
- **Animation Specs:**
  - **Slide Vector:** $\Delta x = +20\text{px} \rightarrow 0\text{px}$.
  - **Opacity Fade:** $0.0 \rightarrow 1.0$.
  - **Duration:** **250ms**.
  - **Easing Curve:** `cubic-bezier(0.16, 1, 0.3, 1)` (Quartic Easing Out).

### C. Mouse Leave Event (`onMouseLeave`)
- **Trigger:** Presenter moves mouse cursor away from button and legend card.
- **Condition:** If panel is NOT pinned (`isPinned == false`), panel auto-collapses back to idle `(?)` button.
- **Duration:** **200ms** fadeout.

### D. Click-to-Pin Toggle (`onClick`)
- **Trigger:** Presenter clicks the `(?)` button.
- **Action:** Toggles `isPinned` state. When pinned, the legend panel stays open permanently until clicked again, featuring a small pin icon indicator (`📌`).
