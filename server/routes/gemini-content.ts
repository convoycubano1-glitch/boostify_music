import { Router } from 'express';
import { generateArtistBiography, generateArtistImage, generateSongDescription, improveText } from '../lib/gemini-service';

const router = Router();

router.post('/generate-biography', async (req, res) => {
  try {
    const { artistName, genre, style } = req.body;
    
    if (!artistName || !genre) {
      return res.status(400).json({ error: 'Artist name and genre are required' });
    }

    const biography = await generateArtistBiography(artistName, genre, style);
    res.json({ biography });
  } catch (error) {
    console.error('Error generating biography:', error);
    res.status(500).json({ error: 'Failed to generate biography' });
  }
});

router.post('/generate-image', async (req, res) => {
  try {
    const { artistName, style, genre } = req.body;
    
    if (!artistName || !genre) {
      return res.status(400).json({ error: 'Artist name and genre are required' });
    }

    const imageData = await generateArtistImage(artistName, style || 'modern and creative', genre);
    res.json({ imageData });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

router.post('/generate-song-description', async (req, res) => {
  try {
    const { songTitle, artistName, genre } = req.body;
    
    if (!songTitle || !artistName || !genre) {
      return res.status(400).json({ error: 'Song title, artist name, and genre are required' });
    }

    const description = await generateSongDescription(songTitle, artistName, genre);
    res.json({ description });
  } catch (error) {
    console.error('Error generating song description:', error);
    res.status(500).json({ error: 'Failed to generate song description' });
  }
});

router.post('/improve-text', async (req, res) => {
  try {
    const { text, purpose } = req.body;
    
    if (!text || !purpose) {
      return res.status(400).json({ error: 'Text and purpose are required' });
    }

    const improved = await improveText(text, purpose);
    res.json({ improved });
  } catch (error) {
    console.error('Error improving text:', error);
    res.status(500).json({ error: 'Failed to improve text' });
  }
});

export default router;
