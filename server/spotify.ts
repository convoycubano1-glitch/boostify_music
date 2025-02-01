import { Express } from "express";
import { db } from './firebase';
import { getFirestore } from 'firebase-admin/firestore';

const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

declare global {
  namespace Express {
    interface User {
      uid: string;
    }
  }
}

export function setupSpotifyRoutes(app: Express) {
  // Iniciar flujo de OAuth de Spotify
  app.get("/api/spotify/auth", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const clientId = process.env.VITE_FIREBASE_API_KEY;
    const redirectUri = `${req.protocol}://${req.get("host")}/api/spotify/callback`;
    const scope = "user-read-private user-read-email user-library-read user-follow-read user-top-read";

    const authUrl = `${SPOTIFY_AUTH_URL}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&show_dialog=true`;
    res.redirect(authUrl);
  });

  // Manejar callback de Spotify OAuth
  app.get("/api/spotify/callback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { code } = req.query;
    if (!code) return res.status(400).send("Authorization code not found");

    try {
      // Obtener token de acceso
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: `${req.protocol}://${req.get("host")}/api/spotify/callback`,
        client_id: process.env.VITE_FIREBASE_API_KEY!,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET!
      });

      const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get access token");
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;

      // Obtener datos del usuario autenticado
      const userData = await fetch(`${SPOTIFY_API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }).then(res => res.json());

      // Guardar datos en Firestore
      const spotifyDataRef = db.collection('spotify_data').doc(req.user.uid);
      await spotifyDataRef.set({
        accessToken,
        refreshToken,
        userId: userData.id,
        displayName: userData.display_name,
        email: userData.email,
        followers: userData.followers.total,
        lastUpdated: new Date(),
        monthlyListeners: 0,
        totalStreams: 0,
        playlistPlacements: 0,
        topTracks: [],
        dailyStats: [{
          date: new Date().toISOString().split('T')[0],
          streams: 0,
          followers: userData.followers.total,
          playlistAdds: 0
        }],
        demographics: {
          countries: [],
          ageRanges: []
        }
      }, { merge: true });

      res.redirect("/spotify");
    } catch (error) {
      console.error("Spotify auth error:", error);
      res.status(500).send("Failed to connect Spotify account");
    }
  });

  // Obtener datos del perfil de Spotify del usuario
  app.get("/api/spotify/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const spotifyDataRef = db.collection('spotify_data').doc(req.user.uid);
      const spotifyDoc = await spotifyDataRef.get();

      if (!spotifyDoc.exists || !spotifyDoc.data()?.accessToken) {
        return res.status(400).send("Spotify account not connected");
      }

      const response = await fetch(`${SPOTIFY_API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${spotifyDoc.data()?.accessToken}` }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Spotify profile");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching Spotify profile:", error);
      res.status(500).send("Failed to fetch Spotify profile");
    }
  });
}