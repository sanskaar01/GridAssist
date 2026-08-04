import React, { useState } from 'react';
import { IncidentData, TicketData, CrewData } from '../../types';
import { updateTicketStatus } from '../../services/dashboardService';
import { AlertOctagon, CheckCircle2, ShieldCheck, MapPin, Wrench, UserCheck, Activity, Info } from 'lucide-react';

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

  if (!selectedIncident) {
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

  const decisionCard = selectedIncident.decisionCard;
  const matchingTicket = tickets.find((t) => t.incidentId === selectedIncident.id);

  const handleStatusChange = async (targetStatus: string) => {
    if (!matchingTicket) return;
    setIsUpdating(true);
    try {
      await updateTicketStatus(matchingTicket.id, targetStatus, selectedCrewId || undefined);
      onRefreshData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Status transition failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const confidenceBadgeColor =
    selectedIncident.confidence === 'HIGH'
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : selectedIncident.confidence === 'MEDIUM'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

  return (
    <aside className="w-[25%] min-w-[320px] max-w-[420px] bg-[#161B22] border-l border-[#30363D] flex flex-col h-full text-xs overflow-y-auto font-mono">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#30363D] bg-[#0D1117] flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-gray-200 uppercase tracking-wider">
          <AlertOctagon className="w-4 h-4 text-amber-400" />
          <span>Fault Assessment</span>
        </div>
        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${confidenceBadgeColor}`}>
          CONFIDENCE: {selectedIncident.confidence}
        </span>
      </div>

      <div className="p-3 space-y-4">
        {/* Section 1: Fault Summary */}
        <div className="bg-[#0D1117] p-3 rounded border border-[#30363D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[11px]">FAULT TYPE:</span>
            <span className="text-rose-400 font-bold text-sm">{selectedIncident.faultType} FAULT</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">TRANSFORMER:</span>
            <span className="text-white font-bold">{decisionCard?.transformerCode || 'D-0101'}</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">FAILED SPAN:</span>
            <span className="text-amber-400 font-bold">
              {decisionCard?.suspectedParentPoleCode || 'DT'} → {decisionCard?.suspectedChildPoleCode || 'P-ROOT'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">AFFECTED POLES:</span>
            <span className="text-rose-400 font-bold">{selectedIncident.affectedPoles} Dark Poles</span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#21262D]">
            <span className="text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-400" /> COORDINATES:
            </span>
            <span className="text-gray-200">
              {selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude.toFixed(4)} ({selectedIncident.pincode})
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
            {((decisionCard?.evidence || []) as string[]).map((item, idx) => (
              <div key={idx} className="text-emerald-300 flex items-start gap-1.5">
                <span className="leading-tight">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclosed Assumptions */}
        {decisionCard?.assumptions && decisionCard.assumptions.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Disclosed Assumptions</span>
            </div>
            <div className="bg-[#0D1117] p-2.5 rounded border border-amber-500/30 text-amber-300 space-y-1 text-[11px]">
              {decisionCard.assumptions.map((item, idx) => (
                <div key={idx}>• {item}</div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Hypotheses */}
        {decisionCard?.rejectedAlternatives && decisionCard.rejectedAlternatives.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Rejected Alternatives
            </div>
            <div className="bg-[#0D1117] p-2.5 rounded border border-[#30363D] space-y-2 text-[11px]">
              {decisionCard.rejectedAlternatives.map((alt, idx) => (
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
              {decisionCard?.recommendedAction?.title || 'Dispatch Repair Crew'}
            </div>
            <div>{decisionCard?.recommendedAction?.detail || selectedIncident.recommendedAction}</div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VISUAL SECTION DIVIDER: REPAIR TICKET WORKFLOW */}
        {/* ========================================================================= */}
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

          {matchingTicket ? (
            <div className="bg-[#0D1117] p-3 rounded border border-[#30363D] space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">TICKET ID:</span>
                <span className="text-white font-bold">{matchingTicket.id.substring(0, 13)}...</span>
              </div>

              {/* Crew Selector */}
              <div className="space-y-1">
                <label className="text-gray-400 text-[11px] block">ASSIGN FIELD REPAIR CREW:</label>
                <select
                  value={selectedCrewId || matchingTicket.assignedCrewId || ''}
                  onChange={(e) => setSelectedCrewId(e.target.value)}
                  className="w-full bg-[#161B22] text-gray-200 text-xs p-1.5 rounded border border-[#30363D] focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Available Crew --</option>
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
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> ACKNOWLEDGE TICKET
                  </button>
                )}

                {(matchingTicket.status === 'DETECTED' || matchingTicket.status === 'ACKNOWLEDGED') && (
                  <button
                    disabled={isUpdating || (!selectedCrewId && !matchingTicket.assignedCrewId)}
                    onClick={() => handleStatusChange('ASSIGNED')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" /> ASSIGN CREW & DISPATCH
                  </button>
                )}

                {matchingTicket.status === 'ASSIGNED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('RESOLVED')}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> CLAIM REPAIR COMPLETE
                  </button>
                )}

                {(matchingTicket.status === 'RESOLVED' || matchingTicket.status === 'VERIFYING') && (
                  <div className="p-2 bg-amber-950/30 border border-amber-500/30 rounded text-[11px] text-amber-300 leading-tight">
                    ⚡ <strong>AUTOMATED TELEMETRY VERIFICATION IN PROGRESS</strong>
                    <br />
                    Ticket will automatically close once IoT telemetry confirms power restoration across all dark poles.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center p-3 bg-[#0D1117] rounded border border-[#30363D]">
              No associated ticket found.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
