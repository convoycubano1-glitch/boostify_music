import { z } from 'zod';

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
    summary: z.string()
  })
});

export type LessonContent = z.infer<typeof lessonContentSchema>;

export async function generateLessonContent(lessonTitle: string, lessonDescription: string): Promise<LessonContent> {
  const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
  
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert music industry educator. Generate comprehensive lesson content for a professional music industry course. The content should be detailed, practical, and include real-world examples.

Output the content in the following JSON structure:
{
  "title": "Lesson title",
  "content": {
    "introduction": "Brief engaging introduction",
    "keyPoints": ["Array of 3-5 key takeaways"],
    "mainContent": [
      {
        "subtitle": "Section subtitle",
        "paragraphs": ["Detailed paragraphs explaining concepts"]
      }
    ],
    "practicalExercises": ["List of practical exercises"],
    "additionalResources": ["Relevant resources, tools, or references"],
    "summary": "Concise summary of main points"
  }
}`
          },
          {
            role: 'user',
            content: `Generate detailed lesson content for: "${lessonTitle}"
Description: ${lessonDescription}
Focus on practical knowledge and real-world applications in the music industry.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate lesson content');
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return lessonContentSchema.parse(content);

  } catch (error) {
    console.error('Error generating lesson content:', error);
    throw new Error('Failed to generate lesson content');
  }
}
