/**
 * NEWS AGENT - Conecta el ecosistema IA con el mundo real
 * 
 * Funciones:
 * 1. Extrae noticias de entretenimiento via Apify Google News Scraper
 * 2. Procesa noticias para que los artistas IA las comenten
 * 3. Genera contexto cultural actual para posts más relevantes
 * 4. Alimenta "World Events" que afectan a todo el ecosistema
 */

import { db } from '../db';
import { 
  worldEvents, 
  artistPersonality, 
  users,
  aiSocialPosts 
} from '../../db/schema';
import { eq, desc, sql, gte } from 'drizzle-orm';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

// Apify Configuration - API key from environment variables
const APIFY_API_KEY = process.env.APIFY_API_KEY;
const GOOGLE_NEWS_ACTOR = 'lhotanova/google-news-scraper';
const NEWS_DATASET_ID = process.env.APIFY_NEWS_DATASET_ID || '6B6relfVBfMQIui9u';

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// TYPES
// ============================================

interface NewsArticle {
  title: string;
  description?: string;
  url: string;
  source?: string;
  publishedAt?: string;
  category?: string;
}

interface ProcessedNews {
  id: string;
  headline: string;
  summary: string;
  relevanceToMusic: number; // 0-100
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  potentialReactions: string[];
}

interface ArtistReaction {
  artistId: number;
  artistName: string;
  reaction: string;
  postType: 'opinion' | 'commentary' | 'inspiration' | 'critique';
}

// ============================================
// APIFY NEWS FETCHING
// ============================================

/**
 * Fetch entertainment news from Apify Google News Scraper
 */
export async function fetchEntertainmentNews(query: string = 'music industry news'): Promise<NewsArticle[]> {
  console.log(`📰 [NewsAgent] Fetching news for: "${query}"`);
  
  try {
    // Option 1: Use existing dataset
    const datasetUrl = `https://api.apify.com/v2/datasets/${NEWS_DATASET_ID}/items?token=${APIFY_API_KEY}&limit=50`;
    
    const response = await fetch(datasetUrl);
    
    if (!response.ok) {
      console.log('📰 [NewsAgent] Dataset not available, trying actor run...');
      return await runNewsActor(query);
    }
    
    const articles = await response.json();
    console.log(`📰 [NewsAgent] Fetched ${articles.length} articles from dataset`);
    
    return articles.map((article: any) => ({
      title: article.title || article.headline,
      description: article.description || article.snippet,
      url: article.url || article.link,
      source: article.source || article.publisher,
      publishedAt: article.publishedAt || article.date,
      category: 'entertainment'
    }));
    
  } catch (error) {
    console.error('❌ [NewsAgent] Error fetching news:', error);
    return [];
  }
}

/**
 * Run the Google News Scraper actor for fresh results
 */
async function runNewsActor(query: string): Promise<NewsArticle[]> {
  try {
    const runUrl = `https://api.apify.com/v2/acts/${GOOGLE_NEWS_ACTOR}/runs?token=${APIFY_API_KEY}`;
    
    const response = await fetch(runUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: [query, 'new music releases', 'artist collaboration', 'music streaming'],
        maxArticles: 30,
        language: 'en',
        dateRange: 'past_week'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Actor run failed: ${response.status}`);
    }
    
    const runData = await response.json();
    const runId = runData.data?.id;
    
    if (!runId) {
      throw new Error('No run ID returned');
    }
    
    // Wait for run to complete (simple polling)
    console.log(`📰 [NewsAgent] Actor run started: ${runId}`);
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    // Fetch results
    const resultsUrl = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_KEY}`;
    const resultsResponse = await fetch(resultsUrl);
    const articles = await resultsResponse.json();
    
    return articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source,
      publishedAt: article.publishedAt,
      category: 'entertainment'
    }));
    
  } catch (error) {
    console.error('❌ [NewsAgent] Error running actor:', error);
    return [];
  }
}

// ============================================
// NEWS PROCESSING
// ============================================

/**
 * Process raw news articles and determine music relevance
 */
