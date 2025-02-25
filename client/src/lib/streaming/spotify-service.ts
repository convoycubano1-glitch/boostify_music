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
    });
  }

  async connect(): Promise<boolean> {
    try {
      // En una implementación real, esto usaría el flujo OAuth2
      const token = await this.getSpotifyToken();
      this.accessToken = token;
      await this.initializePlayer(token);
      this.isAuthenticated = true;
      return true;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  private async getSpotifyToken(): Promise<string> {
    // Por ahora retornamos un token temporal para pruebas
    // En producción, esto debería obtener el token a través de OAuth
    return "test_token";
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

    // Implementación mock para pruebas
    return [
      {
        id: '1',
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 180,
        streamUrl: 'https://example.com/test.mp3',
        source: 'spotify',
        albumArt: 'https://example.com/art.jpg'
      }
    ];
  }

  async getRecommendations(): Promise<StreamingTrack[]> {
    if (!this.accessToken) {
      return [];
    }

    // Implementación mock para pruebas
    return [
      {
        id: '2',
        title: 'Recommended Song',
        artist: 'Recommended Artist',
        duration: 240,
        streamUrl: 'https://example.com/recommended.mp3',
        source: 'spotify',
        albumArt: 'https://example.com/recommended-art.jpg'
      }
    ];
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