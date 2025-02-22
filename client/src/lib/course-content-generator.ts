import { z } from 'zod';
import OpenAI from 'openai';

const examQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string()
});

const sectionSchema = z.object({
  subtitle: z.string(),
  icon: z.string(),
  paragraphs: z.array(z.string()),
  imagePrompt: z.string().optional()
});

const lessonContentSchema = z.object({
  title: z.string(),
  content: z.object({
    introduction: z.string(),
    coverImagePrompt: z.string(),
    keyPoints: z.array(z.object({
      point: z.string(),
      icon: z.string()
    })),
    mainContent: z.array(sectionSchema),
    practicalExercises: z.array(z.object({
      title: z.string(),
      description: z.string(),
      steps: z.array(z.string()),
      icon: z.string()
    })),
    additionalResources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      description: z.string(),
      icon: z.string()
    })),
    summary: z.string(),
    exam: z.array(examQuestionSchema).min(3)
  })
});

export type ExamQuestion = z.infer<typeof examQuestionSchema>;
export type LessonContent = z.infer<typeof lessonContentSchema>;

export async function generateLessonContent(lessonTitle: string, lessonDescription: string): Promise<LessonContent> {
  try {
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    console.log('Initializing OpenRouter API client...');
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Artist Boost - Music Education Platform',
      },
      dangerouslyAllowBrowser: true
    });

    const systemPrompt = `You are an expert music industry educator. Create a detailed lesson following this format:
    - A thorough introduction explaining the topic
    - At least 3 key learning points with icons
    - At least 3 detailed content sections
    - At least 3 practical exercises with clear steps
    - At least 3 relevant external resources
    - A comprehensive summary
    - At least 3 exam questions to test understanding

    Use only these Lucide icons: Music, Star, Book, Lightbulb, FileText, Link, Pencil, Trophy, Clock, Users, Award, ChevronRight.

    Ensure all content is practical and immediately applicable to music industry professionals.`;

    const userPrompt = `Create a comprehensive lesson about "${lessonTitle}" based on this description: "${lessonDescription}".

    The response must be a valid JSON object with this exact structure:
    {
      "title": "string",
      "content": {
        "introduction": "string",
        "coverImagePrompt": "string",
        "keyPoints": [{"point": "string", "icon": "string"}],
        "mainContent": [{
          "subtitle": "string",
          "icon": "string",
          "paragraphs": ["string"],
          "imagePrompt": "string"
        }],
        "practicalExercises": [{
          "title": "string",
          "description": "string",
          "steps": ["string"],
          "icon": "string"
        }],
        "additionalResources": [{
          "title": "string",
          "url": "string",
          "description": "string",
          "icon": "string"
        }],
        "summary": "string",
        "exam": [{
          "question": "string",
          "options": ["string"],
          "correctAnswer": 0,
          "explanation": "string"
        }]
      }
    }`;

    console.log('Making API request to OpenRouter...');
    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    console.log('Received API response:', completion);

    if (!completion.choices?.[0]?.message?.content) {
      console.error('Invalid API response structure:', completion);
      throw new Error('Invalid API response structure');
    }

    const content = completion.choices[0].message.content.trim();
    console.log('Raw content:', content);

    try {
      const parsedContent = JSON.parse(content);
      console.log('Successfully parsed JSON content');

      const validatedContent = lessonContentSchema.parse(parsedContent);
      console.log('Successfully validated content schema');

      return validatedContent;
    } catch (parseError) {
      console.error('Error parsing/validating content:', parseError);
      console.error('Raw content that failed:', content);
      throw new Error('Failed to parse or validate lesson content');
    }

  } catch (error) {
    console.error('Error in generateLessonContent:', error);
    throw error;
  }
}