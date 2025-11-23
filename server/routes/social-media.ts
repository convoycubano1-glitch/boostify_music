/**
 * Social Media Content Generator Routes
 * Genera contenido viral para Facebook, Instagram y TikTok
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
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
 * Genera posts para Facebook, Instagram y TikTok
 */
router.post('/generate-content', async (req: Request, res: Response) => {
  try {
    const validated = generateContentSchema.parse(req.body);

    const result = await generateSocialMediaContent(
      validated.artistName,
      validated.biography,
      validated.profileUrl
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate content'
      });
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

export default router;
