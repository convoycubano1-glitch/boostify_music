import { Router } from 'express';
import { db } from '../db';
import { tokenizedSongs, tokenPurchases, artistTokenEarnings, users } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, Modality } from '@google/genai';
import * as fal from '@fal-ai/serverless-client';

const router = Router();

const createTokenizedSongSchema = z.object({
  songName: z.string().min(1, "Song name is required"),
  songUrl: z.string().url().optional().nullable(),
  tokenSymbol: z.string().min(1).max(20),
  totalSupply: z.number().int().positive(),
  pricePerTokenUsd: z.number().positive(),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  metadataUri: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  benefits: z.array(z.string()).optional().nullable(),
  royaltyPercentageArtist: z.number().int().min(0).max(100).default(80),
  royaltyPercentagePlatform: z.number().int().min(0).max(100).default(20),
});

const recordPurchaseSchema = z.object({
  tokenizedSongId: z.number().int().positive(),
  buyerWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  amountTokens: z.number().int().positive(),
  pricePaidEth: z.string(),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  blockNumber: z.number().int().positive().optional(),
});

router.get('/songs/:artistId', async (req, res) => {
  try {
    const artistId = parseInt(req.params.artistId);
    if (isNaN(artistId)) {
      return res.status(400).json({ error: 'Invalid artist ID' });
    }

    const songs = await db.select().from(tokenizedSongs)
      .where(eq(tokenizedSongs.artistId, artistId))
      .orderBy(desc(tokenizedSongs.createdAt));

    res.json(songs);
  } catch (error) {
    console.error('Error fetching tokenized songs:', error);
    res.status(500).json({ error: 'Failed to fetch tokenized songs' });
  }
});

router.get('/songs/active/:artistId', async (req, res) => {
  try {
    const artistId = parseInt(req.params.artistId);
    if (isNaN(artistId)) {
      return res.status(400).json({ error: 'Invalid artist ID' });
    }

    const songs = await db.select().from(tokenizedSongs)
      .where(and(
        eq(tokenizedSongs.artistId, artistId),
        eq(tokenizedSongs.isActive, true)
      ))
      .orderBy(desc(tokenizedSongs.createdAt));

    res.json(songs);
  } catch (error) {
    console.error('Error fetching active tokenized songs:', error);
    res.status(500).json({ error: 'Failed to fetch active tokenized songs' });
  }
});

router.get('/song/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid song ID' });
    }

    const [song] = await db.select().from(tokenizedSongs)
      .where(eq(tokenizedSongs.id, id))
      .limit(1);

    if (!song) {
      return res.status(404).json({ error: 'Tokenized song not found' });
    }

    res.json(song);
  } catch (error) {
    console.error('Error fetching tokenized song:', error);
    res.status(500).json({ error: 'Failed to fetch tokenized song' });
  }
});

router.post('/create', async (req, res) => {
  try {
    const validatedData = createTokenizedSongSchema.parse(req.body);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const artistId = req.user.id;

    const maxTokenId = await db.select({ max: sql<number>`COALESCE(MAX(${tokenizedSongs.tokenId}), 0)` })
      .from(tokenizedSongs);
    const nextTokenId = (maxTokenId[0]?.max || 0) + 1;

    const [newSong] = await db.insert(tokenizedSongs).values({
      artistId,
      songName: validatedData.songName,
      songUrl: validatedData.songUrl || null,
      tokenId: nextTokenId,
      tokenSymbol: validatedData.tokenSymbol,
      totalSupply: validatedData.totalSupply,
      availableSupply: validatedData.totalSupply,
      pricePerTokenUsd: validatedData.pricePerTokenUsd.toString(),
      contractAddress: validatedData.contractAddress,
      metadataUri: validatedData.metadataUri || null,
      imageUrl: validatedData.imageUrl || null,
      description: validatedData.description || null,
      benefits: validatedData.benefits || null,
      royaltyPercentageArtist: validatedData.royaltyPercentageArtist,
      royaltyPercentagePlatform: validatedData.royaltyPercentagePlatform,
      isActive: true,
    }).returning();

    res.status(201).json(newSong);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating tokenized song:', error);
    res.status(500).json({ error: 'Failed to create tokenized song' });
  }
});

