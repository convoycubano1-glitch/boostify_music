import { Router } from 'express';
import { ImageResponse } from '@vercel/og';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { db as pgDb } from '../db';
import { users, artistNews } from '@db/schema';
import { eq } from 'drizzle-orm';
import React from 'react';

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

// Endpoint para generar imagen Open Graph dinámica para noticias
router.get('/news/:newsId', async (req, res) => {
  try {
    const { newsId } = req.params;
    
    const [newsItem] = await pgDb
      .select({
        title: artistNews.title,
        summary: artistNews.summary,
        imageUrl: artistNews.imageUrl,
        category: artistNews.category,
        artistName: users.artistName,
        profileImage: users.profileImage
      })
      .from(artistNews)
      .leftJoin(users, eq(artistNews.userId, users.id))
      .where(eq(artistNews.id, parseInt(newsId)))
      .limit(1);
    
    if (!newsItem) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    const categoryColors: Record<string, { bg: string; text: string }> = {
      release: { bg: '#10B981', text: 'Lanzamiento' },
      performance: { bg: '#8B5CF6', text: 'Performance' },
      collaboration: { bg: '#F59E0B', text: 'Colaboración' },
      achievement: { bg: '#EF4444', text: 'Logro' },
      lifestyle: { bg: '#3B82F6', text: 'Lifestyle' }
    };

    const categoryInfo = categoryColors[newsItem.category as keyof typeof categoryColors] || { bg: '#FF6B35', text: newsItem.category };
    
    // Generar imagen usando @vercel/og
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#000',
            backgroundImage: 'linear-gradient(135deg, #000000 0%, #1a0a00 50%, #000000 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background image with overlay */}
          {newsItem.imageUrl && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${newsItem.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.3,
                filter: 'blur(20px)',
              }}
            />
          )}
          
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(26,10,0,0.9) 50%, rgba(0,0,0,0.8) 100%)',
            }}
          />
          
          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              padding: '60px 80px',
              position: 'relative',
              zIndex: 1,
              justifyContent: 'space-between',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
              
              {/* Category Badge */}
              <div
                style={{
                  padding: '12px 32px',
                  borderRadius: '999px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: categoryInfo.bg,
                }}
              >
                {categoryInfo.text}
              </div>
            </div>
            
            {/* Title */}
            <div
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#fff',
                lineHeight: 1.2,
                marginBottom: '20px',
                textShadow: '0 4px 20px rgba(234, 88, 12, 0.5)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {newsItem.title}
            </div>
            
            {/* Summary */}
            <div
              style={{
                fontSize: '28px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: '40px',
              }}
            >
              {newsItem.summary}
            </div>
            
            {/* Footer - Artist info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              {newsItem.profileImage && (
                <img
                  src={newsItem.profileImage}
                  width="60"
                  height="60"
                  style={{
                    borderRadius: '999px',
                    border: '3px solid #ea580c',
                  }}
                />
              )}
              <div
                style={{
                  fontSize: '28px',
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              >
                {newsItem.artistName || 'Boostify Music'}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // Configurar headers apropiados
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    return res.send(await imageResponse.arrayBuffer());
  } catch (error) {
    console.error('Error generating news OG image:', error);
    return res.status(500).json({ error: 'Failed to generate OG image' });
  }
});

// Endpoint para generar imagen Open Graph dinámica para artistas por slug
router.get('/artist/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const [artist] = await pgDb
      .select({
        artistName: users.artistName,
        biography: users.biography,
        profileImage: users.profileImage,
        coverImage: users.coverImage,
        genres: users.genres,
        location: users.location,
        country: users.country,
        role: users.role
      })
      .from(users)
      .where(eq(users.slug, slug))
      .limit(1);
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    
    const genre = artist.genres?.[0] || '';
    const location = artist.location || artist.country || '';
    const isAdmin = artist.role === 'admin';
    
    // Generar imagen usando @vercel/og
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#000',
            backgroundImage: 'linear-gradient(135deg, #000000 0%, #1a0a00 50%, #000000 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background cover image with overlay */}
          {artist.coverImage && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${artist.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.25,
                filter: 'blur(30px)',
              }}
            />
          )}
          
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(26,10,0,0.95) 50%, rgba(0,0,0,0.85) 100%)',
            }}
          />
          
          {/* Main content */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              padding: '60px 80px',
              position: 'relative',
              zIndex: 1,
              alignItems: 'center',
              gap: '60px',
            }}
          >
            {/* Left side - Artist Photo */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {artist.profileImage && (
                <img
                  src={artist.profileImage}
                  width="320"
                  height="320"
                  style={{
                    borderRadius: '24px',
                    border: '6px solid #ea580c',
                    boxShadow: '0 20px 60px rgba(234, 88, 12, 0.4)',
                  }}
                />
              )}
            </div>
            
            {/* Right side - Artist Info */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {/* Boostify Logo */}
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#ea580c',
                  letterSpacing: '-1px',
                  marginBottom: '20px',
                }}
              >
                BOOSTIFY MUSIC
              </div>
              
              {/* Artist Name */}
              <div
                style={{
                  fontSize: '72px',
                  fontWeight: 'bold',
                  color: '#fff',
                  lineHeight: 1.1,
                  marginBottom: '20px',
                  textShadow: '0 4px 30px rgba(234, 88, 12, 0.6)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {artist.artistName}
                {isAdmin && (
                  <span
                    style={{
                      fontSize: '48px',
                      marginLeft: '20px',
                    }}
                  >
                    👑
                  </span>
                )}
              </div>
              
              {/* Genre & Location */}
              {(genre || location) && (
                <div
                  style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '30px',
                  }}
                >
                  {genre && (
                    <div
                      style={{
                        padding: '12px 28px',
                        borderRadius: '999px',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                      }}
                    >
                      {genre}
                    </div>
                  )}
                  {location && (
                    <div
                      style={{
                        padding: '12px 28px',
                        borderRadius: '999px',
                        fontSize: '24px',
                        color: '#fff',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '2px solid rgba(234, 88, 12, 0.5)',
                      }}
                    >
                      📍 {location}
                    </div>
                  )}
                </div>
              )}
              
              {/* Biography */}
              {artist.biography && (
                <div
                  style={{
                    fontSize: '28px',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {artist.biography}
                </div>
              )}
            </div>
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

    // Configurar headers apropiados
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    return res.send(await imageResponse.arrayBuffer());
  } catch (error) {
    console.error('Error generating artist OG image:', error);
    return res.status(500).json({ error: 'Failed to generate OG image' });
  }
});

export default router;
