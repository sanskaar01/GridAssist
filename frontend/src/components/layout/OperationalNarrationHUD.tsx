import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationStore } from '../../store/useSimulationStore';
import { ShieldCheck, ChevronRight, Activity, Zap, Cpu, ChevronUp, ChevronDown, CheckCircle2, Award, RotateCcw } from 'lucide-react';

export const OperationalNarrationHUD: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const {
    isGuidedMode,
    activeScript,
    currentStepIndex,
    executeNextStep,
    finishScenario,
    resetGrid,
    selectNextScript,
    isCompleted,
    isExecutingStep,
  } = useSimulationStore();

  const currentStep = activeScript.steps[currentStepIndex];
  if (!currentStep) return null;

  const narration = currentStep.narration;
  const isLastStep = currentStepIndex >= activeScript.steps.length - 1;

  const handleStepButtonClick = async () => {
    if (isLastStep || isCompleted) {
      finishScenario();
    } else {
      await executeNextStep();
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${activeScript.id}-${currentStepIndex}-${isCompleted ? 'completed' : 'active'}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`px-4 py-1.5 text-xs font-mono text-gray-200 shadow-2xl backdrop-blur flex flex-col gap-1 ${
          isCompleted
            ? 'bg-emerald-950/95 border-b-2 border-emerald-500'
            : 'bg-[#0D1117]/95 border-b-2 border-amber-500/60'
        }`}
      >
        {/* Header Bar with Collapse Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCompleted ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className={`font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 ${isCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isCompleted ? <Award className="w-4 h-4 text-emerald-400" /> : <ShieldCheck className="w-4 h-4 text-amber-400" />}
              {isCompleted ? 'MISSION COMPLETE — INCIDENT RESOLVED & VERIFIED' : `MISSION BRIEFING — STEP ${currentStepIndex + 1}/${activeScript.steps.length}`}
            </span>
            <span className="text-[11px] text-gray-400 bg-[#161B22] px-2 py-0.5 rounded border border-[#30363D]">
              {activeScript.title}
            </span>

            {/* Collapse/Expand Toggle Button */}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="text-[10px] text-gray-400 hover:text-amber-400 flex items-center gap-1 bg-[#161B22] px-2 py-0.5 rounded border border-[#30363D] transition-colors ml-2 cursor-pointer"
            >
              {isCollapsed ? (
                <>
                  <span>EXPAND BRIEFING</span>
                  <ChevronDown className="w-3 h-3 text-amber-400" />
                </>
              ) : (
                <>
                  <span>COLLAPSE BRIEFING</span>
                  <ChevronUp className="w-3 h-3 text-amber-400" />
                </>
              )}
            </button>
          </div>

          {/* Guided Step Controls & Mission Complete Action Buttons */}
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => resetGrid()}
                  className="font-bold px-3 py-1 rounded flex items-center gap-1 bg-[#161B22] hover:bg-[#21262D] text-amber-400 border border-amber-500/40 text-xs shadow cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET GRID</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNextScript()}
                  className="font-bold px-3 py-1 rounded flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs shadow-lg shadow-emerald-500/30 cursor-pointer transition-all hover:scale-105"
                >
                  <span>NEXT SCENARIO</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              isGuidedMode && (
                <button
                  disabled={isExecutingStep}
                  onClick={handleStepButtonClick}
                  className={`font-bold px-3 py-1 rounded flex items-center gap-1 transition-all shadow-lg text-xs hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer ${
                    isLastStep
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30'
                      : 'bg-amber-500 hover:bg-amber-400 text-black'
                  }`}
                >
                  {isLastStep ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>FINISH SCENARIO</span>
                    </>
                  ) : (
                    <>
                      <span>NEXT STEP</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>

        {/* Mission Briefing Card Content / Mission Complete Summary Checklist */}
        {!isCollapsed && (
          isCompleted ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-emerald-950/80 p-2 rounded border border-emerald-500/40 mt-0.5 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>✔ POWER RESTORED</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>✔ INCIDENT RESOLVED</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>✔ 3/3 POLES VERIFIED</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>✔ TICKET CLOSED</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#161B22] p-2 rounded border border-[#30363D] mt-0.5">
              {/* Col 1: Telemetry Payload */}
              <div className="space-y-0.5 border-r border-[#30363D]/60 pr-2">
                <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-400" />
                  <span>INGESTED TELEMETRY</span>
                </div>
                <div className="text-white font-bold text-xs">{currentStep.deviceCode}</div>
                <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  {currentStep.eventType} (Seq #{currentStep.sequenceNumber})
                </div>
              </div>

              {/* Col 2: Event Details */}
              <div className="space-y-0.5 border-r border-[#30363D]/60 pr-2">
                <div className="text-[10px] text-gray-400 font-bold uppercase">EVENT DETAILS</div>
                <div className="text-amber-300 font-bold text-xs">{narration.title}</div>
                <div className="text-gray-300 text-[10px] leading-tight">{narration.detail}</div>
              </div>

              {/* Col 3: Algorithmic Reasoning Deduction */}
              <div className="space-y-0.5">
                <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  <span>ALGORITHMIC DEDUCTION</span>
                </div>
                <div className="text-emerald-300 text-[10px] leading-relaxed">
                  {narration.algorithmicReason}
                </div>
              </div>
            </div>
          )
        )}
      </motion.div>
    </AnimatePresence>
  );
};
