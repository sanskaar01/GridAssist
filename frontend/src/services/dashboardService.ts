import axios from 'axios';
import { DashboardResponse, TicketData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchDashboardData = async (): Promise<DashboardResponse> => {
  const response = await apiClient.get<{ success: boolean; data: DashboardResponse }>('/dashboard');
  return response.data.data;
};

export const runSimulation = async (scenarioId: string, speed: number = 1.0): Promise<void> => {
  await apiClient.post('/simulator/run', { scenarioId, speed });
};

export const pauseSimulation = async (): Promise<void> => {
  await apiClient.post('/simulator/pause');
};

export const resetGridSimulation = async (): Promise<void> => {
  await apiClient.post('/simulator/reset');
};

export const updateTicketStatus = async (ticketId: string, status: string, crewId?: string): Promise<TicketData> => {
  const response = await apiClient.patch<{ success: boolean; data: TicketData }>(`/tickets/${ticketId}/status`, {
    status,
    assignedCrewId: crewId,
  });
  return response.data.data;
};
