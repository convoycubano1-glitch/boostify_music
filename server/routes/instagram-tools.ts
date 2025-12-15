import { Router } from "express";
import OpenAI from "openai";
import { authenticate } from "../middleware/auth";

const router = Router();

// Initialize OpenAI for text generation (migrated from Gemini)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Helper function to generate content with OpenAI
async function generateWithOpenAI(prompt: string, maxTokens: number = 1000): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    response_format: { type: 'json_object' }
  });
  return response.choices[0]?.message?.content || '';
}

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

    const responseText = await generateWithOpenAI(prompt, 1000);
    
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

    const responseText = await generateWithOpenAI(prompt, 1000);
    
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

    const responseText = await generateWithOpenAI(prompt, 1200);
    
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

    const responseText = await generateWithOpenAI(prompt, 800);
    
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

    const responseText = await generateWithOpenAI(prompt, 1000);
    
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

// Community - Get Content Calendar
router.get("/community/calendar", authenticate, async (req, res) => {
  try {
    const userId = req.session?.user?.id || req.user?.id;
    
    const contentItems = [
      { id: '1', title: 'Summer Collection Launch', type: 'reel', status: 'scheduled', date: new Date(Date.now() + 86400000) },
      { id: '2', title: 'Behind the Scenes', type: 'post', status: 'draft', date: new Date(Date.now() + 172800000) },
      { id: '3', title: 'Customer Testimonial', type: 'story', status: 'published', date: new Date(Date.now() - 86400000) },
      { id: '4', title: 'Product Showcase', type: 'post', status: 'scheduled', date: new Date(Date.now() + 259200000) },
      { id: '5', title: 'Live Q&A Session', type: 'reel', status: 'draft', date: new Date(Date.now() + 345600000) }
    ];
    
    res.json({ contentItems });
  } catch (error: any) {
    console.error("Calendar error:", error);
    res.status(500).json({ error: "Failed to fetch calendar" });
  }
});

// Community - Get Engagement Stats
router.get("/community/engagement", authenticate, async (req, res) => {
  try {
    const stats = {
      postsThisWeek: 12,
      engagementRate: 8.4,
      comments: 342,
      newFollowers: 156,
      pendingComments: 45,
      likesToday: 127,
      topPost: {
        title: 'Behind the Scenes',
        likes: 234,
        comments: 45,
        shares: 12
      }
    };
    
    res.json(stats);
  } catch (error: any) {
    console.error("Engagement error:", error);
    res.status(500).json({ error: "Failed to fetch engagement" });
  }
});

// Influencers - Search
router.post("/influencers/search", authenticate, async (req, res) => {
  try {
    const { query, niche } = req.body;
    
    const influencers = [
      { id: '1', name: 'Sarah Johnson', niche: 'Fashion & Lifestyle', followers: '125K', engagement: '8.2%', rating: 4.8, posts: 456 },
      { id: '2', name: 'Mike Stevens', niche: 'Tech & Gaming', followers: '89K', engagement: '6.5%', rating: 4.5, posts: 342 },
      { id: '3', name: 'Emma Davis', niche: 'Beauty & Makeup', followers: '210K', engagement: '9.1%', rating: 4.9, posts: 678 },
      { id: '4', name: 'Alex Rodriguez', niche: 'Fitness & Health', followers: '156K', engagement: '7.8%', rating: 4.6, posts: 523 },
      { id: '5', name: 'Lisa Chen', niche: 'Fashion & Lifestyle', followers: '98K', engagement: '8.9%', rating: 4.7, posts: 389 }
    ];
    
    let filtered = influencers;
    if (niche && niche !== 'all') {
      filtered = influencers.filter(inf => inf.niche.toLowerCase().includes(niche.toLowerCase()));
    }
    if (query) {
      filtered = filtered.filter(inf => inf.name.toLowerCase().includes(query.toLowerCase()));
    }
    
    res.json({ influencers: filtered });
  } catch (error: any) {
    console.error("Influencer search error:", error);
    res.status(500).json({ error: "Failed to search influencers" });
  }
});

