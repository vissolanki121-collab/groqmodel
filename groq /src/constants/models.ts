import { GroqModel, PromptExample } from '../types';

export const DEFAULT_GROQ_MODELS: GroqModel[] = [
  {
    id: 'llama-3.3-70b-versatile',
    owned_by: 'Meta',
    context_window: 131072,
    description: 'Most capable open model with 128k context, strong reasoning & coding.',
    category: 'llama',
    isRecommended: true,
  },
  {
    id: 'llama-3.1-8b-instant',
    owned_by: 'Meta',
    context_window: 131072,
    description: 'Blazing fast inference up to 1200+ tok/s. Great for real-time applications.',
    category: 'llama',
    isRecommended: true,
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    owned_by: 'DeepSeek',
    context_window: 131072,
    description: 'Reasoning model distilled from DeepSeek-R1 onto Llama-70B. High mathematical logic.',
    category: 'deepseek',
    isRecommended: true,
  },
  {
    id: 'deepseek-r1-distill-qwen-32b',
    owned_by: 'DeepSeek',
    context_window: 131072,
    description: 'Reasoning model fine-tuned from Qwen 2.5 32B for rapid deep reasoning.',
    category: 'deepseek',
  },
  {
    id: 'qwen-2.5-32b',
    owned_by: 'Alibaba Cloud',
    context_window: 131072,
    description: 'High-performance multilingual instruction model with outstanding math & code benchmarks.',
    category: 'qwen',
  },
  {
    id: 'mixtral-8x7b-32768',
    owned_by: 'Mistral AI',
    context_window: 32768,
    description: 'Fast mixture-of-experts model with 32k context.',
    category: 'mistral',
  },
  {
    id: 'gemma2-9b-it',
    owned_by: 'Google',
    context_window: 8192,
    description: 'Google Gemma 2 9B instruction-tuned model with compact footprint.',
    category: 'gemma',
  },
  {
    id: 'llama-3.1-70b-versatile',
    owned_by: 'Meta',
    context_window: 131072,
    description: 'Meta Llama 3.1 70B parameter model.',
    category: 'llama',
  }
];

export const PRESET_EXAMPLES: Record<string, { name: string; systemPrompt: string; examples: PromptExample[]; sampleInput: string }> = {
  sentiment: {
    name: 'Sentiment Analysis (Few-shot)',
    systemPrompt: 'You are an accurate sentiment classifier. Output only a JSON object with "sentiment" (Positive, Negative, or Neutral) and "confidence" (0-1).',
    examples: [
      {
        id: 'ex-1',
        userInput: 'The product arrived two days early and works like a dream!',
        assistantResponse: '{"sentiment": "Positive", "confidence": 0.98}'
      },
      {
        id: 'ex-2',
        userInput: 'Total waste of money. Broke after ten minutes.',
        assistantResponse: '{"sentiment": "Negative", "confidence": 0.99}'
      },
      {
        id: 'ex-3',
        userInput: 'The package contains 3 items as described in the manual.',
        assistantResponse: '{"sentiment": "Neutral", "confidence": 0.92}'
      }
    ],
    sampleInput: 'The battery lasts fairly well, though the button feels a little plasticky.'
  },
  codeTranslation: {
    name: 'Python to TypeScript (One-shot)',
    systemPrompt: 'You are an expert polyglot programmer. Translate the user Python code into strictly typed TypeScript. Do not include markdown preamble, only TypeScript code.',
    examples: [
      {
        id: 'ex-code-1',
        userInput: 'def greet(name: str, count: int = 1) -> str:\n    return f"Hello {name}!" * count',
        assistantResponse: 'export function greet(name: string, count: number = 1): string {\n  return `Hello ${name}!`.repeat(count);\n}'
      }
    ],
    sampleInput: 'def calculate_discount(price: float, percentage: float) -> float:\n    if percentage < 0 or percentage > 100:\n        raise ValueError("Invalid percentage")\n    return round(price * (1 - percentage / 100), 2)'
  },
  jsonExtractor: {
    name: 'Information Extractor (Few-shot)',
    systemPrompt: 'Extract structured details from unstructured meeting notes. Return valid JSON only.',
    examples: [
      {
        id: 'ex-json-1',
        userInput: 'Met with Alice on Tuesday at 3pm to review Q3 roadmap. Next sync set for Oct 12.',
        assistantResponse: '{"attendees": ["Alice"], "time": "Tuesday 3pm", "topic": "Q3 roadmap review", "nextSync": "Oct 12"}'
      },
      {
        id: 'ex-json-2',
        userInput: 'Quick call with Dave and Sarah about budget approval. Approved $45,000 for server upgrades.',
        assistantResponse: '{"attendees": ["Dave", "Sarah"], "topic": "Budget approval", "outcome": "Approved $45,000 for server upgrades"}'
      }
    ],
    sampleInput: 'Spoke with Priya and Tom regarding the database migration. Action item: Priya will benchmark PostgreSQL by Friday.'
  },
  zeroShot: {
    name: 'Clear to Zero-shot',
    systemPrompt: 'You are an advanced AI assistant powered by Groq LPUs. Provide clear, accurate, and concise responses.',
    examples: [],
    sampleInput: 'Explain how Groq LPU (Language Processing Unit) architecture differs from traditional GPUs for LLM inference.'
  }
};
