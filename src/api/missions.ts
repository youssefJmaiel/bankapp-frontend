import { apiRequest } from './client';
import type { Mission, Employee } from '@/types';

export async function getMissions(): Promise<Mission[]> {
  return apiRequest<Mission[]>('/api/missions');
}

export async function getMission(id: number): Promise<Mission> {
  return apiRequest<Mission>(`/api/missions/${id}`);
}

export async function createMission(data: Partial<Mission>): Promise<Mission> {
  const payload = {
    title: data.title,
    description: data.description,
    assignedEmployeeId: data.employeeId,
    location: data.location,
    startDate: data.startDate ? `${data.startDate}T00:00:00` : undefined,
    endDate: data.endDate ? `${data.endDate}T00:00:00` : undefined,
    status: data.status || 'PENDING',
    priority: data.priority || 'MEDIUM',
    budget: data.budget,
  };

  return apiRequest<Mission>('/api/missions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMission(id: number, data: Partial<Mission>): Promise<Mission> {
  const payload = {
    title: data.title,
    description: data.description,
    assignedEmployeeId: data.employeeId,
    location: data.location,
    startDate: data.startDate
      ? (data.startDate.length === 10 ? `${data.startDate}T00:00:00` : data.startDate)
      : undefined,
    endDate: data.endDate
      ? (data.endDate.length === 10 ? `${data.endDate}T00:00:00` : data.endDate)
      : undefined,
    status: data.status,
    priority: data.priority,
    budget: data.budget,
  };

  return apiRequest<Mission>(`/api/missions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteMission(id: number): Promise<void> {
  await apiRequest<void>(`/api/missions/${id}`, { method: 'DELETE' });
}

export async function getMissionEmployee(id: number): Promise<Employee> {
  return apiRequest<Employee>(`/api/missions/${id}/employee`);
}
