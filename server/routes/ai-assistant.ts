import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import fileUpload from 'express-fileupload';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Preset artistic prompts for cover generation
const COVER_PROMPTS = [
  {
    id: 'vibrant-concert',
    name: 'Vibrant Concert',
    prompt: 'Create a vibrant, energetic concert scene with stage lights, crowd silhouettes, and dynamic colors. Professional music artist cover art style, high quality, artistic, modern.'
  },
  {
    id: 'minimalist-modern',
    name: 'Minimalist Modern',
    prompt: 'Create a minimalist, modern artistic portrait with clean geometric shapes, bold colors, and professional music artist aesthetic. Contemporary design, high quality.'
  },
  {
    id: 'urban-street',
    name: 'Urban Street Art',
    prompt: 'Create an urban street art style cover with graffiti elements, bold colors, and hip-hop/urban music aesthetic. Professional artist cover, artistic, vibrant.'
  },
  {
    id: 'neon-futuristic',
    name: 'Neon Futuristic',
    prompt: 'Create a futuristic neon-lit scene with cyberpunk aesthetic, electric colors, and modern music vibe. Professional artist cover art, high quality, artistic.'
  },
  {
    id: 'vintage-retro',
    name: 'Vintage Retro',
    prompt: 'Create a vintage retro-style cover with warm tones, classic music aesthetic, and nostalgic vibe. Professional artist artwork, high quality, artistic.'
  },
  {
    id: 'abstract-artistic',
    name: 'Abstract Artistic',
    prompt: 'Create an abstract artistic composition with flowing shapes, bold colors, and creative music industry aesthetic. Professional cover art, modern, high quality.'
  }
];

