import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from "@google/genai";

const router = Router();

// Initialize Gemini with AI Integrations
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || 'dummy',
  httpOptions: {
    apiVersion: '',
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

// Simple retry helper without external dependencies
async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Simple concurrency limiter without external dependencies
async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = Promise.resolve().then(task).then(result => {
      results[tasks.indexOf(task)] = result;
    });
    
    executing.push(promise);
    
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

// Generate 20 varied courses with Gemini AI
router.post('/api/education/generate-20-courses', async (req: Request, res: Response) => {
  try {
    console.log('🎓 Starting generation of 20 varied music courses...');
    
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

    // Generate 20 courses in parallel with concurrency limit of 2
    const courseGenerators = courseTopics.map((topic, idx) => async () => {
      const level = levels[idx % 3];
      const description = descriptions[idx % descriptions.length];
      
      console.log(`Generating course ${idx + 1}/20: ${topic} (${level})`);
      
      return await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Generate a JSON course structure for: "${topic}" - Level: ${level}. Include: title, description, preview (first 2 lessons only), fullCurriculum (complete), objectives (3-4), topics (4-5), estimatedHours, skills (3-4), prerequisites, imagePrompt.`,
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
      });
    });

    const courses = await withConcurrencyLimit(courseGenerators, 2);
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

    const content = await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
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

      return JSON.parse(response.text || '{}');
    }, 3, 2000);

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
