/**
 * Music News Service
 * 
 * This service handles fetching music industry news from various sources,
 * generating promotional content using OpenRouter, and creating images with Fal.ai.
 * 
 * It's used by the Music News Plugin in the admin dashboard to automate content creation.
 */

import { db, storage } from "@/firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp, deleteDoc, doc, where, updateDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { generateImageWithFal } from "./fal-ai";
import { getAuthToken } from "@/lib/auth";

// News item definition
export interface NewsItem {
  id?: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  promotionalContent?: string;
  hashtags?: string[];
  category: string;
  keywords: string[];
  status: 'pending' | 'published' | 'archived';
  createdAt: Date | Timestamp;
  publishedAt?: Date | Timestamp;
  userId?: string;
}

// Content generation result
export interface GeneratedContent {
  promotional: string;
  hashtags: string[];
  imageUrl?: string;
}

/**
 * Fetch the latest music news from multiple sources
 * @param keywords Keywords to filter news by
 * @returns Array of news items
 */
export async function fetchLatestMusicNews(keywords: string[] = []): Promise<NewsItem[]> {
  try {
    // In a real implementation, this would fetch from news APIs
    // For now, we'll return mock data
    return getMockNewsData(keywords);
  } catch (error) {
    console.error("Error fetching music news:", error);
    throw new Error("Failed to fetch music news");
  }
}

/**
 * Generate promotional content for a news item using OpenRouter
 * @param newsItem News item to generate content for
 * @returns Generated promotional content
 */
export async function generatePromotionalContent(newsItem: NewsItem): Promise<GeneratedContent> {
  try {
    // In a real implementation, this would call the OpenRouter API
    // For now, we'll simulate the response

    // 1. Prepare the prompt for OpenRouter
    const prompt = `
    Create promotional social media content based on this music industry news:
    
    Title: ${newsItem.title}
    Summary: ${newsItem.summary}
    Full content: ${newsItem.content}
    Keywords: ${newsItem.keywords.join(', ')}
    
    Your task:
    1. Write an engaging social media post that relates this news to Boostify's music education platform
    2. Keep it under 280 characters
    3. Make it sound exciting and relevant to musicians
    4. Include emojis where appropriate
    5. Mention how Boostify's courses or tools can help musicians leverage this news
    `;

    // 2. In a real implementation, call the OpenRouter API
    // const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     model: 'openai/gpt-4-turbo-preview',
    //     messages: [{ role: 'user', content: prompt }]
    //   })
    // });
    // const data = await response.json();
    // const generatedText = data.choices[0].message.content;

    // 3. For now, generate a simulated response
    const generatedText = `🎵 ${newsItem.title} 🎵\n\nExciting news for music creators! ${newsItem.summary}\n\nThis development could dramatically change how artists approach their craft. At Boostify, we provide the education and tools you need to stay ahead of industry changes like this.\n\nCheck out our platform to learn more about how you can leverage these opportunities in your music career!`;

    // 4. Generate hashtags
    const hashtags = generateHashtags(newsItem.keywords);

    // 5. Return the generated content
    return {
      promotional: generatedText,
      hashtags,
      imageUrl: newsItem.imageUrl
    };
  } catch (error) {
    console.error("Error generating promotional content:", error);
    throw new Error("Failed to generate promotional content");
  }
}

/**
 * Generate a promotional image using Fal.ai
 * @param newsItem News item to generate an image for
 * @param existingContent Optional existing generated content
 * @returns URL of the generated image
 */
export async function generatePromotionalImage(newsItem: NewsItem, existingContent?: GeneratedContent): Promise<string> {
  try {
    // In a real implementation, this would call the Fal.ai API
    // For now, we'll simulate the response
    
    // 1. Prepare the prompt for Fal.ai
    const imagePrompt = `
    A professional, high-quality promotional image for music industry news about "${newsItem.title}".
    Focused on ${newsItem.category}, with elements related to ${newsItem.keywords.join(', ')}.
    Modern, clean style suitable for social media. No text overlay.
    `;
    
    // 2. In a real implementation, generate an image with Fal.ai
    // const imageResult = await generateImageWithFal({
    //   prompt: imagePrompt,
    //   negativePrompt: "text, watermark, logo, low quality, blurry"
    // });
    // return imageResult.url;
    
    // 3. For now, return a placeholder image URL
    const mockImages = [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
      "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae",
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"
    ];
    
    // Return a random image from the mock images
    return mockImages[Math.floor(Math.random() * mockImages.length)];
  } catch (error) {
    console.error("Error generating promotional image:", error);
    // If there's an error, return the original image or a default
    return existingContent?.imageUrl || newsItem.imageUrl;
  }
}

