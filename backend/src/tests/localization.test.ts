import { PoleStateStatus, FaultType, ConfidenceLevel, TopologySource } from '@prisma/client';
import { LocalizationEngine } from '../localization/LocalizationEngine.js';
import { TransformerNetworkGraph } from '../topology/TopologyEngine.js';
import { FaultClassifier } from '../localization/FaultClassifier.js';

function createMockGraph(topologySource: TopologySource = TopologySource.SURVEYED): TransformerNetworkGraph {
  const nodes = new Map();
  const childrenMap = new Map();
  const parentMap = new Map();

  // Create tree structure: P1 (root) -> P2 -> P3 -> P4
  // Branch from P2: P2 -> P5 -> P6
  const poleData = [
    { id: 'pole-1', code: 'P-001', parent: null, lat: 12.9710, lon: 77.6410, hasDevice: true },
    { id: 'pole-2', code: 'P-002', parent: 'pole-1', lat: 12.9712, lon: 77.6412, hasDevice: true },
    { id: 'pole-3', code: 'P-003', parent: 'pole-2', lat: 12.9714, lon: 77.6414, hasDevice: true },
    { id: 'pole-4', code: 'P-004', parent: 'pole-3', lat: 12.9716, lon: 77.6416, hasDevice: true },
    { id: 'pole-5', code: 'P-005', parent: 'pole-2', lat: 12.9720, lon: 77.6420, hasDevice: true },
    { id: 'pole-6', code: 'P-006', parent: 'pole-5', lat: 12.9722, lon: 77.6422, hasDevice: true },
  ];

  for (const p of poleData) {
    nodes.set(p.id, {
      id: p.id,
      code: p.code,
      transformerId: 'dt-001',
      parentPoleId: p.parent,
      sequenceNumber: 1,
      latitude: p.lat,
      longitude: p.lon,
      ward: 'W-084',
      pincode: '560078',
      hasDevice: p.hasDevice,
      topologySource,
    });
    childrenMap.set(p.id, []);
  }

  for (const p of poleData) {
    if (p.parent) {
      childrenMap.get(p.parent).push(p.id);
      parentMap.set(p.id, p.parent);
    }
  }

  return {
    transformerId: 'dt-001',
    transformerCode: 'D-0101',
    latitude: 12.9700,
    longitude: 77.6400,
    topologySource,
    nodes,
    childrenMap,
    parentMap,
    rootPoleIds: ['pole-1'],
  };
}

async function testSingleSpanFault() {
  console.log('🧪 Test 1: Single Span Fault (P2 Live, P3 & P4 Dark)...');

  const graph = createMockGraph();
  const poleStates = new Map<string, PoleStateStatus>([
    ['pole-1', PoleStateStatus.LIVE],
    ['pole-2', PoleStateStatus.LIVE],
    ['pole-3', PoleStateStatus.DARK],
    ['pole-4', PoleStateStatus.DARK],
    ['pole-5', PoleStateStatus.LIVE],
    ['pole-6', PoleStateStatus.LIVE],
  ]);

  const mockTopologyEngine: any = {
    loadTransformerGraph: async () => graph,
  };
  const mockPoleStateRepo: any = {
    findByPoleId: async (id: string) => ({ poleId: id, currentState: poleStates.get(id) || PoleStateStatus.LIVE }),
  };

  const engine = new LocalizationEngine(mockTopologyEngine, mockPoleStateRepo, new FaultClassifier());
  const results = await engine.localizeTransformer('dt-001');

  console.assert(results.length === 1, `Expected 1 candidate, got ${results.length}`);
  const candidate = results[0];
  console.assert(candidate.suspectedParentPoleCode === 'P-002', `Expected parent P-002, got ${candidate.suspectedParentPoleCode}`);
  console.assert(candidate.suspectedChildPoleCode === 'P-003', `Expected child P-003, got ${candidate.suspectedChildPoleCode}`);
  console.assert(candidate.affectedPolesCount === 2, `Expected 2 affected poles, got ${candidate.affectedPolesCount}`);
  console.assert(candidate.confidence === ConfidenceLevel.HIGH, `Expected HIGH confidence, got ${candidate.confidence}`);

  console.log('✅ Test 1 Passed! Result:', candidate.explanation);
}

