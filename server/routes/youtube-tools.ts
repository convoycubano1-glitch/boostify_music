/**
 * YouTube Growth Tools - Backend Endpoints
 * Powered by Gemini AI (Nano Banana) + Apify Scraping
 * 
 * Features:
 * - Pre-Launch Score: Predict video success before publishing
 * - Keywords Generator: AI-powered keyword research
 * - Title Analyzer: Score and optimize video titles
 * - Content Ideas: Discover content gaps and opportunities
 */

import { Router, Request, Response } from 'express';
import { ApifyClient } from 'apify-client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticate } from '../middleware/auth';
import { db as firebaseDb } from '../firebase';

const router = Router();

// Initialize Apify Client
const getApifyClient = () => {
  return new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
  });
};

// Initialize Gemini AI (Nano Banana)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Subscription limits per plan
const PLAN_LIMITS = {
  free: {
    preLaunchScore: 5,
    keywords: 5,
    titleAnalyzer: 5,
    contentIdeas: 0
  },
  basic: {
    preLaunchScore: 20,
    keywords: 50,
    titleAnalyzer: 20,
    contentIdeas: 20
  },
  pro: {
    preLaunchScore: 100,
    keywords: 100,
    titleAnalyzer: 100,
    contentIdeas: 50
  },
  premium: {
    preLaunchScore: -1, // unlimited
    keywords: -1,
    titleAnalyzer: -1,
    contentIdeas: -1
  }
};

/**
 * Check user's usage limits for a specific feature
 */
async function checkUsageLimit(
  userId: string, 
  feature: string, 
  userPlan: string = 'free'
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get usage count for today
    const usageRef = firebaseDb.collection('youtube_tool_usage');
    const snapshot = await usageRef
      .where('userId', '==', userId)
      .where('feature', '==', feature)
      .where('timestamp', '>=', today)
      .get();
    
    const usedToday = snapshot.size;
    const limit = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]?.[feature as keyof typeof PLAN_LIMITS.free] || 0;
    
    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, remaining: -1, limit: -1 };
    }
    
    const remaining = Math.max(0, limit - usedToday);
    
    return {
      allowed: remaining > 0,
      remaining,
      limit
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { allowed: false, remaining: 0, limit: 0 };
  }
}

/**
 * Log feature usage
 */
async function logUsage(userId: string, feature: string, metadata?: any): Promise<void> {
  try {
    await firebaseDb.collection('youtube_tool_usage').add({
      userId,
      feature,
      timestamp: new Date(),
      metadata: metadata || {}
    });
  } catch (error) {
    console.error('Error logging usage:', error);
  }
}

/**
 * 1. PRE-LAUNCH SCORE
 * Analyzes video concept and predicts success score (0-100)
 * 
 * Process:
 * 1. Scrape top 20 videos in niche using Apify
 * 2. Analyze patterns with Gemini AI
 * 3. Compare user's video concept
 * 4. Generate predictive score
 */
