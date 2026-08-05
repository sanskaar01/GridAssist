# ELECTRICAL EFFECTS & VISUAL SIGNATURES SPECIFICATION
**GridAssist Operations Theater — Node Keyframe & Span Glow Architecture**

---

## 1. Visual Effect Specifications Matrix

| Visual Effect | Target Object | Visual Properties & Color | Duration & Timing | Trigger Condition |
| :--- | :--- | :--- | :--- | :--- |
| **Fault Frontier Red Glow** | Isolated Line Break Span | `#EF4444` Crimson line (5px width) + `#EF4444` shadowBlur (16px) + Animated dash line `[8, 6]` offset | Continuous pulse keyframe (1.5s loop duration) | Isolated fault frontier span identified by Decision Engine |
| **Dark Node Radial Pulse** | Outage Pole Node | `#EF4444` node fill + 1.8s radial expansion keyframe (`scale 1.0 -> 1.25`) | Continuous pulse loop | PoleState -> DARK |
| **Sensor Anomaly Ring** | Anomaly Pole Node | `#F59E0B` Amber node fill + 2.0s slow warning aura ring | Continuous warning loop | Single dark pole with live child poles |
| **Substation Diamond Glow** | Substation `SUB-01` | `#3B82F6` Royal Blue $32\text{px}$ diamond + 14px radial aura | Continuous ambient glow | Grid energized state |
| **Restoration Wave Flash** | Restored Subtree Branch | Emerald Green `#10B981` line flash (6px width) | Single 400ms flash pass | Power restoration telemetry step |

---

## 2. Keyframe Animation Formulas

### A. Fault Frontier Animated Dashed Polyline
```css
@keyframes scada-glow-polyline {
  0% {
    stroke: #EF4444;
    filter: drop-shadow(0 0 4px #EF4444);
    stroke-dashoffset: 0;
  }
  50% {
    stroke: #F87171;
    filter: drop-shadow(0 0 18px #EF4444);
    stroke-dashoffset: -15;
  }
  100% {
    stroke: #EF4444;
    filter: drop-shadow(0 0 4px #EF4444);
    stroke-dashoffset: -30;
  }
}
```

### B. Dark Node Radial Pulse
$$R(t) = R_{\text{base}} \cdot \left(1 + 0.25 \cdot \sin\left(\frac{2\pi \cdot t}{1.8}\right)\right)$$
$$\text{shadowBlur}(t) = 6 + 14 \cdot \sin^2\left(\frac{\pi \cdot t}{1.8}\right)$$

---

## 3. Forbidden Visual Anti-Patterns
- ❌ Fast strobe flashing (< 300ms cycle) — violates industrial SCADA safety guidelines.
- ❌ Random color shifts (stick strictly to `#10B981` Live Emerald, `#EF4444` Outage Red, `#F59E0B` Warning Amber, `#3B82F6` Substation Blue).
- ❌ Blinking text labels.
