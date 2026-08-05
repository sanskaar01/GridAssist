import React, { useState } from 'react';
import { IncidentData } from '../../types';
import { Search, ShieldAlert, CheckCircle2, MapPin } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

interface Props {
  incidents: IncidentData[];
  selectedIncidentId: string | null;
  onSelectIncident: (incident: IncidentData) => void;
}

export const ActiveFaultQueue: React.FC<Props> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const { activeScript, currentStepIndex } = useSimulationStore();
  const currentStep = activeScript?.steps ? activeScript.steps[currentStepIndex] : null;

  // Construct Synthetic Guided Mode Incident when in Guided Mode or Auto Play
  const guidedIncidents: IncidentData[] = [];
  if (currentStepIndex > 0 && currentStep?.expectedState?.darkPoleCodes?.length) {
    const isDTFault = activeScript.category === 'DT_FAULT';
    const parentCode = currentStep.expectedState?.isolatedSpan?.parentCode || currentStep.narration?.isolatedSpan?.parentCode || 'P-003';
    const childCode = currentStep.expectedState?.isolatedSpan?.childCode || currentStep.narration?.isolatedSpan?.childCode || 'P-004';

    guidedIncidents.push({
      id: isDTFault ? 'INC-DT-D0102' : 'INC-GUIDED-01',
      faultType: isDTFault ? 'DT' : activeScript.category === 'SENSOR_ANOMALY' ? 'SENSOR' : 'SPAN',
      transformerId: isDTFault ? 'dt-0102-id' : 'dt-fallback-01',
      suspectedParentPoleId: isDTFault ? 'D-0102' : parentCode,
      suspectedChildPoleId: isDTFault ? 'P-026' : childCode,
      confidence: 'HIGH',
      evidence: {
        items: isDTFault
          ? [
              `IoT Sensor DEV-W085-D0102-P026 emitted POWER_LOST (Seq #301)`,
              `20/20 downstream poles under D-0102 reported DARK state`,
              `Substation SUB-01 (11.0 kV Feeder F-07) and Parallel DT D-0101 (230 V) live`,
            ]
          : [
              `IoT Sensor ${currentStep.deviceCode} emitted POWER_LOST (Seq #${currentStep.sequenceNumber})`,
              `Downstream poles ${currentStep.expectedState.darkPoleCodes.join(', ')} dark`,
              `Parent Pole ${parentCode} live; Fault frontier isolated on Span ${parentCode} -> ${childCode}`,
            ],
      },
      assumptions: {
        items: isDTFault
          ? [
              `Distribution Transformer Output Failure on D-0102 (Most Probable Cause: HT Fuse Blowout)`,
              `11kV Feeder F-07 and Parallel DT D-0101 operating normally`,
            ]
          : [
              `Overhead conductor break isolated on Span ${parentCode} -> ${childCode}`,
              `Parallel feeder branches operating normally`,
            ],
      },
      rejectedAlternatives: {
        items: isDTFault
          ? [
              { hypothesis: '11kV Feeder Blackout', reason: 'Substation SUB-01 and Parallel DT D-0101 remain energized' },
              { hypothesis: 'Single Span Conductor Break', reason: 'Entire D-0102 subtree collapsed with zero internal Live->Dark transition' },
            ]
          : [
              { hypothesis: 'Distribution Transformer Blowout', reason: 'Parallel feeder poles remain energized' },
              { hypothesis: 'Sensor Malfunction', reason: 'Multi-pole downstream cascade confirmed' },
            ],
      },
      recommendedAction: isDTFault
        ? `Dispatch Specialized HT Crew CREW-BLR-02 to Distribution Transformer D-0102 in Ward W-085 (PIN 560078).`
        : `Dispatch Lineman Crew CREW-BLR-01 to Span ${parentCode} -> ${childCode} in Ward W-084 (PIN 560078).`,
      affectedPoles: currentStep.expectedState.darkPoleCodes.length,
      latitude: isDTFault ? 12.9725 : 12.9716,
      longitude: isDTFault ? 77.6425 : 77.6412,
      pincode: '560078',
      status: 'ACTIVE',
      detectedAt: new Date().toISOString(),
      lastObservedAt: new Date().toISOString(),
      decisionCard: {
        id: 'DEC-GUIDED-01',
        transformerId: 'dt-fallback-01',
        transformerCode: 'D-0101',
        faultType: activeScript.category === 'DT_FAULT' ? 'DT' : 'SPAN',
        suspectedParentPoleCode: parentCode,
        suspectedChildPoleCode: childCode,
        confidence: 'HIGH',
        confidenceReason: 'Deterministic telemetry cascade matching topological parent-child tree hierarchy.',
        latitude: 12.9716,
        longitude: 77.6412,
        pincode: '560078',
        affectedPolesCount: currentStep.expectedState.darkPoleCodes.length,
        affectedPoleIds: currentStep.expectedState.darkPoleCodes,
        evidence: [
          `IoT Sensor ${currentStep.deviceCode} emitted POWER_LOST`,
          `Downstream poles ${currentStep.expectedState.darkPoleCodes.join(', ')} dark`,
          `Parent Pole ${parentCode} live; Fault frontier isolated`,
        ],
        assumptions: [`Overhead conductor break on Span ${parentCode} -> ${childCode}`],
        rejectedAlternatives: [
          { hypothesis: 'Transformer Blowout', reason: 'Parallel branches live' },
        ],
        recommendedAction: {
          title: `Dispatch Lineman Crew to Span ${parentCode} -> ${childCode}`,
          detail: `Dispatch Lineman Crew CREW-BLR-01 to Ward W-084 (PIN 560078).`,
          targetCoordinates: { latitude: 12.9716, longitude: 77.6412 },
          estimatedInspectionDistanceMeters: 45,
        },
        explanation: 'Deterministic graph traversal algorithm identified exact conductor break.',
      },
    });
  }

  const displayIncidents = incidents.length > 0 ? incidents : guidedIncidents;

  const filteredIncidents = displayIncidents.filter((inc) => {
    const matchesSearch =
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.pincode.includes(searchTerm) ||
      (inc.decisionCard?.transformerCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.decisionCard?.suspectedParentPoleCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || inc.faultType === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatElapsedTime = (detectedAtIso: string) => {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(detectedAtIso).getTime()) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  return (
    <aside className="w-[20%] min-w-[280px] bg-[#161B22] border-r border-[#30363D] flex flex-col h-full text-xs">
      {/* Header */}
      <div className="p-3 border-b border-[#30363D] bg-[#0D1117] flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono font-bold text-gray-200 uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>Active Fault Queue</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded border border-rose-500/30">
            {displayIncidents.length} OUTAGES
          </span>
          <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
            TICKETS: {displayIncidents.length}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-2 border-b border-[#30363D] flex flex-col gap-2 bg-[#161B22]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-500" />
          <input
            type="text"
            placeholder="Search transformer, pole, PIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0D1117] text-gray-200 text-xs pl-8 pr-2 py-1.5 rounded border border-[#30363D] focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-gray-400">FILTER:</span>
          <div className="flex gap-1">
            {['ALL', 'SPAN', 'DT'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  filterType === type
                    ? 'bg-[#21262D] text-white border-gray-500 font-bold'
                    : 'text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dense Rows List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#21262D]">
        {filteredIncidents.length === 0 ? (
          <div className="p-6 text-center text-gray-400 flex flex-col items-center justify-center gap-2 h-64">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
            <p className="font-bold text-gray-200 text-sm">Grid Healthy</p>
            <p className="text-[11px] leading-relaxed text-gray-400">
              No active outages detected.<br />
              All monitored transformers and feeders operating normally.
            </p>
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isSelected = selectedIncidentId === null || inc.id === selectedIncidentId;
            const transformerCode = inc.decisionCard?.transformerCode || 'D-0101';
            const parentCode = inc.decisionCard?.suspectedParentPoleCode || 'P-002';
            const childCode = inc.decisionCard?.suspectedChildPoleCode || 'P-003';
            const confidenceColor =
              inc.confidence === 'HIGH'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : inc.confidence === 'MEDIUM'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={`p-2.5 cursor-pointer transition-colors font-mono relative ${
                  isSelected
                    ? 'bg-[#21262D] border-l-4 border-l-rose-500 text-white shadow-lg'
                    : 'hover:bg-[#1C2128] text-gray-300'
                }`}
              >
                {/* Top Row: Type & Transformer Code */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className={`w-2 h-2 rounded-full ${inc.faultType === 'DT' ? 'bg-amber-500' : 'bg-rose-500 scada-pulse-node'}`} />
                    <span className="text-white">{inc.faultType} FAULT</span>
                    <span className="text-gray-400">({transformerCode})</span>
                  </div>

                  <span className={`px-1.5 py-0.2 text-[10px] rounded border font-bold ${confidenceColor}`}>
                    {inc.confidence}
                  </span>
                </div>

                {/* Span details */}
                <div className="text-[11px] text-gray-400 mb-1.5">
                  Span: <span className="text-gray-200 font-bold">{parentCode}</span> → <span className="text-rose-400 font-bold">{childCode}</span>
                </div>

                {/* Bottom Row: Affected count, PIN, elapsed time */}
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#21262D]/60">
                  <div className="flex items-center gap-1 text-rose-400 font-bold">
                    <span>⚡ {inc.affectedPoles} poles dark</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{inc.pincode}</span>
                  </div>
                  <div className="text-amber-400 font-semibold">
                    {formatElapsedTime(inc.detectedAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
