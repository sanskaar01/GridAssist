import { DecisionEngine } from '../localization/DecisionEngine.js';
import { CandidateFaultSpan } from '../localization/LocalizationEngine.js';
import { ConfidenceLevel, FaultType } from '@prisma/client';

function testSurveyedSpanFaultDecisionCard() {
  console.log('🧪 Test 1: Decision Card for Surveyed Span Fault (P2-P3)...');

  const candidate: CandidateFaultSpan = {
    transformerId: 'dt-uuid-001',
    transformerCode: 'D-0101',
    faultType: FaultType.SPAN,
    suspectedParentPoleId: 'pole-002',
    suspectedParentPoleCode: 'P-002',
    suspectedChildPoleId: 'pole-003',
    suspectedChildPoleCode: 'P-003',
    latitude: 12.9713,
    longitude: 77.6413,
    pincode: '560078',
    affectedPolesCount: 43,
    affectedPoleIds: ['pole-003', 'pole-004'],
    confidence: ConfidenceLevel.HIGH,
    evidence: ['✓ Pole P-002 reported LIVE', '✓ Pole P-003 reported DARK'],
    assumptions: [],
    rejectedAlternatives: [],
    explanation: 'Probable Span Fault between Pole P-002 and Pole P-003. 43 downstream poles affected.',
  };

  const decisionEngine = new DecisionEngine();
  const card = decisionEngine.createDecisionCard(candidate);

  console.assert(card.id.startsWith('DC-D-0101-'), 'Card ID format invalid');
  console.assert(card.faultType === FaultType.SPAN, 'FaultType should be SPAN');
  console.assert(card.confidence === ConfidenceLevel.HIGH, 'Confidence should be HIGH');
  console.assert(card.evidence.length >= 3, 'Evidence checklist incomplete');
  console.assert(card.rejectedAlternatives.some((r) => r.hypothesis === 'Transformer Failure'), 'Transformer failure rejection missing');
  console.assert(card.recommendedAction.title === 'Dispatch Line Repair Crew', 'Recommended action title invalid');

  console.log('✅ Test 1 Passed! Decision Card generated cleanly:', card.explanation);
}

function testDTFaultDecisionCard() {
  console.log('🧪 Test 2: Decision Card for Distribution Transformer Fault (D-0102)...');

  const candidate: CandidateFaultSpan = {
    transformerId: 'dt-uuid-002',
    transformerCode: 'D-0102',
    faultType: FaultType.DT,
    suspectedParentPoleId: null,
    suspectedParentPoleCode: null,
    suspectedChildPoleId: 'pole-root-01',
    suspectedChildPoleCode: 'P-010',
    latitude: 12.9725,
    longitude: 77.6425,
    pincode: '560078',
    affectedPolesCount: 120,
    affectedPoleIds: ['pole-010', 'pole-011'],
    confidence: ConfidenceLevel.HIGH,
    evidence: [],
    assumptions: [],
    rejectedAlternatives: [],
    explanation: 'Distribution Transformer D-0102 failure detected. All 120 downstream poles affected.',
  };

  const decisionEngine = new DecisionEngine();
  const card = decisionEngine.createDecisionCard(candidate);

  console.assert(card.faultType === FaultType.DT, 'FaultType should be DT');
  console.assert(card.recommendedAction.title === 'Inspect Distribution Transformer Fuse', 'Recommended action title invalid');
  console.assert(card.rejectedAlternatives.some((r) => r.hypothesis === 'Single Span Fault'), 'Single span fault rejection missing');

  console.log('✅ Test 2 Passed! Decision Card generated cleanly:', card.recommendedAction.detail);
}

function testInferredTopologyDecisionCard() {
  console.log('🧪 Test 3: Decision Card for Inferred Topology with Missing Device...');

  const candidate: CandidateFaultSpan = {
    transformerId: 'dt-uuid-005',
    transformerCode: 'D-0105',
    faultType: FaultType.SPAN,
    suspectedParentPoleId: 'pole-050',
    suspectedParentPoleCode: 'P-050',
    suspectedChildPoleId: 'pole-051',
    suspectedChildPoleCode: 'P-051',
    latitude: 12.9365,
    longitude: 77.6260,
    pincode: '560078',
    affectedPolesCount: 12,
    affectedPoleIds: ['pole-051'],
    confidence: ConfidenceLevel.LOW,
    evidence: [],
    assumptions: [
      'Electrical topology inferred from surveyed GPS coordinates',
      'Pole P-051 has no IoT telemetry device; fault span boundary expanded',
    ],
    rejectedAlternatives: [],
    explanation: 'Probable Span Fault between Pole P-050 and Pole P-051. 12 downstream poles affected.',
  };

  const decisionEngine = new DecisionEngine();
  const card = decisionEngine.createDecisionCard(candidate);

  console.assert(card.confidence === ConfidenceLevel.LOW, 'Confidence should be LOW');
  console.assert(card.assumptions.length >= 2, 'Assumptions list incomplete');

  console.log('✅ Test 3 Passed! Decision Card with explicit assumptions:', card.assumptions);
}

function runAllDecisionEngineTests() {
  testSurveyedSpanFaultDecisionCard();
  testDTFaultDecisionCard();
  testInferredTopologyDecisionCard();
}

runAllDecisionEngineTests();
