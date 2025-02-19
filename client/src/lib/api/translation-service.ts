import { Configuration, OpenAIApi } from "openai";
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

export async function translateText({ text, targetLanguage, sourceLanguage }: TranslationRequest): Promise<TranslationResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage
      })
    });

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    return await response.json();
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

    const response = await fetch('/api/detect-language', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Language detection failed');
    }

    const { language } = await response.json();
    return language;
  } catch (error: any) {
    console.error('Language detection error:', error);
    throw new Error(error.message || 'Failed to detect language');
  }
}