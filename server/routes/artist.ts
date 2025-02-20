import { Router } from 'express';
import { db } from '@db';
import { users, marketingMetrics, analyticsHistory } from '@db/schema';
import { eq } from 'drizzle-orm';

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

    // Get music and videos (mock data for now)
    const mockData = {
      music: [
        {
          id: '1',
          title: 'Summer Vibes',
          duration: '3:45',
          url: '/assets/music/track1.mp3'
        },
        {
          id: '2',
          title: 'City Lights',
          duration: '4:20',
          url: '/assets/music/track2.mp3'
        }
      ],
      videos: [
        {
          id: '1',
          title: 'Music Video 1',
          thumbnail: '/assets/thumbnails/video1.jpg',
          url: '/assets/videos/video1.mp4'
        },
        {
          id: '2',
          title: 'Music Video 2',
          thumbnail: '/assets/thumbnails/video2.jpg',
          url: '/assets/videos/video2.mp4'
        }
      ],
      biography: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
      technicalRider: {
        stage: 'Standard stage setup with minimum dimensions of 6x4 meters',
        sound: 'Professional PA system with minimum 4 monitor speakers',
        lighting: 'Basic stage lighting with ability to control colors and intensity',
        backline: 'Drum kit, bass amp, and guitar amps provided by venue'
      }
    };

    // Combine all data
    const artistData = {
      name: user.username,
      biography: mockData.biography,
      genre: 'Pop/Rock', // This should come from a proper field in the future
      location: 'San Francisco, CA', // This should come from a proper field in the future
      email: 'artist@example.com', // This should come from a proper field in the future
      phone: '+1 (555) 123-4567', // This should come from a proper field in the future
      website: 'www.artistwebsite.com', // This should come from a proper field in the future
      socialMedia: {
        instagram: 'artist_instagram',
        twitter: 'artist_twitter',
        youtube: 'artist_youtube'
      },
      stats: {
        monthlyListeners: metrics?.monthlyListeners || 0,
        followers: metrics?.instagramFollowers || 0,
        views: metrics?.youtubeViews || 0
      },
      technicalRider: mockData.technicalRider,
      music: mockData.music,
      videos: mockData.videos
    };

    res.json(artistData);
  } catch (error) {
    console.error('Error fetching artist data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