// Influencers - Get Campaigns
router.get("/influencers/campaigns", authenticate, async (req, res) => {
  try {
    const campaigns = [
      { id: '1', name: 'Summer Collection 2024', influencers: 3, posts: 15, status: 'active', progress: 75, budget: 5000 },
      { id: '2', name: 'New Product Launch', influencers: 5, posts: 25, status: 'active', progress: 45, budget: 8000 },
      { id: '3', name: 'Brand Awareness Q1', influencers: 2, posts: 10, status: 'planning', progress: 20, budget: 3000 }
    ];
    
    const stats = {
      totalReach: '1.2M',
      engagement: '7.8%',
      roi: '+342%',
      totalSpend: '$8,000'
    };
    
    res.json({ campaigns, stats });
  } catch (error: any) {
    console.error("Campaigns error:", error);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// Strategies - Get Content Mix
router.get("/strategies/content-mix", authenticate, async (req, res) => {
  try {
    const contentMix = {
      entertainment: 40,
      education: 35,
      promotion: 25
    };
    
    const recommendation = {
      message: "Increase educational content by 5% for better engagement with your target audience.",
      suggestedMix: {
        entertainment: 38,
        education: 40,
        promotion: 22
      }
    };
    
    res.json({ contentMix, recommendation });
  } catch (error: any) {
    console.error("Content mix error:", error);
    res.status(500).json({ error: "Failed to fetch content mix" });
  }
});

// Strategies - Get Saved Hashtags
router.get("/strategies/hashtags", authenticate, async (req, res) => {
  try {
    const savedHashtags = ['fashion', 'style', 'ootd', 'fashionblogger', 'instafashion', 'trendy', 'streetstyle', 'lookbook'];
    
    const performingHashtags = [
      { tag: 'trending', growth: '+36%' },
      { tag: 'viral', growth: '+24%' },
      { tag: 'instagood', growth: '+12%' }
    ];
    
    res.json({ savedHashtags, performingHashtags });
  } catch (error: any) {
    console.error("Hashtags error:", error);
    res.status(500).json({ error: "Failed to fetch hashtags" });
  }
});

// Strategies - Get Optimal Times
router.get("/strategies/optimal-times", authenticate, async (req, res) => {
  try {
    const optimalTimes = {
      bestDays: ['Wednesday', 'Saturday'],
      bestHours: ['18:00', '14:00'],
      weeklySchedule: {
        monday: ['09:00', '14:00', '18:00'],
        tuesday: ['09:00', '14:00', '18:00'],
        wednesday: ['09:00', '14:00', '18:00'],
        thursday: ['09:00', '14:00', '18:00'],
        friday: ['09:00', '14:00', '18:00'],
        saturday: ['11:00', '14:00', '19:00'],
        sunday: ['11:00', '14:00', '19:00']
      }
    };
    
    res.json(optimalTimes);
  } catch (error: any) {
    console.error("Optimal times error:", error);
    res.status(500).json({ error: "Failed to fetch optimal times" });
  }
});

// Reports - Get Analytics Data
router.get("/reports/analytics", authenticate, async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    
    const engagementData = [
      { name: 'Mon', value: 420 },
      { name: 'Tue', value: 380 },
      { name: 'Wed', value: 450 },
      { name: 'Thu', value: 390 },
      { name: 'Fri', value: 520 },
      { name: 'Sat', value: 600 },
      { name: 'Sun', value: 480 }
    ];
    
    const metrics = {
      totalFollowers: '24.5K',
      engagementRate: '8.2%',
      reach: '156K',
      changes: {
        followers: '+12.3%',
        engagement: '+2.1%',
        reach: '+18.5%'
      }
    };
    
    const demographics = {
      age: [
        { range: '18-24', percentage: 42 },
        { range: '25-34', percentage: 35 },
        { range: '35-44', percentage: 15 },
        { range: '45+', percentage: 8 }
      ],
      locations: [
        { country: '🇺🇸 United States', percentage: 45 },
        { country: '🇬🇧 United Kingdom', percentage: 22 },
        { country: '🇨🇦 Canada', percentage: 15 },
        { country: '🇦🇺 Australia', percentage: 10 }
      ],
      gender: {
        female: 58,
        male: 42
      }
    };
    
    const topPosts = [
      { title: 'Summer Collection Launch', likes: 1234, comments: 89, shares: 45, type: 'reel' },
      { title: 'Behind the Scenes', likes: 987, comments: 67, shares: 32, type: 'post' },
      { title: 'Customer Testimonials', likes: 856, comments: 54, shares: 28, type: 'story' }
    ];
    
    res.json({ engagementData, metrics, demographics, topPosts });
  } catch (error: any) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
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
