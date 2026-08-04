# MOTION LANGUAGE SPECIFICATION
**GridAssist Operations Theater — Physical Motion & Physics Rules**

---

## 1. Physical Motion Rules

In SCADA Operations Theater Phase 2, motion communicates physical energy:
1. **Energized Motion (Power Particles):** Constant velocity $v = 45\,\text{px/s}$ drifting smoothly downstream along parent-to-child line vectors.
2. **Abrupt Interruption (Fault Outage):** Particle velocity drops to $0\,\text{px/s}$ instantly on de-energized line spans.
3. **Pulse Keyframes (Dark Nodes):** 1.8-second slow radial opacity pulses (`#EF4444`) simulating active power loss.
4. **Smooth Fluid Pans (Camera):** Quartic Out easing curves for smooth focal positioning.

---

## 2. Forbidden Motion Anti-Patterns
- ❌ Fast flashing or strobe effects (causes visual fatigue).
- ❌ Unpredictable random bouncing.
- ❌ Unnecessary 3D rotations or distracting SaaS card animations.
- ❌ Unsynced particle speeds.
