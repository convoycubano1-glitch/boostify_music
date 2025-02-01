import { db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface SpotifyData {
  accessToken: string | null;
  refreshToken: string | null;
  followers: number;
  monthlyListeners: number;
  playlistPlacements: number;
  totalStreams: number;
  lastUpdated: Date;
  // Nuevos campos para análisis detallado
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

export async function saveSpotifyData(user: User, data: Partial<SpotifyData>) {
  if (!user) throw new Error('User must be authenticated');

  const userSpotifyRef = doc(db, 'spotify_data', user.uid);

  try {
    const docSnap = await getDoc(userSpotifyRef);

    if (docSnap.exists()) {
      await updateDoc(userSpotifyRef, {
        ...data,
        lastUpdated: new Date()
      });
    } else {
      await setDoc(userSpotifyRef, {
        ...data,
        lastUpdated: new Date()
      });
    }
  } catch (error) {
    console.error('Error saving Spotify data:', error);
    throw error;
  }
}

export async function getSpotifyData(user: User): Promise<SpotifyData | null> {
  if (!user) return null;

  const userSpotifyRef = doc(db, 'spotify_data', user.uid);

  try {
    const docSnap = await getDoc(userSpotifyRef);

    if (docSnap.exists()) {
      return docSnap.data() as SpotifyData;
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