router.post('/purchase/record', async (req, res) => {
  try {
    const validatedData = recordPurchaseSchema.parse(req.body);

    const [song] = await db.select().from(tokenizedSongs)
      .where(eq(tokenizedSongs.id, validatedData.tokenizedSongId))
      .limit(1);

    if (!song) {
      return res.status(404).json({ error: 'Tokenized song not found' });
    }

    if (!song.isActive) {
      return res.status(400).json({ error: 'This song is not available for purchase' });
    }

    if (song.availableSupply < validatedData.amountTokens) {
      return res.status(400).json({ error: 'Insufficient tokens available' });
    }

    const pricePaidEth = parseFloat(validatedData.pricePaidEth);
    const artistEarnings = pricePaidEth * (song.royaltyPercentageArtist / 100);
    const platformEarnings = pricePaidEth * (song.royaltyPercentagePlatform / 100);

    const buyerUserId = req.user?.id || null;

    const [purchase] = await db.insert(tokenPurchases).values({
      tokenizedSongId: validatedData.tokenizedSongId,
      buyerWalletAddress: validatedData.buyerWalletAddress,
      buyerUserId,
      amountTokens: validatedData.amountTokens,
      pricePaidEth: validatedData.pricePaidEth,
      artistEarningsEth: artistEarnings.toString(),
      platformEarningsEth: platformEarnings.toString(),
      transactionHash: validatedData.transactionHash,
      blockNumber: validatedData.blockNumber || null,
      status: 'pending',
    }).returning();

    await db.update(tokenizedSongs)
      .set({ 
        availableSupply: song.availableSupply - validatedData.amountTokens,
        updatedAt: new Date()
      })
      .where(eq(tokenizedSongs.id, validatedData.tokenizedSongId));

    res.status(201).json(purchase);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error recording purchase:', error);
    res.status(500).json({ error: 'Failed to record purchase' });
  }
});

router.put('/purchase/:transactionHash/confirm', async (req, res) => {
  try {
    const { transactionHash } = req.params;
    const { blockNumber } = req.body;

    const [purchase] = await db.select().from(tokenPurchases)
      .where(eq(tokenPurchases.transactionHash, transactionHash))
      .limit(1);

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const [updatedPurchase] = await db.update(tokenPurchases)
      .set({ 
        status: 'confirmed',
        blockNumber: blockNumber || purchase.blockNumber
      })
      .where(eq(tokenPurchases.transactionHash, transactionHash))
      .returning();

    const [song] = await db.select().from(tokenizedSongs)
      .where(eq(tokenizedSongs.id, purchase.tokenizedSongId))
      .limit(1);

    if (song) {
      await db.insert(artistTokenEarnings).values({
        artistId: song.artistId,
        tokenizedSongId: purchase.tokenizedSongId,
        purchaseId: purchase.id,
        amountEth: purchase.artistEarningsEth,
        transactionHash: purchase.transactionHash,
      });
    }

    res.json(updatedPurchase);
  } catch (error) {
    console.error('Error confirming purchase:', error);
    res.status(500).json({ error: 'Failed to confirm purchase' });
  }
});

