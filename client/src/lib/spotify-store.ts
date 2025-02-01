import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface SpotifyData {
  accessToken: string | null;
  refreshToken: string | null;
  followers: number;
  monthlyListeners: number;
  playlistPlacements: number;
  totalStreams: number;
  lastUpdated: Date;
  topTracks: Array<{
    name: string;
    streams: number;
    playlistAdds: number;
  }>;
  dailyStats: Array<{
    date: string;
    streams: number;
    followers: number;
    playlistAdds: number;
  }>;
  demographics: {
    countries: Array<{
      name: string;
      listeners: number;
    }>;
    ageRanges: Array<{
      range: string;
      percentage: number;
    }>;
  };
}

export interface SpotifyAnalytics {
  dailyStats: SpotifyData['dailyStats'];
  topTracks: SpotifyData['topTracks'];
  demographics: SpotifyData['demographics'];
}

export async function getSpotifyData(user: User): Promise<SpotifyData | null> {
  if (!user) return null;

  try {
    const spotifyDocRef = doc(db, 'spotify_data', user.uid);
    const spotifyDoc = await getDoc(spotifyDocRef);

    if (spotifyDoc.exists()) {
      const data = spotifyDoc.data();
      // Convertir Timestamp de Firestore a Date de JavaScript
      const lastUpdated = data.lastUpdated?.toDate?.() || new Date();
      return {
        ...data,
        lastUpdated,
      } as SpotifyData;
    }

    return null;
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    throw error;
  }
}

export async function getSpotifyAnalytics(user: User): Promise<SpotifyAnalytics | null> {
  if (!user) return null;

  try {
    const spotifyData = await getSpotifyData(user);
    if (!spotifyData) return null;

    return {
      dailyStats: spotifyData.dailyStats || [],
      topTracks: spotifyData.topTracks || [],
      demographics: spotifyData.demographics || {
        countries: [],
        ageRanges: []
      }
    };
  } catch (error) {
    console.error('Error fetching Spotify analytics:', error);
    throw error;
  }
}