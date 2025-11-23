import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { prCampaigns, prMediaDatabase, prWebhookEvents, insertPRCampaignSchema, users } from '../../db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/wwvf4anizf0gc9yr3wyoax6ip1n7rj7w';
const GEMINI_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

/**
 * GET /api/pr/campaigns
 * Lista todas las campañas del usuario
 */
router.get('/campaigns', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const campaigns = await db.select().from(prCampaigns)
      .where(eq(prCampaigns.userId, req.user.id))
      .orderBy(desc(prCampaigns.createdAt));

    res.json({ success: true, campaigns });
  } catch (error) {
    console.error('[PR CAMPAIGNS LIST ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener campañas' });
  }
});

/**
 * GET /api/pr/campaigns/:id
 * Obtiene detalles de una campaña específica
 */
router.get('/campaigns/:id', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const campaignId = parseInt(req.params.id);
    
    const [campaign] = await db.select().from(prCampaigns)
      .where(and(
        eq(prCampaigns.id, campaignId),
        eq(prCampaigns.userId, req.user.id)
      ))
      .limit(1);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
    }

    // Get recent events for this campaign
    const events = await db.select().from(prWebhookEvents)
      .where(eq(prWebhookEvents.campaignId, campaignId))
      .orderBy(desc(prWebhookEvents.createdAt))
      .limit(20);

    res.json({ 
      success: true, 
      campaign,
      events
    });
  } catch (error) {
    console.error('[PR CAMPAIGN DETAILS ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener detalles de campaña' });
  }
});

/**
 * POST /api/pr/campaigns
 * Crea una nueva campaña PR
 */
router.post('/campaigns', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    // Parse and validate request data with defaults for arrays
    const bodyData = {
      userId: req.user.id,
      title: req.body.title || '',
      artistName: req.body.artistName || '',
      artistProfileUrl: req.body.artistProfileUrl || '',
      contentType: req.body.contentType || 'single',
      contentTitle: req.body.contentTitle || '',
      contentUrl: req.body.contentUrl || '',
      targetMediaTypes: Array.isArray(req.body.targetMediaTypes) ? req.body.targetMediaTypes : [],
      targetCountries: Array.isArray(req.body.targetCountries) ? req.body.targetCountries : [],
      targetGenres: Array.isArray(req.body.targetGenres) ? req.body.targetGenres : [],
      pitchMessage: req.body.pitchMessage || '',
      contactEmail: req.body.contactEmail || '',
      contactPhone: req.body.contactPhone || '',
      campaignImage: req.body.campaignImage || '',
      status: 'draft'
    };

    // Validate data
    const validatedData = insertPRCampaignSchema.parse(bodyData);

    const [newCampaign] = await db.insert(prCampaigns).values(validatedData).returning();

    res.json({
      success: true,
      message: 'Campaña creada exitosamente',
      campaign: newCampaign
    });
  } catch (error: any) {
    console.error('[PR CREATE CAMPAIGN ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Error al crear campaña' });
  }
});

/**
 * PUT /api/pr/campaigns/:id
 * Actualiza una campaña (solo si status = draft)
 */
router.put('/campaigns/:id', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const campaignId = parseInt(req.params.id);
    
    const [campaign] = await db.select().from(prCampaigns)
      .where(and(
        eq(prCampaigns.id, campaignId),
        eq(prCampaigns.userId, req.user.id)
      ))
      .limit(1);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
    }

    if (campaign.status !== 'draft') {
      return res.status(403).json({ success: false, message: 'Solo puedes editar campañas en borrador' });
    }

    const [updatedCampaign] = await db.update(prCampaigns)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(prCampaigns.id, campaignId))
      .returning();

    res.json({
      success: true,
      message: 'Campaña actualizada',
      campaign: updatedCampaign
    });
  } catch (error: any) {
    console.error('[PR UPDATE CAMPAIGN ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Error al actualizar campaña' });
  }
});

/**
 * POST /api/pr/campaigns/:id/activate
 * Activa una campaña, obtiene el perfil completo del artista y envía todo al webhook de Make.com
 */
