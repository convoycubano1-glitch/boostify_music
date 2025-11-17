import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { authenticate } from "../middleware/auth";

const router = Router();

// Initialize Gemini AI using Replit AI Integrations
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || '',
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || '',
  },
});

// Usage tracking helper
async function trackUsage(userId: number, feature: string) {
  // Track usage in stats (similar to Spotify tools)
  console.log(`User ${userId} used Instagram tool: ${feature}`);
}

// Caption Generator
router.post("/caption-generator", authenticate, async (req, res) => {
  try {
    const { postTopic, tone, targetAudience, includeEmojis, includeHashtags } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    if (!postTopic) {
      return res.status(400).json({ error: "Post topic is required" });
    }

    await trackUsage(userId, "caption_generator");

    const prompt = `As an Instagram marketing expert, generate 5 engaging Instagram captions for a post about: "${postTopic}"

Tone: ${tone || 'professional'}
Target Audience: ${targetAudience || 'general'}
Include Emojis: ${includeEmojis ? 'Yes' : 'No'}
Include Hashtags: ${includeHashtags ? 'Yes' : 'No'}

For each caption:
1. Make it engaging and authentic
2. Use appropriate emojis if requested
3. Include a call-to-action
4. Add 5-10 relevant hashtags at the end if requested
5. Keep it between 100-150 characters (excluding hashtags)

Return ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{
  "captions": [
    {
      "text": "Caption text here",
      "hashtags": ["hashtag1", "hashtag2"],
      "characterCount": 120,
      "engagementScore": 85
    }
  ]
}`;

    const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const responseText = result.text || "";
    
    // Clean response to extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from AI");
    }
    
    const captionData = JSON.parse(jsonMatch[0]);

    res.json({
      captions: captionData.captions || [],
      metadata: {
        topic: postTopic,
        tone,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("Caption generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate captions" });
  }
});

// Hashtag Generator
router.post("/hashtag-generator", authenticate, async (req, res) => {
  try {
    const { niche, contentType, targetSize } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    if (!niche) {
      return res.status(400).json({ error: "Niche is required" });
    }

    await trackUsage(userId, "hashtag_generator");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `As an Instagram growth expert, generate optimized hashtags for:

Niche: ${niche}
Content Type: ${contentType || 'general post'}
Target Audience Size: ${targetSize || 'mixed'}

Provide 3 sets of hashtags:
1. High-Competition (1M+ posts) - 5 hashtags
2. Medium-Competition (100K-1M posts) - 10 hashtags  
3. Low-Competition (<100K posts) - 15 hashtags

Also provide:
- Trending hashtags for this niche
- Branded hashtag suggestions
- Best practices for this niche

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "highCompetition": ["hashtag1", "hashtag2"],
  "mediumCompetition": ["hashtag1", "hashtag2"],
  "lowCompetition": ["hashtag1", "hashtag2"],
  "trending": ["hashtag1", "hashtag2"],
  "brandedSuggestions": ["hashtag1", "hashtag2"],
  "bestPractices": "Use a mix of all three sizes..."
}`;

    const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const responseText = result.text || "";
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from AI");
    }
    
    const hashtagData = JSON.parse(jsonMatch[0]);

    res.json({
      hashtags: hashtagData,
      metadata: {
        niche,
        contentType,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("Hashtag generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate hashtags" });
  }
});

// Content Ideas Generator
router.post("/content-ideas", authenticate, async (req, res) => {
  try {
    const { niche, goals, postingFrequency } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    if (!niche) {
      return res.status(400).json({ error: "Niche is required" });
    }

    await trackUsage(userId, "content_ideas");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `As an Instagram content strategist, generate 10 creative content ideas for:

Niche: ${niche}
Goals: ${goals || 'increase engagement and followers'}
Posting Frequency: ${postingFrequency || '5 times per week'}

For each idea provide:
1. Content type (Photo, Carousel, Reel, Story)
2. Topic/Theme
3. Brief description
4. Best time to post
5. Expected engagement level (low/medium/high)
6. Content format tips

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "ideas": [
    {
      "contentType": "Reel",
      "topic": "Topic name",
      "description": "Detailed description",
      "bestTimeToPost": "6-9 PM",
      "engagementLevel": "high",
      "formatTips": "Tips for creating this content"
    }
  ],
  "contentCalendar": {
    "monday": "Content type",
    "tuesday": "Content type",
    "wednesday": "Content type",
    "thursday": "Content type",
    "friday": "Content type"
  }
}`;

    const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const responseText = result.text || "";
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from AI");
    }
    
    const contentData = JSON.parse(jsonMatch[0]);

    res.json({
      ideas: contentData.ideas || [],
      contentCalendar: contentData.contentCalendar || {},
      metadata: {
        niche,
        goals,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("Content ideas error:", error);
    res.status(500).json({ error: error.message || "Failed to generate content ideas" });
  }
});

// Best Time Analyzer
router.post("/best-time-analyzer", authenticate, async (req, res) => {
  try {
    const { niche, targetAudience, timezone } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    if (!niche) {
      return res.status(400).json({ error: "Niche is required" });
    }

    await trackUsage(userId, "best_time_analyzer");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `As an Instagram analytics expert, analyze the best posting times for:

Niche: ${niche}
Target Audience: ${targetAudience || 'general'}
Timezone: ${timezone || 'UTC'}

Provide:
1. Best times for each day of the week
2. Peak engagement hours
3. Days to avoid posting
4. Reasoning for each recommendation
5. Content type specific timing (Reels vs Posts vs Stories)

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "bestTimes": {
    "monday": ["9:00 AM", "6:00 PM"],
    "tuesday": ["9:00 AM", "6:00 PM"],
    "wednesday": ["9:00 AM", "6:00 PM"],
    "thursday": ["9:00 AM", "6:00 PM"],
    "friday": ["9:00 AM", "6:00 PM"],
    "saturday": ["11:00 AM", "7:00 PM"],
    "sunday": ["11:00 AM", "7:00 PM"]
  },
  "peakHours": ["6:00 PM - 9:00 PM", "9:00 AM - 11:00 AM"],
  "avoidDays": [],
  "reasoning": "Explanation of why these times work...",
  "contentTypeTimings": {
    "reels": "Best posted at 7:00 PM",
    "posts": "Best posted at 9:00 AM",
    "stories": "Post throughout the day"
  }
}`;

    const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const responseText = result.text || "";
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from AI");
    }
    
    const timingData = JSON.parse(jsonMatch[0]);

    res.json({
      analysis: timingData,
      metadata: {
        niche,
        targetAudience,
        timezone,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("Best time analyzer error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze best times" });
  }
});

// Bio Optimizer
router.post("/bio-optimizer", authenticate, async (req, res) => {
  try {
    const { currentBio, niche, goals, websiteUrl } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    await trackUsage(userId, "bio_optimizer");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `As an Instagram profile optimization expert, optimize this Instagram bio:

Current Bio: ${currentBio || 'No bio provided'}
Niche: ${niche || 'Not specified'}
Goals: ${goals || 'Grow followers and engagement'}
Website: ${websiteUrl || 'None'}

Provide:
1. 3 optimized bio versions (short, medium, detailed)
2. Call-to-action suggestions
3. Emoji recommendations
4. Link-in-bio strategy
5. Profile optimization tips

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "optimizedBios": [
    {
      "version": "short",
      "bio": "Bio text here",
      "characterCount": 120,
      "keywords": ["keyword1", "keyword2"]
    },
    {
      "version": "medium",
      "bio": "Bio text here",
      "characterCount": 140,
      "keywords": ["keyword1", "keyword2"]
    },
    {
      "version": "detailed",
      "bio": "Bio text here",
      "characterCount": 150,
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "ctaSuggestions": ["CTA 1", "CTA 2"],
  "emojiRecommendations": ["✨", "🎵"],
  "linkStrategy": "Use link-in-bio tool to...",
  "profileTips": [
    "Tip 1",
    "Tip 2"
  ]
}`;

    const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const responseText = result.text || "";
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from AI");
    }
    
    const bioData = JSON.parse(jsonMatch[0]);

    res.json({
      optimization: bioData,
      metadata: {
        niche,
        goals,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("Bio optimizer error:", error);
    res.status(500).json({ error: error.message || "Failed to optimize bio" });
  }
});

// Usage Stats (similar to Spotify)
router.get("/usage-stats", authenticate, async (req, res) => {
  try {
    const userId = req.session?.user?.id || req.user?.id;

    // Mock stats for now - can be enhanced with DB tracking
    res.json({
      isAdmin: req.user?.email === 'convoycubano@gmail.com',
      remaining: {
        captionGenerator: 50,
        hashtagGenerator: 50,
        contentIdeas: 50,
        bestTimeAnalyzer: 50,
        bioOptimizer: 50
      },
      limits: {
        captionGenerator: 50,
        hashtagGenerator: 50,
        contentIdeas: 50,
        bestTimeAnalyzer: 50,
        bioOptimizer: 50
      }
    });
  } catch (error: any) {
    console.error("Usage stats error:", error);
    res.status(500).json({ error: "Failed to fetch usage stats" });
  }
});

export default router;
