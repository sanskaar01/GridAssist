export interface DecisionCardData {
  id: string;
  transformerId: string;
  transformerCode: string;
  faultType: 'SPAN' | 'DT' | 'FEEDER' | 'SENSOR' | 'UNKNOWN';
  suspectedParentPoleCode: string | null;
  suspectedChildPoleCode: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
  latitude: number;
  longitude: number;
  pincode: string;
  affectedPolesCount: number;
  affectedPoleIds: string[];
  evidence: string[];
  assumptions: string[];
  rejectedAlternatives: Array<{ hypothesis: string; reason: string }>;
  recommendedAction: {
    title: string;
    detail: string;
    targetCoordinates: { latitude: number; longitude: number };
    estimatedInspectionDistanceMeters: number;
  };
  explanation: string;
}

export interface IncidentData {
  id: string;
  faultType: 'SPAN' | 'DT' | 'FEEDER' | 'SENSOR' | 'UNKNOWN';
  transformerId: string;
  suspectedParentPoleId: string | null;
  suspectedChildPoleId: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: { items?: string[]; timeline?: Array<{ timestamp: string; event: string; details?: string }> };
  assumptions: { items?: string[] };
  rejectedAlternatives: { items?: Array<{ hypothesis: string; reason: string }> };
  recommendedAction: string;
  affectedPoles: number;
  latitude: number;
  longitude: number;
  pincode: string;
  status: 'ACTIVE' | 'RESOLVED' | 'VERIFYING' | 'CLOSED';
  detectedAt: string;
  lastObservedAt: string;
  resolvedAt?: string | null;
  decisionCard?: DecisionCardData;
}

export interface TicketData {
  id: string;
  incidentId: string;
  assignedCrewId?: string | null;
  status: 'DETECTED' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'RESOLVED' | 'VERIFYING' | 'VERIFIED' | 'CLOSED';
  assignedCrew?: {
    id: string;
    code: string;
    name: string;
    contactNumber?: string;
  };
}

export interface CrewData {
  id: string;
  code: string;
  name: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'OFFLINE';
  contactNumber?: string;
}

export interface PoleData {
  id: string;
  transformerId: string;
  parentPoleId: string | null;
  sequenceNumber: number | null;
  latitude: number;
  longitude: number;
  ward: string;
  pincode: string | null;
  poleType: string;
  topologySource: 'SURVEYED' | 'INFERRED';
  currentState: 'LIVE' | 'DARK' | 'UNKNOWN' | 'OFFLINE';
  hasDevice: boolean;
  poleState?: {
    currentState: 'LIVE' | 'DARK' | 'UNKNOWN' | 'OFFLINE';
    lastEvent?: string;
    lastEventTimestamp?: string;
  };
}

export interface TransformerData {
  id: string;
  feederId: string;
  transformerCode: string;
  latitude: number;
  longitude: number;
  ward: string;
  status: string;
  poles: PoleData[];
  inferredEdges: Array<{
    id: string;
    parentPoleId: string;
    childPoleId: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

export interface SystemStatusData {
  telemetry: 'HEALTHY' | 'WARNING' | 'ERROR';
  localization: 'HEALTHY' | 'WARNING' | 'ERROR';
  incidentEngine: 'HEALTHY' | 'WARNING' | 'ERROR';
  ticketEngine: 'HEALTHY' | 'WARNING' | 'ERROR';
  database: 'HEALTHY' | 'WARNING' | 'ERROR';
  simulator: 'READY' | 'RUNNING' | 'STOPPED';
}

export interface PipelineMetricsData {
  telemetryEventsReceived: number;
  localizedFaults: number;
  activeIncidentsCount: number;
  openTicketsCount: number;
  totalMonitoredPoles: number;
  darkPolesCount: number;
}

export interface DashboardResponse {
  systemStatus: SystemStatusData;
  pipeline: PipelineMetricsData;
  transformers: TransformerData[];
  activeIncidents: IncidentData[];
  activeTickets: TicketData[];
  crews: CrewData[];
}
