import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationStore } from '../../store/useSimulationStore';
import { ShieldCheck, ChevronRight, Activity, Zap, Cpu } from 'lucide-react';

export const OperationalNarrationHUD: React.FC = () => {
  const {
    isGuidedMode,
    activeScript,
    currentStepIndex,
    executeNextStep,
    isExecutingStep,
  } = useSimulationStore();

  const currentStep = activeScript.steps[currentStepIndex];
  if (!currentStep) return null;

  const narration = currentStep.narration;
  const isLastStep = currentStepIndex >= activeScript.steps.length - 1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${activeScript.id}-${currentStepIndex}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="bg-[#0D1117]/95 border-b-2 border-amber-500/60 px-4 py-2 text-xs font-mono text-gray-200 shadow-2xl backdrop-blur flex flex-col gap-1.5"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-bold text-amber-400 text-xs tracking-wider uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              OPERATIONAL MISSION BRIEFING — STEP {currentStepIndex + 1}/{activeScript.steps.length}
            </span>
            <span className="text-[11px] text-gray-400 bg-[#161B22] px-2 py-0.5 rounded border border-[#30363D]">
              {activeScript.title}
            </span>
          </div>

          {/* Guided Step Button */}
          {isGuidedMode && (
            <button
              disabled={isExecutingStep}
              onClick={executeNextStep}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1 rounded flex items-center gap-1 transition-all shadow-lg text-xs hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <span>{isLastStep ? 'FINISH SCENARIO' : 'NEXT STEP'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mission Briefing Card Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#161B22] p-2.5 rounded border border-[#30363D]">
          {/* Col 1: Telemetry Payload */}
          <div className="space-y-1 border-r border-[#30363D]/60 pr-2">
            <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
              <Activity className="w-3 h-3 text-blue-400" />
              <span>INGESTED TELEMETRY</span>
            </div>
            <div className="text-white font-bold">{currentStep.deviceCode}</div>
            <div className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              {currentStep.eventType} (Seq #{currentStep.sequenceNumber})
            </div>
          </div>

          {/* Col 2: Event Details */}
          <div className="space-y-1 border-r border-[#30363D]/60 pr-2">
            <div className="text-[10px] text-gray-400 font-bold uppercase">EVENT DETAILS</div>
            <div className="text-amber-300 font-bold text-xs">{narration.title}</div>
            <div className="text-gray-300 text-[11px] leading-tight">{narration.detail}</div>
          </div>

          {/* Col 3: Algorithmic Reasoning Deduction */}
          <div className="space-y-1">
            <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>ALGORITHMIC DEDUCTION</span>
            </div>
            <div className="text-emerald-300 text-[11px] leading-relaxed">
              {narration.algorithmicReason}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
