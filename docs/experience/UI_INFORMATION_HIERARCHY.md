# UI INFORMATION HIERARCHY SPECIFICATION
**GridAssist Operations Theater — Information Disclosure Pacing**

---

## 1. Information Density Philosophy

A real electrical grid dispatcher does not view static paragraphs of documentation while analyzing an active blackout.

- **Primary Canvas Real Estate:** **85%+ Viewport Width & Height**.
- **Collapsible Peripheral Chrome:** All UI panels (Queue, Decision Card, Diagnostics, Help Legend) slide out on-demand or during active scenario steps, automatically retracting when the grid returns to baseline.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ VIEWPORT REAL ESTATE MAP                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Top Status Bar: 40px] ───────────────────────────────────────────────────  │
│ ┌──────────────┐ ┌───────────────────────────────────────┐ ┌──────────────┐ │
│ │ Collapsible  │ │                                       │ │ Collapsible  │ │
│ │ Fault Queue  │ │      ELECTRICAL TOPOLOGY CANVAS       │ │ Decision     │ │
│ │ Drawer       │ │      (85%+ Viewport Coverage)         │ │ Slideout     │ │
│ │ (40px ->     │ │                                       │ │ (0px ->      │ │
│ │  260px)      │ │                                       │ │  320px)      │ │
│ └──────────────┘ └───────────────────────────────────────┘ └──────────────┘ │
│ [Bottom Ticker & Step Timeline Bar: 32px] ───────────────────────────────── │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dynamic Disclosure Triggers

1. **SCADA Legend:** Collapsed inside a floating `?` icon. Expands on hover; auto-collapses on mouse leave.
2. **Developer Diagnostics:** Hidden behind `[ DIAGNOSTICS: OFF ]` toggle in top header.
3. **Decision Evidence Panel:** Hidden until an active incident node or glowing fault span is clicked.
