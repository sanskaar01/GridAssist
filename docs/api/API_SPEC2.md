# API_SPEC.md

# Part 2 — Public API Endpoints

---

# API Domains

The GridAssist public API is divided into the following domains.

```
Telemetry

Dashboard

Network

Incidents

Tickets

Simulator

AI
```

Each endpoint belongs to exactly one domain.

Every endpoint performs one responsibility only.

---

# 1. Telemetry API

This API represents the entry point into the entire GridAssist platform.

Both real IoT devices and the simulator submit telemetry through this endpoint.

No other API is allowed to modify Pole State.

---

## POST

```
/api/v1/telemetry
```

### Purpose

Accept telemetry events from IoT devices.

This endpoint does **not**:

- localize faults
- create incidents
- create tickets
- generate AI summaries

It only validates and records telemetry before forwarding it into the processing pipeline.

---

### Request

```json
{
    "deviceId":"DEV-00231",
    "event":"POWER_LOST",
    "sequenceNumber":281,
    "eventTimestamp":"2026-07-29T10:23:41Z",
    "battery":82,
    "signalStrength":74
}
```

---

### Required Fields

| Field | Required |
|---------|----------|
| deviceId | Yes |
| event | Yes |
| sequenceNumber | Yes |
| eventTimestamp | Yes |

---

### Optional Fields

| Field | Notes |
|---------|--------|
| battery | Device battery percentage |
| signalStrength | RSSI value |

---

### Validation

The Telemetry Gateway performs:

- Device existence validation
- UUID validation
- Event type validation
- Sequence number validation
- Timestamp validation
- Duplicate detection

Only valid telemetry enters the processing pipeline.

---

### Successful Response

```
202 Accepted
```

```json
{
    "success":true,
    "data":{
        "accepted":true
    }
}
```

Accepted does **not** imply localization has completed.

---

### Possible Errors

```
400 Invalid Payload

404 Device Not Found

409 Duplicate Sequence Number

422 Invalid Timestamp

500 Internal Error
```

---

### Edge Cases

Duplicate telemetry

↓

Ignore safely.

---

Delayed telemetry

↓

Store.

Do not create historical incidents.

---

Older sequence number

↓

Reject.

---

Unknown device

↓

Reject.

---

Heartbeat received during outage

↓

Update device status only.

No incident created.

---

# Internal Processing

Accepted telemetry automatically triggers:

```
Telemetry Gateway

↓

Pole State Engine

↓

Localization Engine

↓

Incident Manager

↓

Ticket Manager
```

No client interaction is required.

---

# 2. Dashboard API

The dashboard loads from a single aggregated endpoint.

This minimizes frontend requests.

---

## GET

```
/api/v1/dashboard
```

### Purpose

Return everything required to render the operator homepage.

---

### Response

```json
{
    "success":true,
    "data":{

        "activeIncidents":[...],

        "activeTickets":[...],

        "statistics":{

            "activeFaults":4,

            "affectedPoles":182,

            "healthyDevices":34890,

            "offlineDevices":91

        }

    }

}
```

---

### Notes

This endpoint performs aggregation only.

It never computes localization.

---

### Performance Target

Dashboard response

```
<2 seconds
```

---

# 3. Network API

Provides data required by the Network View.

---

## GET

```
/api/v1/network
```

### Purpose

Return electrical network topology.

Used exclusively by React Leaflet.

---

### Response

```json
{

"poles":[

...

],

"edges":[

...

]

}
```

---

### Pole Object

```json
{

"id":"...",

"latitude":...,

"longitude":...,

"state":"LIVE"

}
```

---

### Edge Object

```json
{

"from":"PoleA",

"to":"PoleB",

"source":"SURVEYED"

}
```

---

### Notes

The frontend draws:

Nodes

↓

CircleMarkers

Edges

↓

Polylines

No localization logic exists inside this endpoint.

---

# 4. Incident API

Represents localized physical faults.

---

## GET

```
/api/v1/incidents
```

Returns

All active incidents.

Sorted by

Severity

↓

Detection Time

---

### Response

```json
{

"incidents":[

...

]

}
```

---

Each incident contains

- fault type
- confidence
- affected poles
- location
- status

No telemetry history.

---

## GET

```
/api/v1/incidents/{id}
```

Purpose

Return the complete Decision Card.

---

Response includes

- evidence
- assumptions
- rejected alternatives
- confidence
- recommendation

---

This endpoint powers

Incident Details.

---

# Edge Cases

Incident closed

↓

Return

404

---

Unknown Incident

↓

404

---

Localization recalculated

↓

Always return latest reasoning.

---

# 5. Ticket API

Tickets represent operational workflow.

---

## GET

```
/api/v1/tickets
```

Returns

All active tickets.

---

## PATCH

```
/api/v1/tickets/{id}/status
```

Allowed transitions

```
Detected

↓

Acknowledged

↓

Assigned

↓

Resolved
```

Notice

Operator CANNOT set

Verified

or

Closed.

Only telemetry can.

---

### Invalid Transition

Example

```
Detected

↓

Resolved
```

↓

Reject

409 Conflict

---

### Response

```json
{

"success":true

}
```

---

### Edge Cases

Ticket already closed

↓

409

---

Unknown ticket

↓

404

---

Duplicate update

↓

200

No changes.

---

# 6. Scheduled Outage API

Mock implementation.

Exactly follows assignment.

---

## GET

```
/api/v1/scheduled-outages
```

Query

```
from

to
```

Returns

Scheduled maintenance windows.

---

Localization Engine consults this endpoint before creating incidents.

---

# API Ownership

| Endpoint | Owner |
|------------|-------|
| POST /telemetry | Telemetry Gateway |
| GET /dashboard | Dashboard Service |
| GET /network | Topology Engine |
| GET /incidents | Incident Manager |
| GET /incidents/{id} | Incident Manager |
| GET /tickets | Ticket Manager |
| PATCH /tickets/{id}/status | Ticket Manager |
| GET /scheduled-outages | Outage Service |

No endpoint performs responsibilities owned by another module.

---

# Engineering Constraint

The frontend is intentionally prevented from invoking localization.

Localization is an internal consequence of telemetry ingestion.

The frontend consumes read-only operational views generated by backend services.

This preserves the event-driven architecture and prevents user actions from accidentally triggering engineering workflows.
