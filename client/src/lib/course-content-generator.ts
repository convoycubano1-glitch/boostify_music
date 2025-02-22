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

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Artist Boost',
      },
      dangerouslyAllowBrowser: true
    });

    // Define the lesson structure template with more detailed content
    const lessonTemplate = {
      title: lessonTitle,
      content: {
        introduction: "Write a detailed 3-4 paragraph introduction",
        coverImagePrompt: "Describe an image that represents this lesson's main concept",
        keyPoints: [{
          point: "Key learning objective",
          icon: "Suggest a Lucide icon name (e.g., 'Music', 'Star', etc.)"
        }],
        mainContent: [{
          subtitle: "Section heading",
          icon: "Suggest a Lucide icon name",
          paragraphs: ["Write 3-4 detailed paragraphs"],
          imagePrompt: "Describe an image that would illustrate this section"
        }],
        practicalExercises: [{
          title: "Exercise title",
          description: "Detailed exercise description",
          steps: ["Step-by-step instructions"],
          icon: "Suggest a Lucide icon name"
        }],
        additionalResources: [{
          title: "Resource title",
          url: "URL to resource",
          description: "Brief description of the resource",
          icon: "Suggest a Lucide icon name"
        }],
        summary: "Write a comprehensive one-paragraph summary",
        exam: [{
          question: "Detailed question about the content",
          options: ["Option 1", "Option 2", "Option 3", "Option 4"],
          correctAnswer: 0,
          explanation: "Detailed explanation of why this answer is correct"
        }]
      }
    };

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3-opus:beta',
      messages: [
        {
          role: 'system',
          content: 'You are an expert music industry educator creating comprehensive educational content. Generate detailed lesson content following the exact JSON structure provided. Include relevant Lucide icon names (see https://lucide.dev) for visual elements. Create detailed, practical content that is immediately applicable to music industry professionals.'
        },
        {
          role: 'user',
          content: `Create a comprehensive lesson about "${lessonTitle}" with this description: "${lessonDescription}". 
            Return a JSON object exactly matching this structure: ${JSON.stringify(lessonTemplate, null, 2)}

            Requirements:
            - Minimum 3 key points
            - Minimum 3 main content sections
            - Minimum 3 practical exercises
            - Minimum 3 additional resources
            - Minimum 3 exam questions
            - All icons should be valid Lucide icon names (e.g., Music, Star, Book, etc.)
            - Image prompts should be detailed enough for image generation
            - Content should be practical and immediately applicable`
        }
      ],
      temperature: 0.7,
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