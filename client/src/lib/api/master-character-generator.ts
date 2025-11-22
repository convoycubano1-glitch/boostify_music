/**
 * Master Character Generator with Multi-Angle Support & Casting
 * Generates high-quality artist portraits from multiple camera angles + casting actors
 */

import { analyzeFaceFeatures, generateMasterCharacterPrompt, type FaceAnalysis } from './face-analyzer';
import { logger } from "../logger";

export interface CharacterPortrait {
  angle: 'frontal' | 'left-profile' | 'right-profile' | 'three-quarter';
  imageUrl: string;
  description: string;
}

export interface CastingMember {
  role: string;
  characterName: string;
  description: string;
  imageUrl: string;
}

export interface MasterCharacterMultiAngle {
  mainCharacter: {
    imageUrl: string;
    angles: CharacterPortrait[];
  };
  casting: CastingMember[];
  analysis: FaceAnalysis;
  prompt: string;
  timestamp: Date;
}

/**
 * Generates Master Character with multiple camera angles for consistency
 * Each angle: frontal, left-profile, right-profile, three-quarter
 * Professional studio photography style
 */
export async function generateMasterCharacterMultiAngle(
  artistPhotos: string[],
  directorStyle: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<MasterCharacterMultiAngle> {
  try {
    logger.info('🎭 [MASTER CHARACTER] Starting multi-angle generation with casting...');
    
    onProgress?.('Analyzing reference images...', 10);

    const baseCharacterPrompt = `Create a professional studio photography style portrait of the artist character based on the reference images.

CRITICAL REQUIREMENTS FOR ALL ANGLES:
- Maintain EXACT facial identity, features, and skin tone across all angles
- Professional studio lighting (key light, fill light, back light)
- White or neutral background
- High-resolution 8K quality
- Sharp focus on facial details
- Professional color grading
- Movie-level cinematography`;

    // Generate 4 different angles of the main character
    const angles: CharacterPortrait[] = [];
    const anglePrompts = [
      {
        angle: 'frontal' as const,
        instruction: 'Direct frontal view, looking straight at camera, professional headshot style, symmetrical lighting'
      },
      {
        angle: 'left-profile' as const,
        instruction: '90-degree left profile, clean side view showing facial structure, profile lighting with subtle rim light'
      },
      {
        angle: 'right-profile' as const,
        instruction: '90-degree right profile, clean side view showing facial structure, profile lighting with subtle rim light'
      },
      {
        angle: 'three-quarter' as const,
        instruction: '45-degree three-quarter view between frontal and side, most flattering angle, dimensional lighting'
      }
    ];

    let progress = 20;
    for (const angleData of anglePrompts) {
      const anglePrompt = `${baseCharacterPrompt}

CAMERA ANGLE: ${angleData.instruction}
Style: ${directorStyle}
Studio Setting: Professional photography studio with cinematic lighting`;

      onProgress?.(`Generating ${angleData.angle.replace('-', ' ')} angle...`, progress);

      try {
        const response = await fetch('/api/gemini-image/generate-master-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referenceImagesBase64: artistPhotos,
            prompt: anglePrompt,
            directorStyle: directorStyle
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.imageUrl) {
            angles.push({
              angle: angleData.angle,
              imageUrl: data.imageUrl,
              description: angleData.instruction
            });
            logger.info(`✅ Generated ${angleData.angle} angle`);
          }
        }
      } catch (error) {
        logger.warn(`⚠️ Error generating ${angleData.angle}:`, error);
      }
      progress += 15;
    }

    // Generate casting members
    onProgress?.('Generating cast members...', 80);

    const castingRoles = [
      {
        role: 'Lead Supporting Actor',
        characterName: 'Protagonist',
        instruction: 'professional male actor, cinematic headshot, studio lighting'
      },
      {
        role: 'Supporting Actress',
        characterName: 'Secondary Character',
        instruction: 'professional female actress, cinematic headshot, studio lighting'
      },
      {
        role: 'Background Actor 1',
        characterName: 'Ensemble Member',
        instruction: 'diverse male actor, cinematic headshot, studio lighting'
      },
      {
        role: 'Background Actress 2',
        characterName: 'Ensemble Member',
        instruction: 'diverse female actress, cinematic headshot, studio lighting'
      }
    ];

    const casting: CastingMember[] = [];

    for (const castingRole of castingRoles) {
      try {
        const castingPrompt = `Create a professional cinema-style headshot for a casting call.
Role: ${castingRole.role}
Character: ${castingRole.characterName}
Style: ${castingRole.instruction}

REQUIREMENTS:
- Professional studio photography style
- 8K resolution, sharp focus
- Cinematic lighting with key, fill, and back light
- Neutral/white background for casting
- Professional color grading
- Movie production quality headshot
- Photorealistic rendering
- Suitable for music video casting`;

        const response = await fetch('/api/gemini-image/generate-casting-headshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: castingPrompt,
            role: castingRole.role
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.imageUrl) {
            casting.push({
              role: castingRole.role,
              characterName: castingRole.characterName,
              description: castingRole.instruction,
              imageUrl: data.imageUrl
            });
            logger.info(`✅ Generated casting for ${castingRole.role}`);
          }
        }
      } catch (error) {
        logger.warn(`⚠️ Error generating casting for ${castingRole.role}:`, error);
      }
    }

    onProgress?.('Finalizing character generation...', 95);

    // Create simplified analysis
    const simplifiedAnalysis: FaceAnalysis = {
      faceShape: 'from reference images',
      jawline: 'from reference images',
      cheekbones: 'from reference images',
      eyeShape: 'from reference images',
      eyeColor: 'from reference images',
      eyeSize: 'from reference images',
      eyebrowShape: 'from reference images',
      eyeSpacing: 'from reference images',
      noseShape: 'from reference images',
      noseSize: 'from reference images',
      lipShape: 'from reference images',
      lipSize: 'from reference images',
      smileType: 'from reference images',
      hairColor: 'from reference images',
      hairTexture: 'from reference images',
      hairStyle: 'from reference images',
      hairline: 'from reference images',
      skinTone: 'from reference images',
      skinTexture: 'from reference images',
      distinctiveFeatures: ['Multi-angle studio photography'],
      typicalExpression: 'professional',
      facialProportions: {
        foreheadSize: 'from reference images',
        eyeToEyeDistance: 'from reference images',
        noseToLipDistance: 'from reference images',
        chinSize: 'from reference images'
      },
      apparentAge: 'from reference images',
      perceivedGender: 'from reference images',
      overallDescription: 'Master character with multi-angle portraits and professional casting',
      generationPrompt: baseCharacterPrompt
    };

    const result: MasterCharacterMultiAngle = {
      mainCharacter: {
        imageUrl: angles[0]?.imageUrl || '',
        angles: angles
      },
      casting: casting,
      analysis: simplifiedAnalysis,
      prompt: baseCharacterPrompt,
      timestamp: new Date()
    };

    onProgress?.('Character and casting generation complete!', 100);
    logger.info('✅ [MASTER CHARACTER] Multi-angle generation successful');

    return result;

  } catch (error) {
    logger.error('❌ [MASTER CHARACTER] Error:', error);
    throw error;
  }
}

/**
 * Validates character generation result
 */
export function validateMasterCharacterMultiAngle(character: MasterCharacterMultiAngle): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!character.mainCharacter.imageUrl) {
    issues.push('No main character image');
  }

  if (!character.mainCharacter.angles || character.mainCharacter.angles.length < 2) {
    issues.push('Need at least 2 angle variations');
  }

  if (!character.casting || character.casting.length === 0) {
    issues.push('No casting members generated');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
