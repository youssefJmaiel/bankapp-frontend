import { apiRequest } from './client';

export type LeaveStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface LeaveRequest {
  id: number;
  requesterUsername: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  decisionBy?: string | null;
  decisionAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateLeaveRequest {
  startDate: string;
  endDate: string;
  reason: string;
}

export type LeaveDecision = 'APPROVED' | 'REJECTED';

export async function getMyLeaveRequests(): Promise<LeaveRequest[]> {
  return apiRequest<LeaveRequest[]>('/api/leaves/my');
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  return apiRequest<LeaveRequest[]>('/api/leaves/all');
}

export async function createLeaveRequest(
  data: CreateLeaveRequest,
): Promise<LeaveRequest> {
  return apiRequest<LeaveRequest>('/api/leaves', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function cancelLeaveRequest(id: number): Promise<LeaveRequest> {
  return apiRequest<LeaveRequest>(`/api/leaves/${id}`, {
    method: 'DELETE',
  });
}

export async function decideLeaveRequest(
  id: number,
  decision: LeaveDecision,
): Promise<LeaveRequest> {
  return apiRequest<LeaveRequest>(`/api/leaves/${id}/decision`, {
    method: 'PATCH',
    body: JSON.stringify({ decision }),
  });
}
