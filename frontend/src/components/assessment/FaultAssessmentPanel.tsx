import React, { useState } from 'react';
import { IncidentData, TicketData, CrewData } from '../../types';
import { updateTicketStatus } from '../../services/dashboardService';
import { AlertOctagon, CheckCircle2, ShieldCheck, MapPin, Wrench, UserCheck, Activity, Info, Award } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

interface Props {
  selectedIncident: IncidentData | null;
  tickets: TicketData[];
  crews: CrewData[];
  onRefreshData: () => void;
}

export const FaultAssessmentPanel: React.FC<Props> = ({
  selectedIncident,
  tickets,
  crews,
  onRefreshData,
}) => {
  const [selectedCrewId, setSelectedCrewId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const { activeScript, currentStepIndex } = useSimulationStore();
  const currentStep = activeScript?.steps ? activeScript.steps[currentStepIndex] : null;

  // Construct Fallback Guided Incident for Right Panel during Guided Mode or Auto Play
  let activeIncident = selectedIncident;
  const hasActiveOutageStep =
    currentStep?.expectedState?.darkPoleCodes?.length ||
    currentStep?.expectedState?.incidentCreated ||
    (activeScript.id === 'power-restoration' && currentStepIndex <= 1);

  if (!activeIncident && hasActiveOutageStep) {
    const isDTFault = activeScript.category === 'DT_FAULT';
    const isSensorAnomaly = activeScript.category === 'SENSOR_ANOMALY';
    const isRestoration = activeScript.category === 'RESTORATION';
    const parentCode = currentStep?.expectedState?.isolatedSpan?.parentCode || currentStep?.narration?.isolatedSpan?.parentCode || 'P-003';
    const childCode = currentStep?.expectedState?.isolatedSpan?.childCode || currentStep?.narration?.isolatedSpan?.childCode || 'P-004';

    const isPrematureClaim = isRestoration && currentStepIndex === 1;
    const isVerifiedRestoration = isRestoration && currentStepIndex >= 2;

    activeIncident = {
      id: isDTFault ? 'INC-DT-D0102' : isSensorAnomaly ? 'INC-SENSOR-P003' : 'INC-GUIDED-01',
      faultType: isDTFault ? 'DT' : isSensorAnomaly ? 'SENSOR' : 'SPAN',
      transformerId: isDTFault ? 'dt-0102-id' : 'dt-fallback-01',
      suspectedParentPoleId: isDTFault ? 'D-0102' : parentCode,
      suspectedChildPoleId: isDTFault ? 'P-026' : childCode,
      confidence: 'HIGH',
      evidence: {
        items: isPrematureClaim
          ? [
              `Lineman CREW-BLR-01 pressed "Repair Complete"`,
              `System entered VERIFYING state to wait for push telemetry`,
              `IoT Sensors P-004, P-005, P-006 STILL report 0 V (DARK)`,
              `VERIFICATION REJECTED: System refuses to trust manual click while network remains broken`,
            ]
          : isVerifiedRestoration
          ? [
              `[✓] Push POWER_RESTORED telemetry ingested (230 V)`,
              `[✓] 3/3 affected poles verified energized`,
              `[✓] Fault Frontier no longer exists`,
              `[✓] Incident RESOLVED; Ticket automatically CLOSED`,
            ]
          : isSensorAnomaly
          ? [
              `IoT Sensor DEV-W084-D0101-P003 emitted POWER_LOST (Seq #401)`,
              `Device Health: Battery 14% (LOW)`,
              `Downstream Child Pole P-004 reports LIVE state (230 V)`,
              `Downstream Child Pole P-005 reports LIVE state (230 V)`,
            ]
          : isDTFault
          ? [
              `SCADA Diagnostics: 11kV Feeder F-07 (11.0 kV NORMAL) | Parallel DT D-0101 (230 V NORMAL)`,
              `D-0102 Secondary Bus Voltage: 0 V (OUTPUT LOST)`,
              `20/20 downstream poles under D-0102 reported DARK state`,
            ]
          : [
              `IoT Sensor ${currentStep?.deviceCode} emitted POWER_LOST (Seq #${currentStep?.sequenceNumber})`,
              `Downstream poles ${currentStep?.expectedState.darkPoleCodes.join(', ')} dark`,
              `Parent Pole ${parentCode} live; Fault frontier isolated on Span ${parentCode} -> ${childCode}`,
            ],
      },
      assumptions: {
        items: isPrematureClaim
          ? [
              `Requirement #4 Enforcement: Closure claim rejected until push POWER_RESTORED telemetry arrives`,
              `Fault frontier glow remains active on canvas`,
            ]
          : isVerifiedRestoration
          ? [
              `Automated Telemetry Verification Complete (Requirement #4 Satisfied)`,
              `Ticket status: VERIFIED & CLOSED`,
            ]
          : isSensorAnomaly
          ? [
              `Telemetry reports power loss at P-003, but downstream energized poles prove conductor remains energized`,
              `EMERGENCY DISPATCH: ❌ CANCELLED (Zero outage ticket created)`,
            ]
          : isDTFault
          ? [
              `Distribution Transformer Output Failure on D-0102 (Most Probable Cause: HT Fuse Blowout)`,
              `No internal Live -> Dark transition inside downstream network`,
            ]
          : [
              `Overhead conductor break isolated on Span ${parentCode} -> ${childCode}`,
              `Parallel feeder branches operating normally`,
            ],
      },
      rejectedAlternatives: {
        items: isSensorAnomaly
          ? [
              { hypothesis: 'Line Conductor Break', reason: 'Downstream child poles (P-004, P-005) remain 100% energized' },
              { hypothesis: 'Distribution Transformer Blowout', reason: 'Transformer D-0101 operating normally at 230 V' },
            ]
          : isDTFault
          ? [
              { hypothesis: '11kV Feeder Blackout', reason: 'Substation SUB-01 and Parallel DT D-0101 remain energized' },
              { hypothesis: 'Single Span Conductor Break', reason: 'Entire D-0102 subtree de-energized with zero internal Live->Dark transition' },
            ]
          : [
              { hypothesis: 'Distribution Transformer Blowout', reason: 'Parallel feeder poles remain energized' },
              { hypothesis: 'Sensor Hardware Malfunction', reason: 'Multi-pole downstream outage cascade confirmed' },
            ],
      },
      recommendedAction: isSensorAnomaly
        ? `Operational Decision: No emergency response. Schedule routine inspection for sensor DEV-W084-D0101-P003.`
        : isDTFault
        ? `Dispatch Specialized HT Crew CREW-BLR-02 to Distribution Transformer D-0102 in Ward W-085 (PIN 560078).`
        : `Dispatch Lineman Crew CREW-BLR-01 to Span ${parentCode} -> ${childCode} in Ward W-084 (PIN 560078).`,
      affectedPoles: isSensorAnomaly ? 0 : currentStep?.expectedState.darkPoleCodes.length || 0,
      latitude: 12.9716,
      longitude: 77.6412,
      pincode: '560078',
      status: 'ACTIVE',
      detectedAt: new Date().toISOString(),
      lastObservedAt: new Date().toISOString(),
      decisionCard: {
        id: isDTFault ? 'DEC-DT-D0102' : 'DEC-GUIDED-01',
        transformerId: isDTFault ? 'dt-0102-id' : 'dt-fallback-01',
        transformerCode: isDTFault ? 'D-0102' : 'D-0101',
        faultType: isDTFault ? 'DT' : 'SPAN',
        suspectedParentPoleCode: isDTFault ? 'D-0102' : parentCode,
        suspectedChildPoleCode: isDTFault ? 'P-026' : childCode,
        confidence: 'HIGH',
        confidenceReason: isDTFault
          ? 'Checklist: [✓] Feeder F-07 energized [✓] Parallel DT D-0101 energized [✓] Entire downstream network de-energized [✓] No internal Live->Dark transition.'
          : 'Deterministic telemetry cascade matching topological parent-child tree hierarchy.',
        latitude: isDTFault ? 12.9725 : 12.9716,
        longitude: isDTFault ? 77.6425 : 77.6412,
        pincode: '560078',
        affectedPolesCount: currentStep?.expectedState?.darkPoleCodes?.length || 0,
        affectedPoleIds: currentStep?.expectedState?.darkPoleCodes || [],
        evidence: isSensorAnomaly
          ? [
              'IoT Sensor DEV-W084-D0101-P003 emitted POWER_LOST',
              'Device Health: Battery 14% (LOW)',
              'Downstream Child Pole P-004 reports LIVE state (230 V)',
              'Downstream Child Pole P-005 reports LIVE state (230 V)',
            ]
          : isDTFault
          ? [
              'SCADA: Feeder F-07 11.0 kV NORMAL | Parallel DT D-0101 230 V NORMAL',
              'D-0102 Secondary Bus Voltage: 0 V (OUTPUT LOST)',
              'Entire D-0102 downstream network de-energized (20 poles)',
              'No internal Live -> Dark transition inside downstream network',
            ]
          : [
              `IoT Sensor ${currentStep?.deviceCode || ''} emitted POWER_LOST`,
              `Downstream poles ${currentStep?.expectedState?.darkPoleCodes?.join(', ') || ''} dark`,
              `Parent Pole ${parentCode} live; Fault frontier isolated`,
            ],
        assumptions: isDTFault
          ? ['Distribution Transformer Output Failure on D-0102 (Most Probable Cause: HT Fuse Blowout)']
          : [`Overhead conductor break on Span ${parentCode} -> ${childCode}`],
        rejectedAlternatives: isDTFault
          ? [{ hypothesis: '11kV Feeder Blackout', reason: 'Substation SUB-01 and Parallel DT D-0101 remain energized' }]
          : [{ hypothesis: 'Transformer Blowout', reason: 'Parallel branches live' }],
        recommendedAction: {
          title: isDTFault
            ? 'Dispatch Specialized HT Crew CREW-BLR-02 to D-0102'
            : `Dispatch Lineman Crew to Span ${parentCode} -> ${childCode}`,
          detail: isDTFault
            ? 'Dispatch Specialized HT Crew CREW-BLR-02 to Distribution Transformer D-0102 in Ward W-085 (PIN 560078).'
            : `Dispatch Lineman Crew CREW-BLR-01 to Ward W-084 (PIN 560078).`,
          targetCoordinates: { latitude: isDTFault ? 12.9725 : 12.9716, longitude: isDTFault ? 77.6425 : 77.6412 },
          estimatedInspectionDistanceMeters: 45,
        },
        explanation: isDTFault
          ? 'SCADA voltage collapse and 20/20 downstream de-energization confirmed Distribution Transformer Output Failure.'
          : 'Deterministic graph traversal algorithm identified exact conductor break.',
      },
    };
  }

  const { isCompleted } = useSimulationStore();

  if (isCompleted || (currentStepIndex >= activeScript.steps.length - 1 && currentStep?.eventType === 'POWER_RESTORED')) {
    return (
      <aside className="w-[25%] min-w-[320px] bg-[#161B22] border-l border-[#30363D] flex flex-col h-full text-xs p-6 items-center justify-center text-center font-mono select-none">
        <Award className="w-14 h-14 text-emerald-400 mb-3" />
        <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">MISSION COMPLETE</h3>
        <p className="text-gray-300 text-[11px] mt-1 font-bold">{activeScript.title}</p>

        <div className="bg-[#0D1117] p-3 rounded-lg border border-emerald-500/30 w-full text-left space-y-2 mt-4 text-[10px]">
          <div className="flex items-center justify-between text-gray-400 border-b border-[#30363D] pb-1.5">
            <span>OPERATIONAL STATUS:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              RESOLVED
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-400 border-b border-[#30363D] pb-1.5">
            <span>TELEMETRY VERIFIED:</span>
            <span className="text-emerald-400 font-bold">100% SUCCESS (230 V)</span>
          </div>
          <div className="flex items-center justify-between text-gray-400 border-b border-[#30363D] pb-1.5">
            <span>TICKET LIFECYCLE:</span>
            <span className="text-emerald-400 font-bold">CLOSED AUTOMATICALLY</span>
          </div>
          <div className="flex items-center justify-between text-gray-400">
            <span>RESTORED POLES:</span>
            <span className="text-emerald-400 font-bold">ALL NODES ENERGIZED</span>
          </div>
        </div>
        <p className="text-gray-500 text-[10px] mt-4">
          Click <strong className="text-gray-300">RESET GRID</strong> or select another scenario from the dropdown to continue.
        </p>
      </aside>
    );
  }

  if (!activeIncident) {
    return (
      <aside className="w-[25%] min-w-[320px] bg-[#161B22] border-l border-[#30363D] flex flex-col h-full text-xs p-6 items-center justify-center text-center text-gray-500">
        <Activity className="w-12 h-12 text-gray-600 mb-2 opacity-50" />
        <h3 className="text-gray-300 font-mono font-bold text-sm">NO FAULT SELECTED</h3>
        <p className="text-[11px] text-gray-400 mt-1 max-w-[240px]">
          Select an active outage from the left Fault Queue to inspect deterministic evidence, location coordinates, and crew dispatch controls.
        </p>
      </aside>
    );
  }

  const decisionCard = activeIncident.decisionCard;
  const matchingTicket = tickets.find((t) => t.incidentId === activeIncident?.id) || {
    id: 'TCK-GUIDED-001',
    incidentId: 'INC-GUIDED-01',
    assignedCrewId: 'crew-01',
    status: (currentStepIndex >= 3 ? 'ASSIGNED' : 'DETECTED') as any,
  };

  const handleStatusChange = async (targetStatus: string) => {
    if (!matchingTicket) return;
    setIsUpdating(true);
    try {
      await updateTicketStatus(matchingTicket.id, targetStatus, selectedCrewId || undefined);
      onRefreshData();
    } catch (err: any) {
      console.warn('Simulated ticket status update');
    } finally {
      setIsUpdating(false);
    }
  };

  const confidenceBadgeColor =
    activeIncident.confidence === 'HIGH'
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : activeIncident.confidence === 'MEDIUM'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

  const evidenceItems = decisionCard?.evidence || activeIncident.evidence?.items || [];
  const assumptionItems = decisionCard?.assumptions || activeIncident.assumptions?.items || [];
  const rejectedItems = decisionCard?.rejectedAlternatives || activeIncident.rejectedAlternatives?.items || [];

  return (
    <aside className="w-[25%] min-w-[320px] max-w-[420px] bg-[#161B22] border-l border-[#30363D] flex flex-col h-full text-xs overflow-y-auto font-mono">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#30363D] bg-[#0D1117] flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-gray-200 uppercase tracking-wider">
          <AlertOctagon className="w-4 h-4 text-amber-400" />
          <span>Fault Assessment</span>
        </div>
        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${confidenceBadgeColor}`}>
          CONFIDENCE: {activeIncident.confidence}
        </span>
      </div>

      <div className="p-3 space-y-4">
        {/* Section 1: Fault Summary */}
        <div className="bg-[#0D1117] p-3 rounded border border-[#30363D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[11px]">FAULT TYPE:</span>
            <span className="text-rose-400 font-bold text-sm">{activeIncident.faultType} FAULT</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">TRANSFORMER:</span>
            <span className="text-white font-bold">{decisionCard?.transformerCode || 'D-0101'}</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">FAILED SPAN:</span>
            <span className="text-amber-400 font-bold">
              {decisionCard?.suspectedParentPoleCode || 'P-002'} → {decisionCard?.suspectedChildPoleCode || 'P-003'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">AFFECTED POLES:</span>
            <span className="text-rose-400 font-bold">{activeIncident.affectedPoles} Dark Poles</span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#21262D]">
            <span className="text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-400" /> COORDINATES:
            </span>
            <span className="text-gray-200">
              {activeIncident.latitude.toFixed(4)}, {activeIncident.longitude.toFixed(4)} ({activeIncident.pincode})
            </span>
          </div>
        </div>

        {/* Observable Evidence Checklist */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deterministic Evidence</span>
          </div>
          <div className="bg-[#0D1117] p-2.5 rounded border border-[#30363D] space-y-1.5 text-[11px]">
            {evidenceItems.map((item, idx) => (
              <div key={idx} className="text-emerald-300 flex items-start gap-1.5">
                <span className="leading-tight">• {item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclosed Assumptions */}
        {assumptionItems.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Disclosed Assumptions</span>
            </div>
            <div className="bg-[#0D1117] p-2.5 rounded border border-amber-500/30 text-amber-300 space-y-1 text-[11px]">
              {assumptionItems.map((item, idx) => (
                <div key={idx}>• {item}</div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Hypotheses */}
        {rejectedItems.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Rejected Alternatives
            </div>
            <div className="bg-[#0D1117] p-2.5 rounded border border-[#30363D] space-y-2 text-[11px]">
              {rejectedItems.map((alt, idx) => (
                <div key={idx} className="border-b border-[#21262D] last:border-0 pb-1.5 last:pb-0">
                  <span className="text-gray-300 font-bold">✗ {alt.hypothesis}:</span>{' '}
                  <span className="text-gray-400">{alt.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Operational Action */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Recommended Action</span>
          </div>
          <div className="bg-blue-950/30 p-2.5 rounded border border-blue-500/30 text-blue-200 text-[11px] leading-relaxed">
            <div className="font-bold text-blue-400 mb-1">
              {decisionCard?.recommendedAction?.title || 'Dispatch Lineman Repair Crew'}
            </div>
            <div>{decisionCard?.recommendedAction?.detail || activeIncident.recommendedAction}</div>
          </div>
        </div>

        {/* Repair Ticket Workflow */}
        <div className="pt-3 border-t-2 border-[#30363D] space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-gray-200 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>Repair Ticket Operations</span>
            </div>
            {matchingTicket && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30 text-[10px]">
                {matchingTicket.status}
              </span>
            )}
          </div>

          {matchingTicket && (
            <div className="bg-[#0D1117] p-3 rounded border border-[#30363D] space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">TICKET ID:</span>
                <span className="text-white font-bold">{matchingTicket.id.substring(0, 13)}...</span>
              </div>

              {/* Crew Selector */}
              <div className="space-y-1">
                <label className="text-gray-400 text-[11px] block">ASSIGN FIELD REPAIR CREW:</label>
                <select
                  value={selectedCrewId || matchingTicket.assignedCrewId || 'crew-01'}
                  onChange={(e) => setSelectedCrewId(e.target.value)}
                  className="w-full bg-[#161B22] text-gray-200 text-xs p-1.5 rounded border border-[#30363D] focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="crew-01">CREW-BLR-01 - Lineman Unit 1 (AVAILABLE)</option>
                  <option value="crew-02">CREW-BLR-02 - Lineman Unit 2 (AVAILABLE)</option>
                  {crews.map((crew) => (
                    <option key={crew.id} value={crew.id}>
                      {crew.code} - {crew.name} ({crew.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons for Ticket Status Transitions */}
              <div className="flex flex-col gap-2 pt-1">
                {matchingTicket.status === 'DETECTED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('ACKNOWLEDGED')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> ACKNOWLEDGE TICKET
                  </button>
                )}

                {(matchingTicket.status === 'DETECTED' || matchingTicket.status === 'ACKNOWLEDGED') && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('ASSIGNED')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded text-xs transition-colors shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" /> DISPATCH LINEMAN CREW
                  </button>
                )}

                {matchingTicket.status === 'ASSIGNED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('RESOLVED')}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> CLAIM REPAIR COMPLETE
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
