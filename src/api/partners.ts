import { getToken, updateTokenIfNeeded } from './auth';
import type { Partner, PageResponse } from '@/types';

const PARTNER_API_URL = 'http://localhost:8087';

async function partnerRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const refreshed = await updateTokenIfNeeded();

  if (!refreshed) {
    throw new Error('Authentication required');
  }

  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${PARTNER_API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please log in again.');
    }

    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }

    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function getPartners(): Promise<Partner[]> {
  return partnerRequest<Partner[]>('/api/partners');
}

export async function getPartnersPaged(
  page = 0,
  size = 10
): Promise<PageResponse<Partner>> {
  return partnerRequest<PageResponse<Partner>>(
    `/api/partners/paged?page=${page}&size=${size}`
  );
}

export async function getPartner(id: number): Promise<Partner> {
  return partnerRequest<Partner>(`/api/partners/${id}`);
}

export async function createPartner(data: Partial<Partner>): Promise<Partner> {
  return partnerRequest<Partner>('/api/partners', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deletePartner(id: number): Promise<void> {
  await partnerRequest<void>(`/api/partners/${id}`, {
    method: 'DELETE',
  });
}
