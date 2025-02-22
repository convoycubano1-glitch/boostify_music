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

    // Define the lesson structure template
    const lessonTemplate = {
      title: lessonTitle,
      content: {
        introduction: "Write 2-3 paragraphs here",
        keyPoints: ["4-6 key points"],
        mainContent: [{
          subtitle: "Section heading",
          paragraphs: ["Detailed explanation"]
        }],
        practicalExercises: ["3-5 exercises"],
        additionalResources: ["3-5 resources"],
        summary: "One paragraph summary",
        exam: [{
          question: "Question about content",
          options: ["Option 1", "Option 2", "Option 3", "Option 4"],
          correctAnswer: 0,
          explanation: "Why this is correct"
        }]
      }
    };

    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-r1:free',
      messages: [
        {
          role: 'system',
          content: 'You are an expert music industry educator. Generate lesson content following the exact JSON structure provided, with no additional formatting or markdown.'
        },
        {
          role: 'user',
          content: `Create a lesson about "${lessonTitle}" with description: "${lessonDescription}". 
            Return a JSON object exactly matching this structure: ${JSON.stringify(lessonTemplate, null, 2)}`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }

    const content = completion.choices[0].message.content.trim();

    try {
      const parsedContent = JSON.parse(content);
      return lessonContentSchema.parse(parsedContent);
    } catch (parseError) {
      console.error('Error parsing content:', parseError);
      throw new Error('Failed to parse lesson content: Invalid JSON format');
    }

  } catch (error) {
    console.error('Error in generateLessonContent:', error);
    throw error;
  }
}