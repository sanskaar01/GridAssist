# ANIMATION ARCHITECTURE SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Core Animation Philosophy: "ANIMATION COMMUNICATES CAUSALITY"

In GridAssist Phase 2, animations are **not decorative**. They exist strictly to communicate physical causality:
- **Particle Motion = Electrical Current Flow**
- **Particle Halting = Physical Line Interruption**
- **Span Red Glow = Fault Frontier Isolation**
- **Node Color Transition = Operational State Shift**
- **Camera Pan = Operational Focus**

---

## 2. Animation Engine Pipeline

```
                                  ┌───────────────────────────────┐
                                  │   Animation Engine Core       │
                                  └───────────────┬───────────────┘
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                ▼                                 ▼                                 ▼
   Particle Subsystem (Canvas 2D)     Graph State Transitions (CSS/Framer)   Camera & Viewport (Matrix)
   • Particle position interpolation  • Node color fill transition (300ms)  • Smooth pan offset (600ms)
   • Dynamic velocity calculation     • Fault span red glow keyframes    • Scale matrix interpolation
   • Flow halting on dark edges       • Signal pulse animations           • Auto-focus target node
```

---

## 3. Particle Flow Animation Subsystem

### Physics & Motion Math
Power flow particles travel along line vectors from parent node $(x_1, y_1)$ to child node $(x_2, y_2)$.

- **Vector Distance:**  
  $$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$
- **Normalized Direction:**  
  $$u_x = \frac{x_2 - x_1}{d}, \quad u_y = \frac{y_2 - y_1}{d}$$
- **Particle Position at Frame $t$:**  
  $$p_x(t) = x_1 + u_x \cdot \left((v \cdot t + \text{offset}) \bmod d\right)$$  
  $$p_y(t) = y_1 + u_y \cdot \left((v \cdot t + \text{offset}) \bmod d\right)$$  
  where velocity $v = 45\,\text{pixels/sec}$.

### Halting Condition
If `isEnergized == false`, particle velocity $v$ drops to 0 instantly, and opacity fades out over 400ms.

---

## 4. Keyframe Animation Specifications

### 4.1 Fault Frontier Polyline Glow (`scada-glow-polyline`)
```css
@keyframes scada-glow-polyline {
  0% {
    stroke: #EF4444;
    filter: drop-shadow(0 0 4px #EF4444);
    stroke-dashoffset: 0;
  }
  50% {
    stroke: #F87171;
    filter: drop-shadow(0 0 16px #EF4444);
    stroke-dashoffset: -15;
  }
  100% {
    stroke: #EF4444;
    filter: drop-shadow(0 0 4px #EF4444);
    stroke-dashoffset: -30;
  }
}
```

### 4.2 Dark Node Pulse Keyframe (`scada-pulse-node`)
```css
@keyframes scada-pulse-node {
  0%, 100% {
    transform: scale(1.0);
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.8);
  }
  50% {
    transform: scale(1.25);
    box-shadow: 0 0 20px rgba(239, 68, 68, 1.0);
  }
}
```

---

## 5. Performance Criteria
- Render loop operates strictly inside `requestAnimationFrame()`.
- Maximum 150 active particles rendered simultaneously using lightweight canvas drawing paths.
- Target frame rate: **60 FPS** on std hardware.
