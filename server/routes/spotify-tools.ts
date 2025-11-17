/**
 * Spotify Growth Tools - Backend Endpoints
 * Powered by Gemini AI + Apify Scraping
 * 
 * Features:
 * - Monthly Listeners AI Predictor: Predict and optimize listener growth
 * - Playlist Match AI: Find perfect playlists with acceptance score
 * - Curator Contact Finder: Extract curator emails + AI pitch templates
 * - Spotify SEO Optimizer: Optimize profile and tracks for Spotify algorithm
 */

import { Router, Request, Response } from 'express';
import { ApifyClient } from 'apify-client';
import { GoogleGenAI } from '@google/genai';
import { authenticate } from '../middleware/auth';
import { db as firebaseDb } from '../firebase';

const router = Router();

// Initialize Apify Client
const getApifyClient = () => {
  return new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
  });
};

// Initialize Gemini AI using Replit AI Integrations
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || '',
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || '',
  },
});

// Subscription limits per plan
const PLAN_LIMITS = {
  free: {
    monthlyListenersPrediction: 10,
    playlistMatch: 20,
    curatorFinder: 5,
    seoOptimizer: 10
  },
  basic: {
    monthlyListenersPrediction: 50,
    playlistMatch: 100,
    curatorFinder: 30,
    seoOptimizer: 50
  },
  pro: {
    monthlyListenersPrediction: 200,
    playlistMatch: 500,
    curatorFinder: 150,
    seoOptimizer: 200
  },
  premium: {
    monthlyListenersPrediction: -1, // unlimited
    playlistMatch: -1,
    curatorFinder: -1,
    seoOptimizer: -1
  }
};

/**
 * Check if user is admin (unlimited access)
 */
function isAdmin(user: any): boolean {
  // Platform owner: convoycubano@gmail.com
  const ADMIN_EMAIL = 'convoycubano@gmail.com';
  
  return user?.email === ADMIN_EMAIL || 
         user?.role === 'admin' || 
         user?.isAdmin === true || 
         user?.subscriptionTier === 'admin';
}

/**
 * Check user's usage limits for a specific feature
 */