router.get('/purchases/:artistId', async (req, res) => {
  try {
    const artistId = parseInt(req.params.artistId);
    if (isNaN(artistId)) {
      return res.status(400).json({ error: 'Invalid artist ID' });
    }

    const purchases = await db.select({
      purchase: tokenPurchases,
      song: tokenizedSongs,
    })
      .from(tokenPurchases)
      .innerJoin(tokenizedSongs, eq(tokenPurchases.tokenizedSongId, tokenizedSongs.id))
      .where(eq(tokenizedSongs.artistId, artistId))
      .orderBy(desc(tokenPurchases.createdAt));

    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

router.get('/earnings/:artistId', async (req, res) => {
  try {
    const artistId = parseInt(req.params.artistId);
    if (isNaN(artistId)) {
      return res.status(400).json({ error: 'Invalid artist ID' });
    }

    const earnings = await db.select().from(artistTokenEarnings)
      .where(eq(artistTokenEarnings.artistId, artistId))
      .orderBy(desc(artistTokenEarnings.createdAt));

    const totalEarnings = earnings.reduce((acc, earning) => {
      return acc + parseFloat(earning.amountEth || '0');
    }, 0);

    res.json({
      earnings,
      totalEarningsEth: totalEarnings.toString(),
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

router.put('/song/:id/toggle', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid song ID' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [song] = await db.select().from(tokenizedSongs)
      .where(eq(tokenizedSongs.id, id))
      .limit(1);

    if (!song) {
      return res.status(404).json({ error: 'Tokenized song not found' });
    }

    if (song.artistId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [updated] = await db.update(tokenizedSongs)
      .set({ 
        isActive: !song.isActive,
        updatedAt: new Date()
      })
      .where(eq(tokenizedSongs.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error toggling song status:', error);
    res.status(500).json({ error: 'Failed to toggle song status' });
  }
});

router.get('/wallet/:walletAddress/tokens', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const userTokens = await db.select({
      purchase: tokenPurchases,
      song: tokenizedSongs,
      artist: {
        id: users.id,
        artistName: users.artistName,
        slug: users.slug,
      },
    })
      .from(tokenPurchases)
      .innerJoin(tokenizedSongs, eq(tokenPurchases.tokenizedSongId, tokenizedSongs.id))
      .innerJoin(users, eq(tokenizedSongs.artistId, users.id))
      .where(and(
        eq(tokenPurchases.buyerWalletAddress, walletAddress),
        eq(tokenPurchases.status, 'confirmed')
      ))
      .orderBy(desc(tokenPurchases.createdAt));

    res.json(userTokens);
  } catch (error) {
    console.error('Error fetching wallet tokens:', error);
    res.status(500).json({ error: 'Failed to fetch wallet tokens' });
  }
});

router.post('/ai/improve-description', async (req, res) => {
  try {
    const { songName, currentDescription } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Eres un experto en marketing musical y tokenización NFT. 
    
Nombre de la canción: "${songName}"
Descripción actual: "${currentDescription || 'Sin descripción'}"

Mejora esta descripción para una canción tokenizada en blockchain. La descripción debe:
- Ser atractiva y profesional (2-3 párrafos)
- Destacar el valor único de poseer tokens de esta canción
- Mencionar beneficios potenciales para los holders
- Usar lenguaje emocionante pero profesional
- Máximo 200 palabras

Responde SOLO con la descripción mejorada, sin explicaciones adicionales.`;

    const result = await model.generateContent(prompt);
    const improvedDescription = result.response.text();

    res.json({ description: improvedDescription });
  } catch (error: any) {
    console.error('Error improving description:', error);
    res.status(500).json({ error: 'Failed to improve description' });
  }
});

router.post('/ai/generate-image', async (req, res) => {
  try {
    const { songName, description } = req.body;
    
    const prompt = `Professional album cover art for the song "${songName}". 
${description ? `${description}. ` : ''}
High quality music cover art, vibrant colors, eye-catching design, modern style, professional photography, studio quality, 4k, artistic composition`;

    // Try nano banana (gemini-2.5-flash-image) first with Replit AI Integrations
    if (process.env.AI_INTEGRATIONS_GEMINI_BASE_URL && process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
      try {
        console.log('Generating image with nano banana (gemini-2.5-flash-image) for song:', songName);
        
        const ai = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
          httpOptions: {
            apiVersion: "",
            baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
          },
        });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        });

        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
        
        if (imagePart?.inlineData?.data) {
          const mimeType = imagePart.inlineData.mimeType || "image/png";
          const imageUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`;
          console.log('Image generated successfully with nano banana');
          return res.json({ imageUrl });
        }
      } catch (nanoBananaError: any) {
        console.warn('Nano banana failed, falling back to FAL:', nanoBananaError.message);
      }
    }

    // Fallback to FAL if nano banana fails or isn't available
    if (!process.env.FAL_KEY) {
      return res.status(500).json({ error: 'No image generation service configured' });
    }

    console.log('Generating image with FAL for song:', songName);
    
    fal.config({
      credentials: process.env.FAL_KEY
    });
    
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: prompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: false,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('FAL generation progress:', update.logs);
        }
      },
    }) as any;

    if (result && result.images && result.images.length > 0) {
      const imageUrl = result.images[0].url;
      console.log('Image generated successfully with FAL');
      res.json({ imageUrl });
    } else {
      throw new Error('No image generated');
    }
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
});

export default router;
