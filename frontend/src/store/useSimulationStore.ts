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
  isCompleted: boolean;
  error: string | null;
  /** Increments on every resetGrid() so UI layers can sync local state. */
  gridResetToken: number;

  // Actions
  setGuidedMode: (enabled: boolean) => void;
  selectScript: (scriptId: string) => void;
  setPlaybackSpeed: (speed: number) => void;
  executeNextStep: () => Promise<void>;
  executePreviousStep: () => Promise<void>;
  startAutoPlayback: () => Promise<void>;
  pauseAutoPlayback: () => Promise<void>;
  finishScenario: () => void;
  resetGrid: () => Promise<void>;
  selectNextScript: () => void;
}

let autoPlayTimer: any = null;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  isGuidedMode: true,
  activeScript: ALL_SCRIPTS[0],
  currentStepIndex: 0,
  isPlayingAuto: false,
  playbackSpeed: 1.0,
  isExecutingStep: false,
  isCompleted: false,
  error: null,
  gridResetToken: 0,

  setGuidedMode: (enabled: boolean) => set({ isGuidedMode: enabled }),

  selectScript: (scriptId: string) => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = null;
    const script = getScriptById(scriptId);
    set({
      activeScript: script,
      currentStepIndex: 0,
      isPlayingAuto: false,
      isGuidedMode: true,
      isExecutingStep: false,
      isCompleted: false,
      error: null,
    });
    resetGridSimulation().catch((err) => console.error('Failed to reset backend grid on scenario select:', err));
  },

  selectNextScript: () => {
    const { activeScript, selectScript } = get();
    const currentIndex = ALL_SCRIPTS.findIndex((s) => s.id === activeScript.id);
    const nextScript = ALL_SCRIPTS[(currentIndex + 1) % ALL_SCRIPTS.length];
    selectScript(nextScript.id);
  },

  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

  executeNextStep: async () => {
    const { activeScript, currentStepIndex, isExecutingStep, isCompleted, finishScenario } = get();
    if (isExecutingStep || isCompleted) return;

    if (currentStepIndex >= activeScript.steps.length - 1) {
      finishScenario();
      return;
    }

    set({ isExecutingStep: true, error: null });

    try {
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
      });

      // Lock button during 650ms animation + 200ms camera hold pause
      setTimeout(() => {
        set({ isExecutingStep: false });
      }, 750);
    }
  },

  executePreviousStep: async () => {
    const { currentStepIndex } = get();
    if (currentStepIndex <= 0) return;
    set({ currentStepIndex: currentStepIndex - 1, isCompleted: false });
  },

  startAutoPlayback: async () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);

    set({ isPlayingAuto: true, isCompleted: false });

    // Auto Play Interval Loop: Advances step every 2.5s with animation holds
    autoPlayTimer = setInterval(() => {
      const { executeNextStep, isPlayingAuto, isCompleted } = get();
      if (isPlayingAuto && !isCompleted) {
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

  finishScenario: () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = null;
    set({
      isPlayingAuto: false,
      isCompleted: true,
      isExecutingStep: false,
    });
  },

  resetGrid: async () => {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = null;

    const nextToken = get().gridResetToken + 1;

    try {
      await resetGridSimulation();
    } catch (err) {
      console.error('Failed to reset grid:', err);
    } finally {
      // Return to the same healthy overview shown at page load. In particular,
      // do not retain Scenario 4's step-zero outage as the post-reset state.
      set({
        activeScript: ALL_SCRIPTS[0],
        isPlayingAuto: false,
        currentStepIndex: 0,
        isGuidedMode: true,
        isExecutingStep: false,
        isCompleted: false,
        error: null,
        gridResetToken: nextToken,
      });
    }
  },
}));