router.post('/campaigns/:id/activate', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const campaignId = parseInt(req.params.id);
    
    // Get campaign
    const [campaign] = await db.select().from(prCampaigns)
      .where(and(
        eq(prCampaigns.id, campaignId),
        eq(prCampaigns.userId, req.user.id)
      ))
      .limit(1);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
    }

    // Get COMPLETE artist profile from database
    const [artist] = await db.select().from(users)
      .where(eq(users.id, campaign.userId))
      .limit(1);

    if (!artist) {
      return res.status(404).json({ success: false, message: 'Perfil del artista no encontrado' });
    }

    // Get target media based on campaign targets
    if (campaign.targetMediaTypes && campaign.targetMediaTypes.length > 0) {
      const mediaList = await db.select().from(prMediaDatabase)
        .where(and(
          eq(prMediaDatabase.isActive, true),
          inArray(prMediaDatabase.type, campaign.targetMediaTypes as any[])
        ));
      
      const targetMedia = mediaList.map(media => ({
        id: media.id,
        name: media.name,
        type: media.type,
        email: media.email,
        country: media.country,
        city: media.city,
        genres: media.genres,
        language: media.language
      }));

      // Build COMPLETE artist profile to send to webhook
      const artistProfile = {
        // Basic info
        id: artist.id,
        artistName: artist.artistName || artist.firstName || '',
        realName: artist.realName || '',
        email: artist.email || '',
        phone: artist.phone || '',
        
        // Profile URLs and images
        profileUrl: campaign.artistProfileUrl || `https://boostify.app/artist/${artist.slug || artist.artistName?.toLowerCase().replace(/\s+/g, '-')}`,
        profileImage: artist.profileImage || '',
        coverImage: artist.coverImage || '',
        
        // Biography and info
        biography: artist.biography || '',
        genre: artist.genre || '',
        genres: artist.genres || [],
        location: artist.location || '',
        country: artist.country || '',
        
        // Social media
        spotifyUrl: artist.spotifyUrl || '',
        instagramHandle: artist.instagramHandle || '',
        twitterHandle: artist.twitterHandle || '',
        youtubeChannel: artist.youtubeChannel || '',
        facebookUrl: artist.facebookUrl || '',
        tiktokUrl: artist.tiktokUrl || '',
        
        // Website
        website: artist.website || '',
        
        // Additional content
        topYoutubeVideos: artist.topYoutubeVideos || [],
        concerts: artist.concerts || { upcoming: [], highlights: [] }
      };

      // Prepare COMPLETE payload for Make.com with full artist profile
      const makePayload = {
        campaignId: campaign.id,
        
        // Campaign details
        campaignTitle: campaign.title,
        contentType: campaign.contentType,
        contentTitle: campaign.contentTitle,
        contentUrl: campaign.contentUrl,
        campaignImage: campaign.campaignImage || '',
        
        // Artist PROFILE (complete)
        artistProfile: artistProfile,
        
        // Campaign contact info
        contactEmail: campaign.contactEmail,
        contactPhone: campaign.contactPhone,
        pitchMessage: campaign.pitchMessage,
        
        // Target details
        targetCountries: campaign.targetCountries || [],
        targetGenres: campaign.targetGenres || [],
        
        // Media to contact
        targetMedia: targetMedia,
        mediaCount: targetMedia.length,
        
        // Webhook callback URL
        webhookUrl: `${process.env.REPLIT_DEV_DOMAIN || 'https://boostify.app'}/api/pr/webhooks/event`,
        
        // Timestamp
        activatedAt: new Date().toISOString()
      };

      console.log('[PR ACTIVATE] Sending payload to Make.com:', JSON.stringify(makePayload, null, 2));

      // Send to Make.com webhook
      const makeResponse = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(makePayload)
      });

      if (!makeResponse.ok) {
        throw new Error(`Make.com webhook failed: ${makeResponse.statusText}`);
      }

      // Update campaign status
      const [updatedCampaign] = await db.update(prCampaigns)
        .set({
          status: 'active',
          mediaContacted: targetMedia.length,
          lastSyncAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(prCampaigns.id, campaignId))
        .returning();

      res.json({
        success: true,
        message: `Campaña activada! Se contactarán ${targetMedia.length} medios. Perfil del artista enviado a ${targetMedia.length} outlets.`,
        campaign: updatedCampaign,
        mediaCount: targetMedia.length,
        artistProfile: artistProfile
      });
    } else {
      return res.status(400).json({ success: false, message: 'No hay tipos de medios seleccionados' });
    }
  } catch (error: any) {
    console.error('[PR ACTIVATE CAMPAIGN ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Error al activar campaña' });
  }
});

/**
 * POST /api/pr/campaigns/:id/pause
 * Pausa una campaña activa
 */
router.post('/campaigns/:id/pause', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const campaignId = parseInt(req.params.id);
    
    const [campaign] = await db.select().from(prCampaigns)
      .where(and(
        eq(prCampaigns.id, campaignId),
        eq(prCampaigns.userId, req.user.id)
      ))
      .limit(1);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
    }

    const [updatedCampaign] = await db.update(prCampaigns)
      .set({
        status: 'paused',
        updatedAt: new Date()
      })
      .where(eq(prCampaigns.id, campaignId))
      .returning();

    res.json({
      success: true,
      message: 'Campaña pausada',
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('[PR PAUSE CAMPAIGN ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al pausar campaña' });
  }
});

/**
 * POST /api/pr/webhooks/event
 * Webhook receptor para eventos de Make.com
 */