/**
 * Save a news item to Firestore
 * @param newsItem News item to save
 * @returns ID of the saved news item
 */
export async function saveNewsItem(newsItem: Omit<NewsItem, 'id'>): Promise<string> {
  try {
    // Get current user's auth token
    const userId = await getCurrentUserId();
    
    // Add to Firestore
    const newsRef = collection(db, 'music_news');
    const docRef = await addDoc(newsRef, {
      ...newsItem,
      userId,
      createdAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error saving news item:", error);
    throw new Error("Failed to save news item");
  }
}

/**
 * Update an existing news item in Firestore
 * @param id ID of the news item to update
 * @param updates Updates to apply
 */
export async function updateNewsItem(id: string, updates: Partial<NewsItem>): Promise<void> {
  try {
    const newsRef = doc(db, 'music_news', id);
    
    // If we're updating status to published, add publishedAt timestamp
    if (updates.status === 'published' && !updates.publishedAt) {
      updates.publishedAt = Timestamp.now();
    }
    
    await updateDoc(newsRef, updates);
  } catch (error) {
    console.error("Error updating news item:", error);
    throw new Error("Failed to update news item");
  }
}

/**
 * Get all news items from Firestore
 * @param userId Optional user ID to filter by
 * @returns Array of news items
 */
export async function getNewsItems(userId?: string): Promise<NewsItem[]> {
  try {
    const newsRef = collection(db, 'music_news');
    let q = query(newsRef, orderBy('createdAt', 'desc'));
    
    // If userId is provided, filter by it
    if (userId) {
      q = query(newsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as NewsItem));
  } catch (error) {
    console.error("Error getting news items:", error);
    // For now, return mock data if there's an error
    return getMockNewsData();
  }
}

/**
 * Save generated promotional content to Firestore
 * @param newsItemId ID of the news item
 * @param content Generated content
 */
export async function savePromotionalContent(newsItemId: string, content: GeneratedContent): Promise<void> {
  try {
    const newsRef = doc(db, 'music_news', newsItemId);
    
    await updateDoc(newsRef, {
      promotionalContent: content.promotional,
      hashtags: content.hashtags,
      imageUrl: content.imageUrl,
      status: 'published',
      publishedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error saving promotional content:", error);
    throw new Error("Failed to save promotional content");
  }
}

/**
 * Delete a news item from Firestore
 * @param id ID of the news item to delete
 */
export async function deleteNewsItem(id: string): Promise<void> {
  try {
    const newsRef = doc(db, 'music_news', id);
    await deleteDoc(newsRef);
  } catch (error) {
    console.error("Error deleting news item:", error);
    throw new Error("Failed to delete news item");
  }
}

/**
 * Generate hashtags from keywords
 * @param keywords Keywords to generate hashtags from
 * @returns Array of hashtags
 */
export function generateHashtags(keywords: string[]): string[] {
  // Create hashtags from keywords and add some standard platform hashtags
  const standardTags = ["MusicEducation", "BoostifyMusic", "MusicProduction", "LearnMusic"];
  const keywordTags = keywords.map(k => k.replace(/\s+/g, ''));
  
  // Combine arrays and then use filter to ensure uniqueness
  const combinedTags = [...keywordTags, ...standardTags];
  const uniqueTags = combinedTags.filter((tag, index) => combinedTags.indexOf(tag) === index);
  
  // Add hashtag symbol to each tag
  return uniqueTags.map(tag => `#${tag}`);
}

/**
 * Get the current user's ID
 * @returns User ID or null if not authenticated
 */
async function getCurrentUserId(): Promise<string | undefined> {
  try {
    // Get the auth token
    const token = await getAuthToken();
    
    // If no token, return undefined
    if (!token) return undefined;
    
    // Decode the token to get the user ID (simplified for demo)
    // In a real implementation, you would properly decode the token
    return "current-user-id";
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return undefined;
  }
}

/**
 * Get mock news data for development
 * @param filterKeywords Optional keywords to filter by
 * @returns Array of mock news items
 */
function getMockNewsData(filterKeywords: string[] = []): NewsItem[] {
  // Mock news data for development
  const mockNewsItems: Omit<NewsItem, 'id'>[] = [
    {
      title: "Grammy-Winning Producer Launches New Masterclass Series",
      summary: "Top producer shares industry secrets in exclusive online masterclass series focused on advanced production techniques.",
      content: "Grammy-winning producer Mark Johnson has announced the launch of a comprehensive masterclass series designed for aspiring music producers. The series will cover everything from advanced mixing techniques to creating unique sounds and navigating the music business. \"I wanted to create something that I wish I had when I was starting out,\" Johnson said. The masterclass includes over 15 hours of video content, downloadable project files, and a private community for students.",
      source: "Music Production Monthly",
      sourceUrl: "https://example.com/news/grammy-producer-masterclass",
      imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
      category: "education",
      keywords: ["production", "masterclass", "grammy", "education"],
      status: "pending",
      createdAt: new Date(),
    },
    {
      title: "New AI Tool Revolutionizes Music Mastering Process",
      summary: "Revolutionary AI-powered platform allows independent artists to achieve professional mastering at a fraction of traditional costs.",
      content: "A startup called SoundPerfect has launched an AI-driven mastering tool that promises studio-quality results at an affordable price point. The technology, which has been trained on thousands of professionally mastered tracks, analyzes the audio characteristics of a song and applies appropriate processing to enhance its sound quality. Early reviews from independent artists suggest the results rival those of professional mastering engineers. The service offers various pricing tiers, including a free option for basic mastering.",
      source: "Tech Music News",
      sourceUrl: "https://example.com/news/ai-mastering-tool",
      imageUrl: "https://images.unsplash.com/photo-1558584673-c834fb1cc3ca",
      category: "technology",
      keywords: ["AI", "mastering", "technology", "independent artists"],
      status: "pending",
      createdAt: new Date(),
    },
    {
      title: "Major Music Streaming Platform Increases Royalty Rates for Artists",
      summary: "Leading streaming service announces new payment structure that could significantly increase income for independent musicians.",
      content: "In a move that has been welcomed by the independent music community, StreamifyMusic has announced a revised royalty payment structure that will increase payments to artists by an estimated 15-20%. The new model will particularly benefit artists with dedicated fan bases who listen to their music repeatedly. This change comes after years of criticism about the low payments typically received by artists from streaming platforms. Indie artist collectives have responded positively, calling it \"a step in the right direction\" while noting that further improvements are still needed for sustainable careers.",
      source: "Digital Music News",
      sourceUrl: "https://example.com/news/streaming-royalty-increase",
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
      category: "industry",
      keywords: ["streaming", "royalties", "independent artists", "income"],
      status: "pending",
      createdAt: new Date(),
    },
    {
      title: "New Music Education Platform Focuses on Practical Career Skills",
      summary: "Innovative online platform combines music production lessons with real-world business and marketing training for modern musicians.",
      content: "A new education platform called MusicianMap has launched with a novel approach to music education, combining technical training with essential career skills. Unlike traditional music education that focuses primarily on performance or production, this platform includes courses on music business, marketing, networking, and financial management specifically for musicians. \"We saw a gap in the market where musicians were learning their craft but not how to make a living from it,\" explains founder Sarah Chen. The platform features courses taught by both successful musicians and industry experts.",
      source: "Music Education Weekly",
      sourceUrl: "https://example.com/news/musicianmap-launch",
      imageUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76",
      category: "education",
      keywords: ["education", "career", "business", "marketing"],
      status: "pending",
      createdAt: new Date(),
    },
    {
      title: "New DJ Software Uses AI to Match Beats Perfectly",
      summary: "Revolutionary DJ application leverages machine learning to create seamless transitions between tracks of different BPMs and keys.",
      content: "A team of software engineers and professional DJs have collaborated to create 'BeatSync Pro', a DJ application that uses artificial intelligence to analyze and match tracks for perfect transitions. The software can automatically adjust tempo, key, and even suggest optimal mix points based on song structure analysis. Early beta testers report that the AI suggestions have improved their sets and allowed for creative combinations that wouldn't have been attempted manually. The product is set to launch next month with both subscription and one-time purchase options.",
      source: "DJ Tech Reviews",
      sourceUrl: "https://example.com/news/beatsync-ai-dj-software",
      imageUrl: "https://images.unsplash.com/photo-1571935614846-3bcf3bfba75d",
      category: "technology",
      keywords: ["DJ", "software", "AI", "music technology", "mixing"],
      status: "pending",
      createdAt: new Date(),
    }
  ];

  // If we have filter keywords, apply them
  if (filterKeywords.length > 0) {
    return mockNewsItems.filter(item => 
      item.keywords.some(keyword => 
        filterKeywords.some(filter => 
          keyword.toLowerCase().includes(filter.toLowerCase())
        )
      )
    ).map((item, index) => ({
      ...item,
      id: `mock-${index}`
    })) as NewsItem[];
  }

  // Otherwise return all mock items
  return mockNewsItems.map((item, index) => ({
    ...item,
    id: `mock-${index}`
  })) as NewsItem[];
}