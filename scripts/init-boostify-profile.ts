import { db } from '../server/db';
import { users, songs } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Script para inicializar el perfil predeterminado de Boostify
 * con canciones de demostración y configuración completa
 */

const BOOSTIFY_PROFILE = {
  username: 'boostify-official',
  password: 'boostify-2025',
  artistName: 'Boostify Music',
  slug: 'boostify',
  email: 'info@boostify.music',
  biography: 'Welcome to Boostify Music - The ultimate AI-powered platform for artists to create, promote, and grow their music career. Explore our demo tracks and discover the power of AI-driven music video creation.',
  genre: 'Electronic',
  location: 'Los Angeles, CA',
  website: 'https://boostify.music',
  instagramHandle: '@boostifymusic',
  twitterHandle: '@boostifymusic',
  youtubeChannel: 'BoostifyMusic',
  profileImage: '/assets/stock_images/professional_music_p_1d5393ab.jpg',
  coverImage: '/assets/stock_images/modern_music_studio__4d461e36.jpg',
  genres: ['Electronic', 'Pop', 'Hip Hop', 'R&B'],
  realName: 'Boostify Team',
  country: 'United States'
};

const DEMO_SONGS = [
  {
    title: 'Neon Dreams',
    description: 'An electrifying journey through synthesized soundscapes and pulsating beats. Perfect for high-energy music videos.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '3:45',
    genre: 'Electronic',
    coverArt: '/assets/stock_images/album_cover_art_abst_50eaa1cd.jpg',
    releaseDate: new Date('2025-01-15'),
    isPublished: true
  },
  {
    title: 'Urban Pulse',
    description: 'A fusion of hip-hop rhythms and modern production. Ideal for creating dynamic street-style visuals.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: '4:12',
    genre: 'Hip Hop',
    coverArt: '/assets/stock_images/album_cover_art_abst_cbaef9b0.jpg',
    releaseDate: new Date('2025-01-20'),
    isPublished: true
  },
  {
    title: 'Midnight Vibes',
    description: 'Smooth R&B melodies with atmospheric production. Great for cinematic and emotional video content.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: '3:58',
    genre: 'R&B',
    coverArt: '/assets/stock_images/album_cover_art_abst_5b2a6b47.jpg',
    releaseDate: new Date('2025-01-25'),
    isPublished: true
  }
];

async function initBoostifyProfile() {
  try {
    console.log('🚀 Inicializando perfil de Boostify...');

    // Verificar si el perfil ya existe
    const existingProfile = await db
      .select()
      .from(users)
      .where(eq(users.slug, 'boostify'))
      .limit(1);

    let userId: number;

    if (existingProfile.length > 0) {
      console.log('✅ Perfil de Boostify ya existe, actualizando...');
      userId = existingProfile[0].id;

      await db
        .update(users)
        .set(BOOSTIFY_PROFILE)
        .where(eq(users.id, userId));
    } else {
      console.log('📝 Creando nuevo perfil de Boostify...');
      const [newProfile] = await db
        .insert(users)
        .values(BOOSTIFY_PROFILE)
        .returning({ id: users.id });

      userId = newProfile.id;
    }

    console.log(`✅ Perfil de Boostify creado/actualizado con ID: ${userId}`);

    // Eliminar canciones antiguas de Boostify si existen
    await db
      .delete(songs)
      .where(eq(songs.userId, userId));

    console.log('🎵 Agregando canciones de demostración...');

    // Agregar canciones de demostración
    for (const song of DEMO_SONGS) {
      await db
        .insert(songs)
        .values({
          ...song,
          userId,
        });
      console.log(`  ✅ "${song.title}" agregada`);
    }

    console.log('\n🎉 ¡Perfil de Boostify inicializado exitosamente!');
    console.log(`📍 Acceso: /artist/boostify`);
    console.log(`🎵 Canciones: ${DEMO_SONGS.length} demos agregadas`);

  } catch (error) {
    console.error('❌ Error inicializando perfil de Boostify:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
initBoostifyProfile();
