# VISUAL ATTENTION MODEL SPECIFICATION
**GridAssist Operations Theater — Selective Dimming & Focus Architecture**

---

## 1. Visual Attention Control Strategy

When an electrical grid fault occurs, the human eye must be guided immediately to the failure point without being distracted by healthy background branches.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ VISUAL ATTENTION LAYERING                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ • AFFECTED ELECTRICAL BRANCH: 100% Opacity + Full Glow + Red Polyline       │
│ • UNRELATED GRID BRANCHES:    15% Opacity (Selective Darkening)             │
│ • BACKGROUND GRID MATRIX:     5% Opacity Grid Lines                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Opacity Interpolation Rules

1. **Baseline State:** All grid branches render at `opacity = 1.0`.
2. **Active Incident Focus:**
   - Find all nodes in the subtree of the affected transformer $T_{\text{affected}}$.
   - For all nodes $N_i \notin T_{\text{affected}}$: interpolate `opacity` from `1.0` to `0.15` over 350ms.
3. **Reset Grid:** Interpolate `opacity` back from `0.15` to `1.0` over 300ms.
