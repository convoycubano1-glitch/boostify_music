import { Router } from 'express';
import { ImageResponse } from '@vercel/og';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const router = Router();

// Endpoint para generar imagen Open Graph dinámica por artista
router.get('/artist/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;
    
    // Obtener datos del artista de Firestore
    const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", artistId)));
    
    if (userDoc.empty) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    
    const artistData = userDoc.docs[0].data();
    
    // Intentar obtener datos de PostgreSQL también
    let postgresData = null;
    try {
      const response = await fetch(`${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/api/profile/${artistId}`);
      if (response.ok) {
        postgresData = await response.json();
      }
    } catch (error) {
      console.log('Artist not in PostgreSQL');
    }
    
    const artistName = artistData.name || artistData.displayName || 'Unknown Artist';
    const genre = artistData.genre || 'Music';
    const biography = artistData.biography || 'Music Artist on Boostify Music';
    const profileImage = artistData.photoURL || artistData.profileImage || '';
    const isAIGenerated = postgresData?.isAIGenerated || false;
    
    // Generar imagen usando @vercel/og
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            backgroundImage: 'linear-gradient(135deg, #000000 0%, #1a0a00 50%, #000000 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: 'radial-gradient(circle at 25px 25px, #ea580c 2%, transparent 0%), radial-gradient(circle at 75px 75px, #ea580c 2%, transparent 0%)',
              backgroundSize: '100px 100px',
            }}
          />
          
          {/* Main content container */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              padding: '60px 80px',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Left side - Artist info */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                maxWidth: '600px',
              }}
            >
              {/* Logo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '40px',
                }}
              >
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#ea580c',
                    letterSpacing: '-1px',
                  }}
                >
                  BOOSTIFY MUSIC
                </div>
              </div>
              
              {/* Artist name */}
              <div
                style={{
                  fontSize: '72px',
                  fontWeight: 'bold',
                  color: '#fff',
                  lineHeight: 1.1,
                  marginBottom: '20px',
                  textShadow: '0 4px 20px rgba(234, 88, 12, 0.5)',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {artistName}
              </div>
              
              {/* Genre badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  marginBottom: '25px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#ea580c',
                    color: '#fff',
                    padding: '12px 28px',
                    borderRadius: '50px',
                    fontSize: '24px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 20px rgba(234, 88, 12, 0.4)',
                  }}
                >
                  {genre}
                </div>
                
                {isAIGenerated && (
                  <div
                    style={{
                      backgroundColor: 'rgba(234, 88, 12, 0.2)',
                      border: '2px solid #ea580c',
                      color: '#ea580c',
                      padding: '12px 28px',
                      borderRadius: '50px',
                      fontSize: '20px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    🤖 AI ARTIST
                  </div>
                )}
              </div>
              
              {/* Bio */}
              <div
                style={{
                  fontSize: '22px',
                  color: '#cbd5e1',
                  lineHeight: 1.5,
                  marginBottom: '30px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {biography.length > 120 ? biography.substring(0, 120) + '...' : biography}
              </div>
              
              {/* Stats bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '40px',
                  marginTop: 'auto',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}
                  >
                    🎵
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '18px' }}>Music</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}
                  >
                    🎬
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '18px' }}>Videos</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}
                  >
                    🛍️
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '18px' }}>Merch</div>
                </div>
              </div>
            </div>
            
            {/* Right side - Artist image */}
            {profileImage && (
              <div
                style={{
                  display: 'flex',
                  width: '400px',
                  height: '400px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  marginLeft: '60px',
                  border: '4px solid #ea580c',
                  boxShadow: '0 20px 60px rgba(234, 88, 12, 0.4), 0 0 40px rgba(234, 88, 12, 0.2)',
                }}
              >
                <img
                  src={profileImage}
                  alt={artistName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Bottom gradient bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '8px',
              background: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
    
    // Convert ImageResponse to Buffer
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Set proper headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    
    // Send image
    res.send(Buffer.from(imageBuffer));
    
  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

export default router;
