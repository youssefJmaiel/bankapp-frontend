import { apiRequest } from './client';
import type { Department } from '@/types';

export async function getDepartments(): Promise<Department[]> {
  return apiRequest<Department[]>('/api/departments');
}

export async function getDepartment(id: number): Promise<Department> {
  return apiRequest<Department>(`/api/departments/${id}`);
}

export async function createDepartment(data: Partial<Department>): Promise<Department> {
  return apiRequest<Department>('/api/departments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDepartment(id: number, data: Partial<Department>): Promise<Department> {
  return apiRequest<Department>(`/api/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id: number): Promise<void> {
  await apiRequest<void>(`/api/departments/${id}`, { method: 'DELETE' });
}
