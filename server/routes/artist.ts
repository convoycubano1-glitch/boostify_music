import { Router } from 'express';
import { db } from '@db';
import { users, marketingMetrics } from '@db/schema';
import { eq } from 'drizzle-orm';
import { db as firestore } from '../firebase';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user data from PostgreSQL
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Get marketing metrics from PostgreSQL
    const [metrics] = await db
      .select()
      .from(marketingMetrics)
      .where(eq(marketingMetrics.userId, user.id))
      .limit(1);

    // Get music from Firestore
    const musicSnapshot = await firestore
      .collection('songs')
      .where('userId', '==', user.id)
      .get();

    const music = musicSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.name,
        url: data.audioUrl,
        storageRef: data.storageRef,
        createdAt: data.createdAt?.toDate()
      };
    });

    // Get videos from Firestore
    const videosSnapshot = await firestore
      .collection('videos')
      .where('userId', '==', user.id)
      .get();

    const videos = videosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        url: data.url,
        thumbnail: data.thumbnailUrl,
        createdAt: data.createdAt?.toDate()
      };
    });

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