export async function processNewsForArtists(articles: NewsArticle[]): Promise<ProcessedNews[]> {
  console.log(`🔄 [NewsAgent] Processing ${articles.length} articles...`);
  
  const processedNews: ProcessedNews[] = [];
  
  for (const article of articles.slice(0, 10)) { // Process top 10
    try {
      const response = await llm.invoke([
        new SystemMessage(`You are a music industry analyst. Analyze this news article and determine its relevance to the music industry and how AI music artists might react to it.

Return a JSON object with:
- relevanceToMusic: 0-100 (how relevant is this to music/entertainment)
- sentiment: "positive", "negative", or "neutral"
- topics: array of 2-4 topic tags
- potentialReactions: array of 2-3 ways an artist might react to this news
- summary: 1-2 sentence summary focused on music industry impact`),
        new HumanMessage(`Article: "${article.title}"
Description: "${article.description || 'No description'}"
Source: ${article.source || 'Unknown'}`)
      ]);
      
      const content = response.content as string;
      
      // Try to parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.relevanceToMusic >= 30) { // Only keep relevant news
          processedNews.push({
            id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            headline: article.title,
            summary: parsed.summary || article.description || '',
            relevanceToMusic: parsed.relevanceToMusic,
            sentiment: parsed.sentiment,
            topics: parsed.topics || [],
            potentialReactions: parsed.potentialReactions || []
          });
        }
      }
    } catch (error) {
      console.error(`❌ [NewsAgent] Error processing article:`, error);
    }
  }
  
  console.log(`✅ [NewsAgent] Processed ${processedNews.length} relevant articles`);
  return processedNews;
}

// ============================================
// ARTIST REACTIONS
// ============================================

/**
 * Generate reactions from AI artists to a news item
 */
export async function generateArtistReactions(news: ProcessedNews, maxReactions: number = 3): Promise<ArtistReaction[]> {
  console.log(`🎤 [NewsAgent] Generating reactions to: "${news.headline}"`);
  
  // Get artists with personalities
  const artists = await db
    .select({
      id: users.id,
      artistName: users.artistName,
      genre: users.genre,
      personality: artistPersonality.traits,
      artisticTraits: artistPersonality.artisticTraits,
      currentMood: artistPersonality.currentMood
    })
    .from(artistPersonality)
    .innerJoin(users, eq(artistPersonality.artistId, users.id))
    .orderBy(sql`RANDOM()`)
    .limit(maxReactions * 2); // Get extra to filter
  
  const reactions: ArtistReaction[] = [];
  
  for (const artist of artists) {
    if (reactions.length >= maxReactions) break;
    
    const traits = artist.personality as any;
    const artisticTraits = artist.artisticTraits as any;
    
    // Determine if this artist would care about this news
    const controversyTrait = artisticTraits?.controversy || 50;
    const opinionatedTrait = traits?.openness || 50;
    
    // Artists with high controversy/openness are more likely to comment
    const shouldReact = Math.random() * 100 < (controversyTrait + opinionatedTrait) / 2;
    
    if (!shouldReact) continue;
    
    try {
      const response = await llm.invoke([
        new SystemMessage(`You are ${artist.artistName}, a ${artist.genre || 'music'} artist.
Your personality: ${JSON.stringify(traits)}
Your current mood: ${artist.currentMood}

Generate a short, authentic reaction (1-3 sentences) to this music industry news.
Be authentic to your personality - if you're controversial, be bold. If you're thoughtful, be insightful.
Format: Just the reaction text, no quotes or attribution.`),
        new HumanMessage(`News: "${news.headline}"
Summary: "${news.summary}"
Topics: ${news.topics.join(', ')}`)
      ]);
      
      const reactionText = (response.content as string).trim();
      
      // Determine post type based on content
      let postType: ArtistReaction['postType'] = 'commentary';
      if (reactionText.toLowerCase().includes('inspire') || reactionText.toLowerCase().includes('motivat')) {
        postType = 'inspiration';
      } else if (reactionText.toLowerCase().includes('disagree') || reactionText.toLowerCase().includes('wrong')) {
        postType = 'critique';
      } else if (reactionText.toLowerCase().includes('think') || reactionText.toLowerCase().includes('opinion')) {
        postType = 'opinion';
      }
      
      reactions.push({
        artistId: artist.id,
        artistName: artist.artistName || 'Unknown Artist',
        reaction: reactionText,
        postType
      });
      
    } catch (error) {
      console.error(`❌ [NewsAgent] Error generating reaction for ${artist.artistName}:`, error);
    }
  }
  
  console.log(`✅ [NewsAgent] Generated ${reactions.length} artist reactions`);
  return reactions;
}

/**
 * Post artist reactions to the social feed
 */
