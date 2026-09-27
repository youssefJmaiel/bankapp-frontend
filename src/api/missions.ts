import { apiRequest } from './client';
import type { Mission, Employee } from '@/types';

export async function getMissions(): Promise<Mission[]> {
  return apiRequest<Mission[]>('/api/missions');
}

export async function getMission(id: number): Promise<Mission> {
  return apiRequest<Mission>(`/api/missions/${id}`);
}

export async function createMission(data: Partial<Mission>): Promise<Mission> {
  return apiRequest<Mission>('/api/missions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMission(id: number, data: Partial<Mission>): Promise<Mission> {
  return apiRequest<Mission>(`/api/missions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMission(id: number): Promise<void> {
  await apiRequest<void>(`/api/missions/${id}`, { method: 'DELETE' });
}

export async function getMissionEmployee(id: number): Promise<Employee> {
  return apiRequest<Employee>(`/api/missions/${id}/employee`);
}
