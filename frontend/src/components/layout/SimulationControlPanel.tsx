import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { ALL_SCRIPTS } from '../../simulator/scenarioScripts';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Sliders } from 'lucide-react';

interface Props {
  onGridReset?: () => void;
}

export const SimulationControlPanel: React.FC<Props> = ({ onGridReset }) => {
  const {
    isGuidedMode,
    activeScript,
    currentStepIndex,
    isPlayingAuto,
    playbackSpeed,
    isExecutingStep,
    setGuidedMode,
    selectScript,
    setPlaybackSpeed,
    executeNextStep,
    executePreviousStep,
    startAutoPlayback,
    pauseAutoPlayback,
    resetGrid,
  } = useSimulationStore();

  const handleReset = async () => {
    await resetGrid();
    if (onGridReset) onGridReset();
  };

  return (
    <div className="bg-[#0D1117] border border-[#30363D] px-3 py-1.5 rounded flex items-center justify-between font-mono text-xs shadow-inner">
      {/* Scenario Selector & Mode Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
          <Sliders className="w-3.5 h-3.5" />
          <span>SCENARIO:</span>
        </div>

        <select
          value={activeScript.id}
          onChange={(e) => selectScript(e.target.value)}
          className="bg-[#161B22] text-white border border-[#30363D] rounded px-2.5 py-1 font-mono text-xs focus:outline-none focus:border-amber-500"
        >
          {ALL_SCRIPTS.map((script) => (
            <option key={script.id} value={script.id}>
              {script.title}
            </option>
          ))}
        </select>

        {/* Mode Toggle Switch: GUIDED DEMO MODE vs AUTO PLAYBACK */}
        <div className="flex items-center bg-[#161B22] p-0.5 rounded border border-[#30363D]">
          <button
            onClick={() => setGuidedMode(true)}
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
              isGuidedMode ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            GUIDED DEMO
          </button>
          <button
            onClick={() => setGuidedMode(false)}
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
              !isGuidedMode ? 'bg-blue-500 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            AUTO PLAY
          </button>
        </div>
      </div>

      {/* Step Progress Timeline Indicators */}
      <div className="flex items-center gap-1.5">
        {activeScript.steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex;

          return (
            <div
              key={step.stepIndex}
              className={`h-2 rounded-full transition-all ${
                isActive
                  ? 'w-6 bg-amber-400 shadow-[0_0_8px_#F59E0B]'
                  : isCompleted
                  ? 'w-3 bg-emerald-500'
                  : 'w-2 bg-gray-700'
              }`}
              title={`Step ${idx + 1}: ${step.label}`}
            />
          );
        })}
        <span className="text-[10px] text-gray-400 ml-1">
          ({currentStepIndex + 1}/{activeScript.steps.length})
        </span>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        {isGuidedMode ? (
          /* Guided Mode Step Controls */
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentStepIndex === 0 || isExecutingStep}
              onClick={executePreviousStep}
              className="bg-[#161B22] hover:bg-[#21262D] text-gray-300 px-2 py-1 rounded border border-[#30363D] flex items-center gap-1 disabled:opacity-30 text-[11px]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREV</span>
            </button>

            <button
              disabled={isExecutingStep}
              onClick={executeNextStep}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1 rounded flex items-center gap-1 transition-all text-xs hover:scale-105 disabled:opacity-50"
            >
              <span>NEXT STEP</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Auto Playback Controls */
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <span>SPEED:</span>
              {[0.5, 1.0, 2.0, 5.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    playbackSpeed === s ? 'bg-amber-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {isPlayingAuto ? (
              <button
                onClick={pauseAutoPlayback}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-2.5 py-1 rounded flex items-center gap-1"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>PAUSE</span>
              </button>
            ) : (
              <button
                onClick={startAutoPlayback}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5" />
                <span>PLAY</span>
              </button>
            )}
          </div>
        )}

        {/* Reset Grid Button */}
        <button
          onClick={handleReset}
          className="bg-[#161B22] hover:bg-[#21262D] text-gray-300 px-2.5 py-1 rounded border border-[#30363D] flex items-center gap-1 hover:text-white text-[11px]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET GRID</span>
        </button>
      </div>
    </div>
  );
};
