import { StreamingService, StreamingTrack, StreamingError } from './streaming-service';

export class SpotifyStreamingService implements StreamingService {
  private accessToken: string | null = null;
  name = 'Spotify';
  isAuthenticated = false;

  constructor() {
    // Add check for debugging
    console.log("Spotify Client ID available:", !!import.meta.env.VITE_SPOTIFY_CLIENT_ID);

    if (!import.meta.env.VITE_SPOTIFY_CLIENT_ID) {
      console.error('Spotify client ID is not configured');
    }
  }

  async connect(): Promise<boolean> {
    try {
      const token = await this.getSpotifyToken();
      this.accessToken = token;
      this.isAuthenticated = true;
      return true;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  private async getSpotifyToken(): Promise<string> {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SPOTIFY_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials&scope=streaming user-read-playback-state user-modify-playback-state'
      });

      if (!response.ok) {
        throw new Error('Failed to get access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting Spotify token:', error);
      throw new StreamingError(
        'Failed to authenticate with Spotify',
        'spotify',
        'AUTH_FAILED'
      );
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
    this.isAuthenticated = false;
  }

  async search(query: string): Promise<StreamingTrack[]> {
    if (!this.accessToken) {
      return [];
    }

    try {
      console.log('Searching Spotify for:', query);
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50&market=US&include_external=audio`, 
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Spotify API error:', errorData);
        throw new Error(`Failed to search tracks: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const tracks = data.tracks.items.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists[0].name,
        duration: track.duration_ms / 1000,
        streamUrl: track.preview_url,
        source: 'spotify' as const,
        albumArt: track.album.images[0]?.url,
        externalUrl: track.external_urls.spotify
      }));

      // Log search results statistics
      const tracksWithPreviews = tracks.filter(t => t.streamUrl).length;
      console.log(`Found ${tracks.length} tracks, ${tracksWithPreviews} with previews available`);

      if (tracksWithPreviews === 0) {
        console.log('First 3 tracks for debugging:', 
          tracks.slice(0, 3).map(t => ({
            name: t.title,
            artist: t.artist,
            hasPreview: !!t.streamUrl
          }))
        );
      }

      return tracks;
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  async getRecommendations(): Promise<StreamingTrack[]> {
    if (!this.accessToken) {
      return [];
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/recommendations?limit=20&market=US', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      return data.tracks.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists[0].name,
        duration: track.duration_ms / 1000,
        streamUrl: track.preview_url,
        source: 'spotify' as const,
        albumArt: track.album.images[0]?.url,
        externalUrl: track.external_urls.spotify
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  // Estos métodos ahora son no-op ya que usaremos el elemento audio HTML
  async play(_track: StreamingTrack): Promise<void> {}
  async pause(): Promise<void> {}
  async resume(): Promise<void> {}
}