export async function postNewsReactions(reactions: ArtistReaction[], news: ProcessedNews): Promise<number> {
  let posted = 0;
  
  for (const reaction of reactions) {
    try {
      // Create post with news context
      const contentWithContext = `📰 Reacting to: "${news.headline.substring(0, 50)}..."

${reaction.reaction}

#MusicNews #IndustryTalk`;

      await db.insert(aiSocialPosts).values({
        artistId: reaction.artistId,
        contentType: 'text',
        content: contentWithContext,
        hashtags: ['MusicNews', 'IndustryTalk', ...news.topics.slice(0, 2)],
        mood: 'engaged',
        context: {
          newsSource: news.headline,
          reactionType: reaction.postType
        },
        engagement: { likes: 0, comments: 0, shares: 0 },
        createdAt: new Date()
      });
      
      posted++;
      console.log(`📝 [NewsAgent] ${reaction.artistName} posted about: ${news.headline.substring(0, 30)}...`);
      
    } catch (error) {
      console.error(`❌ [NewsAgent] Error posting reaction:`, error);
    }
  }
  
  return posted;
}

// ============================================
// WORLD EVENTS INTEGRATION
// ============================================

/**
 * Create a World Event from significant news
 */
export async function createWorldEventFromNews(news: ProcessedNews): Promise<void> {
  // Only create world events for highly relevant news
  if (news.relevanceToMusic < 70) return;
  
  try {
    await db.insert(worldEvents).values({
      title: news.headline,
      description: news.summary,
      eventType: 'cultural',
      impact: news.sentiment === 'positive' ? 'positive' : news.sentiment === 'negative' ? 'negative' : 'neutral',
      scope: 'all',
      affectsGenres: news.topics,
      startTime: new Date(),
      endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      status: 'active',
      metadata: {
        source: 'apify_news',
        originalTopics: news.topics,
        potentialReactions: news.potentialReactions
      }
    });
    
    console.log(`🌍 [NewsAgent] Created world event: ${news.headline}`);
  } catch (error) {
    console.error('❌ [NewsAgent] Error creating world event:', error);
  }
}

// ============================================
// NEWS TICK (Called by Orchestrator)
// ============================================

/**
 * Main news processing tick - called periodically by orchestrator
 */
export async function processNewsTick(): Promise<void> {
  console.log('📰 [NewsAgent] ====== NEWS TICK START ======');
  
  try {
    // 1. Fetch fresh news
    const articles = await fetchEntertainmentNews('music industry news 2024');
    
    if (articles.length === 0) {
      console.log('📰 [NewsAgent] No articles fetched, using fallback topics');
      // Use trending music topics as fallback
      const fallbackTopics = [
        { title: 'AI in Music Production Growing Rapidly', description: 'More artists adopting AI tools for music creation', relevanceToMusic: 90 },
        { title: 'Streaming Numbers Hit Record Highs', description: 'Spotify and Apple Music report increased user engagement', relevanceToMusic: 85 },
        { title: 'Independent Artists Seeing More Success', description: 'DIY musicians finding audiences without major labels', relevanceToMusic: 80 }
      ];
      
      for (const topic of fallbackTopics) {
        const processedNews: ProcessedNews = {
          id: `fallback_${Date.now()}`,
          headline: topic.title,
          summary: topic.description,
          relevanceToMusic: topic.relevanceToMusic,
          sentiment: 'positive',
          topics: ['music', 'industry', 'trends'],
          potentialReactions: ['excited', 'supportive', 'opinionated']
        };
        
        // Generate and post reactions
        const reactions = await generateArtistReactions(processedNews, 2);
        await postNewsReactions(reactions, processedNews);
      }
      
      return;
    }
    
    // 2. Process articles for relevance
    const processedNews = await processNewsForArtists(articles);
    
    // 3. For each relevant news item, generate reactions
    for (const news of processedNews.slice(0, 3)) { // Top 3 news items
      // Create world event if significant
      await createWorldEventFromNews(news);
      
      // Generate artist reactions
      const reactions = await generateArtistReactions(news, 2);
      
      // Post reactions to feed
      await postNewsReactions(reactions, news);
    }
    
    console.log('📰 [NewsAgent] ====== NEWS TICK COMPLETE ======');
    
  } catch (error) {
    console.error('❌ [NewsAgent] Error in news tick:', error);
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  NewsArticle,
  ProcessedNews,
  ArtistReaction
};
