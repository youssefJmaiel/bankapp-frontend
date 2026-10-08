import { apiRequest } from './client';
import type { Partner, PageResponse } from '@/types';

export async function getPartners(): Promise<Partner[]> {
  return apiRequest<Partner[]>('/api/partners');
}

export async function getPartnersPaged(
  page = 0,
  size = 10
): Promise<PageResponse<Partner>> {
  return apiRequest<PageResponse<Partner>>(
    `/api/partners/paged?page=${page}&size=${size}`
  );
}

export async function getPartner(id: number): Promise<Partner> {
  return apiRequest<Partner>(`/api/partners/${id}`);
}

export async function createPartner(data: Partial<Partner>): Promise<Partner> {
  return apiRequest<Partner>('/api/partners', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deletePartner(id: number): Promise<void> {
  await apiRequest<void>(`/api/partners/${id}`, {
    method: 'DELETE',
  });
}
