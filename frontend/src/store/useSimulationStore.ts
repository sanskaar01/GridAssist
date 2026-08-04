import { create } from 'zustand';
import { ALL_SCRIPTS, getScriptById, SimulationScript } from '../simulator/scenarioScripts';
import { runSimulation, pauseSimulation, resetGridSimulation, apiClient } from '../services/dashboardService';

interface SimulationStore {
  isGuidedMode: boolean;
  activeScript: SimulationScript;
  currentStepIndex: number;
  isPlayingAuto: boolean;
  playbackSpeed: number;
  isExecutingStep: boolean;
  error: string | null;

  // Actions
  setGuidedMode: (enabled: boolean) => void;
  selectScript: (scriptId: string) => void;
  setPlaybackSpeed: (speed: number) => void;
  executeNextStep: () => Promise<void>;
  executePreviousStep: () => Promise<void>;
  startAutoPlayback: () => Promise<void>;
  pauseAutoPlayback: () => Promise<void>;
  resetGrid: () => Promise<void>;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  isGuidedMode: true, // Default GUIDED DEMO MODE per RFC alignment
  activeScript: ALL_SCRIPTS[0],
  currentStepIndex: 0,
  isPlayingAuto: false,
  playbackSpeed: 1.0,
  isExecutingStep: false,
  error: null,

  setGuidedMode: (enabled: boolean) => set({ isGuidedMode: enabled }),

  selectScript: (scriptId: string) => {
    const script = getScriptById(scriptId);
    set({
      activeScript: script,
      currentStepIndex: 0,
      isPlayingAuto: false,
      error: null,
    });
  },

  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

  executeNextStep: async () => {
    const { activeScript, currentStepIndex, isExecutingStep } = get();
    if (isExecutingStep) return;

    if (currentStepIndex >= activeScript.steps.length) {
      set({ isPlayingAuto: false });
      return;
    }

    set({ isExecutingStep: true, error: null });

    try {
      // Call backend step-run API for synchronous step execution
      await apiClient.post('/simulator/step-run', {
        scenarioId: activeScript.id,
        stepIndex: currentStepIndex,
      });

      const nextIndex = currentStepIndex + 1;
      set({
        currentStepIndex: Math.min(nextIndex, activeScript.steps.length - 1),
        isExecutingStep: false,
      });
    } catch (err: any) {
      console.error('Step execution failed:', err);
      set({
        error: err.response?.data?.error?.message || 'Failed to execute simulation step',
        isExecutingStep: false,
        isPlayingAuto: false,
      });
    }
  },

  executePreviousStep: async () => {
    const { currentStepIndex } = get();
    if (currentStepIndex <= 0) return;
    set({ currentStepIndex: currentStepIndex - 1 });
  },

  startAutoPlayback: async () => {
    const { activeScript, playbackSpeed } = get();
    set({ isPlayingAuto: true, isGuidedMode: false });
    try {
      await runSimulation(activeScript.id, playbackSpeed);
    } catch (err: any) {
      set({ error: 'Failed to start auto playback', isPlayingAuto: false });
    }
  },

  pauseAutoPlayback: async () => {
    set({ isPlayingAuto: false });
    try {
      await pauseSimulation();
    } catch (err) {
      console.error('Failed to pause:', err);
    }
  },

  resetGrid: async () => {
    set({ isPlayingAuto: false, currentStepIndex: 0, isExecutingStep: false });
    try {
      await resetGridSimulation();
    } catch (err) {
      console.error('Failed to reset grid:', err);
    }
  },
}));
