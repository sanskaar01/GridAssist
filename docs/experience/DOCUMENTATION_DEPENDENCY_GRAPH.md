# DOCUMENTATION DEPENDENCY GRAPH
**GridAssist Operations Theater — Documentation Architecture & Cross-References**

---

## 1. Documentation Dependency Graph

The technical specifications form a directed acyclic graph (DAG) where higher-level Experience Architecture documents drive lower-level Implementation Specifications.

```mermaid
graph TD
    EA[docs/experience/EXPERIENCE_ARCHITECTURE.md] --> SC[docs/experience/SCENARIO_CHOREOGRAPHY.md]
    EA --> CL[docs/experience/CAMERA_LANGUAGE.md]
    EA --> UIH[docs/experience/UI_INFORMATION_HIERARCHY.md]
    EA --> VAM[docs/experience/VISUAL_ATTENTION_MODEL.md]
    
    SC --> SSM[docs/experience/SCENARIO_STATE_MACHINE.md]
    SC --> ML[docs/experience/MOTION_LANGUAGE.md]
    SC --> SCIN[docs/experience/SCENARIO_CINEMATOGRAPHY.md]
    
    NTS[docs/experience/NETWORK_TOPOLOGY_SPEC.md] --> PFR[docs/operations-theater/POWER_FLOW_RENDERER.md]
    NTS --> GLE[docs/operations-theater/GRAPH_LAYOUT_ENGINE.md]
    
    ML --> PS[docs/operations-theater/PARTICLE_SYSTEM.md]
    ML --> AA[docs/operations-theater/ANIMATION_ARCHITECTURE.md]
    
    CL --> PFR
    VAM --> PFR
    SSM --> DF[docs/experience/DEMONSTRATION_FLOW.md]
```

---

## 2. Document Cross-Reference Map

| Document | Direct Dependencies (Imports) | Dependent Documents (Export Consumers) |
| :--- | :--- | :--- |
| **`EXPERIENCE_ARCHITECTURE.md`** | None (Root Specification) | `SCENARIO_CHOREOGRAPHY.md`, `CAMERA_LANGUAGE.md`, `UI_INFORMATION_HIERARCHY.md` |
| **`SCENARIO_CHOREOGRAPHY.md`** | `EXPERIENCE_ARCHITECTURE.md` | `SCENARIO_STATE_MACHINE.md`, `DEMONSTRATION_FLOW.md`, `SCENARIO_CINEMATOGRAPHY.md` |
| **`CAMERA_LANGUAGE.md`** | `EXPERIENCE_ARCHITECTURE.md` | `SCENARIO_CINEMATOGRAPHY.md`, `POWER_FLOW_RENDERER.md` |
| **`MOTION_LANGUAGE.md`** | `EXPERIENCE_ARCHITECTURE.md` | `PARTICLE_SYSTEM.md`, `ANIMATION_ARCHITECTURE.md` |
| **`NETWORK_TOPOLOGY_SPEC.md`** | `SystemArchitecture.md` | `GRAPH_LAYOUT_ENGINE.md`, `POWER_FLOW_RENDERER.md` |
| **`UI_INFORMATION_HIERARCHY.md`** | `EXPERIENCE_ARCHITECTURE.md` | `DEMONSTRATION_FLOW.md`, `VisualLanguage.md` |
