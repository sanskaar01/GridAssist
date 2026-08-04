# NETWORK TOPOLOGY ENGINEERING DRAWING SPECIFICATION
**GridAssist Operations Theater — 47-Node Connected Electrical Network Layout**

---

## Complete Network Topology Engineering Schematic

```
                                SUBSTATION 33kV (SUB-01) [x:540, y:40]
                                          │
                                  FEEDER MAIN (F-07) [y:110]
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
         DT D-0101 [x:260, y:190]                      DT D-0102 [x:840, y:190]
        (Ward W-084, 25 Poles)                        (Ward W-085, 20 Poles)
     ┌─────────────┴─────────────┐                 ┌─────────────┴─────────────┐
     ▼                           ▼                 ▼                           ▼
  Spur A                      Spur B            Spur C                      Spur D
(P001..P012)                (P013..P025)      (P026..P035)                (P036..P045)

 [Spur A Layout]             [Spur B Layout]   [Spur C Layout]             [Spur D Layout]
 P001 [y:280]                P013 [y:280]      P026 [y:280]                P036 [y:280]
  │                           │                 │                           │
 P002 [y:365]                P014 [y:365]      P027 [y:365]                P037 [y:365]
  │ ⚡ (Fault Span)           │                 │                           │
 P003 [y:450] (Dark)         P015 [y:450]      P028 [y:450]                P038 [y:450]
  │                           │                 │                           │
 P004 [y:535] (Dark)         P016 [y:535]      P029 [y:535]                P039 [y:535]
 ┌┴┐                         ┌┴┐               ┌┴┐                         ┌┴┐
P005 P006                   P017 P018         P030 P031                   P040 P041
(Dark)                      (Live Green)      (Live Green)                (Live Green)
```

---

## Visual Symbol Legend

- **Substation Node:** Dual-concentric diamond ($42\text{px} \times 42\text{px}$) `#3B82F6` with 12px radial aura.
- **Distribution Transformer (DT):** Yellow industrial square ($28\text{px} \times 28\text{px}$) `#F59E0B`.
- **Live Pole Node:** 14px circle `#10B981` (Emerald Green) with moving particle flow dots (`#6EE7B7`).
- **Dark Pole Node:** 14px circle `#EF4444` (Crimson Red) with 1.8s opacity pulse keyframe.
- **Failed Overhead Span:** 5px glowing red polyline (`#EF4444`, 16px blur) with animated dashes.
- **Sensor Anomaly Pole:** 14px amber circle (`#F59E0B`) with unbroken downstream particle flow.
