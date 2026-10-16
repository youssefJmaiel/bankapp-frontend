import { apiRequest } from './client';

export interface AIChatResponse {
  reply: string;
  conversationId: number;
}

export interface AIMessage {
  id: number;
  role: 'USER' | 'ASSISTANT' | string;
  content: string;
  createdAt: string;
}

export interface AIConversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AIMessage[];
}

export interface AIConversationSummary {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export async function sendAIMessage(
  message: string,
  conversationId?: number,
): Promise<AIChatResponse> {
  const headers: Record<string, string> = {};

  if (conversationId !== undefined) {
    headers['X-Conversation-Id'] = String(conversationId);
  }

  const result = await apiRequest<AIChatResponse>('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ message }),
  });

  if (
    !result ||
    typeof result.reply !== 'string' ||
    typeof result.conversationId !== 'number'
  ) {
    throw new Error('The AI service returned an invalid response.');
  }

  return result;
}

export async function listAIConversations(): Promise<AIConversationSummary[]> {
  const result = await apiRequest<AIConversationSummary[]>(
    '/api/ai/conversations',
  );

  if (!Array.isArray(result)) {
    throw new Error('The AI service returned an invalid conversation history.');
  }

  return result;
}

export async function getAIConversation(
  conversationId: number,
): Promise<AIConversation> {
  const result = await apiRequest<AIConversation>(
    `/api/ai/conversations/${conversationId}`,
  );

  if (!result || typeof result.id !== 'number' || !Array.isArray(result.messages)) {
    throw new Error('The AI service returned an invalid conversation.');
  }

  return result;
}

export async function createAIConversation(): Promise<AIConversation> {
  return apiRequest<AIConversation>('/api/ai/conversations', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function deleteAIConversation(
  conversationId: number,
): Promise<void> {
  await apiRequest<void>(`/api/ai/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}
