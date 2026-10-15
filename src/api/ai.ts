import { apiRequest } from './client';

export interface AIChatResponse {
  reply: string;
}

export async function sendAIMessage(message: string): Promise<string> {
  const result = await apiRequest<AIChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  if (!result || typeof result.reply !== 'string') {
    throw new Error('The AI service returned an invalid response.');
  }

  return result.reply;
}
