import { apiRequest } from './client';
import type { Employee } from '@/types';

export async function getEmployees(): Promise<Employee[]> {
  return apiRequest<Employee[]>('/api/employees');
}

export async function getEmployee(id: number): Promise<Employee> {
  return apiRequest<Employee>(`/api/employees/${id}`);
}

export async function createEmployee(data: Partial<Employee>): Promise<Employee> {
  return apiRequest<Employee>('/api/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
  return apiRequest<Employee>(`/api/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEmployee(id: number): Promise<void> {
  await apiRequest<void>(`/api/employees/${id}`, { method: 'DELETE' });
}
