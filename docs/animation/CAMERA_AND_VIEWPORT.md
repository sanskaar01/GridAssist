# CAMERA AND VIEWPORT SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Interactive Viewport Engine

The HTML5 Canvas viewport is managed via a 2D Transformation Matrix $(s, dx, dy)$:

$$\begin{bmatrix} x' \\ y' \end{bmatrix} = \begin{bmatrix} s & 0 \\ 0 & s \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix} + \begin{bmatrix} dx \\ dy \end{bmatrix}$$

---

## 2. Dynamic Camera Operations

1. **Auto-Focus Target Node:** When an active incident is selected or step executes, the camera smoothly interpolates pan offsets $(dx, dy)$ to position the target asset at the upper-center centroid of the canvas:
   $$dx = \frac{W_{\text{canvas}}}{2} - x_{\text{target}} \cdot s$$
   $$dy = \frac{H_{\text{canvas}}}{3} - y_{\text{target}} \cdot s$$
2. **Pan Range & Drag Bounds:** Panning is constrained to prevent losing the network tree.
3. **Zoom Scale Limits:** $0.5\times \le s \le 2.5\times$. Mouse wheel zooming zooms centered on cursor coordinates $(x_{\text{mouse}}, y_{\text{mouse}})$.