router.post('/webhooks/event', async (req: Request, res: Response) => {
  try {
    const { campaignId, eventType, mediaName, mediaEmail, notes, ...payload } = req.body;

    if (!campaignId || !eventType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Save webhook event
    const [event] = await db.insert(prWebhookEvents).values({
      campaignId,
      eventType,
      payload: payload,
      mediaName,
      mediaEmail,
      notes
    }).returning();

    // Update campaign stats based on event type
    const updateData: any = { lastSyncAt: new Date() };
    
    switch (eventType) {
      case 'email_opened':
        updateData.emailsOpened = db.$count(prWebhookEvents, eq(prWebhookEvents.eventType, 'email_opened'));
        break;
      case 'media_replied':
        updateData.mediaReplied = db.$count(prWebhookEvents, eq(prWebhookEvents.eventType, 'media_replied'));
        break;
      case 'interview_booked':
        updateData.interviewsBooked = db.$count(prWebhookEvents, eq(prWebhookEvents.eventType, 'interview_booked'));
        break;
    }

    // Get current campaign stats
    const [campaign] = await db.select().from(prCampaigns)
      .where(eq(prCampaigns.id, campaignId))
      .limit(1);

    if (campaign) {
      const updates: any = { lastSyncAt: new Date() };
      
      if (eventType === 'email_opened') updates.emailsOpened = campaign.emailsOpened + 1;
      if (eventType === 'media_replied') updates.mediaReplied = campaign.mediaReplied + 1;
      if (eventType === 'interview_booked') updates.interviewsBooked = campaign.interviewsBooked + 1;

      await db.update(prCampaigns)
        .set(updates)
        .where(eq(prCampaigns.id, campaignId));
    }

    res.json({ success: true, event });
  } catch (error) {
    console.error('[PR WEBHOOK ERROR]', error);
    res.status(500).json({ success: false, message: 'Error processing webhook' });
  }
});

/**
 * GET /api/pr/media
 * Lista medios disponibles (con filtros opcionales)
 */
router.get('/media', authenticate, async (req: Request, res: Response) => {
  try {
    const { type, country, genre } = req.query;

    let query = db.select().from(prMediaDatabase)
      .where(eq(prMediaDatabase.isActive, true));

    const media = await query;

    res.json({ success: true, media, total: media.length });
  } catch (error) {
    console.error('[PR MEDIA LIST ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener medios' });
  }
});

/**
 * POST /api/pr/generate-image
 * Genera descripción y metadata de imagen usando Gemini AI
 */
router.post('/generate-image', authenticate, async (req: Request, res: Response) => {
  try {
    const { artistName, contentType, contentTitle, genres } = req.body;
    
    if (!artistName || !contentTitle) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Generate image description using Gemini AI
    try {
      const prompt = `Create a detailed image description for a music promotional campaign. Return ONLY valid JSON with no markdown, no backticks, just raw JSON:

{
  "title": "Professional campaign image title",
  "description": "Detailed description of a stunning modern music promotional image",
  "style": "modern/vibrant/professional",
  "colors": ["color1", "color2", "color3"],
  "elements": ["element1", "element2"],
  "tips": "Additional design tips for this genre"
}

Artist: ${artistName}
Content: ${contentTitle}
Type: ${contentType}
Genres: ${genres?.join(', ') || 'music'}`;

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const response = await model.generateContent(prompt);
      const textContent = response.response.candidates?.[0]?.content?.parts?.[0];
      
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No valid response from AI');
      }

      let imageMetadata;
      try {
        imageMetadata = JSON.parse(textContent.text);
      } catch (e) {
        // Fallback if JSON parsing fails
        imageMetadata = {
          title: `${contentTitle} - Campaign Image`,
          description: `Professional promotional image for ${artistName}'s ${contentType}`,
          style: 'modern',
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
          elements: ['artist name', 'content title', 'modern typography', 'vibrant gradient'],
          tips: `Perfect for reaching media in the ${genres?.[0] || 'music'} genre`
        };
      }

      res.json({
        success: true,
        message: 'Image metadata generated successfully',
        image: {
          ...imageMetadata,
          generatedAt: new Date().toISOString(),
          artistName,
          contentType,
          contentTitle,
          genres: genres || []
        }
      });
    } catch (aiError: any) {
      console.error('[GEMINI AI ERROR]', aiError);
      // Fallback to basic template if Gemini fails
      res.json({
        success: true,
        message: 'Image template generated (Gemini fallback)',
        image: {
          title: `${contentTitle} - Campaign Image`,
          description: `Professional promotional image for ${artistName}'s ${contentType}`,
          style: 'modern',
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
          elements: ['artist name', 'content title', 'modern typography', 'vibrant gradient'],
          tips: `Perfect for reaching media outlets`,
          artistName,
          contentType,
          contentTitle,
          genres: genres || [],
          generatedAt: new Date().toISOString()
        }
      });
    }
  } catch (error: any) {
    console.error('[PR GENERATE IMAGE ERROR]', error);
    res.status(400).json({ success: false, message: 'Image generation requires valid artist and content information' });
  }
});

export default router;
