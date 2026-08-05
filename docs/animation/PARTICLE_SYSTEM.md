# PARTICLE SYSTEM SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Particle System Physics Engine

The Particle System visualizes dynamic AC power flow across overhead distribution lines:

- **Particle Lifetime:** Continuous looped motion along parent-to-child vectors.
- **Particle Color:** `#6EE7B7` (Glowing AC Current Green).
- **Particle Size:** 2.5px radius circle with 6px radial blur shadow.
- **Halting Behavior:** If a line segment is de-energized or isolated as a fault frontier, particle position freezes at line boundary or fades out within 300ms.

---

## 2. Sensor Anomaly Exception Handler

When an isolated telemetry dropout occurs on a pole whose downstream children remain live:
- Power particles **DO NOT HALT**.
- Particles pass through the anomaly node $P_{\text{anomaly}}$ to child nodes $P_{\text{child}}$ continuously, visually demonstrating to the evaluator that the electrical branch remains physically energized!
