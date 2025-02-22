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
    exam: z.array(examQuestionSchema).min(1) // Aseguramos que haya al menos una pregunta
  })
});

export type ExamQuestion = z.infer<typeof examQuestionSchema>;
export type LessonContent = z.infer<typeof lessonContentSchema>;

// Fallback content generator
function generateFallbackContent(lessonTitle: string, lessonDescription: string): LessonContent {
  return {
    title: lessonTitle,
    content: {
      introduction: `Welcome to the lesson on ${lessonTitle}. ${lessonDescription}`,
      keyPoints: [
        "Understanding the fundamentals",
        "Learning industry best practices",
        "Developing practical skills",
        "Applying knowledge in real-world scenarios"
      ],
      mainContent: [
        {
          subtitle: "Getting Started",
          paragraphs: [
            `This lesson will cover ${lessonTitle}.`,
            "We'll explore the key concepts and practical applications."
          ]
        },
        {
          subtitle: "Core Concepts",
          paragraphs: [
            `${lessonDescription}`,
            "Let's dive into the details and understand how this applies to your music career."
          ]
        }
      ],
      practicalExercises: [
        "Review the concepts covered in this lesson",
        "Apply the knowledge to your current projects",
        "Practice with real-world examples"
      ],
      additionalResources: [
        "Industry standard tools and platforms",
        "Recommended reading materials",
        "Online tutorials and workshops"
      ],
      summary: `This lesson covered ${lessonTitle}. Continue practicing and applying these concepts to advance your music industry career.`,
      exam: [
        {
          question: "What is the main focus of this lesson?",
          options: [
            "Basic music theory",
            `Understanding ${lessonTitle}`,
            "Advanced composition",
            "Music history"
          ],
          correctAnswer: 1,
          explanation: `This lesson focuses on ${lessonTitle} and its practical applications in the music industry.`
        },
        {
          question: "What is one of the key objectives of this lesson?",
          options: [
            "Learning industry best practices",
            "Playing musical instruments",
            "Writing song lyrics",
            "Recording vocals"
          ],
          correctAnswer: 0,
          explanation: "This lesson emphasizes learning and applying industry best practices in your music career."
        }
      ]
    }
  };
}

export async function generateLessonContent(lessonTitle: string, lessonDescription: string): Promise<LessonContent> {
  try {
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      console.warn('OpenRouter API key not configured, using fallback content');
      return generateFallbackContent(lessonTitle, lessonDescription);
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

    try {
      const completion = await openai.chat.completions.create({
        model: 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'system',
            content: `You are an expert music industry educator. Create a detailed lesson with multiple-choice exam questions in this exact JSON format:
{
  "title": "${lessonTitle}",
  "content": {
    "introduction": "2-3 paragraphs introducing the topic",
    "keyPoints": ["4-6 key points as string array"],
    "mainContent": [
      {
        "subtitle": "section heading",
        "paragraphs": ["detailed explanation paragraph", "another paragraph"]
      }
    ],
    "practicalExercises": ["3-5 exercises as string array"],
    "additionalResources": ["3-5 resources as string array"],
    "summary": "one paragraph summary",
    "exam": [
      {
        "question": "Clear, specific question about the lesson content",
        "options": ["4 possible answers as array"],
        "correctAnswer": 0,
        "explanation": "Detailed explanation of why this is the correct answer"
      },
      {
        "question": "Another specific question about the content",
        "options": ["4 possible answers as array"],
        "correctAnswer": 1,
        "explanation": "Detailed explanation for this answer"
      }
    ]
  }
}`
          },
          {
            role: 'user',
            content: `Create a comprehensive lesson about: "${lessonTitle}" with this description: ${lessonDescription}. Include at least 2 exam questions.`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      if (!completion.choices[0]?.message?.content) {
        console.warn('Invalid API response format, using fallback content');
        return generateFallbackContent(lessonTitle, lessonDescription);
      }

      try {
        const parsedContent = typeof completion.choices[0].message.content === 'string'
          ? JSON.parse(completion.choices[0].message.content)
          : completion.choices[0].message.content;

        // Intentar validar con el esquema
        const validatedContent = lessonContentSchema.parse(parsedContent);
        return validatedContent;
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        return generateFallbackContent(lessonTitle, lessonDescription);
      }

    } catch (fetchError) {
      console.error('Network error:', fetchError);
      return generateFallbackContent(lessonTitle, lessonDescription);
    }

  } catch (error) {
    console.error('Error in generateLessonContent:', error);
    return generateFallbackContent(lessonTitle, lessonDescription);
  }
}