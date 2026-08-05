# DEMO SCRIPT & EVALUATOR PRESENTATION PLAYBOOK
**GridAssist Operations Theater Phase 2**

---

## 1. Presenter Script & Keynote Narrative

### Introduction (0:00 - 0:15)
> *"Welcome to GridAssist. What you see on screen is not a static GIS dashboard—it is a live command center for an electrical distribution network. The topology graph occupying the screen represents an authentic 33kV/11kV feeder layout with monitored overhead poles and distribution transformers."*

### Step 1: Ingesting Telemetry (0:15 - 0:35)
> *"I will now trigger Scenario 1: Single Span Line Break in Guided Demonstration Mode. Notice how pressing NEXT STEP triggers an actual IoT telemetry packet from Pole P-003 into our production backend. The Mission Briefing banner displays the ingested payload."*

### Step 2: Fault Frontier Localization (0:35 - 1:00)
> *"As the outage propagates downstream, watch the topology canvas. Notice that power particles have stopped flowing beyond Pole P-002, while parallel branches remain 100% green and energized. GridAssist has isolated the exact fault frontier as span P-002 -> P-003. Notice the decision card: it explicitly rejected a transformer failure because upstream nodes remain energized."*

### Step 3: Sensor Anomaly Demonstration (1:00 - 1:20)
> *"Now let us look at Scenario 3: Sensor Anomaly. A sensor on Pole P-003 reports DARK, but its child poles remain live. Watch how GridAssist keeps power particles flowing through the child poles, flagging a hardware anomaly and blocking a false alarm."*

### Step 4: Automated Verification & Closure (1:20 - 1:45)
> *"Finally, as field repair completes and power restoration telemetry arrives, nodes return to green, power flow particles resume, and the repair ticket automatically verifies and closes."*
