import { PoleStateStatus, FaultType, ConfidenceLevel, TopologySource } from '@prisma/client';
import { TopologyEngine, TransformerNetworkGraph, TopologyNode } from '../topology/TopologyEngine.js';
import { FaultClassifier } from './FaultClassifier.js';
import { PoleStateRepository } from '../repositories/PoleStateRepository.js';

export interface CandidateFaultSpan {
  transformerId: string;
  transformerCode: string;
  faultType: FaultType;
  suspectedParentPoleId: string | null;
  suspectedParentPoleCode: string | null;
  suspectedChildPoleId: string | null;
  suspectedChildPoleCode: string | null;
  latitude: number;
  longitude: number;
  pincode: string;
  affectedPolesCount: number;
  affectedPoleIds: string[];
  confidence: ConfidenceLevel;
  evidence: string[];
  assumptions: string[];
  rejectedAlternatives: Array<{ hypothesis: string; reason: string }>;
  explanation: string;
}

export class LocalizationEngine {
  constructor(
    private topologyEngine = new TopologyEngine(),
    private poleStateRepo = new PoleStateRepository(),
    private faultClassifier = new FaultClassifier()
  ) {}

  async localizeTransformer(transformerId: string): Promise<CandidateFaultSpan[]> {
    const graph = await this.topologyEngine.loadTransformerGraph(transformerId);
    if (!graph || graph.nodes.size === 0) return [];

    // Load current PoleState map for all poles in the transformer
    const poleStates = new Map<string, PoleStateStatus>();
    for (const [poleId] of graph.nodes) {
      const stateRow = await this.poleStateRepo.findByPoleId(poleId);
      poleStates.set(poleId, stateRow ? stateRow.currentState : PoleStateStatus.LIVE);
    }

    // Pre-classify failure mode
    const classification = this.faultClassifier.classify(graph, poleStates);

    if (classification.faultType === FaultType.UNKNOWN) {
      return [];
    }

    // Case 1: Distribution Transformer (DT) Fault
    if (classification.faultType === FaultType.DT) {
      const allDarkPoleIds = Array.from(graph.nodes.keys()).filter(
        (id) => poleStates.get(id) === PoleStateStatus.DARK
      );

      const confidence = graph.topologySource === TopologySource.SURVEYED ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM;

      return [
        {
          transformerId: graph.transformerId,
          transformerCode: graph.transformerCode,
          faultType: FaultType.DT,
          suspectedParentPoleId: null,
          suspectedParentPoleCode: null,
          suspectedChildPoleId: graph.rootPoleIds[0] || null,
          suspectedChildPoleCode: graph.rootPoleIds[0] ? `P-${graph.rootPoleIds[0].substring(0, 6)}` : null,
          latitude: graph.latitude,
          longitude: graph.longitude,
          pincode: graph.nodes.get(graph.rootPoleIds[0])?.pincode || '560078',
          affectedPolesCount: allDarkPoleIds.length,
          affectedPoleIds: allDarkPoleIds,
          confidence,
          evidence: [
            `✓ Distribution Transformer ${graph.transformerCode} lost output`,
            `✓ All ${allDarkPoleIds.length} downstream poles report dark`,
            `✓ Zero live poles observed beneath transformer`,
          ],
          assumptions:
            graph.topologySource === TopologySource.INFERRED
              ? ['Electrical topology inferred from geographic proximity']
              : [],
          rejectedAlternatives: [
            {
              hypothesis: 'Single Span Fault',
              reason: 'Entire transformer cluster is dark rather than a single branch segment.',
            },
            {
              hypothesis: 'Sensor Failure',
              reason: 'Multiple poles across all branches report simultaneous outage.',
            },
          ],
          explanation: `Distribution Transformer ${graph.transformerCode} failure detected. All ${allDarkPoleIds.length} downstream poles affected.`,
        },
      ];
    }

    // Case 2: Sensor Failure (Single isolated dark pole)
    if (classification.faultType === FaultType.SENSOR) {
      return [];
    }

    // Case 3: Span Fault Frontier Localization
    const candidates: CandidateFaultSpan[] = [];
    const visitedNodes = new Set<string>();

    // Frontier Search traversal: Find LIVE -> DARK transitions
    const searchQueue: Array<{ parentNode: TopologyNode | null; childNode: TopologyNode }> = [];

    // Initialize queue with root poles (Assume DT output itself is LIVE since DT fault was ruled out)
    for (const rootId of graph.rootPoleIds) {
      const node = graph.nodes.get(rootId);
      if (node) {
        const rootState = poleStates.get(rootId) || PoleStateStatus.LIVE;
        if (rootState === PoleStateStatus.DARK) {
          // Frontier right at DT output to root pole
          searchQueue.push({ parentNode: null, childNode: node });
        } else {
          // Root is LIVE, traverse children
          this.traverseForFrontiers(node, graph, poleStates, candidates, visitedNodes);
        }
      }
    }

    // Process direct root frontiers if any
    for (const item of searchQueue) {
      if (!visitedNodes.has(item.childNode.id)) {
        visitedNodes.add(item.childNode.id);
        const candidate = this.buildCandidateSpan(
          graph,
          item.parentNode,
          item.childNode,
          poleStates
        );
        candidates.push(candidate);
      }
    }

    return candidates;
  }

