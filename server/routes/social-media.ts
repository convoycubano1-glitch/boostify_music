/**
 * Social Media Content Generator Routes
 * Genera contenido viral para Facebook, Instagram y TikTok
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { socialMediaPosts } from '../db/schema';
import { generateSocialMediaContent } from '../services/social-media-service';

const router = Router();

// Validación de input
const generateContentSchema = z.object({
  artistName: z.string().min(1),
  biography: z.string().min(10),
  profileUrl: z.string().url(),
  postgresId: z.number().optional()
});

/**
 * POST /api/social-media/generate-content
 * Genera posts para Facebook, Instagram y TikTok y los guarda
 */
router.post('/generate-content', async (req: Request, res: Response) => {
  try {
    const validated = generateContentSchema.parse(req.body);

    const result = await generateSocialMediaContent(
      validated.artistName,
      validated.biography,
      validated.profileUrl,
      validated.postgresId
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate content'
      });
    }

    // Guardar posts en la BD si existe userId
    if (validated.postgresId && result.posts) {
      try {
        for (const post of result.posts) {
          await db.insert(socialMediaPosts).values({
            userId: validated.postgresId,
            platform: post.platform,
            caption: post.caption,
            hashtags: post.hashtags,
            cta: post.cta,
            viralScore: post.viralScore || 0,
            isPublished: true
          });
        }
        console.log('✅ Posts saved to database');
      } catch (dbError) {
        console.error('⚠️ Error saving posts to database:', dbError);
        // No fallar el request si no se puede guardar
      }
    }

    return res.json({
      success: true,
      posts: result.posts || [],
      message: 'Social media content generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating social media content:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/social-media/posts/:userId
 * Obtiene los posts de redes sociales de un artista
 */
router.get('/posts/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const numUserId = parseInt(userId);

    if (isNaN(numUserId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const posts = await db
      .select()
      .from(socialMediaPosts)
      .where(
        (table) => (table.userId = numUserId && table.isPublished = true)
      )
      .orderBy((table) => table.createdAt);

    return res.json({
      success: true,
      posts: posts || [],
      count: posts?.length || 0
    });
  } catch (error: any) {
    console.error('Error fetching social media posts:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch posts'
    });
  }
});

export default router;
