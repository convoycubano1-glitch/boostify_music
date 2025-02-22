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

    // Define the lesson structure template
    const lessonTemplate = {
      title: lessonTitle,
      content: {
        introduction: "Write a detailed introduction to the topic (2-3 paragraphs)",
        coverImagePrompt: "Describe a professional image that represents this lesson",
        keyPoints: [
          {
            point: "Key point 1",
            icon: "Music"
          },
          {
            point: "Key point 2",
            icon: "Star"
          },
          {
            point: "Key point 3",
            icon: "Book"
          }
        ],
        mainContent: [
          {
            subtitle: "First Section",
            icon: "Lightbulb",
            paragraphs: ["Detailed content paragraph"],
            imagePrompt: "Description for section image"
          }
        ],
        practicalExercises: [
          {
            title: "Exercise 1",
            description: "Exercise description",
            steps: ["Step 1", "Step 2", "Step 3"],
            icon: "Pencil"
          }
        ],
        additionalResources: [
          {
            title: "Resource 1",
            url: "https://example.com",
            description: "Resource description",
            icon: "Link"
          }
        ],
        summary: "Comprehensive summary of the lesson",
        exam: [
          {
            question: "Sample question",
            options: ["Option 1", "Option 2", "Option 3", "Option 4"],
            correctAnswer: 0,
            explanation: "Explanation for the correct answer"
          }
        ]
      }
    };

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3-opus:beta',
      messages: [
        {
          role: 'system',
          content: `You are an expert music industry educator creating comprehensive educational content. Generate detailed lesson content following the exact JSON structure provided. Include relevant Lucide icon names from this list: Music, Star, Book, Lightbulb, FileText, Link, Pencil, Trophy, Clock, Users, Award, ChevronRight. Create detailed, practical content that is immediately applicable to music industry professionals.`
        },
        {
          role: 'user',
          content: `Create a comprehensive lesson about "${lessonTitle}" with this description: "${lessonDescription}". 
            Return valid JSON matching this structure exactly: ${JSON.stringify(lessonTemplate, null, 2)}

            Requirements:
            - Must have at least 3 key points
            - Must have at least 3 main content sections
            - Must have at least 3 practical exercises
            - Must have at least 3 additional resources
            - Must have at least 3 exam questions
            - Only use icon names from the provided list
            - Content should be practical and immediately applicable`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    if (!completion.choices[0]?.message?.content) {
      console.error('Invalid API response format:', completion);
      throw new Error('Invalid API response format');
    }

    const content = completion.choices[0].message.content.trim();
    console.log('Generated content:', content);

    try {
      const parsedContent = JSON.parse(content);
      console.log('Parsed content:', parsedContent);
      return lessonContentSchema.parse(parsedContent);
    } catch (parseError) {
      console.error('Error parsing content:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse lesson content: Invalid JSON format');
    }

  } catch (error) {
    console.error('Error in generateLessonContent:', error);
    throw error;
  }
}