import { IncidentManager } from '../services/IncidentManager.js';
import { DecisionCard } from '../localization/DecisionEngine.js';
import { IncidentStatus, FaultType, ConfidenceLevel } from '@prisma/client';

function createSampleDecisionCard(
  transformerId: string = 'dt-001',
  parentPole: string = 'P-002',
  childPole: string = 'P-003',
  affectedPoles: number = 43
): DecisionCard {
  return {
    id: `DC-${Date.now()}`,
    transformerId,
    transformerCode: 'D-0101',
    faultType: FaultType.SPAN,
    suspectedParentPoleId: 'pole-uuid-002',
    suspectedParentPoleCode: parentPole,
    suspectedChildPoleId: 'pole-uuid-003',
    suspectedChildPoleCode: childPole,
    confidence: ConfidenceLevel.HIGH,
    confidenceReason: 'Surveyed topology confirmed',
    latitude: 12.9713,
    longitude: 77.6413,
    pincode: '560078',
    affectedPolesCount: affectedPoles,
    affectedPoleIds: ['p-3', 'p-4'],
    evidence: ['✓ Pole P-002 LIVE', '✓ Pole P-003 DARK'],
    assumptions: [],
    rejectedAlternatives: [{ hypothesis: 'Transformer Failure', reason: 'P-002 live' }],
    recommendedAction: {
      title: 'Dispatch Crew',
      detail: 'Dispatch line crew to span P-002 - P-003',
      targetCoordinates: { latitude: 12.9713, longitude: 77.6413 },
      estimatedInspectionDistanceMeters: 18,
    },
    explanation: `Probable Span Fault between Pole ${parentPole} and Pole ${childPole}`,
  };
}

async function testIncidentDeduplicationAndTimeline() {
  console.log('🧪 Test 1: Deduplication & Timeline Append for Repeated Decision Cards...');

  const incidentsStore: any[] = [];

  const mockIncidentRepo: any = {
    findActiveBySpan: async (dtId: string, type: string, p: string, c: string) => {
      return incidentsStore.find(
        (i) =>
          i.transformerId === dtId &&
          i.faultType === type &&
          i.suspectedParentPoleId === p &&
          i.suspectedChildPoleId === c &&
          (i.status === IncidentStatus.ACTIVE || i.status === IncidentStatus.VERIFYING)
      ) || null;
    },
    findRecentResolvedBySpan: async () => null,
    create: async (data: any) => {
      const inc = { id: `inc-${incidentsStore.length + 1}`, ...data };
      incidentsStore.push(inc);
      return inc;
    },
    update: async (id: string, data: any) => {
      const idx = incidentsStore.findIndex((i) => i.id === id);
      if (idx >= 0) {
        incidentsStore[idx] = { ...incidentsStore[idx], ...data };
        return incidentsStore[idx];
      }
      throw new Error('Not found');
    },
  };

  const manager = new IncidentManager(mockIncidentRepo);
  const card1 = createSampleDecisionCard('dt-001', 'P-002', 'P-003', 43);

  // First run -> Create Incident
  const inc1 = await manager.processDecisionCard(card1);
  console.assert(incidentsStore.length === 1, `Expected 1 incident, got ${incidentsStore.length}`);
  console.assert(inc1.status === IncidentStatus.ACTIVE, 'Incident should be ACTIVE');

  // Second run with updated affected poles -> Update existing, DO NOT duplicate
  const card2 = createSampleDecisionCard('dt-001', 'P-002', 'P-003', 50);
  const inc2 = await manager.processDecisionCard(card2);

  console.assert(incidentsStore.length === 1, `Expected still 1 incident, got ${incidentsStore.length}`);
  console.assert(inc2.affectedPoles === 50, 'Affected poles should be updated to 50');

  const timeline = (inc2.evidence as any).timeline;
  console.assert(timeline.length >= 2, 'Timeline should contain creation and update events');
  console.log('✅ Test 1 Passed! Timeline events:', timeline.map((t: any) => `${t.event}: ${t.details || ''}`));
}

async function testIncidentReopening() {
  console.log('🧪 Test 2: Incident Automatic Reopening within 10-Minute Window...');

  const resolvedIncident = {
    id: 'inc-resolved-01',
    transformerId: 'dt-001',
    faultType: FaultType.SPAN,
    suspectedParentPoleId: 'pole-uuid-002',
    suspectedChildPoleId: 'pole-uuid-003',
    confidence: ConfidenceLevel.HIGH,
    status: IncidentStatus.RESOLVED,
    resolvedAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    evidence: { timeline: [{ timestamp: new Date().toISOString(), event: 'Marked Resolved' }] },
  };

  const incidentsStore = [resolvedIncident];

  const mockIncidentRepo: any = {
    findActiveBySpan: async () => null,
    findRecentResolvedBySpan: async () => resolvedIncident,
    update: async (id: string, data: any) => {
      const idx = incidentsStore.findIndex((i) => i.id === id);
      if (idx >= 0) {
        incidentsStore[idx] = { ...incidentsStore[idx], ...data };
        return incidentsStore[idx];
      }
      throw new Error('Not found');
    },
  };

  const manager = new IncidentManager(mockIncidentRepo);
  const card = createSampleDecisionCard('dt-001', 'P-002', 'P-003', 43);

  const reopenedInc = await manager.processDecisionCard(card);

  console.assert(reopenedInc.status === IncidentStatus.ACTIVE, 'Incident should be set to ACTIVE');
  console.assert(reopenedInc.resolvedAt === null, 'resolvedAt should be reset to null');

  const timeline = (reopenedInc.evidence as any).timeline;
  console.assert(timeline.some((t: any) => t.event === 'Incident Reopened'), 'Timeline should record Incident Reopened');

  console.log('✅ Test 2 Passed! Incident successfully reopened:', timeline);
}

async function runAllIncidentManagerTests() {
  await testIncidentDeduplicationAndTimeline();
  await testIncidentReopening();
}

runAllIncidentManagerTests().catch((err) => {
  console.error('❌ IncidentManager tests failed:', err);
  process.exit(1);
});