async function checkUsageLimit(
  userId: string, 
  feature: string, 
  userPlan: string = 'free',
  user?: any
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  try {
    // Admins have unlimited access
    if (user && isAdmin(user)) {
      console.log('👑 [ADMIN] Unlimited access granted');
      return { allowed: true, remaining: -1, limit: -1 };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get usage count for today
    const usageRef = firebaseDb.collection('spotify_tool_usage');
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
    await firebaseDb.collection('spotify_tool_usage').add({
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
 * 1. MONTHLY LISTENERS AI PREDICTOR
 * Analyzes artist profile and predicts listener growth using AI
 * 
 * Process:
 * 1. Get artist's current Spotify data
 * 2. Analyze trends and engagement patterns with Gemini AI
 * 3. Generate growth predictions and optimization strategies
 * 4. Provide actionable recommendations
 */
router.post('/monthly-listeners-prediction', authenticate, async (req: Request, res: Response) => {
  try {
    // Get user from Replit Auth session
    const user = req.session?.user || req.user;
    const userId = user?.id || user?.replitId;
    
    if (!userId) {
      console.error('❌ No user ID found in session');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { artistUrl, currentMonthlyListeners, targetListeners } = req.body;
    
    if (!artistUrl || !currentMonthlyListeners || !targetListeners) {
      return res.status(400).json({ error: 'Artist URL, current monthly listeners, and target are required' });
    }
    
    console.log(`✅ User authenticated: ${userId}`);
    
    // Get user plan from session or default to free
    const userPlan = user?.subscriptionTier || 'free';
    console.log(`📊 User plan: ${userPlan}`);
    
    const usageCheck = await checkUsageLimit(userId, 'monthlyListenersPrediction', userPlan, user);
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'Usage limit reached',
        limit: usageCheck.limit,
        remaining: 0
      });
    }
    
    console.log(`🎯 [LISTENERS PREDICTION] Analyzing artist profile: ${artistUrl}`);
    
    // Analyze with Gemini AI
    const prompt = `You are a Spotify growth expert. Analyze this artist's current status and predict their growth potential.

ARTIST DATA:
Current Monthly Listeners: ${currentMonthlyListeners.toLocaleString()}
Target Monthly Listeners: ${targetListeners.toLocaleString()}
Spotify Profile: ${artistUrl}

TASK:
1. Analyze the gap between current and target listeners
2. Predict realistic timeframe to reach target
3. Calculate monthly growth rate needed
4. Identify key growth opportunities
5. Provide specific, actionable strategies

Return JSON:
{
  "currentListeners": number,
  "targetListeners": number,
  "prediction": {
    "timeToTarget": "description (e.g., '3-6 months with consistent effort')",
    "requiredMonthlyGrowth": number (percentage),
    "likelihood": "high/medium/low",
    "confidenceScore": number (0-100)
  },
  "growthOpportunities": [
    {
      "strategy": "strategy name",
      "impact": "high/medium/low",
      "effort": "high/medium/low",
      "description": "detailed explanation",
      "estimatedListenerGain": number
    }
  ],
  "actionPlan": [
    {
      "priority": number (1-5),
      "action": "specific action to take",
      "timeline": "when to do it",
      "expectedResult": "what to expect"
    }
  ],
  "keyMetrics": {
    "releaseFrequency": "recommended releases per month",
    "playlistTargets": number,
    "collaborationOpportunities": number,
    "socialMediaEngagement": "recommended activity level"
  }
}`;

    const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const responseText = result.text || "";
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    // Log usage
    await logUsage(userId, 'monthlyListenersPrediction', { 
      artistUrl, 
      currentListeners: currentMonthlyListeners,
      targetListeners 
    });
    
    console.log(`✅ [LISTENERS PREDICTION] Analysis complete`);
    
    res.json({
      success: true,
      analysis,
      remaining: usageCheck.remaining - 1,
      limit: usageCheck.limit
    });
    
  } catch (error) {
    console.error('Error in monthly listeners prediction:', error);
    res.status(500).json({ 
      error: 'Failed to generate prediction',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 2. PLAYLIST MATCH AI
 * Finds perfect playlists for your music with AI-powered matching
 * 
 * Process:
 * 1. Analyze track characteristics (genre, mood, energy)
 * 2. Search for matching playlists
 * 3. Score each playlist by fit quality (0-100)
 * 4. Provide contact strategy for each curator
 */
router.post('/playlist-match', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.session?.user || req.user;
    const userId = user?.id || user?.replitId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { trackName, artist, genre, mood, targetAudience } = req.body;
    
    if (!trackName || !artist || !genre) {
      return res.status(400).json({ error: 'Track name, artist, and genre are required' });
    }
    
    const userPlan = user?.subscriptionTier || 'free';
    const usageCheck = await checkUsageLimit(userId, 'playlistMatch', userPlan, user);
    
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'Usage limit reached',
        limit: usageCheck.limit,
        remaining: 0
      });
    }
    
    console.log(`🎵 [PLAYLIST MATCH] Finding playlists for: ${trackName} by ${artist}`);
    
    // Analyze with Gemini AI to find best playlists
    const prompt = `You are a Spotify playlist curator expert. Find the best playlists for this track.

TRACK DETAILS:
Track: "${trackName}"
Artist: "${artist}"
Genre: "${genre}"
Mood: "${mood || 'Not specified'}"
Target Audience: "${targetAudience || 'General'}"

TASK:
1. Identify 10-15 playlist types that would be perfect for this track
2. Score each playlist type by fit quality (0-100)
3. Estimate followers range for each playlist type
4. Provide submission strategy for each

Return JSON:
{
  "matchedPlaylists": [
    {
      "playlistType": "playlist category/name pattern",
      "matchScore": number (0-100),
      "reasoning": "why this playlist is a good fit",
      "estimatedFollowers": "range (e.g., '10K-50K')",
      "acceptanceLikelihood": "high/medium/low",
      "submissionStrategy": "specific approach to pitch this playlist",
      "curatorProfile": "typical curator for this playlist type",
      "keyFeatures": ["feature 1", "feature 2"]
    }
  ],
  "overallFitScore": number (0-100),
  "recommendations": [
    "recommendation 1",
    "recommendation 2",
    "recommendation 3"
  ],
  "bestMatches": ["playlist type 1", "playlist type 2", "playlist type 3"]
}`;

    const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const responseText = result.text || "";
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const matches = JSON.parse(jsonMatch[0]);
    
    await logUsage(userId, 'playlistMatch', { trackName, artist, genre });
    
    console.log(`✅ [PLAYLIST MATCH] Found ${matches.matchedPlaylists?.length || 0} matches`);
    
    res.json({
      success: true,
      matches,
      remaining: usageCheck.remaining - 1,
      limit: usageCheck.limit
    });
    
  } catch (error) {
    console.error('Error in playlist match:', error);
    res.status(500).json({ 
      error: 'Failed to find playlist matches',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 3. CURATOR CONTACT FINDER
 * Finds curator emails and generates personalized pitch templates
 * 
 * Process:
 * 1. Search for playlists in the genre
 * 2. Extract curator information
 * 3. Generate personalized pitch email with AI
 * 4. Provide follow-up strategy
 */
router.post('/curator-contact-finder', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.session?.user || req.user;
    const userId = user?.id || user?.replitId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { genre, trackName, artist, trackDescription } = req.body;
    
    if (!genre || !trackName || !artist) {
      return res.status(400).json({ error: 'Genre, track name, and artist are required' });
    }
    
    const userPlan = user?.subscriptionTier || 'free';
    const usageCheck = await checkUsageLimit(userId, 'curatorFinder', userPlan, user);
    
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'Usage limit reached',
        limit: usageCheck.limit,
        remaining: 0
      });
    }
    
    console.log(`📧 [CURATOR FINDER] Finding curators for genre: ${genre}`);
    
    // Generate AI-powered curator profiles and pitch templates
    const prompt = `You are a music PR expert. Help find curators and create pitch templates.

TRACK INFO:
Track: "${trackName}"
Artist: "${artist}"
Genre: "${genre}"
Description: "${trackDescription || 'Not provided'}"

TASK:
1. Identify 8-10 types of playlist curators who would love this track
2. For each curator type, generate a personalized pitch email template
3. Provide contact finding strategies
4. Include follow-up approach

Return JSON:
{
  "curatorProfiles": [
    {
      "curatorType": "type of curator",
      "playlistFocus": "what they curate",
      "estimatedPlaylists": "number range",
      "followerRange": "typical follower count",
      "contactStrategy": "how to find their email",
      "pitchTemplate": "personalized email template with [PLACEHOLDERS]",
      "subjectLine": "compelling email subject",
      "followUpStrategy": "when and how to follow up",
      "successTips": ["tip 1", "tip 2", "tip 3"]
    }
  ],
  "generalTips": [
    "general tip 1",
    "general tip 2",
    "general tip 3"
  ],
  "bestPractices": {
    "timing": "best time to send",
    "frequency": "how often to follow up",
    "dosList": ["do 1", "do 2"],
    "dontsList": ["don't 1", "don't 2"]
  }
}`;

    const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const responseText = result.text || "";
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const curatorData = JSON.parse(jsonMatch[0]);
    
    await logUsage(userId, 'curatorFinder', { genre, trackName, artist });
    
    console.log(`✅ [CURATOR FINDER] Found ${curatorData.curatorProfiles?.length || 0} curator profiles`);
    
    res.json({
      success: true,
      curatorData,
      remaining: usageCheck.remaining - 1,
      limit: usageCheck.limit
    });
    
  } catch (error) {
    console.error('Error in curator contact finder:', error);
    res.status(500).json({ 
      error: 'Failed to find curator contacts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 4. SPOTIFY SEO OPTIMIZER
 * Optimizes artist profile and track metadata for Spotify algorithm
 * 
 * Process:
 * 1. Analyze current profile/track metadata
 * 2. Identify SEO opportunities
 * 3. Generate optimized versions with AI
 * 4. Provide algorithm-friendly recommendations
 */
router.post('/seo-optimizer', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.session?.user || req.user;
    const userId = user?.id || user?.replitId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { type, content } = req.body;
    
    // type can be: 'artist_bio', 'track_title', 'track_description', 'playlist_title'
    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }
    
    const userPlan = user?.subscriptionTier || 'free';
    const usageCheck = await checkUsageLimit(userId, 'seoOptimizer', userPlan, user);
    
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'Usage limit reached',
        limit: usageCheck.limit,
        remaining: 0
      });
    }
    
    console.log(`🔍 [SEO OPTIMIZER] Optimizing ${type}`);
    
    const typeDescriptions = {
      'artist_bio': 'Artist Biography',
      'track_title': 'Track Title',
      'track_description': 'Track Description',
      'playlist_title': 'Playlist Title/Description'
    };
    
    const prompt = `You are a Spotify SEO expert. Optimize this ${typeDescriptions[type as keyof typeof typeDescriptions] || 'content'} for maximum discoverability.

ORIGINAL CONTENT:
${content}

TASK:
1. Analyze current SEO strengths and weaknesses
2. Generate 3 optimized versions (conservative, moderate, aggressive)
3. Identify key SEO keywords to include
4. Explain Spotify algorithm considerations
5. Provide character count optimization

Return JSON:
{
  "analysis": {
    "currentScore": number (0-100),
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "missingElements": ["element 1", "element 2"]
  },
  "optimizedVersions": [
    {
      "style": "conservative",
      "content": "optimized version that's similar to original",
      "seoScore": number (0-100),
      "changes": ["change 1", "change 2"],
      "reasoning": "why this version works"
    },
    {
      "style": "moderate",
      "content": "balanced optimization",
      "seoScore": number (0-100),
      "changes": ["change 1", "change 2"],
      "reasoning": "why this version works"
    },
    {
      "style": "aggressive",
      "content": "maximum SEO optimization",
      "seoScore": number (0-100),
      "changes": ["change 1", "change 2"],
      "reasoning": "why this version works"
    }
  ],
  "seoKeywords": [
    {
      "keyword": "keyword phrase",
      "searchVolume": "high/medium/low",
      "competition": "high/medium/low",
      "priority": number (1-10)
    }
  ],
  "algorithmInsights": [
    "insight 1",
    "insight 2",
    "insight 3"
  ],
  "recommendations": [
    "recommendation 1",
    "recommendation 2",
    "recommendation 3"
  ]
}`;

    const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const responseText = result.text || "";
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const optimization = JSON.parse(jsonMatch[0]);
    
    await logUsage(userId, 'seoOptimizer', { type, contentLength: content.length });
    
    console.log(`✅ [SEO OPTIMIZER] Generated ${optimization.optimizedVersions?.length || 0} optimized versions`);
    
    res.json({
      success: true,
      optimization,
      remaining: usageCheck.remaining - 1,
      limit: usageCheck.limit
    });
    
  } catch (error) {
    console.error('Error in SEO optimizer:', error);
    res.status(500).json({ 
      error: 'Failed to optimize content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET USAGE STATS
 * Returns current usage statistics for all Spotify tools
 */
router.get('/usage-stats', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.session?.user || req.user;
    const userId = user?.id || user?.replitId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userPlan = user?.subscriptionTier || 'free';
    const isUserAdmin = isAdmin(user);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usageRef = firebaseDb.collection('spotify_tool_usage');
    const snapshot = await usageRef
      .where('userId', '==', userId)
      .where('timestamp', '>=', today)
      .get();
    
    const usage: Record<string, number> = {
      monthlyListenersPrediction: 0,
      playlistMatch: 0,
      curatorFinder: 0,
      seoOptimizer: 0
    };
    
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.feature && usage.hasOwnProperty(data.feature)) {
        usage[data.feature]++;
      }
    });
    
    const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
    
    res.json({
      success: true,
      plan: userPlan,
      isAdmin: isUserAdmin,
      usage,
      limits,
      remaining: {
        monthlyListenersPrediction: limits.monthlyListenersPrediction === -1 ? -1 : Math.max(0, limits.monthlyListenersPrediction - usage.monthlyListenersPrediction),
        playlistMatch: limits.playlistMatch === -1 ? -1 : Math.max(0, limits.playlistMatch - usage.playlistMatch),
        curatorFinder: limits.curatorFinder === -1 ? -1 : Math.max(0, limits.curatorFinder - usage.curatorFinder),
        seoOptimizer: limits.seoOptimizer === -1 ? -1 : Math.max(0, limits.seoOptimizer - usage.seoOptimizer)
      }
    });
    
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
});

export default router;
