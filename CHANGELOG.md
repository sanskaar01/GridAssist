# CHANGELOG

All notable changes to GridAssist will be documented in this file.

## [1.2.0] - 2026-08-05
### Added
- **Guided Demonstration Platform:** Synchronous step-run API (`POST /api/v1/simulator/step-run`), Zustand simulation store, and Mission Control Briefing HUD.
- **Scenario Script Engine:** Declarative scenario definitions for single span faults, transformer blowouts, sensor anomalies, and power restorations.
- **Operations Theater Canvas:** HTML5 Canvas particle system with power flow particle halting and glowing fault frontier polylines.
- **16 Technical Specifications:** Published in `docs/` covering visual language, interaction model, layout engine, and scene transitions.

## [1.1.0] - 2026-08-04
### Added
- Interactive Simulation Engine (`/api/v1/simulator/*`).
- SCADA Control Room Header with live service health LEDs and pipeline metrics.
- Active Fault Queue with compact severity filters.

## [1.0.0] - 2026-08-03
### Added
- Initial release of GridAssist Backend (Telemetry Engine, Localization Engine, Decision Engine, Incident & Ticket Managers).
- PostgreSQL database integration via Prisma ORM.
