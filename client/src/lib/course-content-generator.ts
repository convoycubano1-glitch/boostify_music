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
      summary: `This lesson covered ${lessonTitle}. Continue practicing and applying these concepts to advance your music industry career.`
    }
  };
}

export async function generateLessonContent(lessonTitle: string, lessonDescription: string): Promise<LessonContent> {
  try {
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      console.warn('OpenRouter API key not configured, using fallback content');
      return generateFallbackContent(lessonTitle, lessonDescription);
    }

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': `${window.location.origin}/`,
          'X-Title': 'Artist Boost'
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite-preview-02-05:free",
          messages: [
            {
              role: 'system',
              content: `Generate a lesson about ${lessonTitle}. Include introduction, key points, main content with subtitles and paragraphs, practical exercises, additional resources, and summary.`
            },
            {
              role: 'user',
              content: `Create a comprehensive lesson about: "${lessonTitle}" with this description: ${lessonDescription}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('API request failed, using fallback content');
        return generateFallbackContent(lessonTitle, lessonDescription);
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        console.warn('Invalid API response format, using fallback content');
        return generateFallbackContent(lessonTitle, lessonDescription);
      }

      try {
        const parsedContent = typeof data.choices[0].message.content === 'string'
          ? JSON.parse(data.choices[0].message.content)
          : data.choices[0].message.content;

        return lessonContentSchema.parse(parsedContent);
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