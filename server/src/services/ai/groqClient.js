import { groq, DEFAULT_GROQ_MODEL } from '../../config/groq.js';

/**
 * Executes a structured chat completion with Groq AI, returning parsed JSON
 */
export async function getGroqStructuredCompletion({ systemPrompt, userPrompt, temperature = 0.2, model = DEFAULT_GROQ_MODEL }) {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;

  if (!apiKey || apiKey.startsWith('gsk_mock')) {
    // Return null to signal caller to use deterministic rules-based processing
    return null;
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model,
      temperature,
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq AI');
    }

    return JSON.parse(content);
  } catch (err) {
    console.error('[Groq Client] Error calling Groq AI:', err.message);
    throw err;
  }
}
