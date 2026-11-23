import { GroqModel, ModelParameters, PromptExample, SearchSource, CompletionStats } from '../types';
import { DEFAULT_GROQ_MODELS } from '../constants/models';

export interface ChatCompletionPayload {
  apiKey: string;
  model: string;
  systemPrompt: string;
  examples: PromptExample[];
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  parameters: ModelParameters;
  webSearchSources?: SearchSource[];
  signal?: AbortSignal;
}

export async function validateApiKey(apiKey: string): Promise<{ success: boolean; models?: GroqModel[]; error?: string }> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { success: false, error: 'API key cannot be empty' };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${trimmed}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      return {
        success: false,
        error: 'Invalid API Key (401 Unauthorized). Please check your key at console.groq.com/keys'
      };
    }

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `API error (${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.error?.message || errMsg;
      } catch {
        errMsg = errText || errMsg;
      }
      return { success: false, error: errMsg };
    }

    const data = await response.json();
    const fetchedModels: GroqModel[] = [];

    if (Array.isArray(data.data)) {
      // Filter out non-chat models e.g. whisper or guard unless compatible
      const validModels = data.data
        .filter((m: any) => m.id && !m.id.includes('whisper'))
        .map((m: any) => {
          const defaultMatch = DEFAULT_GROQ_MODELS.find(d => d.id === m.id);
          return {
            id: m.id,
            owned_by: m.owned_by || defaultMatch?.owned_by || 'Groq',
            context_window: m.context_window || defaultMatch?.context_window || 8192,
            description: defaultMatch?.description || `Groq LPU accelerated model ${m.id}`,
            category: defaultMatch?.category || 'other',
            isRecommended: defaultMatch?.isRecommended || false
          };
        });

      // Sort recommended models first
      validModels.sort((a: GroqModel, b: GroqModel) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return a.id.localeCompare(b.id);
      });

      return { success: true, models: validModels.length > 0 ? validModels : DEFAULT_GROQ_MODELS };
    }

    return { success: true, models: DEFAULT_GROQ_MODELS };
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      return { success: false, error: 'Network error: Failed to reach api.groq.com. Please check your internet connection.' };
    }
    return { success: false, error: err.message || 'An unknown network error occurred.' };
  }
}

export async function executeWebSearch(query: string): Promise<SearchSource[]> {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error(`Search request failed with status ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    console.warn('Web search error:', err);
    // Return empty results rather than hard crash
    return [];
  }
}

