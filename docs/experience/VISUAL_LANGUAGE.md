# VISUAL LANGUAGE & CINEMATIC DESIGN SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Core Visual Philosophy: "SHOW FIRST, EXPLAIN SECOND"

GridAssist is an **AI-powered visual electrical fault localization simulator**. The visual language must communicate the operational state of a high-voltage distribution grid instantly. An evaluator sitting 3 meters away from the display screen should immediately recognize:
1. Power is flowing through energized feeders.
2. An overhead conductor break or transformer outage occurs.
3. Power particle movement halts along the affected branch while adjacent branches remain live.
4. The AI Fault Localization Engine isolates the exact fault frontier span.
5. A field crew is dispatched and power is restored.

Without reading a single line of text or paragraph of documentation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ OLD DIRECTION (TEXT-HEAVY DASHBOARD):                                      │
│ [60% Workspace: Briefings, Debug Boxes, Telemetry Lists, Incident Logs]     │
│ [40% Workspace: Miniature 6-Pole Canvas Widget]                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ NEW DIRECTION (CINEMATIC OPERATIONS THEATER):                               │
│ [85% Workspace: Dominating Connected Electrical Grid Topology Graph]        │
│ [15% Floating Minimal Chrome: Collapsible HUD, Help Overlay, Sleek Controls]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Palette & SCADA Color Semantics

| Semantic State | Hex Color | Visual Effect | SCADA Meaning |
| :--- | :--- | :--- | :--- |
| **Grid Deep Space** | `#070A0F` | Dark matte background | Primary workspace baseline |
| **Panel Surface** | `#0E131F` | Subtle 1px `#1E2638` border | Non-intrusive container chrome |
| **Energized Conductor** | `#10B981` | 2px solid line + 4px glow | Live MV overhead distribution line |
| **Power Particle** | `#6EE7B7` | 3px floating glowing sphere | Active AC current flow |
| **Dark Conductor** | `#333B4D` | 1.5px dashed muted line | De-energized unpowered line segment |
| **Fault Frontier Span** | `#EF4444` | 5px glowing red polyline | Conductor break / isolated fault |
| **Transformer Node** | `#F59E0B` | 28px industrial square | 11kV / 415V Distribution Transformer |
| **Live Pole Node** | `#10B981` | 14px glowing emerald circle | Energized monitored pole |
| **Dark Pole Node** | `#EF4444` | 14px crimson red pulse | De-energized dark pole |
| **Sensor Anomaly** | `#F59E0B` | 14px amber warning node | False telemetry / hardware dropout |
| **Crew Dispatch** | `#3B82F6` | 16px blue animated marker | En-route field repair vehicle |

---

## 3. Node & Edge Symbol System

### 3.1 Substation Node
- **Symbol:** Dual-concentric industrial diamond ($42\text{px} \times 42\text{px}$) `#3B82F6`.
- **Glow:** Constant 12px outer radial aura representing primary 33kV grid feed.

### 3.2 Distribution Transformer (DT)
- **Symbol:** Industrial yellow square ($28\text{px} \times 28\text{px}$) `#F59E0B`.
- **Internal Mark:** Monospace `DT` code in black bold text (`#000000`).
- **Fault State:** Flashes crimson red (`#EF4444`) with 20px radial blur when internal HT fuse blows.

### 3.3 Monitored Pole Node
- **Symbol:** 14px circular node with 2px dark border `#070A0F`.
- **Live State:** Solid Emerald `#10B981` with 6px soft glow.
- **Dark State:** Solid Crimson `#EF4444` with slow 1.8-second opacity pulse keyframe.
- **Sensor Anomaly State:** Solid Amber `#F59E0B` with warning icon, maintaining green line continuity downstream.

---

## 4. Typography & Information Density Hierarchy

1. **Grid Monospace Header (Primary Code):** `JetBrains Mono`, `Roboto Mono`, or `Space Mono` for asset codes (`D-0101`, `P-003`), fault metrics, coordinates, and sequence numbers.
2. **Minimal Operational Text:** Dense, crisp, uppercase headers (`OPERATIONAL GRAPH`, `FEEDS: 33kV MAIN`).
3. **No Decorative Filler:** Paragraph text is completely removed from the primary viewport. Detailed decision card evidence is kept inside a collapsible right-hand slideout panel.

---

## 5. Visual Hierarchy Rules

- **Level 1 (Dominant Eye Attraction):** The glowing electrical network topology graph occupying 85%+ of the viewport.
- **Level 2 (Secondary Focus):** Active fault frontier span (`#EF4444`) and power flow particle movement.
- **Level 3 (Tertiary Floating Controls):** Compact top SCADA control bar and floating bottom timeline drawer.
- **Level 4 (Hidden / On-Demand):** Developer diagnostics, graph symbol legend (revealed via `?` key or floating icon), and deep decision evidence logs.
