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
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token error:', errorData);
        throw new Error(`Failed to get access token: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Token response:', { ...data, access_token: '[REDACTED]' });
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
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`, 
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

      // Log raw track data for debugging
      console.log('First track raw data:', JSON.stringify(data.tracks.items[0], null, 2));

      const tracks = data.tracks.items.map((track: any) => {
        // Log individual track processing
        console.log('Processing track:', {
          id: track.id,
          name: track.name,
          preview_url: track.preview_url,
          external_urls: track.external_urls
        });

        return {
          id: track.id,
          title: track.name,
          artist: track.artists[0].name,
          duration: track.duration_ms / 1000,
          streamUrl: track.preview_url || null,
          source: 'spotify' as const,
          albumArt: track.album.images[0]?.url,
          externalUrl: track.external_urls.spotify
        };
      });

      // Log track statistics
      const tracksWithPreviews = tracks.filter(t => t.streamUrl).length;
      console.log(`Found ${tracks.length} tracks, ${tracksWithPreviews} with previews available`);

      if (tracksWithPreviews === 0) {
        console.log('First 3 tracks details:', 
          tracks.slice(0, 3).map(t => ({
            name: t.title,
            artist: t.artist,
            hasPreview: !!t.streamUrl,
            previewUrl: t.streamUrl || 'no preview available',
            trackId: t.id,
            spotifyUrl: t.externalUrl
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
      const response = await fetch('https://api.spotify.com/v1/recommendations?limit=20', {
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

  // These methods are no-op since we use the HTML audio element
  async play(_track: StreamingTrack): Promise<void> {}
  async pause(): Promise<void> {}
  async resume(): Promise<void> {}
}