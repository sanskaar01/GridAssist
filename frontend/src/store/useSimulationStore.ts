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

let autoPlayTimer: any = null;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  isGuidedMode: true,
  activeScript: ALL_SCRIPTS[0],
  currentStepIndex: 0,
  isPlayingAuto: false,
  playbackSpeed: 1.0,
  isExecutingStep: false,
  error: null,

  setGuidedMode: (enabled: boolean) => set({ isGuidedMode: enabled }),

  selectScript: (scriptId: string) => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = null;
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

    if (currentStepIndex >= activeScript.steps.length - 1) {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
      autoPlayTimer = null;
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
    } catch (err: any) {
      console.warn('Backend step-run fallback to client state synchronization');
    } finally {
      const nextIndex = Math.min(currentStepIndex + 1, activeScript.steps.length - 1);
      set({
        currentStepIndex: nextIndex,
        isExecutingStep: false,
      });
    }
  },

  executePreviousStep: async () => {
    const { currentStepIndex } = get();
    if (currentStepIndex <= 0) return;
    set({ currentStepIndex: currentStepIndex - 1 });
  },

  startAutoPlayback: async () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);

    set({ isPlayingAuto: true });

    // Auto Play Interval Loop: Advances step every 2.5s
    autoPlayTimer = setInterval(() => {
      const { executeNextStep, isPlayingAuto } = get();
      if (isPlayingAuto) {
        executeNextStep();
      } else {
        if (autoPlayTimer) clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }, 2500);

    try {
      await runSimulation(get().activeScript.id, get().playbackSpeed);
    } catch (err: any) {
      console.warn('Backend auto playback run failed, executing in-memory auto playback');
    }
  },

  pauseAutoPlayback: async () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = null;
    set({ isPlayingAuto: false });
    try {
      await pauseSimulation();
    } catch (err) {
      console.error('Failed to pause:', err);
    }
  },

  resetGrid: async () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = null;

    set({
      isPlayingAuto: false,
      currentStepIndex: 0,
      isGuidedMode: true,
      isExecutingStep: false,
      error: null,
    });

    try {
      await resetGridSimulation();
    } catch (err) {
      console.error('Failed to reset grid:', err);
    }
  },
}));
