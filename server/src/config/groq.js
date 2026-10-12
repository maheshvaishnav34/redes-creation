import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || '';
export const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let groqInstance = null;

export function getGroqClient() {
  if (!groqInstance) {
    if (!apiKey || apiKey.startsWith('gsk_mock')) {
      console.warn('[Groq Config] GROQ_API_KEY is not configured or using placeholder. AI will use deterministic mock fallback when needed.');
    }
    groqInstance = new Groq({
      apiKey: apiKey && !apiKey.startsWith('gsk_mock') ? apiKey : 'placeholder_key',
    });
  }
  return groqInstance;
}

export const groq = getGroqClient();
export default groq;
