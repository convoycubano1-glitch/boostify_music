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
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'OpenRouter-Override': 'true'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4',
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: `You are an expert music industry educator creating comprehensive lesson content for professional music industry courses. 
Generate detailed, practical content with real-world examples in JSON format with the following structure:

{
  "title": "${lessonTitle}",
  "content": {
    "introduction": "Engaging introduction to the topic (2-3 paragraphs)",
    "keyPoints": ["Array of 4-6 key takeaways"],
    "mainContent": [
      {
        "subtitle": "Logical section heading",
        "paragraphs": ["Detailed explanations with examples and industry insights", "Multiple paragraphs per section"]
      }
    ],
    "practicalExercises": ["3-5 hands-on exercises or assignments"],
    "additionalResources": ["Relevant tools, websites, or learning materials"],
    "summary": "Concise summary of main concepts"
  }
}`
          },
          {
            role: 'user',
            content: `Generate comprehensive lesson content for: "${lessonTitle}"
Topic Description: ${lessonDescription}
Focus on practical knowledge, real-world examples, and current industry practices.
Include specific tools, techniques, and strategies used in the modern music industry.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate lesson content: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    let content;
    try {
      content = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      throw new Error('Failed to parse lesson content');
    }

    return lessonContentSchema.parse(content);

  } catch (error) {
    console.error('Error generating lesson content:', error);
    throw error;
  }
}