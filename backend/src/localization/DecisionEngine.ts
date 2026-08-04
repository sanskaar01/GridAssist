import { CandidateFaultSpan } from './LocalizationEngine.js';
import { ConfidenceLevel, FaultType } from '@prisma/client';

export interface RecommendedAction {
  title: string;
  detail: string;
  targetCoordinates: {
    latitude: number;
    longitude: number;
  };
  estimatedInspectionDistanceMeters: number;
}

export interface RejectedAlternative {
  hypothesis: string;
  reason: string;
}

export interface DecisionCard {
  id: string;
  transformerId: string;
  transformerCode: string;
  faultType: FaultType;
  suspectedParentPoleId: string | null;
  suspectedParentPoleCode: string | null;
  suspectedChildPoleId: string | null;
  suspectedChildPoleCode: string | null;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  latitude: number;
  longitude: number;
  pincode: string;
  affectedPolesCount: number;
  affectedPoleIds: string[];
  evidence: string[];
  assumptions: string[];
  rejectedAlternatives: RejectedAlternative[];
  recommendedAction: RecommendedAction;
  explanation: string;
}

export class DecisionEngine {
  createDecisionCard(candidate: CandidateFaultSpan): DecisionCard {
    const confidenceReason = this.explainConfidence(candidate);
    const evidence = this.buildEvidenceList(candidate);
    const assumptions = this.buildAssumptionsList(candidate);
    const rejectedAlternatives = this.buildRejectedAlternatives(candidate);
    const recommendedAction = this.buildRecommendedAction(candidate);

    return {
      id: `DC-${candidate.transformerCode}-${Date.now()}`,
      transformerId: candidate.transformerId,
      transformerCode: candidate.transformerCode,
      faultType: candidate.faultType,
      suspectedParentPoleId: candidate.suspectedParentPoleId,
      suspectedParentPoleCode: candidate.suspectedParentPoleCode,
      suspectedChildPoleId: candidate.suspectedChildPoleId,
      suspectedChildPoleCode: candidate.suspectedChildPoleCode,
      confidence: candidate.confidence,
      confidenceReason,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      pincode: candidate.pincode,
      affectedPolesCount: candidate.affectedPolesCount,
      affectedPoleIds: candidate.affectedPoleIds,
      evidence,
      assumptions,
      rejectedAlternatives,
      recommendedAction,
      explanation: candidate.explanation,
    };
  }

  private explainConfidence(candidate: CandidateFaultSpan): string {
    if (candidate.confidence === ConfidenceLevel.HIGH) {
      return 'Surveyed topology confirmed. Complete telemetry observations with zero device gaps on frontier.';
    }
    if (candidate.confidence === ConfidenceLevel.MEDIUM) {
      return candidate.assumptions.length > 0
        ? candidate.assumptions.join('; ')
        : 'Electrical topology inferred from surveyed GPS coordinates.';
    }
    return 'Unmonitored poles on frontier span increase localization uncertainty.';
  }

  private buildEvidenceList(candidate: CandidateFaultSpan): string[] {
    const evidenceList: string[] = [];

    if (candidate.faultType === FaultType.DT) {
      evidenceList.push(`✓ Distribution Transformer ${candidate.transformerCode} lost output`);
      evidenceList.push(`✓ ${candidate.affectedPolesCount} downstream poles report dark`);
      evidenceList.push(`✓ Zero live poles observed beneath transformer`);
    } else {
      const parentCode = candidate.suspectedParentPoleCode || `DT-${candidate.transformerCode}`;
      const childCode = candidate.suspectedChildPoleCode || 'Unknown';
      evidenceList.push(`✓ Pole ${parentCode} reported LIVE`);
      evidenceList.push(`✓ Pole ${childCode} reported DARK`);
      evidenceList.push(`✓ ${candidate.affectedPolesCount} downstream poles also report outage`);
      evidenceList.push(`✓ No scheduled maintenance matches feeder/transformer ${candidate.transformerCode}`);
    }

    return evidenceList;
  }

  private buildAssumptionsList(candidate: CandidateFaultSpan): string[] {
    const assumptions = [...candidate.assumptions];

    if (!candidate.pincode || candidate.pincode === '560078') {
      assumptions.push('PIN code estimated from nearest surveyed pole in ward');
    }

    return Array.from(new Set(assumptions));
  }

  private buildRejectedAlternatives(candidate: CandidateFaultSpan): RejectedAlternative[] {
    const rejected: RejectedAlternative[] = [];

    if (candidate.faultType === FaultType.SPAN) {
      const parentCode = candidate.suspectedParentPoleCode || `DT-${candidate.transformerCode}`;
      rejected.push({
        hypothesis: 'Transformer Failure',
        reason: `Upstream pole ${parentCode} remains energized.`,
      });
      rejected.push({
        hypothesis: 'Sensor Failure',
        reason: `${candidate.affectedPolesCount} downstream poles report matching outage patterns.`,
      });
      rejected.push({
        hypothesis: 'Scheduled Outage',
        reason: 'No scheduled maintenance window matches this active feeder or DT.',
      });
    } else if (candidate.faultType === FaultType.DT) {
      rejected.push({
        hypothesis: 'Single Span Fault',
        reason: 'Entire transformer cluster is dark rather than a single branch segment.',
      });
      rejected.push({
        hypothesis: 'Sensor Failure',
        reason: 'Multiple poles across all branches report simultaneous outage.',
      });
    }

    return rejected;
  }

  private buildRecommendedAction(candidate: CandidateFaultSpan): RecommendedAction {
    if (candidate.faultType === FaultType.DT) {
      return {
        title: 'Inspect Distribution Transformer Fuse',
        detail: `Dispatch crew to Distribution Transformer ${candidate.transformerCode}. Inspect HT fuse and breaker unit.`,
        targetCoordinates: {
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        },
        estimatedInspectionDistanceMeters: 0,
      };
    }

    const parentCode = candidate.suspectedParentPoleCode || `DT-${candidate.transformerCode}`;
    const childCode = candidate.suspectedChildPoleCode || 'Unknown';

    return {
      title: 'Dispatch Line Repair Crew',
      detail: `Dispatch nearest crew to span between Pole ${parentCode} and Pole ${childCode}. Inspect line conductors for physical breaks.`,
      targetCoordinates: {
        latitude: candidate.latitude,
        longitude: candidate.longitude,
      },
      estimatedInspectionDistanceMeters: 18,
    };
  }
}
