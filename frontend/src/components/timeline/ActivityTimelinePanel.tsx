import React from 'react';
import { IncidentData, TicketData } from '../../types';
import { Zap, AlertTriangle, ShieldAlert, Wrench, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  selectedIncident: IncidentData | null;
  matchingTicket: TicketData | undefined;
}

import { useSimulationStore } from '../../store/useSimulationStore';

export const ActivityTimelinePanel: React.FC<Props> = ({ selectedIncident, matchingTicket }) => {
  const { activeScript, currentStepIndex, isCompleted } = useSimulationStore();

  // Guided Mode / Scenario 4 Chronological Timeline Proof Builder
  const guidedTimeline: Array<{ timestamp: string; event: string; details: string }> = [];

  if (activeScript.id === 'power-restoration') {
    guidedTimeline.push({
      timestamp: '13:20:41',
      event: 'Telemetry Ingested',
      details: 'DEV-W084-D0101-P004 emitted POWER_LOST (0 V)',
    });
    if (currentStepIndex >= 0) {
      guidedTimeline.push({
        timestamp: '13:20:43',
        event: 'Fault Localized',
        details: 'Isolated Fault Frontier: Span P-003 -> P-004',
      });
      guidedTimeline.push({
        timestamp: '13:20:45',
        event: 'Crew Dispatched',
        details: 'Ticket TCK-SPAN-P004 ASSIGNED to CREW-BLR-01',
      });
    }
    if (currentStepIndex >= 1) {
      guidedTimeline.push({
        timestamp: '13:20:48',
        event: 'Repair Claimed',
        details: 'Verification REJECTED — Sensors still report 0 V',
      });
    }
    if (currentStepIndex >= 2) {
      guidedTimeline.push({
        timestamp: '13:20:50',
        event: 'Telemetry Verified',
        details: 'POWER_RESTORED packet ingested (230 V restored)',
      });
    }
    if (currentStepIndex >= 3 || isCompleted) {
      guidedTimeline.push({
        timestamp: '13:20:51',
        event: 'Ticket Closed',
        details: 'Status VERIFYING -> VERIFIED -> CLOSED',
      });
    }
  }

  // Extract timeline events from incident evidence object
  const rawTimeline = selectedIncident?.evidence?.timeline || guidedTimeline;

  // Complement with ticket status milestones
  const mergedTimeline = [...rawTimeline];

  if (matchingTicket?.assignedCrew && selectedIncident) {
    mergedTimeline.push({
      timestamp: selectedIncident.detectedAt,
      event: 'Crew Assigned',
      details: `Assigned repair unit ${matchingTicket.assignedCrew.code} (${matchingTicket.assignedCrew.name})`,
    });
  }

  // Sort chronologically ascending
  mergedTimeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const getEventIcon = (eventName: string) => {
    if (eventName.includes('Power Lost') || eventName.includes('Outage')) {
      return <Zap className="w-3.5 h-3.5 text-rose-500" />;
    }
    if (eventName.includes('Created') || eventName.includes('Incident')) {
      return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (eventName.includes('Crew') || eventName.includes('Assigned')) {
      return <Wrench className="w-3.5 h-3.5 text-blue-400" />;
    }
    if (eventName.includes('Resolved') || eventName.includes('Verified') || eventName.includes('Closed')) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />;
  };

  return (
    <footer className="h-24 bg-[#0D1117] border-t border-[#30363D] px-4 py-2 text-xs flex flex-col justify-between font-mono">
      <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 border-b border-[#21262D] pb-1">
        <span className="flex items-center gap-1.5 text-gray-200">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          ACTIVITY TIMELINE — {selectedIncident ? `INCIDENT #${selectedIncident.id.substring(0, 8)}` : 'NO ACTIVE INCIDENT'}
        </span>
        <span className="text-gray-400">CHRONOLOGICAL EVENT LOG</span>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto py-1 scrollbar-thin">
        {mergedTimeline.map((item, idx) => {
          const timeFormatted = new Date(item.timestamp).toLocaleTimeString('en-IN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div
              key={idx}
              className="flex items-center gap-2 bg-[#161B22] border border-[#30363D] px-3 py-1.5 rounded shrink-0 min-w-[200px]"
            >
              {getEventIcon(item.event)}
              <div className="flex flex-col text-[11px]">
                <span className="font-bold text-white leading-tight">{item.event}</span>
                <span className="text-[10px] text-gray-400 font-normal truncate max-w-[180px]">
                  {item.details || timeFormatted}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </footer>
  );
};