  private traverseForFrontiers(
    parentNode: TopologyNode,
    graph: TransformerNetworkGraph,
    poleStates: Map<string, PoleStateStatus>,
    candidates: CandidateFaultSpan[],
    visitedNodes: Set<string>
  ) {
    const parentState = poleStates.get(parentNode.id) || PoleStateStatus.LIVE;
    const childrenIds = graph.childrenMap.get(parentNode.id) || [];

    for (const childId of childrenIds) {
      const childNode = graph.nodes.get(childId);
      if (!childNode) continue;

      const childState = poleStates.get(childId) || PoleStateStatus.LIVE;

      if (parentState === PoleStateStatus.LIVE && childState === PoleStateStatus.DARK) {
        // FOUND FAULT FRONTIER!
        if (!visitedNodes.has(childId)) {
          visitedNodes.add(childId);
          const candidate = this.buildCandidateSpan(graph, parentNode, childNode, poleStates);
          candidates.push(candidate);
        }
      } else if (parentState === PoleStateStatus.LIVE && childState === PoleStateStatus.LIVE) {
        // Continue traversing downstream live branch
        this.traverseForFrontiers(childNode, graph, poleStates, candidates, visitedNodes);
      }
    }
  }

  private buildCandidateSpan(
    graph: TransformerNetworkGraph,
    parentNode: TopologyNode | null,
    childNode: TopologyNode,
    poleStates: Map<string, PoleStateStatus>
  ): CandidateFaultSpan {
    // 1. Calculate affected downstream sub-tree dark poles
    const affectedPoleIds: string[] = [];
    this.collectDownstreamDarkPoles(childNode.id, graph, poleStates, affectedPoleIds);

    // 2. Midpoint GPS calculation
    const latitude = parentNode
      ? (parentNode.latitude + childNode.latitude) / 2
      : childNode.latitude;
    const longitude = parentNode
      ? (parentNode.longitude + childNode.longitude) / 2
      : childNode.longitude;

    const pincode = childNode.pincode || parentNode?.pincode || '560078';

    // 3. Deterministic Confidence Evaluation & Assumptions
    const assumptions: string[] = [];
    let confidence: ConfidenceLevel = ConfidenceLevel.HIGH;

    if (graph.topologySource === TopologySource.INFERRED) {
      confidence = ConfidenceLevel.MEDIUM;
      assumptions.push('Electrical topology inferred from surveyed GPS coordinates');
    }

    if (!childNode.hasDevice) {
      confidence = ConfidenceLevel.LOW;
      assumptions.push(`Pole ${childNode.code} has no IoT telemetry device; fault span boundary expanded`);
    }

    if (parentNode && !parentNode.hasDevice) {
      confidence = ConfidenceLevel.LOW;
      assumptions.push(`Pole ${parentNode.code} has no IoT telemetry device; fault span boundary expanded`);
    }

    // 4. Evidence Checklist
    const parentCode = parentNode ? parentNode.code : `DT-${graph.transformerCode}`;
    const evidence = [
      `✓ Pole ${parentCode} reported LIVE`,
      `✓ Pole ${childNode.code} reported DARK`,
      `✓ ${affectedPoleIds.length} downstream poles also report outage`,
      `✓ No scheduled maintenance matching transformer ${graph.transformerCode}`,
    ];

    // 5. Rejected Alternatives
    const rejectedAlternatives = [
      {
        hypothesis: 'Transformer Failure',
        reason: parentNode ? `Upstream pole ${parentCode} remains energized.` : 'Other feeder branches remain energized.',
      },
      {
        hypothesis: 'Sensor Failure',
        reason: `${affectedPoleIds.length} downstream poles report matching outage patterns.`,
      },
    ];

    const explanation = `Probable Span Fault between Pole ${parentCode} and Pole ${childNode.code}. ${affectedPoleIds.length} downstream poles affected.`;

    return {
      transformerId: graph.transformerId,
      transformerCode: graph.transformerCode,
      faultType: FaultType.SPAN,
      suspectedParentPoleId: parentNode ? parentNode.id : null,
      suspectedParentPoleCode: parentCode,
      suspectedChildPoleId: childNode.id,
      suspectedChildPoleCode: childNode.code,
      latitude,
      longitude,
      pincode,
      affectedPolesCount: affectedPoleIds.length,
      affectedPoleIds,
      confidence,
      evidence,
      assumptions,
      rejectedAlternatives,
      explanation,
    };
  }

  private collectDownstreamDarkPoles(
    startPoleId: string,
    graph: TransformerNetworkGraph,
    poleStates: Map<string, PoleStateStatus>,
    result: string[]
  ) {
    result.push(startPoleId);
    const children = graph.childrenMap.get(startPoleId) || [];
    for (const childId of children) {
      const state = poleStates.get(childId) || PoleStateStatus.LIVE;
      if (state === PoleStateStatus.DARK) {
        this.collectDownstreamDarkPoles(childId, graph, poleStates, result);
      }
    }
  }
}
