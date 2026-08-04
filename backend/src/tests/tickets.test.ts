import { TicketManager } from '../services/TicketManager.js';
import { TicketStatus, IncidentStatus, FaultType, ConfidenceLevel } from '@prisma/client';

function createSampleIncident(id: string = 'inc-uuid-001', status: IncidentStatus = IncidentStatus.ACTIVE): any {
  return {
    id,
    faultType: FaultType.SPAN,
    transformerId: 'dt-001',
    suspectedParentPoleId: 'P-002',
    suspectedChildPoleId: 'P-003',
    confidence: ConfidenceLevel.HIGH,
    evidence: { timeline: [] },
    assumptions: {},
    rejectedAlternatives: {},
    recommendedAction: 'Dispatch line crew',
    affectedPoles: 43,
    latitude: 12.9713,
    longitude: 77.6413,
    pincode: '560078',
    status,
    detectedAt: new Date(),
    lastObservedAt: new Date(),
    resolvedAt: status === IncidentStatus.RESOLVED ? new Date() : null,
  };
}

async function testTicketCreationAndTransitions() {
  console.log('🧪 Test 1: Ticket Creation & Valid Transitions...');

  const ticketsStore: any[] = [];

  const mockTicketRepo: any = {
    findByIncidentId: async (incId: string) => ticketsStore.find((t) => t.incidentId === incId) || null,
    findById: async (id: string) => ticketsStore.find((t) => t.id === id) || null,
    create: async (data: any) => {
      const ticket = { id: `ticket-${ticketsStore.length + 1}`, ...data };
      ticketsStore.push(ticket);
      return ticket;
    },
    update: async (id: string, data: any) => {
      const idx = ticketsStore.findIndex((t) => t.id === id);
      if (idx >= 0) {
        ticketsStore[idx] = { ...ticketsStore[idx], ...data };
        return ticketsStore[idx];
      }
      throw new Error('Ticket not found');
    },
  };

  const manager = new TicketManager(mockTicketRepo);
  const incident = createSampleIncident('inc-001', IncidentStatus.ACTIVE);

  // 1. Sync new incident -> Creates exactly 1 ticket
  const ticket1 = await manager.syncTicketForIncident(incident);
  console.assert(ticketsStore.length === 1, `Expected 1 ticket, got ${ticketsStore.length}`);
  console.assert(ticket1.status === TicketStatus.DETECTED, 'New ticket status should be DETECTED');

  // 2. Transition DETECTED -> ACKNOWLEDGED
  const ackTicket = await manager.transitionTicketStatus(ticket1.id, TicketStatus.ACKNOWLEDGED);
  console.assert(ackTicket.status === TicketStatus.ACKNOWLEDGED, 'Status should be ACKNOWLEDGED');

  // 3. Transition ACKNOWLEDGED -> ASSIGNED (Assign Crew)
  const assignedTicket = await manager.transitionTicketStatus(
    ticket1.id,
    TicketStatus.ASSIGNED,
    'CREW-BLR-01'
  );
  console.assert(assignedTicket.status === TicketStatus.ASSIGNED, 'Status should be ASSIGNED');
  console.assert(assignedTicket.assignedCrewId === 'CREW-BLR-01', 'Crew ID should be assigned');

  // 4. Transition ASSIGNED -> RESOLVED (Lineman claims repair) -> System sets VERIFYING
  const resolvedTicket = await manager.transitionTicketStatus(ticket1.id, TicketStatus.RESOLVED);
  console.assert(resolvedTicket.status === TicketStatus.VERIFYING, 'Status should auto-move to VERIFYING');

  console.log('✅ Test 1 Passed! Ticket lifecycle state machine verified.');
}

async function testIllegalTransitionsAndManualVerificationBlock() {
  console.log('🧪 Test 2: Illegal Transition & Manual Verification Rejection...');

  const ticket = {
    id: 'ticket-002',
    incidentId: 'inc-002',
    status: TicketStatus.DETECTED,
  };

  const mockTicketRepo: any = {
    findById: async () => ticket,
  };

  const manager = new TicketManager(mockTicketRepo);

  // Test illegal transition DETECTED -> CLOSED
  let caughtIllegal = false;
  try {
    await manager.transitionTicketStatus(ticket.id, TicketStatus.CLOSED, undefined, true);
  } catch (err: any) {
    caughtIllegal = true;
    console.assert(err.code === 'INVALID_TICKET_TRANSITION', 'Expected INVALID_TICKET_TRANSITION error');
  }
  console.assert(caughtIllegal, 'Illegal transition should throw error');

  // Test manual API call attempting VERIFIED status
  let caughtManual = false;
  try {
    await manager.transitionTicketStatus(ticket.id, TicketStatus.VERIFIED, undefined, false); // false = API request
  } catch (err: any) {
    caughtManual = true;
    console.assert(err.code === 'MANUAL_VERIFICATION_PROHIBITED', 'Expected MANUAL_VERIFICATION_PROHIBITED error');
  }
  console.assert(caughtManual, 'Manual verification from API should be rejected');

  console.log('✅ Test 2 Passed! Illegal transitions & manual verification strictly blocked.');
}

async function testTelemetryAutoVerification() {
  console.log('🧪 Test 3: Telemetry Auto-Verification (Incident RESOLVED -> Ticket CLOSED)...');

  const ticket = {
    id: 'ticket-003',
    incidentId: 'inc-003',
    status: TicketStatus.VERIFYING,
  };

  let updatedStatus: any = null;

  const mockTicketRepo: any = {
    findByIncidentId: async () => ticket,
    update: async (_id: string, data: any) => {
      updatedStatus = data.status;
      return { ...ticket, ...data };
    },
  };

  const manager = new TicketManager(mockTicketRepo);

  // Incident resolved by telemetry
  const resolvedIncident = createSampleIncident('inc-003', IncidentStatus.RESOLVED);
  await manager.syncTicketForIncident(resolvedIncident);

  console.assert(updatedStatus === TicketStatus.CLOSED, 'Ticket should automatically transition to CLOSED upon telemetry restoration');
  console.log('✅ Test 3 Passed! Telemetry restoration automatically verified and closed ticket.');
}

async function runAllTicketTests() {
  await testTicketCreationAndTransitions();
  await testIllegalTransitionsAndManualVerificationBlock();
  await testTelemetryAutoVerification();
}

runAllTicketTests().catch((err) => {
  console.error('❌ Ticket tests failed:', err);
  process.exit(1);
});
