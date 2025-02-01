import { db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface SpotifyData {
  accessToken: string | null;
  refreshToken: string | null;
  followers: number;
  monthlyListeners: number;
  playlistPlacements: number;
  totalStreams: number;
  lastUpdated: Date;
}

export async function saveSpotifyData(user: User, data: Partial<SpotifyData>) {
  if (!user) throw new Error('User must be authenticated');

  const userSpotifyRef = doc(db, 'spotify_data', user.uid);
  
  try {
    const docSnap = await getDoc(userSpotifyRef);
    
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(userSpotifyRef, {
        ...data,
        lastUpdated: new Date()
      });
    } else {
      // Create new document
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
