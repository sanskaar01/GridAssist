# CAMERA ANIMATION ENGINE SPECIFICATION
**GridAssist Operations Theater — Viewport Camera Matrix Architecture**

---

## 1. Camera System Ownership & Immutable Bounds

The Camera Animation Engine controls the 2D transformation matrix $(s, dx, dy)$ mapping electrical graph world coordinates to canvas screen pixel coordinates:

$$\begin{bmatrix} x_{\text{screen}} \\ y_{\text{screen}} \end{bmatrix} = \begin{bmatrix} s & 0 & dx \\ 0 & s & dy \end{bmatrix} \begin{bmatrix} x_{\text{world}} \\ y_{\text{world}} \end{bmatrix} + \begin{bmatrix} 0 \\ 0 \end{bmatrix}$$

### Immutable Camera Bounds & Constraints
- **Minimum Scale ($s_{\text{min}}$):** `0.50x` (Grid Wide Macro View).
- **Maximum Scale ($s_{\text{max}}$):** `2.50x` (Single Pole Close Inspection).
- **Dead-Zone Margin:** `60px` padding from canvas viewport edges.
- **Stationary Elements (NEVER MOVED BY CAMERA):** Top Status Bar, Bottom Step Controls, Mission Control Briefing HUD, Floating `(?)` SCADA Help Button, Active Fault Queue Drawer.

---

## 2. Exhaustive Motion Parameters

| Parameter | Specification |
| :--- | :--- |
| **Moving Object** | Canvas 2D Viewport Matrix Transformation $(s, dx, dy)$. |
| **Static / Immovable Objects** | DOM Chrome UI, Header, Floating `(?)` Help Button, Diagnostic Drawer. |
| **Motion Path** | 2D Linear Centroid Pan Vector $(\Delta x, \Delta y)$ combined with Scale Matrix Expansion $\Delta s$. |
| **Duration** | **650 milliseconds** ($\pm 10\text{ms}$). |
| **Easing Function** | **Quartic Out Easing:** $f(t) = 1 - (1 - t)^4 \quad \text{where} \quad t \in [0, 1]$. |
| **Trigger Events** | Storyboard Step Advancement, Active Incident Card Click, `RESET GRID` button click. |
| **Interrupt Events** | User Manual Mouse Drag (`onMouseDown`), User Wheel Zoom (`onWheel`). |

---

## 3. Centroid Pan Target Formulas

When camera auto-focuses on asset $A$ (located at world coordinate $X_A, Y_A$) with target scale $s_{\text{target}}$:

- **Target Offset X ($dx_{\text{target}}$):**
  $$dx_{\text{target}} = \frac{W_{\text{viewport}}}{2} - X_A \cdot s_{\text{target}}$$
- **Target Offset Y ($dy_{\text{target}}$):**
  $$dy_{\text{target}} = \frac{H_{\text{viewport}}}{3.2} - Y_A \cdot s_{\text{target}}$$
  *(Offset to $H_{\text{viewport}} / 3.2$ centers asset in upper 65% of screen, leaving clear space for lower decision cards).*

---

## 4. Frame-by-Frame Interpolation State Machine

At frame timestamp $t \in [t_{\text{start}}, t_{\text{end}}]$ with progress ratio $p = \frac{t - t_{\text{start}}}{\text{duration}}$:

$$t_{\text{eased}} = 1 - (1 - p)^4$$
$$s(t) = s_{\text{start}} + (s_{\text{target}} - s_{\text{start}}) \cdot t_{\text{eased}}$$
$$dx(t) = dx_{\text{start}} + (dx_{\text{target}} - dx_{\text{start}}) \cdot t_{\text{eased}}$$
$$dy(t) = dy_{\text{start}} + (dy_{\text{target}} - dy_{\text{start}}) \cdot t_{\text{eased}}$$

---

## 5. Interrupt & Failure State Handling

1. **User Drag Interrupt:** If user presses mouse down (`onMouseDown`) during auto-pan, camera animation CANCELS instantly ($dx_{\text{target}} \leftarrow dx_{\text{current}}$, $dy_{\text{target}} \leftarrow dy_{\text{current}}$), yielding immediate manual control to presenter.
2. **Double Click / Rapid Step Advance:** If `NEXT STEP` is clicked while camera is panning, current pan snaps to final target coordinates ($s_{\text{target}}, dx_{\text{target}}, dy_{\text{target}}$) instantly, and new step's camera pan begins from that snap point.
3. **Grid Reset:** Smooth 650ms return to default overview bounds ($s = 1.0\times, dx = 50, dy = 30$).