// POST /api/ai/enrich-profile - AI-powered profile enrichment
router.post('/enrich-profile', authenticate, async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user!.uid || req.user!.id;
    const { artistName } = req.body;
    
    // Find user in PostgreSQL
    const [user] = await db.select().from(users).where(eq(users.username, firebaseUid)).limit(1);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = user.id;

    if (!artistName || typeof artistName !== 'string' || artistName.trim() === '') {
      return res.status(400).json({ message: 'Artist name is required' });
    }

    // Use Gemini to search for artist information
    
    const prompt = `Search for information about the music artist "${artistName}". 
    Provide a JSON response with the following structure (if information is not available, use null):
    {
      "realName": "Artist's real name",
      "country": "Country of origin",
      "genres": ["genre1", "genre2", "genre3"],
      "biography": "Short biography (2-3 sentences)",
      "website": "Official website URL",
      "spotifyUrl": "Spotify artist URL",
      "instagramHandle": "Instagram handle without @",
      "twitterHandle": "Twitter/X handle without @",
      "youtubeChannel": "YouTube channel URL",
      "facebookUrl": "Facebook page URL",
      "tiktokUrl": "TikTok profile URL",
      "topYoutubeVideos": [
        {
          "title": "Video title",
          "url": "YouTube video URL",
          "thumbnailUrl": "Thumbnail image URL",
          "type": "official_music_video or lyric_video or live_performance"
        }
      ],
      "concerts": {
        "upcoming": [
          {
            "tourName": "Tour name",
            "location": {
              "city": "City",
              "country": "Country",
              "venue": "Venue name"
            },
            "date": "YYYY-MM-DD",
            "status": "scheduled",
            "source": "ticketmaster"
          }
        ],
        "highlights": [
          {
            "eventName": "Notable tour or concert",
            "year": 2024,
            "note": "Brief description"
          }
        ]
      }
    }
    
    Only return valid JSON. If you cannot find information for a field, set it to null or empty array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text || '';
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'Failed to extract data from AI response' });
    }

    const enrichedData = JSON.parse(jsonMatch[0]);

    // Update user profile with enriched data
    const updateData: any = {
      ...(enrichedData.realName && { realName: enrichedData.realName }),
      ...(enrichedData.country && { country: enrichedData.country }),
      ...(enrichedData.genres && enrichedData.genres.length > 0 && { genres: enrichedData.genres }),
      ...(enrichedData.biography && { biography: enrichedData.biography }),
      ...(enrichedData.website && { website: enrichedData.website }),
      ...(enrichedData.spotifyUrl && { spotifyUrl: enrichedData.spotifyUrl }),
      ...(enrichedData.instagramHandle && { instagramHandle: enrichedData.instagramHandle }),
      ...(enrichedData.twitterHandle && { twitterHandle: enrichedData.twitterHandle }),
      ...(enrichedData.youtubeChannel && { youtubeChannel: enrichedData.youtubeChannel }),
      ...(enrichedData.facebookUrl && { facebookUrl: enrichedData.facebookUrl }),
      ...(enrichedData.tiktokUrl && { tiktokUrl: enrichedData.tiktokUrl }),
      ...(enrichedData.topYoutubeVideos && { topYoutubeVideos: enrichedData.topYoutubeVideos }),
      ...(enrichedData.concerts && { concerts: enrichedData.concerts }),
    };

    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, userId));
    }

    res.json({
      message: 'Profile enriched successfully',
      data: enrichedData
    });
  } catch (error: any) {
    console.error('Error enriching profile:', error);
    res.status(500).json({ 
      message: 'Error enriching profile', 
      error: error.message 
    });
  }
});

// GET /api/ai/cover-prompts - Get available cover generation prompts
router.get('/cover-prompts', authenticate, async (_req: Request, res: Response) => {
  res.json({ prompts: COVER_PROMPTS });
});

// POST /api/ai/generate-cover - Generate artistic cover image
router.post('/generate-cover', authenticate, async (req: any, res: Response) => {
  try {
    const firebaseUid = req.user!.uid || req.user!.id;
    const { promptId, customPrompt, artistName } = req.body;
    
    // Find user in PostgreSQL
    const [user] = await db.select().from(users).where(eq(users.username, firebaseUid)).limit(1);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = user.id;

    // Get the prompt template
    let basePrompt = '';
    if (promptId) {
      const preset = COVER_PROMPTS.find(p => p.id === promptId);
      if (!preset) {
        return res.status(400).json({ message: 'Invalid prompt ID' });
      }
      basePrompt = preset.prompt;
    } else if (customPrompt) {
      basePrompt = customPrompt;
    } else {
      return res.status(400).json({ message: 'Either promptId or customPrompt is required' });
    }

    // Add artist name to the prompt
    const finalPrompt = artistName 
      ? `${basePrompt} Incorporate the essence and style of artist "${artistName}".`
      : basePrompt;

    // Handle reference image if provided
    const parts: any[] = [{ text: finalPrompt }];
    
    if (req.files && req.files.referenceImage) {
      const file = Array.isArray(req.files.referenceImage) 
        ? req.files.referenceImage[0] 
        : req.files.referenceImage;
      
      // Read the file as base64
      const imageData = file.data.toString('base64');
      
      parts.push({
        inlineData: {
          mimeType: file.mimetype,
          data: imageData
        }
      });
      
      parts[0].text = `Using this reference image, ${finalPrompt}`;
    }

    // Generate image with Gemini 2.5 Flash Image (nano banana)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ role: 'user', parts }],
    });
    
    // Extract image from response
    let imageData: string | null = null;
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
    
    if (imagePart?.inlineData?.data) {
      imageData = imagePart.inlineData.data;
    }

    if (!imageData) {
      return res.status(500).json({ message: 'Failed to generate image' });
    }

    // Save the generated image
    const uploadsDir = path.join(process.cwd(), 'uploads', 'covers', userId.toString());
    await fs.mkdir(uploadsDir, { recursive: true });

    const filename = `cover-${Date.now()}.png`;
    const filepath = path.join(uploadsDir, filename);
    
    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(imageData, 'base64');
    await fs.writeFile(filepath, imageBuffer);

    const imageUrl = `/uploads/covers/${userId}/${filename}`;

    res.json({
      message: 'Cover image generated successfully',
      imageUrl
    });
  } catch (error: any) {
    console.error('Error generating cover:', error);
    res.status(500).json({ 
      message: 'Error generating cover image', 
      error: error.message 
    });
  }
});

export default router;
