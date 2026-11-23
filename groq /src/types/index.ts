export interface PromptExample {
  id: string;
  userInput: string;
  assistantResponse: string;
}

export type PromptingTechnique = 'Zero-shot' | 'One-shot' | 'Few-shot';

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface CompletionStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  promptTime: number; // seconds
  completionTime: number; // seconds
  totalTime: number; // seconds
  tokensPerSecond: number;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: SearchSource[];
  stats?: CompletionStats;
  isStreaming?: boolean;
}

export interface ModelParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stream: boolean;
}

export interface GroqModel {
  id: string;
  owned_by?: string;
  context_window?: number;
  description?: string;
  category?: 'llama' | 'deepseek' | 'qwen' | 'mistral' | 'gemma' | 'other';
  isRecommended?: boolean;
}

export type ApiConnectionStatus = 'disconnected' | 'validating' | 'connected' | 'error';
