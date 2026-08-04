# TOPOLOGY LAYOUT SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Connected Electrical Feeder Network Topology

Phase 2 replaces disconnected mini-trees with a **large-scale connected electrical distribution network**. The topology represents an authentic MV feeder network ($33\text{kV} / 11\text{kV} / 415\text{V}$) originating from a primary Substation.

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

## 2. Dynamic Asymmetric Layout Rules

1. **Non-Symmetrical Tree Geometry:** Real electrical lines follow road rights-of-way and property boundaries. Trees must use irregular horizontal offsets ($\pm 25\text{px}$ skew per branch) and staggered depth steps to avoid artificial grid rigidity.
2. **Multi-Level Branch Splits:**
   - **Level 0:** Substation Node ($y = 40\text{px}$)
   - **Level 1:** Primary 11kV Feeders ($y = 110\text{px}$)
   - **Level 2:** Distribution Transformers ($y = 190\text{px}$)
   - **Level 3:** Primary Trunk Poles ($y = 280\text{px}$)
   - **Level 4+:** Secondary Spur Poles ($y = 360\text{px} \dots 680\text{px}$)
3. **Dead End & Tap-Off Indicators:** Terminal poles render with standard utility termination crossarms.

---

## 3. Scale & Screen Coverage Target

- The topology canvas must occupy **85%+ of total screen real estate**.
- Minimum canvas viewport size: $1400\text{px} \times 800\text{px}$.
- Network total nodes: 47 total assets (1 Substation, 2 Distribution Transformers, 44 Poles).
- Default scale ($1.0\times$) presents the complete feeder network centered nicely inside the viewport.
