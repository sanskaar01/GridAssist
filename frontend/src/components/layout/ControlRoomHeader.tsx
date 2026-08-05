import React, { useState, useEffect } from 'react';
import { SimulationControlPanel } from './SimulationControlPanel';
import { OperationalNarrationHUD } from './OperationalNarrationHUD';
import { ShieldCheck, Zap } from 'lucide-react';

interface Props {
  onRefreshData?: () => void;
}

export const ControlRoomHeader: React.FC<Props> = ({ onRefreshData }) => {
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

      {/* Scenario Control Panel Bar */}
      <SimulationControlPanel onGridReset={onRefreshData} />

      {/* Operational Mission Briefing HUD Banner */}
      <OperationalNarrationHUD />
    </header>
  );
};
