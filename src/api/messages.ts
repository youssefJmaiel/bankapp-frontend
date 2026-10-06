import { apiRequest } from './client';
import type { Message, PageResponse } from '@/types';

export async function getMessages(): Promise<Message[]> {
  return apiRequest<Message[]>('/api/messages');
}

export async function getMyMessages(): Promise<Message[]> {
  return apiRequest<Message[]>('/api/messages/my');
}

export async function getMessagesPaged(page = 0, size = 10): Promise<PageResponse<Message>> {
  return apiRequest<PageResponse<Message>>(`/api/messages/paged?page=${page}&size=${size}`);
}

export async function getMessage(id: number): Promise<Message> {
  return apiRequest<Message>(`/api/message/${id}`);
}

export async function createMessage(data: Partial<Message>): Promise<Message> {
  return apiRequest<Message>('/api/message', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function sendMessage(data: Partial<Message>): Promise<Message> {
  return apiRequest<Message>('/api/message/send', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteMessage(id: number): Promise<void> {
  await apiRequest<void>(`/api/message/${id}`, { method: 'DELETE' });
}
