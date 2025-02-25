import { Router } from 'express';
import { db } from '@db';
import { users, marketingMetrics, artistMedia } from '@db/schema';
import { eq } from 'drizzle-orm';
import { getStorage } from 'firebase-admin/storage';
import { firebaseAdmin } from '../firebase';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Get marketing metrics
    const [metrics] = await db
      .select()
      .from(marketingMetrics)
      .where(eq(marketingMetrics.userId, user.id))
      .limit(1);

    // Get artist media from database
    const media = await db
      .select()
      .from(artistMedia)
      .where(eq(artistMedia.userId, user.id));

    // Process media files through Firebase Storage
    const storage = getStorage(firebaseAdmin);
    const bucket = storage.bucket();

    const processedMedia = await Promise.all(media.map(async (item) => {
      try {
        const file = bucket.file(item.storagePath);
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
        });

        return {
          ...item,
          url
        };
      } catch (error) {
        console.error(`Error getting signed URL for ${item.storagePath}:`, error);
        return null;
      }
    }));

    // Filter out failed items and separate into music and videos
    const validMedia = processedMedia.filter(item => item !== null);
    const music = validMedia.filter(item => item.type === 'audio');
    const videos = validMedia.filter(item => item.type === 'video');

    // Combine all data
    const artistData = {
      name: user.username,
      biography: user.biography || 'Biography not available',
      genre: user.genre || 'Genre not specified',
      location: user.location || 'Location not specified',
      email: user.email,
      phone: user.phone || 'Phone not specified',
      website: user.website || '',
      socialMedia: {
        instagram: user.instagramHandle || '',
        twitter: user.twitterHandle || '',
        youtube: user.youtubeChannel || ''
      },
      stats: {
        monthlyListeners: metrics?.monthlyListeners || 0,
        followers: metrics?.instagramFollowers || 0,
        views: metrics?.youtubeViews || 0
      },
      music,
      videos,
      technicalRider: user.technicalRider || {
        stage: 'Standard stage setup with minimum dimensions of 6x4 meters',
        sound: 'Professional PA system with minimum 4 monitor speakers',
        lighting: 'Basic stage lighting with ability to control colors and intensity',
        backline: 'Drum kit, bass amp, and guitar amps provided by venue'
      }
    };

    res.json(artistData);
  } catch (error) {
    console.error('Error fetching artist data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;