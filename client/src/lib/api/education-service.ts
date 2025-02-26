import { getAuthToken } from "@/lib/auth";

interface CourseContent {
  overview: string;
  objectives: string[];
  curriculum: {
    title: string;
    description: string;
    estimatedMinutes: number;
  }[];
  topics: string[];
  assignments: string[];
  applications: string[];
}

/**
 * Creates fallback course content when API calls fail
 */
function createFallbackCourseContent(prompt: string): CourseContent {
  console.log("Creating fallback course content from prompt:", prompt.substring(0, 100) + "...");
  
  // Extract course title and category from the prompt if possible
  const titleMatch = prompt.match(/Title: "([^"]+)"/i);
  const descriptionMatch = prompt.match(/Description: "([^"]+)"/i);
  const levelMatch = prompt.match(/Level: ([A-Za-z]+)/i);
  const categoryMatch = prompt.match(/Category: ([A-Za-z]+)/i);
  
  const title = titleMatch ? titleMatch[1] : "Music Course";
  const description = descriptionMatch ? descriptionMatch[1] : "Comprehensive music industry course";
  const level = levelMatch ? levelMatch[1] : "Intermediate";
  const category = categoryMatch ? categoryMatch[1] : "Music";
  
  // Create modular structure based on extracted information
  return {
    overview: `A comprehensive ${level.toLowerCase()} level course focusing on ${category.toLowerCase()} in the music industry. ${description}`,
    objectives: [
      `Understand key concepts and principles in ${category}`,
      `Develop practical skills through guided exercises and hands-on projects`,
      `Learn industry best practices and professional techniques for ${category.toLowerCase()}`,
      `Build a professional portfolio demonstrating your ${category.toLowerCase()} skills`
    ],
    curriculum: [
      {
        title: `Introduction to ${title}`,
        description: "A comprehensive introduction to the key concepts covered in this course.",
        estimatedMinutes: 45
      },
      {
        title: `${category} Fundamentals`,
        description: "Master the essential building blocks necessary for success.",
        estimatedMinutes: 60
      },
      {
        title: "Practical Applications",
        description: `Apply your ${category.toLowerCase()} knowledge to real-world scenarios and projects.`,
        estimatedMinutes: 90
      },
      {
        title: `Advanced ${category} Techniques`,
        description: "Take your skills to the next level with advanced concepts and methods.",
        estimatedMinutes: 75
      },
      {
        title: "Professional Development",
        description: `Prepare for success in the ${category.toLowerCase()} industry with career-focused strategies.`,
        estimatedMinutes: 60
      },
      {
        title: "Industry Integration",
        description: "Learn how to position your skills in the current music industry landscape.",
        estimatedMinutes: 90
      },
      {
        title: "Final Project",
        description: "Apply everything you've learned to create a professional portfolio piece.",
        estimatedMinutes: 120
      }
    ],
    topics: [`${category} Fundamentals`, "Best Practices", "Technical Skills", "Industry Standards", "Career Growth", "Portfolio Development"],
    assignments: ["Concept Development", "Technical Exercise", "Research Project", "Creative Application", "Final Portfolio"],
    applications: ["Professional Portfolio Development", `${category} Industry Implementation`, "Creative Collaboration", "Career Advancement"]
  };
}

/**
 * Generate course content using the OpenRouter API with the server API key
 * This calls our backend endpoint which handles the API key securely
 */
export async function generateCourseContent(prompt: string): Promise<CourseContent> {
  try {
    console.log("Starting course content generation with backend OpenRouter API...");
    
    // First, try to get the course content from the backend
    const token = await getAuthToken();
    const response = await fetch("/api/education/generate-course", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Error from backend course generation:", error);
      throw new Error(`Error from backend course generation: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Successfully generated course content from backend:", data);
    return data;
    
  } catch (error) {
    console.error("Course generation error:", error);
    console.log("Using fallback course content generation due to error");
    return createFallbackCourseContent(prompt);
  }
}

/**
 * Direct API call to OpenRouter for course generation
 * This is a fallback in case the backend route isn't implemented yet
 */
export async function generateCourseContentDirect(prompt: string): Promise<CourseContent> {
  try {
    console.log("Starting direct course content generation with OpenRouter...");

    // Get the OPENROUTER_API_KEY from the environment
    // We'll fetch this from the server to keep it secure
    const apiKeyResponse = await fetch("/api/get-openrouter-key");
    if (!apiKeyResponse.ok) {
      throw new Error("Could not retrieve OpenRouter API key");
    }
    
    const { key } = await apiKeyResponse.json();
    if (!key) {
      throw new Error("Invalid or missing OpenRouter API key");
    }

    // Prepare the correct headers for OpenRouter
    const headers = {
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": window.location.origin || "https://boostify.music.app",
      "X-Title": "Boostify Music Education",
      "Content-Type": "application/json"
    };
    
    // Use the Gemini 2.0 Flash model as requested
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
        messages: [
          {
            role: "system",
            content: `You are a JSON generator for music education courses. You MUST return a valid JSON object with this EXACT structure:
{
  "overview": "course overview text",
  "objectives": ["objective1", "objective2", "objective3"],
  "curriculum": [
    {
      "title": "lesson title",
      "description": "lesson description",
      "estimatedMinutes": 60
    }
  ],
  "topics": ["topic1", "topic2", "topic3"],
  "assignments": ["assignment1", "assignment2"],
  "applications": ["application1", "application2"]
}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error("Invalid API response structure");
    }

    // Extract the content from the response
    const content = data.choices[0].message?.content;
    if (!content) {
      throw new Error("No content in API response");
    }

    // Parse the JSON content
    const parsed = JSON.parse(content);
    
    // Validate and ensure the structure is correct
    const validatedContent: CourseContent = {
      overview: typeof parsed.overview === 'string' 
        ? parsed.overview 
        : "A comprehensive course designed to help you succeed in the music industry.",
        
      objectives: Array.isArray(parsed.objectives) && parsed.objectives.length > 0
        ? parsed.objectives
        : ["Learn key concepts", "Develop practical skills", "Master industry techniques"],
        
      curriculum: Array.isArray(parsed.curriculum) && parsed.curriculum.length > 0
        ? parsed.curriculum.map((lesson: any) => ({
            title: lesson.title || "Untitled Lesson",
            description: lesson.description || "No description provided",
            estimatedMinutes: typeof lesson.estimatedMinutes === 'number' ? 
                              lesson.estimatedMinutes : 
                              (parseInt(String(lesson.estimatedMinutes)) || 60)
          }))
        : [
            { title: "Introduction", description: "Course introduction", estimatedMinutes: 45 },
            { title: "Fundamentals", description: "Core concepts", estimatedMinutes: 60 },
            { title: "Practical Applications", description: "Hands-on learning", estimatedMinutes: 90 }
          ],
          
      topics: Array.isArray(parsed.topics) && parsed.topics.length > 0
        ? parsed.topics
        : ["Fundamentals", "Best Practices", "Professional Techniques", "Industry Standards"],
        
      assignments: Array.isArray(parsed.assignments) && parsed.assignments.length > 0
        ? parsed.assignments
        : ["Practice Exercise", "Case Study Analysis", "Final Project"],
        
      applications: Array.isArray(parsed.applications) && parsed.applications.length > 0
        ? parsed.applications
        : ["Professional Portfolio Development", "Industry Implementation"]
    };
    
    return validatedContent;
  } catch (error) {
    console.error("Direct course generation error:", error);
    return createFallbackCourseContent(prompt);
  }
}