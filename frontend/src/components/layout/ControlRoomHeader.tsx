import React, { useState, useEffect } from 'react';
import { SimulationControlPanel } from './SimulationControlPanel';
import { OperationalNarrationHUD } from './OperationalNarrationHUD';
import { ShieldCheck, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

interface Props {
  onRefreshData?: () => void;
}

export const ControlRoomHeader: React.FC<Props> = ({ onRefreshData }) => {
  const [timeString, setTimeString] = useState<string>('');
  const { activeScript, currentStepIndex } = useSimulationStore();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentStep = activeScript?.steps ? activeScript.steps[currentStepIndex] : null;
  const isEvaluatorFaultActive =
    currentStep?.expectedState?.darkPoleCodes?.length ||
    currentStep?.expectedState?.incidentCreated ||
    (activeScript.id === 'power-restoration' && currentStepIndex <= 1) ||
    (activeScript.category === 'SENSOR_ANOMALY' && currentStepIndex >= 1);

  return (
    <header className="bg-[#161B22] border-b border-[#30363D] px-4 py-2 text-xs flex flex-col gap-2 relative">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono font-bold text-base text-white tracking-wider">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            <span>GridAssist</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#21262D] text-gray-400 font-normal border border-[#30363D]">
              KSPDB CONTROL ROOM
            </span>
          </div>
        </div>

        {/* Right Side: SCADA Status Dialog Box, Dispatcher Info & Live Clock */}
        <div className="flex items-center gap-3 font-mono">
          {/* SCADA System Status Dialog Box (GRID OK vs FAULT DETECTED) */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border font-bold text-[11px] shadow-lg transition-all ${
              isEvaluatorFaultActive
                ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-rose-950/50 animate-pulse'
                : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50'
            }`}
          >
            {isEvaluatorFaultActive ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>⚠ FAULT DETECTED</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>🟢 GRID OK</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-gray-400 border-r border-[#30363D] pr-3 border-l pl-3">
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
