import type { MemoryEntry, MediaData } from '@mlhkinfotech/types';

export interface OpenRouterCallParams {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  history: MemoryEntry[];
  prompt: string;
  media?: MediaData;
  temperature?: number;
  maxTokens?: number;
}

export const callOpenRouter = async (params: OpenRouterCallParams): Promise<string | null> => {
  const model = params.model || 'google/gemma-2-9b-it:free';
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const messages: any[] = [];

  if (params.systemInstruction) {
    messages.push({ role: 'system', content: params.systemInstruction });
  }

  for (const h of params.history) {
    messages.push({ role: h.role, content: h.content });
  }

  if (params.media?.data) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: params.prompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:${params.media.mimeType || 'image/jpeg'};base64,${params.media.data}`
          }
        }
      ]
    });
  } else {
    messages.push({ role: 'user', content: params.prompt });
  }

  const body = {
    model,
    messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.maxTokens ?? 800
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
        'X-Title': 'MLHK AI Agent'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`OpenRouter API Error (${res.status}):`, errText.slice(0, 200));
      return null;
    }

    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('OpenRouter request failed:', err.message);
    return null;
  }
};