router.post('/pre-launch-score', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { title, description, keywords, niche } = req.body;
    
    if (!title || !niche) {
      return res.status(400).json({ error: 'Title and niche are required' });
    }
    
    // Check usage limits
    const userDoc = await firebaseDb.collection('users').doc(userId).get();
    const userPlan = userDoc.data()?.subscriptionTier || 'free';
    
    const usageCheck = await checkUsageLimit(userId, 'preLaunchScore', userPlan);
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'Usage limit reached',
        limit: usageCheck.limit,
        remaining: 0
      });
    }
    
    console.log(`🎯 [PRE-LAUNCH] Analyzing video concept for niche: ${niche}`);
    
    // Step 1: Scrape top videos in niche using Apify
    const apifyClient = getApifyClient();
    
    const input = {
      searchQueries: [niche],
      maxResults: 20,
      resultsPerPage: 20
    };
    
    console.log('📡 Scraping YouTube with Apify...');
    const run = await apifyClient.actor('streamers/youtube-scraper').call(input);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    console.log(`✅ Scraped ${items.length} videos from YouTube`);
    
    // Step 2: Analyze with Gemini AI
    const competitorData = items.slice(0, 10).map((item: any) => ({
      title: item.title,
      views: item.viewCount,
      likes: item.likeCount,
      publishedAt: item.publishedAt
    }));
    
    const prompt = `You are a YouTube growth expert. Analyze this video concept and predict its success.

USER'S VIDEO CONCEPT:
Title: "${title}"
Description: "${description || 'Not provided'}"
Keywords: "${keywords || 'Not provided'}"
Niche: "${niche}"

TOP PERFORMING VIDEOS IN NICHE:
${JSON.stringify(competitorData, null, 2)}

TASK:
1. Analyze the user's concept vs successful videos
2. Identify strengths and weaknesses
3. Predict success score (0-100)
4. Provide specific recommendations

Return JSON:
{
  "score": number (0-100),
  "prediction": "description of likely performance",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "estimatedViews": {
    "7days": number,
    "30days": number
  }
}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      score: 50,
      prediction: "Unable to analyze",
      strengths: [],
      weaknesses: [],
      recommendations: [],
      estimatedViews: { "7days": 0, "30days": 0 }
    };
    
    // Log usage
    await logUsage(userId, 'preLaunchScore', { title, niche, score: analysis.score });
    
    console.log(`✅ Pre-Launch Score: ${analysis.score}/100`);
    
    return res.json({
      success: true,
      score: analysis.score,
      prediction: analysis.prediction,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendations: analysis.recommendations,
      estimatedViews: analysis.estimatedViews,
      competitorsSampled: items.length,
      remaining: usageCheck.remaining - 1
    });
    
  } catch (error) {
    console.error('Error in pre-launch score:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze video concept',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 2. KEYWORDS GENERATOR
 * Generates optimized keywords based on niche and trending data
 * 
 * Process:
 * 1. Scrape trending videos in niche
 * 2. Extract tags and keywords
 * 3. Use Gemini AI to generate optimized keywords
 * 4. Return with difficulty scores
 */
router.post('/generate-keywords', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { topic, niche } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    // Check usage limits
    const userDoc = await firebaseDb.collection('users').doc(userId).get();
    const userPlan = userDoc.data()?.subscriptionTier || 'free';
    
    const usageCheck = await checkUsageLimit(userId, 'keywords', userPlan);
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'Usage limit reached',
        limit: usageCheck.limit,
        remaining: 0
      });
    }
    
    console.log(`🔑 [KEYWORDS] Generating keywords for: ${topic}`);
    
    // Step 1: Scrape trending videos
    const apifyClient = getApifyClient();
    
    const input = {
      searchQueries: [topic, niche || topic].filter(Boolean),
      maxResults: 15,
      resultsPerPage: 15
    };
    
    console.log('📡 Scraping trending videos...');
    const run = await apifyClient.actor('streamers/youtube-scraper').call(input);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    // Extract tags from videos
    const allTags = items.flatMap((item: any) => item.keywords || []);
    const uniqueTags = [...new Set(allTags)].slice(0, 50);
    
    console.log(`✅ Found ${uniqueTags.length} unique tags from trending videos`);
    
    // Step 2: Generate optimized keywords with Gemini AI
    const prompt = `You are a YouTube SEO expert. Generate optimized keywords for this topic.

TOPIC: "${topic}"
NICHE: "${niche || 'General'}"

TRENDING TAGS IN NICHE:
${uniqueTags.join(', ')}

TASK:
Generate 15-20 optimized keywords that:
1. Are relevant to the topic
2. Have good search volume potential
3. Mix of high and low competition
4. Include long-tail variations

For each keyword, estimate:
- difficulty (easy/medium/hard)
- relevance (1-10)
- estimated monthly searches

