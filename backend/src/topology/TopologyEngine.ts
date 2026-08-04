import { prisma } from '../utils/prisma.js';
import { TopologySource } from '@prisma/client';

export interface TopologyNode {
  id: string;
  code: string;
  transformerId: string;
  parentPoleId: string | null;
  sequenceNumber: number | null;
  latitude: number;
  longitude: number;
  ward: string;
  pincode: string | null;
  hasDevice: boolean;
  topologySource: TopologySource;
}

export interface ElectricalSpanEdge {
  fromPoleId: string;
  toPoleId: string;
  isSurveyed: boolean;
}

export interface TransformerNetworkGraph {
  transformerId: string;
  transformerCode: string;
  latitude: number;
  longitude: number;
  topologySource: TopologySource;
  nodes: Map<string, TopologyNode>;
  childrenMap: Map<string, string[]>;
  parentMap: Map<string, string>;
  rootPoleIds: string[];
}

export class TopologyEngine {
  async loadTransformerGraph(transformerId: string): Promise<TransformerNetworkGraph | null> {
    const transformer = await prisma.distributionTransformer.findUnique({
      where: { id: transformerId },
      include: {
        poles: true,
        inferredEdges: true,
      },
    });

    if (!transformer) return null;

    const nodes = new Map<string, TopologyNode>();
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();
    const rootPoleIds: string[] = [];

    // Determine primary topology source
    const hasSurveyedPoles = transformer.poles.some((p) => p.topologySource === TopologySource.SURVEYED && p.parentPoleId !== null);
    const overallTopologySource = hasSurveyedPoles ? TopologySource.SURVEYED : TopologySource.INFERRED;

    for (const pole of transformer.poles) {
      nodes.set(pole.id, {
        id: pole.id,
        code: `P-${pole.id.substring(0, 6)}`,
        transformerId: pole.transformerId,
        parentPoleId: pole.parentPoleId,
        sequenceNumber: pole.sequenceNumber,
        latitude: pole.latitude,
        longitude: pole.longitude,
        ward: pole.ward,
        pincode: pole.pincode,
        hasDevice: pole.hasDevice,
        topologySource: pole.topologySource,
      });

      childrenMap.set(pole.id, []);
    }

    if (overallTopologySource === TopologySource.SURVEYED) {
      for (const pole of transformer.poles) {
        if (pole.parentPoleId) {
          const children = childrenMap.get(pole.parentPoleId) || [];
          children.push(pole.id);
          childrenMap.set(pole.parentPoleId, children);
          parentMap.set(pole.id, pole.parentPoleId);
        } else {
          rootPoleIds.push(pole.id);
        }
      }
    } else {
      // Inferred topology using InferredEdge table
      for (const edge of transformer.inferredEdges) {
        const children = childrenMap.get(edge.parentPoleId) || [];
        children.push(edge.childPoleId);
        childrenMap.set(edge.parentPoleId, children);
        parentMap.set(edge.childPoleId, edge.parentPoleId);
      }

      // Root poles are those without a parent in inferred graph
      for (const pole of transformer.poles) {
        if (!parentMap.has(pole.id)) {
          rootPoleIds.push(pole.id);
        }
      }
    }

    return {
      transformerId: transformer.id,
      transformerCode: transformer.transformerCode,
      latitude: transformer.latitude,
      longitude: transformer.longitude,
      topologySource: overallTopologySource,
      nodes,
      childrenMap,
      parentMap,
      rootPoleIds,
    };
  }
}
