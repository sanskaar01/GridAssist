import React from 'react';
import { IncidentData, TicketData } from '../../types';
import { Zap, AlertTriangle, ShieldAlert, Wrench, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  selectedIncident: IncidentData | null;
  matchingTicket: TicketData | undefined;
}

export const ActivityTimelinePanel: React.FC<Props> = ({ selectedIncident, matchingTicket }) => {
  if (!selectedIncident) {
    return (
      <footer className="h-16 bg-[#0D1117] border-t border-[#30363D] px-4 py-2 text-xs flex items-center justify-center text-gray-500 font-mono">
        <Clock className="w-4 h-4 mr-2" /> Select an active outage to view chronological event timeline.
      </footer>
    );
  }

  // Extract timeline events from incident evidence object
  const rawTimeline = selectedIncident.evidence?.timeline || [];

  // Complement with ticket status milestones
  const mergedTimeline = [...rawTimeline];

  if (matchingTicket?.assignedCrew) {
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
          ACTIVITY TIMELINE — INCIDENT #{selectedIncident.id.substring(0, 8)}
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
