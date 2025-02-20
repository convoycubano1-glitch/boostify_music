import { OpenAI } from "openai";
import { getAuth } from "firebase/auth";
import { db } from "@db";
import { translations } from "@db/schema";
import { eq, desc } from 'drizzle-orm';
import { SelectTranslation } from "@db/schema";

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

// Initialize OpenAI with error handling
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

if (!import.meta.env.VITE_OPENAI_API_KEY) {
  console.error("OpenAI API key is not configured");
}

export async function translateText({ text, targetLanguage, sourceLanguage }: TranslationRequest): Promise<TranslationResponse> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    // First detect the source language if not provided
    if (!sourceLanguage) {
      sourceLanguage = await detectLanguage(text);
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

    const translatedText = response.choices[0]?.message?.content;
    if (!translatedText) {
      throw new Error('Translation failed - empty response');
    }

    // Store the translation in the database with error handling
    try {
      await db.insert(translations).values({
        userId: parseInt(user.uid), // Convert string uid to number
        sourceText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
      });
      console.log("Translation saved successfully");
    } catch (dbError) {
      console.error("Failed to save translation:", dbError);
      // Continue with the translation even if saving fails
    }

    return {
      translatedText,
      detectedLanguage: sourceLanguage,
      confidence: 0.9
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to translate text');
  }
}

export async function getTranslationHistory(): Promise<SelectTranslation[]> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    try {
      const history = await db.query.translations.findMany({
        where: eq(translations.userId, parseInt(user.uid)),
        orderBy: [desc(translations.createdAt)],
        limit: 50
      });
      return history;
    } catch (dbError) {
      console.error("Failed to fetch translation history:", dbError);
      return []; // Return empty array on database error
    }
  } catch (error) {
    console.error('Error in translation history:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch translation history');
  }
}

export async function detectLanguage(text: string): Promise<string> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
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
  } catch (error) {
    console.error('Language detection error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to detect language');
  }
}