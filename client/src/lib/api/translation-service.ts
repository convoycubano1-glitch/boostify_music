import { OpenAI } from "openai";
import { getAuthToken } from "@/lib/firebase";

interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function translateText({ text, targetLanguage, sourceLanguage }: TranslationRequest): Promise<TranslationResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const systemPrompt = `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the original meaning, tone, and style while ensuring the translation sounds natural in the target language.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const translatedText = response.choices[0]?.message?.content || '';
    if (!translatedText) {
      throw new Error('Translation failed - empty response');
    }

    return {
      translatedText,
      detectedLanguage: sourceLanguage,
      confidence: 0.9
    };
  } catch (error: any) {
    console.error('Translation error:', error);
    throw new Error(error.message || 'Failed to translate text');
  }
}

export async function detectLanguage(text: string): Promise<string> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a language detection expert. Detect the language of the given text and respond with only the ISO 639-1 language code (e.g., 'en' for English, 'es' for Spanish)." 
        },
        { role: "user", content: text }
      ],
      temperature: 0,
      max_tokens: 10
    });

    const language = response.choices[0]?.message?.content?.trim().toLowerCase() || 'en';
    return language;
  } catch (error: any) {
    console.error('Language detection error:', error);
    throw new Error(error.message || 'Failed to detect language');
  }
}