import { StreamingService, StreamingTrack, StreamingError } from './streaming-service';

declare global {
  interface Window {
    Spotify: {
      Player: new (config: SpotifyPlayerConfig) => Spotify.Player;
    };
  }
}

interface SpotifyPlayerConfig {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
}

export class SpotifyStreamingService implements StreamingService {
  private accessToken: string | null = null;
  private player: Spotify.Player | null = null;
  name = 'Spotify';
  isAuthenticated = false;

  constructor() {
    this.loadSpotifyScript();
    // Add check for debugging
    console.log("OpenAI API Key available:", !!import.meta.env.VITE_SPOTIFY_CLIENT_ID);

    if (!import.meta.env.VITE_SPOTIFY_CLIENT_ID) {
      console.error('Spotify client ID is not configured');
    }
  }

  private loadSpotifyScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Spotify) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Spotify SDK'));
      document.body.appendChild(script);

      // Add a timeout to prevent hanging
      setTimeout(() => {
        reject(new Error('Spotify SDK load timeout'));
      }, 10000);
    });
  }

  async connect(): Promise<boolean> {
    try {
      // Esperar a que el SDK se cargue con reintento
      for (let i = 0; i < 3; i++) {
        try {
          await this.loadSpotifyScript();
          break;
        } catch (error) {
          if (i === 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const token = await this.getSpotifyToken();
      this.accessToken = token;
      await this.initializePlayer(token);
      this.isAuthenticated = true;
      return true;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      this.isAuthenticated = false;
      throw new StreamingError(
        'Failed to connect to Spotify',
        'spotify',
        'SDK_NOT_LOADED'
      );
    }
  }

  private async getSpotifyToken(): Promise<string> {
    // Por ahora retornamos un token temporal para pruebas
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

  private async initializePlayer(token: string): Promise<void> {
    if (!window.Spotify) {
      throw new StreamingError(
        'Spotify SDK not loaded',
        'spotify',
        'SDK_NOT_LOADED'
      );
    }

    try {
      this.player = new window.Spotify.Player({
        name: 'Boostify Radio',
        getOAuthToken: cb => cb(token)
      });

      // Agregar event listeners para el player
      this.player.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize:', message);
        throw new Error(message);
      });

      this.player.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate:', message);
        throw new Error(message);
      });

      this.player.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account:', message);
        throw new Error(message);
      });

      this.player.addListener('playback_error', ({ message }) => {
        console.error('Failed to perform playback:', message);
        throw new Error(message);
      });

      // Connect to the player
      const connected = await this.player.connect();
      if (!connected) {
        throw new Error('Failed to connect to Spotify player');
      }
    } catch (error) {
      console.error('Error initializing Spotify player:', error);
      this.player = null;
      throw new StreamingError(
        'Failed to initialize Spotify player',
        'spotify',
        'PLAYER_INIT_FAILED'
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.player) {
      await this.player.disconnect();
      this.player = null;
    }
    this.accessToken = null;
    this.isAuthenticated = false;
  }

  async search(query: string): Promise<StreamingTrack[]> {
    if (!this.accessToken) {
      return [];
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search tracks');
      }

      const data = await response.json();
      return data.tracks.items.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists[0].name,
        duration: track.duration_ms / 1000,
        streamUrl: track.preview_url,
        source: 'spotify',
        albumArt: track.album.images[0]?.url
      }));
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
        source: 'spotify',
        albumArt: track.album.images[0]?.url
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  async play(track: StreamingTrack): Promise<void> {
    if (!this.player) {
      throw new StreamingError(
        'Spotify player not initialized',
        'spotify',
        'PLAYER_NOT_READY'
      );
    }

    try {
      await this.player.resume();
    } catch (error) {
      console.error('Error playing track:', error);
      throw new StreamingError(
        'Failed to play track',
        'spotify',
        'PLAYBACK_ERROR'
      );
    }
  }

  async pause(): Promise<void> {
    if (!this.player) return;

    try {
      await this.player.pause();
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  }

  async resume(): Promise<void> {
    if (!this.player) return;

    try {
      await this.player.resume();
    } catch (error) {
      console.error('Error resuming playback:', error);
    }
  }
}