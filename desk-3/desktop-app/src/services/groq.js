// Project Groq API Key loaded from environment
const FIXED_GROQ_API_KEY =
  (import.meta.env.VITE_GROQ_API_KEY ||
  import.meta.env.GROQ_API_KEY ||
  '').trim();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';

const STORAGE_KEYS = {
  SESSIONS: 'groq_chat_sessions_v2',
  ACTIVE_SESSION: 'groq_chat_active_session_v2',
  ACTIVE_MODEL: 'groq_chat_active_model_v2',
};

export const getProjectApiKey = () => FIXED_GROQ_API_KEY;

export const getStoredSessions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sessions', e);
  }
  return [];
};

export const setStoredSessions = (sessions) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions', e);
  }
};

export const getStoredActiveSessionId = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) || null;
  } catch (e) {
    return null;
  }
};

export const setStoredActiveSessionId = (id) => {
  try {
    if (id) localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, id);
    else localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  } catch (e) {
    console.error(e);
  }
};

export const getStoredActiveModelId = (defaultId) => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_MODEL) || defaultId;
  } catch (e) {
    return defaultId;
  }
};

export const setStoredActiveModelId = (modelId) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MODEL, modelId);
  } catch (e) {
    console.error(e);
  }
};

/**
 * Fetch available models from Groq API
 */
export const fetchGroqModels = async () => {
  try {
    const response = await fetch(GROQ_MODELS_URL, {
      headers: {
        Authorization: `Bearer ${FIXED_GROQ_API_KEY}`,
      },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch (e) {
    return [];
  }
};

/**
 * Stream chat completions from Groq directly
 */
export const streamChatCompletion = async ({
  model,
  messages,
  temperature = 0.7,
  maxTokens = 2048,
  onToken,
  onDone,
  onError,
  signal,
}) => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FIXED_GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      let errMsg = `Groq API Error (${response.status})`;
      if (response.status === 401) {
        errMsg = 'Invalid API key configured for the project.';
      } else if (response.status === 429) {
        errMsg = 'Rate limit reached. Please wait a few moments or choose a different model.';
      } else if (errorData && errorData.error && errorData.error.message) {
        errMsg = errorData.error.message;
      }
      throw new Error(errMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedContent = '';
    let accumulatedReasoning = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed === 'data: [DONE]') {
          const finalOutput = formatOutput(accumulatedReasoning, accumulatedContent);
          if (onDone) onDone(finalOutput);
          return;
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta || {};

            if (delta.reasoning) {
              accumulatedReasoning += delta.reasoning;
              const currentOutput = formatOutput(accumulatedReasoning, accumulatedContent);
              if (onToken) onToken(currentOutput);
            }

            if (delta.content) {
              accumulatedContent += delta.content;
              const currentOutput = formatOutput(accumulatedReasoning, accumulatedContent);
              if (onToken) onToken(currentOutput);
            }
          } catch (err) {
            // Ignore partial SSE chunk
          }
        }
      }
    }

    const finalOutput = formatOutput(accumulatedReasoning, accumulatedContent);
    if (onDone) onDone(finalOutput);
  } catch (err) {
    if (err.name === 'AbortError') {
      if (onDone) onDone();
      return;
    }
    if (onError) onError(err);
  }
};

function formatOutput(reasoning, content) {
  if (reasoning && content) {
    return `<think>\n${reasoning.trim()}\n</think>\n\n${content}`;
  } else if (reasoning && !content) {
    return `<think>\n${reasoning.trim()}\n</think>`;
  }
  return content;
}
