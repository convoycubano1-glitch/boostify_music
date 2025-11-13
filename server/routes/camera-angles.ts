import { Router } from 'express';
import { generateCinematicImage } from '../services/gemini-image-service';
import { logger } from '../utils/logger';

const router = Router();

const CAMERA_ANGLES = [
  {
    id: 'close-up',
    name: 'Close-Up',
    emoji: '🔍',
    description: 'Extreme close-up shot, intimate detail',
    prompt: 'Close-up shot, tight framing on subject, shallow depth of field, intimate perspective, detailed facial features visible'
  },
  {
    id: 'wide',
    name: 'Wide Shot',
    emoji: '🌐',
    description: 'Wide establishing shot',
    prompt: 'Wide shot, full scene visible, establishing perspective, show environment and context, distant view'
  },
  {
    id: 'medium',
    name: 'Medium Shot',
    emoji: '👤',
    description: 'Medium framing',
    prompt: 'Medium shot, waist up framing, balanced composition, standard cinematic framing'
  },
  {
    id: 'low-angle',
    name: 'Low Angle (Jib)',
    emoji: '⬆️',
    description: 'Looking up at subject',
    prompt: 'Low angle shot, camera looking up from below, dramatic perspective, heroic framing, powerful composition'
  }
];

router.post('/api/clips/generate-camera-angles', async (req, res) => {
  try {
    const { originalPrompt, clipId } = req.body;

    if (!originalPrompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Original prompt is required' 
      });
    }

    logger.log(`📷 Generating 4 camera angle variations for clip ${clipId}`);
    logger.log(`📝 Original prompt: ${originalPrompt.substring(0, 100)}...`);

    // Generate all 4 angles in parallel
    const generationPromises = CAMERA_ANGLES.map(async (angle) => {
      try {
        const enhancedPrompt = `${originalPrompt}

CAMERA ANGLE: ${angle.prompt}

CRITICAL INSTRUCTIONS:
- Keep the EXACT same scene, characters, mood, lighting, and setting
- ONLY change the camera angle and framing
- Maintain consistency with the original concept
- Use the camera angle to create visual variety while preserving the story`;

        logger.log(`📸 Generating ${angle.name} variation...`);
        
        const result = await generateCinematicImage(enhancedPrompt);

        if (!result.success || !result.imageUrl) {
          logger.error(`❌ Failed to generate ${angle.name}:`, result.error);
          return {
            angle: angle.id,
            name: angle.name,
            emoji: angle.emoji,
            success: false,
            error: result.error || 'Generation failed',
            imageUrl: null
          };
        }

        logger.log(`✅ ${angle.name} generated successfully`);
        
        return {
          angle: angle.id,
          name: angle.name,
          emoji: angle.emoji,
          success: true,
          imageUrl: result.imageUrl,
          prompt: enhancedPrompt
        };
      } catch (error: any) {
        logger.error(`❌ Error generating ${angle.name}:`, error);
        return {
          angle: angle.id,
          name: angle.name,
          emoji: angle.emoji,
          success: false,
          error: error.message,
          imageUrl: null
        };
      }
    });

    const variations = await Promise.all(generationPromises);

    const successCount = variations.filter(v => v.success).length;
    logger.log(`✅ Generated ${successCount}/4 camera angle variations`);

    res.json({
      success: true,
      variations,
      totalGenerated: successCount,
      clipId
    });
  } catch (error: any) {
    logger.error('Error generating camera angles:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate camera angles' 
    });
  }
});

router.get('/api/clips/camera-angles/list', (req, res) => {
  res.json({
    success: true,
    angles: CAMERA_ANGLES
  });
});

export default router;
