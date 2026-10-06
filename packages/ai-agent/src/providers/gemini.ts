import type { MemoryEntry, MediaData } from '@mlhkinfotech/types';

export interface GeminiCallParams {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  history: MemoryEntry[];
  prompt: string;
  media?: MediaData;
  temperature?: number;
  maxTokens?: number;
}

export const callGemini = async (params: GeminiCallParams): Promise<string | null> => {
  const model = params.model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${params.apiKey}`;

  let contents = params.history
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  while (contents.length > 0 && contents[0]?.role === 'model') {
    contents.shift();
  }

  // Current user turn
  const userParts: any[] = [{ text: params.prompt }];
  if (params.media?.data) {
    userParts.push({
      inlineData: {
        mimeType: params.media.mimeType || 'image/jpeg',
        data: params.media.data
      }
    });
  }
  contents.push({ role: 'user', parts: userParts });

  const body: any = {
    contents,
    generationConfig: {
      temperature: params.temperature ?? 0.7,
      maxOutputTokens: params.maxTokens ?? 800
    }
  };

  if (params.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: params.systemInstruction }]
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`Gemini API Error (${res.status}):`, errText.slice(0, 200));
      return null;
    }

    const data: any = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) return null;

    const reply = candidate.content.parts
      .map((p: any) => p.text)
      .filter(Boolean)
      .join('');

    return reply || null;
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('Gemini request failed:', err.message);
    return null;
  }
};
