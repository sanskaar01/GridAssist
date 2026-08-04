# TRANSITION GUIDELINES SPECIFICATION
**GridAssist Operations Theater — UI Transition Curves**

---

## 1. Timing Matrix for UI Transitions

| Component Transition | Duration | Easing Curve | Trigger |
| :--- | :--- | :--- | :--- |
| **Node Fill Color Change** | 300ms | `ease-in-out` | Telemetry Ingestion / Restoration |
| **Camera Viewport Pan** | 650ms | `cubic-bezier(0.25, 1, 0.5, 1)` | Step Execution / Incident Selection |
| **Fault Span Glow Activation** | 500ms | `ease-out` | Fault Frontier Isolation |
| **Unrelated Branch Dimming** | 350ms | `ease-in-out` | Active Incident Selection |
| **Briefing HUD Slide-In** | 400ms | Framer Motion Spring | Step Advance |
| **Decision Card Slideout** | 350ms | `ease-out` | Incident Click / Selection |

---

## 2. Transition Synchronization Principles
Animations execute sequentially to create clear visual lead-ins:
`Node Flash (150ms)` $\longrightarrow$ `Color Shift (300ms)` $\longrightarrow$ `Particle Halt (300ms)` $\longrightarrow$ `Camera Pan (650ms)` $\longrightarrow$ `HUD Briefing Reveal (400ms)`.
