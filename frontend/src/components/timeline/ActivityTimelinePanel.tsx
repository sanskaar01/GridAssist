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

  // Guided-mode operational log. Entries are only revealed once their scripted
  // operational milestone has occurred; no inferred or decorative events.
  const timelineDefinitions: Record<string, Array<{ atStep: number; event: string; details: string }>> = {
    'single-span-fault': [
      { atStep: 1, event: 'Telemetry Received', details: 'P-004 reported POWER_LOST; P-003 remains energized' },
      { atStep: 2, event: 'Topology Validated', details: 'P-005 and P-006 remain energized on a separate branch' },
      { atStep: 3, event: 'Fault Localized', details: 'Fault frontier isolated: Span P-003 → P-004' },
      { atStep: 4, event: 'Crew Assigned', details: 'CREW-BLR-01 assigned to repair ticket' },
      { atStep: 5, event: 'Power Restored', details: 'POWER_RESTORED telemetry received from affected poles' },
      { atStep: 5, event: 'Ticket Closed', details: 'Restoration verified from telemetry' },
    ],
    'transformer-failure': [
      { atStep: 1, event: 'HT Fuse Failure', details: 'D-0102 secondary output lost at root pole P-026' },
      { atStep: 2, event: 'Transformer Output Lost', details: '20 downstream poles de-energized under D-0102' },
      { atStep: 3, event: 'Transformer Fault Confirmed', details: 'Feeder healthy; outage isolated to D-0102' },
      { atStep: 4, event: 'HT Crew Assigned', details: 'CREW-BLR-02 assigned to D-0102' },
      { atStep: 5, event: 'Supply Restored', details: 'All 20 poles report restored supply' },
      { atStep: 5, event: 'Ticket Closed', details: 'Restoration verified from telemetry' },
    ],
    'sensor-failure': [
      { atStep: 1, event: 'Telemetry Received', details: 'P-003 reported POWER_LOST while children remain energized' },
      { atStep: 2, event: 'Physics Validation', details: 'Live downstream poles rule out a conductor outage' },
      { atStep: 2, event: 'False Alarm Blocked', details: 'No outage ticket created; emergency dispatch cancelled' },
      { atStep: 2, event: 'Routine Inspection Recommended', details: 'Sensor DEV-W084-D0101-P003 flagged for maintenance' },
      { atStep: 3, event: 'Sensor Heartbeat Restored', details: 'P-003 resumed normal heartbeat reporting' },
    ],
    'power-restoration': [
      { atStep: 0, event: 'Telemetry Ingested', details: 'P-004 emitted POWER_LOST; span outage active' },
      { atStep: 0, event: 'Fault Localized', details: 'Fault frontier isolated: Span P-003 → P-004' },
      { atStep: 0, event: 'Crew Dispatched', details: 'CREW-BLR-01 assigned to repair ticket' },
      { atStep: 1, event: 'Repair Claim Rejected', details: 'Verification held; affected sensors still report 0 V' },
      { atStep: 2, event: 'Power Restored', details: 'POWER_RESTORED telemetry received from affected poles' },
      { atStep: 3, event: 'Ticket Closed', details: 'Restoration verified from telemetry' },
    ],
    'severe-weather': [
      { atStep: 1, event: 'Telemetry Surge', details: 'Concurrent weather-related POWER_LOST telemetry received' },
      { atStep: 2, event: 'Span Fault Localized', details: 'Fault frontier isolated: Span P-003 → P-004' },
      { atStep: 3, event: 'DT Failure Localized', details: 'D-0102 outage grouped separately from the span fault' },
      { atStep: 5, event: 'Crew BLR-01 Assigned', details: 'LT line crew assigned to Span P-003 → P-004' },
      { atStep: 5, event: 'Crew BLR-02 Assigned', details: 'HT crew assigned to Transformer D-0102' },
      { atStep: 6, event: 'Span Restored', details: 'P-004 restoration telemetry verified; span ticket closed' },
      { atStep: 7, event: 'Transformer Restored', details: 'D-0102 restoration telemetry verified' },
      { atStep: 7, event: 'Ticket Closed', details: 'Final storm outage cleared' },
    ],
  };

  const guidedTimeline = (timelineDefinitions[activeScript.id] || [])
    .filter((entry) => entry.atStep <= currentStepIndex || (isCompleted && entry.atStep < activeScript.steps.length))
    .map((entry, index) => ({
      timestamp: new Date(Date.UTC(2026, 6, 29, 13, 20, 41 + index * 2)).toISOString(),
      event: entry.event,
      details: entry.details,
    }));

  // During a scripted scenario, the timeline is the scenario's own operational
  // record. Live incident evidence remains the fallback outside those flows.
  const isScriptedTimeline = guidedTimeline.length > 0;
  const rawTimeline = isScriptedTimeline ? guidedTimeline : selectedIncident?.evidence?.timeline || [];

  // Complement with ticket status milestones
  const mergedTimeline = [...rawTimeline];

  if (matchingTicket?.assignedCrew) {
    mergedTimeline.push({
      timestamp: selectedIncident?.detectedAt || new Date().toISOString(),
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
          ACTIVITY TIMELINE — INCIDENT #{selectedIncident ? selectedIncident.id.substring(0, 8) : 'S04-RESTORATION'}
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
