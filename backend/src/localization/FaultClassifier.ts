import { PoleStateStatus, FaultType } from '@prisma/client';
import { TransformerNetworkGraph } from '../topology/TopologyEngine.js';

export interface FaultClassificationResult {
  faultType: FaultType;
  reason: string;
}

export class FaultClassifier {
  classify(
    graph: TransformerNetworkGraph,
    poleStates: Map<string, PoleStateStatus>
  ): FaultClassificationResult {
    const totalPoles = graph.nodes.size;
    if (totalPoles === 0) {
      return { faultType: FaultType.UNKNOWN, reason: 'Empty network topology' };
    }

    let darkCount = 0;
    let liveCount = 0;

    for (const [poleId] of graph.nodes) {
      const state = poleStates.get(poleId) || PoleStateStatus.LIVE;
      if (state === PoleStateStatus.DARK) {
        darkCount++;
      } else if (state === PoleStateStatus.LIVE) {
        liveCount++;
      }
    }

    // 1. Check for DT Fault (All or almost all poles dark with zero live poles)
    if (darkCount > 0 && liveCount === 0 && darkCount >= Math.floor(totalPoles * 0.8)) {
      return {
        faultType: FaultType.DT,
        reason: `All ${darkCount} monitored poles under Distribution Transformer ${graph.transformerCode} report loss of power simultaneously.`,
      };
    }

    // 2. Check for Sensor Failure (Single isolated dark pole with live children)
    for (const [poleId] of graph.nodes) {
      const state = poleStates.get(poleId) || PoleStateStatus.LIVE;
      if (state === PoleStateStatus.DARK) {
        const children = graph.childrenMap.get(poleId) || [];
        if (children.length > 0) {
          const allChildrenLive = children.every(
            (childId) => (poleStates.get(childId) || PoleStateStatus.LIVE) === PoleStateStatus.LIVE
          );
          if (allChildrenLive && darkCount === 1) {
            return {
              faultType: FaultType.SENSOR,
              reason: `Pole ${poleId} reports DARK while all downstream child poles remain LIVE. Physically impossible as a line fault; sensor failure suspected.`,
            };
          }
        }
      }
    }

    // 3. Span Fault
    if (darkCount > 0) {
      return {
        faultType: FaultType.SPAN,
        reason: `${darkCount} dark poles detected. Frontier search will isolate failed electrical line spans.`,
      };
    }

    return {
      faultType: FaultType.UNKNOWN,
      reason: 'No dark poles observed.',
    };
  }
}