export async function streamGroqCompletion({
  payload,
  onDelta,
  onStats,
  onError,
  onDone
}: {
  payload: ChatCompletionPayload;
  onDelta: (text: string) => void;
  onStats?: (stats: CompletionStats) => void;
  onError: (error: string) => void;
  onDone: () => void;
}) {
  const { apiKey, model, systemPrompt, examples, conversationHistory, parameters, webSearchSources, signal } = payload;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  // 1. Build System Prompt (incorporating web search context if present)
  let effectiveSystemPrompt = systemPrompt.trim();
  if (webSearchSources && webSearchSources.length > 0) {
    const sourcesContext = webSearchSources.map((s, idx) => 
      `[${idx + 1}] "${s.title}"\nURL: ${s.url}\nExcerpt: ${s.snippet}`
    ).join('\n\n');

    const searchInstructions = `\n\n[LIVE WEB SEARCH CONTEXT]\nThe user has enabled real-time web search. The following recent web search results have been retrieved to help answer the question accurately:\n\n${sourcesContext}\n\nInstructions: Synthesize your answer using these search results. Cite your sources in the text using bracketed numbers like [1], [2] corresponding to the references above. If the search results do not provide enough information, supplement with your knowledge while being clear about uncertainty.`;

    effectiveSystemPrompt = effectiveSystemPrompt ? (effectiveSystemPrompt + searchInstructions) : searchInstructions.trim();
  }

  if (effectiveSystemPrompt) {
    messages.push({ role: 'system', content: effectiveSystemPrompt });
  }

  // 2. Insert Few-Shot Examples as user/assistant pairs
  if (examples && examples.length > 0) {
    examples.forEach((example) => {
      if (example.userInput?.trim() && example.assistantResponse?.trim()) {
        messages.push({ role: 'user', content: example.userInput.trim() });
        messages.push({ role: 'assistant', content: example.assistantResponse.trim() });
      }
    });
  }

  // 3. Append Conversation History / Current User Messages
  conversationHistory.forEach((msg) => {
    messages.push({ role: msg.role, content: msg.content });
  });

  const requestBody: any = {
    model,
    messages,
    temperature: parameters.temperature,
    max_tokens: parameters.maxTokens,
    top_p: parameters.topP,
    frequency_penalty: parameters.frequencyPenalty,
    presence_penalty: parameters.presencePenalty,
    stream: parameters.stream,
  };

  if (parameters.stream) {
    requestBody.stream_options = { include_usage: true };
  }

  const startTime = performance.now();
  let accumulatedText = '';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `HTTP ${response.status} ${response.statusText}`;
      try {
        const json = JSON.parse(errText);
        if (json.error?.message) {
          errorMsg = json.error.message;
        }
      } catch {
        if (errText) errorMsg = errText;
      }
      onError(errorMsg);
      return;
    }

    // NON-STREAMING RESPONSE
    if (!parameters.stream) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      onDelta(content);
      
      const endTime = performance.now();
      const totalTimeSec = (endTime - startTime) / 1000;
      const usage = data.usage;
      const completionTokens = usage?.completion_tokens || Math.round(content.length / 4);
      const promptTokens = usage?.prompt_tokens || 0;
      const totalTokens = usage?.total_tokens || (promptTokens + completionTokens);
      const completionTime = usage?.completion_time || totalTimeSec;

      if (onStats) {
        onStats({
          promptTokens,
          completionTokens,
          totalTokens,
          promptTime: usage?.prompt_time || 0,
          completionTime,
          totalTime: usage?.total_time || totalTimeSec,
          tokensPerSecond: Math.round(completionTokens / (completionTime || 0.001)),
        });
      }
      onDone();
      return;
    }

    // STREAMING RESPONSE (SSE)
    const reader = response.body?.getReader();
    if (!reader) {
      onError('Unable to initialize response stream');
      return;
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let completionTokensEstimate = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // comments/keep-alive

        if (trimmed === 'data: [DONE]') {
          continue;
        }

        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);

            // Extract content chunk
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulatedText += delta;
              completionTokensEstimate += Math.max(1, Math.round(delta.length / 3.5));
              onDelta(delta);
            }

            // Extract usage stats if provided in stream
            if (parsed.usage && onStats) {
              const u = parsed.usage;
              const promptTime = u.prompt_time || 0;
              const completionTime = u.completion_time || ((performance.now() - startTime) / 1000);
              const completionTokens = u.completion_tokens || completionTokensEstimate;
              const tps = completionTime > 0 ? Math.round(completionTokens / completionTime) : 0;

              onStats({
                promptTokens: u.prompt_tokens || 0,
                completionTokens,
                totalTokens: u.total_tokens || (u.prompt_tokens + completionTokens),
                promptTime,
                completionTime,
                totalTime: u.total_time || ((performance.now() - startTime) / 1000),
                tokensPerSecond: tps,
              });
            }
          } catch (e) {
            // Partial JSON in chunk, will be handled in buffer
          }
        }
      }
    }

    // Fallback stats calculation if usage object wasn't delivered in stream
    const totalDurationSec = (performance.now() - startTime) / 1000;
    const finalTokens = Math.max(1, Math.round(accumulatedText.length / 3.5));
    if (onStats) {
      onStats({
        promptTokens: Math.round(messages.reduce((acc, m) => acc + m.content.length, 0) / 3.5),
        completionTokens: finalTokens,
        totalTokens: finalTokens,
        promptTime: 0.05,
        completionTime: totalDurationSec,
        totalTime: totalDurationSec,
        tokensPerSecond: Math.round(finalTokens / (totalDurationSec || 0.001)),
      });
    }

    onDone();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // User aborted stream, call onDone gracefully
      onDone();
      return;
    }
    onError(err.message || 'Stream processing failed');
  }
}
