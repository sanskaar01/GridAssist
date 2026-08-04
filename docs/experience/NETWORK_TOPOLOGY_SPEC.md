# NETWORK TOPOLOGY SPECIFICATION (SINGLE SOURCE OF TRUTH)
**GridAssist Operations Theater — Electrical Feeder Network Specification**

---

## 1. Top-Level Electrical Network Architecture

`NETWORK_TOPOLOGY_SPEC.md` is the **Single Source of Truth** for all electrical graph nodes, branches, and feeder hierarchies across GridAssist.

```
                      SUBSTATION 33kV (SUB-01)
                                 │
                         FEEDER MAIN (F-07)
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
            DT D-0101 (25 Poles)        DT D-0102 (20 Poles)
          ┌────────┴────────┐         ┌────────┴────────┐
       Spur A            Spur B    Spur C            Spur D
       (P001..P012)   (P013..P025) (P026..P035)   (P036..P045)
```

---

## 2. Asset Inventory Breakdown

- **1 Substation Node:** `SUB-01` (Primary 33kV Grid Transformer, $x = 540\text{px}, y = 40\text{px}$).
- **1 Main Feeder:** `F-07` (11kV Main Line Header).
- **2 Distribution Transformers:**
  - `D-0101` (Ward W-084, 11kV/415V Step-Down Transformer, $x = 260\text{px}, y = 130\text{px}$).
  - `D-0102` (Ward W-085, 11kV/415V Step-Down Transformer, $x = 840\text{px}, y = 130\text{px}$).
- **44 Monitored Overhead Poles:**
  - `D-0101` Cluster: 25 poles ($P_{001} \dots P_{025}$) arranged in 2 radial sub-spurs.
  - `D-0102` Cluster: 20 poles ($P_{026} \dots P_{045}$) arranged in 2 radial sub-spurs.

---

## 3. Node Coordinates & Asymmetric Tree Layout Formula

For any pole $P_k$ beneath transformer $T$ at tree depth level $L \in [1, 5]$ and branch index $i$:

- **$Y$-Coordinate:**
  $$Y(L) = Y_{\text{DT}} + L \cdot 85\text{px}$$
- **$X$-Coordinate:**
  $$X(L, i) = X_{\text{DT}} + \left(i - \frac{N_{\text{branches}} - 1}{2}\right) \cdot \max(90 \cdot N_{\text{branches}}, 110)\text{px} + \text{skew}(k)$$
  where $\text{skew}(k) = (-1)^k \cdot 15\text{px}$.

This layout eliminates artificial geometric symmetry and guarantees a realistic utility feeder appearance.
