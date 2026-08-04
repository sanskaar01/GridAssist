import { apiClient } from './apiClient';

export interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
  targetTransformerCode: string;
  stepsCount: number;
}

export interface SimulatorStatus {
  state: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  scenarioId: string | null;
  scenarioName: string | null;
  currentStep: number;
  totalSteps: number;
  injectedEventsCount: number;
  speedMultiplier: number;
}

export async function fetchScenarios(): Promise<ScenarioInfo[]> {
  const response = await apiClient.get<{ success: boolean; data: ScenarioInfo[] }>('/simulator/scenarios');
  return response.data.data;
}

export async function fetchSimulatorStatus(): Promise<SimulatorStatus> {
  const response = await apiClient.get<{ success: boolean; data: SimulatorStatus }>('/simulator/status');
  return response.data.data;
}

export async function runSimulation(scenarioId: string, speed: number = 1.0): Promise<SimulatorStatus> {
  const response = await apiClient.post<{ success: boolean; data: SimulatorStatus }>('/simulator/run', {
    scenarioId,
    speed,
  });
  return response.data.data;
}

export async function pauseSimulation(): Promise<SimulatorStatus> {
  const response = await apiClient.post<{ success: boolean; data: SimulatorStatus }>('/simulator/pause');
  return response.data.data;
}

export async function resumeSimulation(): Promise<SimulatorStatus> {
  const response = await apiClient.post<{ success: boolean; data: SimulatorStatus }>('/simulator/resume');
  return response.data.data;
}

export async function stopSimulation(): Promise<SimulatorStatus> {
  const response = await apiClient.post<{ success: boolean; data: SimulatorStatus }>('/simulator/stop');
  return response.data.data;
}

export async function resetGridSimulation(): Promise<SimulatorStatus> {
  const response = await apiClient.post<{ success: boolean; data: SimulatorStatus }>('/simulator/reset');
  return response.data.data;
}
