# CAMERA LANGUAGE SPECIFICATION
**GridAssist Operations Theater — Camera & Viewport Choreography**

---

## 1. The Camera as an Operational Storyteller

The viewport camera does not merely zoom and pan; it directs the evaluator's attention.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMERA STATE TYPES                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. GRID OVERVIEW MODE (1.0x Scale):                                         │
│    • Centers on Substation & Feeder Main. Used during healthy baseline.    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. ASSET FOCUS MODE (1.45x Scale):                                          │
│    • Glides smoothly to center on a target Distribution Transformer or      │
│      overhead line span during fault frontier isolation.                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. INSPECTION TRACKING MODE (1.80x Scale):                                  │
│    • Follows field crew dispatch movement along feeder spur lines.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Matrix Interpolation & Easing Curves

Camera pan offset $(dx, dy)$ and scale $s$ interpolate over a 650ms duration using a **Quartic Easing Out** curve:

$$f(t) = 1 - (1 - t)^4 \quad \text{where} \quad t \in [0, 1]$$

- **Target Offset Calculation:**
  $$dx_{\text{target}} = \frac{W_{\text{viewport}}}{2} - X_{\text{asset}} \cdot s_{\text{target}}$$
  $$dy_{\text{target}} = \frac{H_{\text{viewport}}}{3} - Y_{\text{asset}} \cdot s_{\text{target}}$$

This positions the target asset slightly above center, leaving space for floating slideout panels beneath.
