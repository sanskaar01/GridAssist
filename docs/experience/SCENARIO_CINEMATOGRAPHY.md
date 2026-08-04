# SCENARIO CINEMATOGRAPHY SPECIFICATION
**GridAssist Operations Theater — Cinematography & Framing Layer**

---

## 1. Framing Architecture

The **Scenario Cinematography Layer** manages visual composition, focal framing, and visual depth during simulation playback.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CINEMATIC FRAMING MATRIX                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. WIDE ESTABLISHING SHOT:                                                  │
│    • Frames the entire 47-node connected feeder network.                    │
│    • Used at initial load & after reset grid operations.                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. MEDIUM FRONTIER SHOT:                                                    │
│    • Frames the active Distribution Transformer & target fault span.        │
│    • Positions asset at top-center 33% centroid of canvas viewport.        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. CLOSE INSPECTION SHOT:                                                   │
│    • Frames single pole hardware anomaly or lineman crew dispatch marker.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Lighting & Glow Depth Controls

- **Ambient Workspace:** Dark matte background `#070A0F`.
- **Primary Energy Glow:** Emerald radial aura (`#10B981`, 6px shadow) around live poles.
- **Fault Frontier Highlights:** Crimson red radial aura (`#EF4444`, 16px shadow) around failed line segments.
