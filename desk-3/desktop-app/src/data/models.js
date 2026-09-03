// Exactly 5 verified models active on this Groq project key
export const GROQ_MODELS = [
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B',
    provider: 'Alibaba Cloud',
    speed: '450 T/s',
    contextWindow: '131K',
    badge: 'Fast & Smart',
    description: 'High-capability multi-domain conversational model with strong reasoning.',
    isDefault: true
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    provider: 'OpenAI (OSS)',
    speed: '500 T/s',
    contextWindow: '131K',
    badge: 'Deep Reasoning',
    description: 'Deep reasoning and complex analytical thinking powered by open architecture.',
    isDefault: false
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    provider: 'OpenAI (OSS)',
    speed: '1,000 T/s',
    contextWindow: '131K',
    badge: '1,000 T/s Turbo',
    description: 'Blistering 1,000 tokens/sec generation for rapid code, writing, and queries.',
    isDefault: false
  },
  {
    id: 'qwen/qwen3.6-27b',
    name: 'Qwen 3.6 27B',
    provider: 'Alibaba Cloud',
    speed: '500 T/s',
    contextWindow: '131K',
    badge: 'Logic & Code',
    description: 'Optimized for algorithmic precision, code generation, and multi-turn dialog.',
    isDefault: false
  },
  {
    id: 'groq/compound',
    name: 'Groq Compound',
    provider: 'Groq System',
    speed: '450 T/s',
    contextWindow: '131K',
    badge: 'Compound System',
    description: 'Ensemble model architecture orchestrating multi-step intelligence and reasoning.',
    isDefault: false
  }
];

export const DEFAULT_MODEL_ID = 'qwen/qwen3.8-27b';
