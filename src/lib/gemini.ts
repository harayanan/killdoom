import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateWithRetry(
  prompt: string,
  maxRetries = 3,
  baseDelay = 1000
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `Gemini API attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );
      await sleep(delay);
    }
  }
  throw new Error('Unreachable');
}

export function extractJson<T>(text: string): T {
  // Try to find JSON array first, then JSON object
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) return JSON.parse(arrayMatch[0]);

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) return JSON.parse(objectMatch[0]);

  throw new Error('Failed to extract JSON from Gemini response');
}