Return JSON:
{
  "keywords": [
    {
      "keyword": "keyword phrase",
      "difficulty": "easy|medium|hard",
      "relevance": number (1-10),
      "estimatedSearches": number,
      "competition": "low|medium|high"
    }
  ]
}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const keywordData = jsonMatch ? JSON.parse(jsonMatch[0]) : { keywords: [] };
    
    // Log usage
    await logUsage(userId, 'keywords', { topic, count: keywordData.keywords.length });
    
    console.log(`✅ Generated ${keywordData.keywords.length} keywords`);
    
    return res.json({
      success: true,
      keywords: keywordData.keywords,
      trendingTags: uniqueTags.slice(0, 20),
      remaining: usageCheck.remaining - 1
    });
    
  } catch (error) {
    console.error('Error generating keywords:', error);
    return res.status(500).json({ 
      error: 'Failed to generate keywords',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 3. TITLE ANALYZER
 * Analyzes video title and provides score + optimization suggestions
 * 
 * Process:
 * 1. Scrape top performing titles in niche
 * 2. Use Gemini AI to analyze patterns
 * 3. Score user's title
 * 4. Suggest improvements
 */
router.post('/analyze-title', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { title, niche } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Check usage limits
    const userDoc = await firebaseDb.collection('users').doc(userId).get();
    const userPlan = userDoc.data()?.subscriptionTier || 'free';
    
    const usageCheck = await checkUsageLimit(userId, 'titleAnalyzer', userPlan);
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'Usage limit reached',
        limit: usageCheck.limit,
        remaining: 0
      });
    }
    
    console.log(`📝 [TITLE ANALYZER] Analyzing: "${title}"`);
    
    // Scrape top titles if niche provided
    let competitorTitles: string[] = [];
    if (niche) {
      const apifyClient = getApifyClient();
      const input = {
        searchQueries: [niche],
        maxResults: 10,
        resultsPerPage: 10
      };
      
      const run = await apifyClient.actor('streamers/youtube-scraper').call(input);
      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      
      competitorTitles = items.map((item: any) => item.title).filter(Boolean);
    }
    
    // Analyze with Gemini AI
    const prompt = `You are a YouTube title optimization expert. Analyze this video title.

USER'S TITLE: "${title}"
${niche ? `NICHE: "${niche}"` : ''}

${competitorTitles.length > 0 ? `TOP PERFORMING TITLES IN NICHE:\n${competitorTitles.join('\n')}` : ''}

TASK:
Analyze the title for:
1. Click-Through Rate (CTR) potential
2. SEO optimization
3. Emotional appeal
4. Clarity and conciseness
5. Use of power words
6. Length (ideal 50-70 characters)

Return JSON:
{
  "score": number (0-100),
  "ctrScore": number (0-100),
  "seoScore": number (0-100),
  "emotionalScore": number (0-100),
  "strengths": ["strength 1", "strength 2"],
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "improvedTitles": ["alternative 1", "alternative 2", "alternative 3"]
}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      score: 50,
      ctrScore: 50,
      seoScore: 50,
      emotionalScore: 50,
      strengths: [],
      issues: [],
      suggestions: [],
      improvedTitles: []
    };
    
    // Log usage
    await logUsage(userId, 'titleAnalyzer', { title, score: analysis.score });
    
    console.log(`✅ Title Score: ${analysis.score}/100`);
    
    return res.json({
      success: true,
      ...analysis,
      titleLength: title.length,
      remaining: usageCheck.remaining - 1
    });
    
  } catch (error) {
    console.error('Error analyzing title:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze title',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 4. CONTENT IDEAS GENERATOR
 * Discovers content gaps and generates video ideas with demand
 * 
 * Process:
 * 1. Scrape top videos in niche
 * 2. Analyze comments for unanswered questions
 * 3. Use Gemini AI to identify content gaps
 * 4. Generate actionable video ideas
 */
router.post('/content-ideas', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { niche, count = 5 } = req.body;
    
    if (!niche) {
      return res.status(400).json({ error: 'Niche is required' });
    }
    
    // Check usage limits
    const userDoc = await firebaseDb.collection('users').doc(userId).get();
    const userPlan = userDoc.data()?.subscriptionTier || 'free';
    
    const usageCheck = await checkUsageLimit(userId, 'contentIdeas', userPlan);
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'Usage limit reached',
        limit: usageCheck.limit,
        remaining: 0
      });
    }
    
    console.log(`💡 [CONTENT IDEAS] Generating ideas for niche: ${niche}`);
    
    // Step 1: Scrape videos in niche
    const apifyClient = getApifyClient();
    
    const input = {
      searchQueries: [niche],
      maxResults: 20,
      resultsPerPage: 20
    };
    
    const run = await apifyClient.actor('streamers/youtube-scraper').call(input);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    // Extract video data
    const videoData = items.map((item: any) => ({
      title: item.title,
      views: item.viewCount,
      description: item.description?.substring(0, 200)
    }));
    
    console.log(`✅ Analyzed ${videoData.length} videos`);
    
    // Step 2: Use Gemini AI to identify gaps and generate ideas
    const prompt = `You are a YouTube content strategist. Analyze this niche and generate high-potential video ideas.

NICHE: "${niche}"

EXISTING POPULAR VIDEOS:
${JSON.stringify(videoData.slice(0, 10), null, 2)}

TASK:
1. Identify content gaps (topics with demand but few quality videos)
2. Find trending subtopics within the niche
3. Generate ${count} video ideas with:
   - High demand potential
   - Low-medium competition
   - Clear value proposition

For each idea, provide:
- Title (optimized for CTR)
- Description (what the video should cover)
- Target audience
- Estimated difficulty
- Keywords to target

Return JSON:
{
  "contentGaps": ["gap 1", "gap 2", "gap 3"],
  "trendingSubtopics": ["subtopic 1", "subtopic 2"],
  "videoIdeas": [
    {
      "title": "Compelling video title",
      "description": "What this video should cover",
      "targetAudience": "Who this is for",
      "difficulty": "easy|medium|hard",
      "estimatedViews": number,
      "keywords": ["keyword1", "keyword2"],
      "hook": "Opening hook suggestion"
    }
  ]
}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      contentGaps: [],
      trendingSubtopics: [],
      videoIdeas: []
    };
    
    // Log usage
    await logUsage(userId, 'contentIdeas', { niche, count: ideas.videoIdeas.length });
    
    console.log(`✅ Generated ${ideas.videoIdeas.length} content ideas`);
    
    return res.json({
      success: true,
      ...ideas,
      videosAnalyzed: items.length,
      remaining: usageCheck.remaining - 1
    });
    
  } catch (error) {
    console.error('Error generating content ideas:', error);
    return res.status(500).json({ 
      error: 'Failed to generate content ideas',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get user's current usage stats
 */
router.get('/usage-stats', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userDoc = await firebaseDb.collection('users').doc(userId).get();
    const userPlan = userDoc.data()?.subscriptionTier || 'free';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const features = ['preLaunchScore', 'keywords', 'titleAnalyzer', 'contentIdeas'];
    const stats: any = {};
    
    for (const feature of features) {
      const usageRef = firebaseDb.collection('youtube_tool_usage');
      const snapshot = await usageRef
        .where('userId', '==', userId)
        .where('feature', '==', feature)
        .where('timestamp', '>=', today)
        .get();
      
      const used = snapshot.size;
      const limit = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]?.[feature as keyof typeof PLAN_LIMITS.free] || 0;
      const remaining = limit === -1 ? -1 : Math.max(0, limit - used);
      
      stats[feature] = {
        used,
        limit,
        remaining,
        unlimited: limit === -1
      };
    }
    
    return res.json({
      success: true,
      plan: userPlan,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch usage stats'
    });
  }
});

export default router;
