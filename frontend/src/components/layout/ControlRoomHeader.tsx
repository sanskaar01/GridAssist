import React, { useState, useEffect } from 'react';
import { PipelineMetricsData, SystemStatusData } from '../../types';
import { SimulationControlPanel } from './SimulationControlPanel';
import { OperationalNarrationHUD } from './OperationalNarrationHUD';
import { ShieldCheck, Zap, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  systemStatus?: SystemStatusData;
  pipeline?: PipelineMetricsData;
  onRefreshData?: () => void;
}

export const ControlRoomHeader: React.FC<Props> = ({ systemStatus, pipeline, onRefreshData }) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const services = [
    { label: 'Telemetry', status: systemStatus?.telemetry || 'HEALTHY' },
    { label: 'Localization', status: systemStatus?.localization || 'HEALTHY' },
    { label: 'Incident Engine', status: systemStatus?.incidentEngine || 'HEALTHY' },
    { label: 'Ticket Engine', status: systemStatus?.ticketEngine || 'HEALTHY' },
    { label: 'Database', status: systemStatus?.database || 'HEALTHY' },
    { label: 'Simulator', status: systemStatus?.simulator || 'READY' },
  ];

  return (
    <header className="bg-[#161B22] border-b border-[#30363D] px-4 py-2 text-xs flex flex-col gap-2">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono font-bold text-base text-white tracking-wider">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            <span>GridAssist</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#21262D] text-gray-400 font-normal border border-[#30363D]">
              KSPDB CONTROL ROOM
            </span>
          </div>
        </div>

        {/* LED Service Health Indicators */}
        <div className="flex items-center gap-4 bg-[#0D1117] px-3 py-1.5 rounded border border-[#30363D]">
          {services.map((svc) => (
            <div key={svc.label} className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-gray-300">{svc.label}</span>
            </div>
          ))}
        </div>

        {/* Live Clock & Station Info */}
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5 text-gray-400 border-r border-[#30363D] pr-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>DISPATCHER-07</span>
          </div>
          <div className="text-emerald-400 font-bold text-sm tracking-wide bg-[#0D1117] px-2.5 py-1 rounded border border-[#30363D]">
            {timeString}
          </div>
        </div>
      </div>

      {/* Operational Pipeline Metrics Bar */}
      <div className="flex items-center justify-between bg-[#0D1117] px-4 py-1.5 rounded border border-[#30363D] font-mono">
        <div className="flex items-center gap-6 text-[11px]">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-gray-400">TELEMETRY EVENTS:</span>
            <span className="text-white font-bold text-sm">{pipeline?.telemetryEventsReceived || 0}</span>
          </div>
          <span className="text-gray-600">→</span>

          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-gray-400">LOCALIZED FAULTS:</span>
            <span className="text-amber-400 font-bold text-sm">{pipeline?.localizedFaults || 0}</span>
          </div>
          <span className="text-gray-600">→</span>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-gray-400">ACTIVE INCIDENTS:</span>
            <span className="text-rose-400 font-bold text-sm">{pipeline?.activeIncidentsCount || 0}</span>
          </div>
          <span className="text-gray-600">→</span>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-400">OPEN TICKETS:</span>
            <span className="text-emerald-400 font-bold text-sm">{pipeline?.openTicketsCount || 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-gray-400">
          <span>MONITORED POLES: <strong className="text-white">{pipeline?.totalMonitoredPoles || 0}</strong></span>
          <span>DARK POLES: <strong className={pipeline?.darkPolesCount ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{pipeline?.darkPolesCount || 0}</strong></span>
        </div>
      </div>

      {/* Embedded Simulation Control Panel */}
      <SimulationControlPanel onGridReset={onRefreshData} />

      {/* Operational Mission Briefing HUD Banner */}
      <OperationalNarrationHUD />
    </header>
  );
};
