import { z } from 'zod';
import OpenAI from 'openai';

const examQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string()
});

const lessonContentSchema = z.object({
  title: z.string(),
  content: z.object({
    introduction: z.string(),
    keyPoints: z.array(z.string()),
    mainContent: z.array(z.object({
      subtitle: z.string(),
      paragraphs: z.array(z.string())
    })),
    practicalExercises: z.array(z.string()),
    additionalResources: z.array(z.string()),
    summary: z.string(),
    exam: z.array(examQuestionSchema).min(1)
  })
});

export type ExamQuestion = z.infer<typeof examQuestionSchema>;
export type LessonContent = z.infer<typeof lessonContentSchema>;

export async function generateLessonContent(lessonTitle: string, lessonDescription: string): Promise<LessonContent> {
  try {
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      console.warn('OpenRouter API key not configured');
      throw new Error('OpenRouter API key not configured');
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Artist Boost',
      },
      dangerouslyAllowBrowser: true
    });

    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-r1:free',
      messages: [
        {
          role: 'system',
          content: `You are an expert music industry educator. Create a detailed lesson with exam questions in JSON format. Include at least 2 exam questions.`
        },
        {
          role: 'user',
          content: `Create a comprehensive lesson about: "${lessonTitle}" with this description: ${lessonDescription}. The response must be in this exact JSON format:
{
  "title": "${lessonTitle}",
  "content": {
    "introduction": "2-3 paragraphs introducing the topic",
    "keyPoints": ["4-6 key points"],
    "mainContent": [
      {
        "subtitle": "section heading",
        "paragraphs": ["detailed explanation", "more details"]
      }
    ],
    "practicalExercises": ["3-5 exercises"],
    "additionalResources": ["3-5 resources"],
    "summary": "one paragraph summary",
    "exam": [
      {
        "question": "specific question about the content",
        "options": ["four possible answers"],
        "correctAnswer": 0,
        "explanation": "why this is correct"
      }
    ]
  }
}`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }

    const parsedContent = JSON.parse(completion.choices[0].message.content);
    return lessonContentSchema.parse(parsedContent);

  } catch (error) {
    console.error('Error in generateLessonContent:', error);
    throw error;
  }
}