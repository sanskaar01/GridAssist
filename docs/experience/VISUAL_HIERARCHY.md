# VISUAL HIERARCHY SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Visual Weight Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PRIMARY FOCUS (85% Screen Space):                                        │
│    • Animated Electrical Topology Canvas                                    │
│    • Glowing Red Fault Spans                                                │
│    • Dynamic Power Flow Particles                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. SECONDARY FOCUS (Top Header Chrome):                                     │
│    • SCADA Status Bar & Pipeline Metrics Ticker                             │
│    • Scenario Controls & Mode Toggle Switch                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. TERTIARY FOCUS (Floating Contextual Overlays):                           │
│    • Operational Mission Briefing HUD Banner                                │
│    • Collapsible Decision Card Slideout (Right Margin)                      │
│    • Collapsible Incident Queue Drawer (Left Margin)                        │
│    • Floating SCADA Symbol Legend ("?" Button)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dynamic Panel Visibility Matrix

| Operational State | Left Queue | Right Decision Panel | Mission Briefing HUD | Bottom Timeline | Canvas Viewport |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Grid Baseline (Healthy)** | Collapsed | Collapsed | Collapsed | Collapsed Ticker | 100% Fullscreen |
| **Guided Mode Execution** | Compact Indicator | Slides Out on Selection | Active Mission Briefing | Step Timeline Bar | 85% Workspace |
| **Incident Clicked** | Highlighted | Full Evidence Report | Active Briefing | Asset Log | Auto-Panned Focus |
| **Reset Grid Clicked** | Collapsed | Collapsed | Retracted | Reset Milestone | 100% Fullscreen |

---

## 3. Contrast & Z-Index Layering

- `z-index: 0`: HTML5 Canvas Renderer (`ElectricalTopologyCanvas`).
- `z-index: 10`: Top SCADA Status Bar & Simulation Control Panel.
- `z-index: 20`: Operational Mission Briefing HUD Banner.
- `z-index: 30`: Collapsible Left Queue & Right Decision Slideout Panels.
- `z-index: 100`: Floating SCADA Help Overlay & Dev Diagnostics.
