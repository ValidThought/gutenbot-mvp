import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }
  return clientInstance;
}

export interface LLMResponse<T> {
  content: T;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function complete(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number }
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY && process.env.NODE_ENV !== 'test') {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: options?.maxTokens ?? 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text;
  } catch (error) {
    console.error('[LLM] Error:', error);
    throw error;
  }
}

export async function completeWithSchema<T>(
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodSchema<T>,
  options?: { maxTokens?: number }
): Promise<T> {
  const text = await complete(systemPrompt, userMessage, options);

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || 
                    text.match(/```\n?([\s\S]*?)\n?```/) ||
                    text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.error('[LLM] No JSON found in response:', text);
    throw new Error('No JSON found in Claude response');
  }

  const json = jsonMatch[1] || jsonMatch[0];
  
  try {
    const parsed = JSON.parse(json);
    return schema.parse(parsed);
  } catch (error) {
    console.error('[LLM] JSON parse error:', error);
    console.error('[LLM] Raw JSON:', json);
    throw new Error('Failed to parse Claude response as JSON');
  }
}

export function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// For testing purposes
export function setClient(client: Anthropic) {
  clientInstance = client;
}

export function resetClient() {
  clientInstance = null;
}
