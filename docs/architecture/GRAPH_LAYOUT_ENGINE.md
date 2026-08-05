# GRAPH LAYOUT ENGINE SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Electrical Graph Hierarchy Model

The Graph Layout Engine constructs tree coordinates from parent-child relationships in the seeded network database:

$$\text{Substation} \longrightarrow \text{Feeder} \longrightarrow \text{Distribution Transformer} \longrightarrow \text{Parent Pole} \longrightarrow \text{Child Poles}$$

---

## 2. Layout Positioning Math

For a tree node at depth $L$ with branch index $i$ among $N$ children:

- **Vertical Y Coordinates:**
  $$Y(L) = Y_{\text{root}} + L \cdot \Delta Y$$
  where $Y_{\text{root}} = 90\text{px}$ and level height $\Delta Y = 85\text{px}$.

- **Horizontal X Coordinates:**
  $$X(L, i) = X_{\text{parent}} + \left(i - \frac{N - 1}{2}\right) \cdot w_{\text{spread}} + \text{skew}(i)$$
  where spread width $w_{\text{spread}} = \max(90 \cdot N, 100)\text{px}$ and organic skew factor $\text{skew}(i) = (-1)^i \cdot 15\text{px}$.

---

## 3. Organic Utility Feeder Aesthetics
To avoid rigid grid alignment:
1. Every sub-branch receives a deterministic pseudo-random offset based on asset code hash.
2. Radial feeder lines curve slightly towards primary road channels.
3. Terminal leaf poles render with termination crossbars.
