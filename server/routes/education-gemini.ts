import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from "@google/genai";
import pLimit from 'p-limit';
import pRetry from 'p-retry';

const router = Router();

// Initialize Gemini with AI Integrations
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || 'dummy',
  httpOptions: {
    apiVersion: '',
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

// Helper to check rate limit errors
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

// Generate 20 varied courses with Gemini AI
router.post('/api/education/generate-20-courses', async (req: Request, res: Response) => {
  try {
    console.log('🎓 Starting generation of 20 varied music courses...');
    
    const limit = pLimit(2); // Process 2 courses concurrently
    const courseTopics = [
      'Music Production Fundamentals',
      'Mixing and Mastering Essentials',
      'Advanced Vocal Techniques',
      'Guitar Playing Mastery',
      'Digital Audio Workstations (DAWs)',
      'Music Theory for Composers',
      'Electronic Music Production',
      'Sound Design Techniques',
      'Music Business and Marketing',
      'Live Performance Skills',
      'Podcast Production',
      'Hip-Hop Production',
      'Jazz Improvisation',
      'Film Scoring and Soundtracks',
      'Songwriting Craft',
      'Studio Recording Techniques',
      'Music Video Production',
      'Music Licensing and Rights',
      'Music Promotion Strategies',
      'Orchestra Arrangement'
    ];

    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    const descriptions = [
      'Learn the fundamentals and master the basics',
      'Build on your existing knowledge',
      'Take your skills to professional level',
      'Discover advanced techniques and strategies',
      'Comprehensive guide for professionals',
      'Deep dive into specialized topics'
    ];

    // Generate 20 courses in parallel
    const coursePromises = courseTopics.map((topic, idx) =>
      limit(() =>
        pRetry(
          async () => {
            const level = levels[idx % 3];
            const description = descriptions[idx % descriptions.length];
            
            console.log(`Generating course ${idx + 1}/20: ${topic} (${level})`);
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Generate a JSON course structure for: "${topic}" - Level: ${level}. Include: title, description, preview (first 2 lessons only for preview), fullCurriculum (complete curriculum), objectives (3-4), topics (4-5), estimatedHours, skills (3-4), prerequisites, imagePrompt (detailed prompt for course thumbnail).`,
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    level: { type: Type.STRING },
                    preview: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          duration: { type: Type.STRING }
                        },
                        required: ['title', 'description', 'duration']
                      }
                    },
                    fullCurriculum: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          module: { type: Type.STRING },
                          lessons: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                duration: { type: Type.STRING },
                                content: { type: Type.STRING }
                              },
                              required: ['title', 'description', 'duration', 'content']
                            }
                          }
                        },
                        required: ['module', 'lessons']
                      }
                    },
                    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    estimatedHours: { type: Type.NUMBER },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
                    imagePrompt: { type: Type.STRING }
                  },
                  required: ['title', 'description', 'level', 'preview', 'fullCurriculum', 'objectives', 'topics', 'estimatedHours', 'skills', 'prerequisites', 'imagePrompt']
                }
              }
            });

            const courseData = JSON.parse(response.text || '{}');
            
            // Generate thumbnail image with Gemini 2.5 Flash Image (Nano Banana)
            let thumbnail = null;
            try {
              const imagePrompt = courseData.imagePrompt || `Professional music course thumbnail for ${topic}. Modern design with vibrant colors, musical elements, and text "${topic}". 16:9 aspect ratio.`;
              
              const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: [{ role: 'user', parts: [{ text: imagePrompt }] }],
                config: {
                  responseModalities: ['image'],
                }
              });

              const candidate = imageResponse.candidates?.[0];
              const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);
              if (imagePart?.inlineData?.data) {
                const mimeType = imagePart.inlineData.mimeType || 'image/png';
                thumbnail = `data:${mimeType};base64,${imagePart.inlineData.data}`;
              }
            } catch (imgError) {
              console.warn(`Could not generate image for ${topic}:`, imgError);
            }

            return {
              id: `course-${Date.now()}-${idx}`,
              ...courseData,
              thumbnail,
              price: '0.00',
              isPublished: true,
              createdAt: new Date().toISOString(),
              quiz: {
                questions: [
                  {
                    question: `What is the main objective of ${courseData.title}?`,
                    options: courseData.objectives.slice(0, 4),
                    correct: 0
                  },
                  {
                    question: `Which of the following is NOT a topic in this course?`,
                    options: [...courseData.topics.slice(0, 3), 'Unrelated Topic'],
                    correct: 3
                  }
                ]
              }
            };
          },
          {
            retries: 3,
            minTimeout: 2000,
            maxTimeout: 30000,
            factor: 2,
            onFailedAttempt: (error) => {
              console.warn(`Attempt failed for course generation: ${error.message}`);
            }
          }
        )
      )
    );

    const courses = await Promise.all(coursePromises);
    console.log(`✅ Generated ${courses.length} courses successfully`);
    
    res.json({
      success: true,
      count: courses.length,
      courses: courses.filter(c => c !== null)
    });
  } catch (error: any) {
    console.error('❌ Error generating courses:', error);
    res.status(500).json({
      error: 'Failed to generate courses',
      details: error.message
    });
  }
});

// Generate full course content on purchase
router.post('/api/education/generate-full-content', async (req: Request, res: Response) => {
  try {
    const { courseId, courseTitle, level } = req.body;
    
    if (!courseId || !courseTitle) {
      return res.status(400).json({ error: 'Course ID and title required' });
    }

    console.log(`📖 Generating full content for course: ${courseTitle}`);

    const response = await pRetry(
      async () => {
        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Generate complete course content for "${courseTitle}" (${level || 'Intermediate'} level). Include: detailed lessons with exercises, practical examples, code snippets, best practices, common mistakes to avoid, and a comprehensive final exam with 10 multiple choice questions.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                modules: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      lessons: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            exercises: { type: Type.ARRAY, items: { type: Type.STRING } },
                            examples: { type: Type.ARRAY, items: { type: Type.STRING } }
                          }
                        }
                      }
                    }
                  }
                },
                exam: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    questions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          question: { type: Type.STRING },
                          options: { type: Type.ARRAY, items: { type: Type.STRING } },
                          correct: { type: Type.NUMBER }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
        return result;
      },
      {
        retries: 3,
        minTimeout: 2000,
        maxTimeout: 30000
      }
    );

    const content = JSON.parse(response.text || '{}');
    console.log(`✅ Full content generated for ${courseTitle}`);
    
    res.json({
      success: true,
      content,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error generating full content:', error);
    res.status(500).json({
      error: 'Failed to generate full content',
      details: error.message
    });
  }
});

export default router;