async function testMultipleSimultaneousFaults() {
  console.log('🧪 Test 2: Multiple Simultaneous Faults (Branch P3-P4 Dark AND Branch P5-P6 Dark)...');

  const graph = createMockGraph();
  const poleStates = new Map<string, PoleStateStatus>([
    ['pole-1', PoleStateStatus.LIVE],
    ['pole-2', PoleStateStatus.LIVE],
    ['pole-3', PoleStateStatus.DARK],
    ['pole-4', PoleStateStatus.DARK],
    ['pole-5', PoleStateStatus.DARK],
    ['pole-6', PoleStateStatus.DARK],
  ]);

  const mockTopologyEngine: any = { loadTransformerGraph: async () => graph };
  const mockPoleStateRepo: any = {
    findByPoleId: async (id: string) => ({ poleId: id, currentState: poleStates.get(id) || PoleStateStatus.LIVE }),
  };

  const engine = new LocalizationEngine(mockTopologyEngine, mockPoleStateRepo, new FaultClassifier());
  const results = await engine.localizeTransformer('dt-001');

  console.assert(results.length === 2, `Expected 2 simultaneous candidates, got ${results.length}`);
  console.log('✅ Test 2 Passed! Isolated 2 separate frontiers:', results.map((r) => r.explanation));
}

async function testTransformerRootFault() {
  console.log('🧪 Test 3: Transformer Root Fault (All Poles Dark)...');

  const graph = createMockGraph();
  const poleStates = new Map<string, PoleStateStatus>([
    ['pole-1', PoleStateStatus.DARK],
    ['pole-2', PoleStateStatus.DARK],
    ['pole-3', PoleStateStatus.DARK],
    ['pole-4', PoleStateStatus.DARK],
    ['pole-5', PoleStateStatus.DARK],
    ['pole-6', PoleStateStatus.DARK],
  ]);

  const mockTopologyEngine: any = { loadTransformerGraph: async () => graph };
  const mockPoleStateRepo: any = {
    findByPoleId: async (id: string) => ({ poleId: id, currentState: poleStates.get(id) || PoleStateStatus.LIVE }),
  };

  const engine = new LocalizationEngine(mockTopologyEngine, mockPoleStateRepo, new FaultClassifier());
  const results = await engine.localizeTransformer('dt-001');

  console.assert(results.length === 1, 'Expected 1 DT fault candidate');
  console.assert(results[0].faultType === FaultType.DT, 'Expected faultType DT');
  console.log('✅ Test 3 Passed! Result:', results[0].explanation);
}

async function testInferredTopologyConfidenceDegradation() {
  console.log('🧪 Test 4: Inferred Topology Confidence Degradation...');

  const graph = createMockGraph(TopologySource.INFERRED);
  const poleStates = new Map<string, PoleStateStatus>([
    ['pole-1', PoleStateStatus.LIVE],
    ['pole-2', PoleStateStatus.LIVE],
    ['pole-3', PoleStateStatus.DARK],
    ['pole-4', PoleStateStatus.DARK],
  ]);

  const mockTopologyEngine: any = { loadTransformerGraph: async () => graph };
  const mockPoleStateRepo: any = {
    findByPoleId: async (id: string) => ({ poleId: id, currentState: poleStates.get(id) || PoleStateStatus.LIVE }),
  };

  const engine = new LocalizationEngine(mockTopologyEngine, mockPoleStateRepo, new FaultClassifier());
  const results = await engine.localizeTransformer('dt-001');

  console.assert(results[0].confidence === ConfidenceLevel.MEDIUM, 'Expected MEDIUM confidence for inferred topology');
  console.assert(results[0].assumptions.some((a) => a.includes('inferred')), 'Expected inferred assumption');
  console.log('✅ Test 4 Passed! Confidence degraded to MEDIUM with explanation:', results[0].assumptions);
}

async function runAllLocalizationTests() {
  await testSingleSpanFault();
  await testMultipleSimultaneousFaults();
  await testTransformerRootFault();
  await testInferredTopologyConfidenceDegradation();
}

runAllLocalizationTests().catch((err) => {
  console.error('❌ Localization test suite failed:', err);
  process.exit(1);
});
