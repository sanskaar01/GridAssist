# PARTICLE PHYSICS & MOTION SPECIFICATION
**GridAssist Operations Theater — Electrical Current Flow Particle Subsystem**

---

## 1. Subsystem Ownership & Core Physics Principles

The Particle Physics Subsystem simulates high-voltage electrical current flow along overhead distribution lines ($33\text{kV Substation} \rightarrow \text{Feeders} \rightarrow \text{Transformers} \rightarrow \text{Poles}$).

- **Core Rule:** **Particle Motion = Electrical Power Flow.**
- **Energized Line Spans (`isEnergized == true`):** Particles float continuously downstream along parent-to-child line vectors at constant velocity $v = 45\,\text{pixels/sec}$.
- **De-energized Line Spans (`isEnergized == false`):** Particle velocity drops to $0\,\text{pixels/sec}$ instantly, and opacity fades from `1.0` to `0.0` over **400ms**.

---

## 2. Particle Spawning & Vector Motion Math

For an electrical edge span between parent node $(x_1, y_1)$ and child node $(x_2, y_2)$:

- **Span Vector Length:**  
  $$L = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$
- **Unit Direction Vectors:**  
  $$u_x = \frac{x_2 - x_1}{L}, \quad u_y = \frac{y_2 - y_1}{L}$$
- **Particle Count per Edge:** Exactly 2 particles per energized line span, evenly spaced at distance $\Delta d = \frac{L}{2}$.
- **Particle Trajectory Equation at Time $t$:**  
  $$d_{\text{particle}}(t) = (v \cdot t + i \cdot \Delta d) \bmod L \quad \text{for particle index } i \in \{0, 1\}$$  
  $$x_{\text{particle}}(t) = x_1 + u_x \cdot d_{\text{particle}}(t)$$  
  $$y_{\text{particle}}(t) = y_1 + u_y \cdot d_{\text{particle}}(t)$$

---

## 3. Visual Attributes & Styles

- **Particle Diameter:** $5.0\text{px}$ circle (`ctx.arc(px, py, 2.5, 0, 2*PI)`).
- **Core Fill Color:** `#6EE7B7` (Bright Mint Emerald).
- **Radial Glow Shadow:** `#10B981` (Emerald Green) with `ctx.shadowBlur = 6`.
- **Opacity State:** `1.0` when energized; interpolates to `0.0` over 400ms when line becomes dark.

---

## 4. Sensor Anomaly Exception Rules

When a pole $P_k$ experiences a **Sensor Anomaly** (telemetry reports `POWER_LOST`, but all downstream child poles remain `LIVE`):
- Power flow particles **DO NOT HALT** on the parent edge $(P_{\text{parent}}, P_k)$ or child edges $(P_k, P_{\text{child}})$.
- Particles continue floating through $P_k$ at full velocity ($45\,\text{px/s}$).
- The node fill turns Amber (`#F59E0B`), but line current flow remains uninterrupted.

---

## 5. Restoration Acceleration & Wave Front

When power restoration occurs (`POWER_RESTORED` telemetry received):
1. Particles do NOT restart simultaneously across the whole network.
2. Particles resume floating in a **Downstream Wave Sequence**:
   - Level 1 Substation $\rightarrow$ Feeder: Resumes at $T+0\text{ms}$.
   - Level 2 Transformer $\rightarrow$ Parent Pole: Resumes at $T+200\text{ms}$.
   - Level 3 Parent Pole $\rightarrow$ Child Poles: Resumes at $T+400\text{ms}$.
3. During the first 300ms of restoration, particle velocity accelerates from $0\,\text{px/s}$ to $90\,\text{px/s}$ (2.0x surge) before settling back to baseline $45\,\text{px/s}$.
