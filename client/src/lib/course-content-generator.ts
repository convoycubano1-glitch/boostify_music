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
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultQuery: { transforms: ["middle-out"] },
      defaultHeaders: {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Artist Boost - Music Education Platform',
      },
      dangerouslyAllowBrowser: true
    });

    const lessonTemplate = {
      title: lessonTitle,
      content: {
        introduction: "Write a detailed introduction about the topic",
        coverImagePrompt: "Describe a professional image for this lesson",
        keyPoints: [
          {
            point: "Important learning point",
            icon: "Music"
          }
        ],
        mainContent: [
          {
            subtitle: "Main topic section",
            icon: "Lightbulb",
            paragraphs: ["Detailed explanation"],
            imagePrompt: "Visual representation description"
          }
        ],
        practicalExercises: [
          {
            title: "Hands-on Exercise",
            description: "What the student will learn",
            steps: ["Step-by-step instructions"],
            icon: "Pencil"
          }
        ],
        additionalResources: [
          {
            title: "Further Learning",
            url: "https://example.com",
            description: "What this resource offers",
            icon: "Link"
          }
        ],
        summary: "Key takeaways from the lesson",
        exam: [
          {
            question: "Test knowledge question",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0,
            explanation: "Why this is the correct answer"
          }
        ]
      }
    };

    console.log('Making API request to OpenRouter...');

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3-opus:beta',
      messages: [
        {
          role: 'system',
          content: `You are an expert music industry educator. Create detailed lesson content following the exact structure provided. Use only these Lucide icons: Music, Star, Book, Lightbulb, FileText, Link, Pencil, Trophy, Clock, Users, Award, ChevronRight.`
        },
        {
          role: 'user',
          content: `Generate a comprehensive lesson about "${lessonTitle}" based on this description: "${lessonDescription}".

Return the content in this exact JSON structure:
${JSON.stringify(lessonTemplate, null, 2)}

Requirements:
- At least 3 key points with valid icons
- At least 3 content sections with relevant icons
- At least 3 practical exercises with clear steps
- At least 3 additional resources with valid URLs
- At least 3 exam questions with detailed explanations
- All icons must be from the provided list
- Content should be practical and immediately applicable
- Each section should be detailed and thorough`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    if (!completion.choices[0]?.message?.content) {
      console.error('Invalid API response:', completion);
      throw new Error('Invalid API response format');
    }

    const content = completion.choices[0].message.content.trim();
    console.log('Raw API response:', content);

    try {
      const parsedContent = JSON.parse(content);
      console.log('Parsed content:', parsedContent);

      const validatedContent = lessonContentSchema.parse(parsedContent);
      console.log('Validated content:', validatedContent);

      return validatedContent;
    } catch (parseError) {
      console.error('Error parsing/validating content:', parseError);
      throw new Error('Failed to parse or validate lesson content');
    }

  } catch (error) {
    console.error('Error in generateLessonContent:', error);
    throw error;
  }
}