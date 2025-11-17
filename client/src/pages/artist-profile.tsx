import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { ArtistProfileCard } from "../components/artist/artist-profile-card";
import { CrowdfundingButton } from "../components/crowdfunding/crowdfunding-button";
import { TokenizedMusicView } from "../components/tokenization/tokenized-music-view";
import { Head } from "../components/ui/head";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export default function ArtistProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [artistId, setArtistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [artistData, setArtistData] = useState<any>(null);

  useEffect(() => {
    const findArtistBySlug = async () => {
      if (!slug) {
        setError(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log(`🔍 Looking for artist with slug: ${slug}`);
        
        // Primero intentar buscar en PostgreSQL
        try {
          const response = await fetch(`/api/artist/by-slug/${slug}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.artist) {
              console.log(`✅ Artist found in PostgreSQL:`, data.artist);
              
              // Usar el firestoreId o el id como artistId
              const artistIdToUse = data.artist.firestoreId || String(data.artist.id);
              setArtistId(artistIdToUse);
              
              // Adaptar la estructura de datos para que sea compatible con ArtistProfileCard
              setArtistData({
                uid: artistIdToUse,
                displayName: data.artist.artistName,
                name: data.artist.artistName,
                slug: data.artist.slug,
                biography: data.artist.biography,
                bannerImage: data.artist.coverImage,
                profileImage: data.artist.profileImage,
                photoURL: data.artist.profileImage,
                genre: data.artist.genres?.[0] || '',
                location: data.artist.location || data.artist.country,
                instagram: data.artist.instagramHandle,
                twitter: data.artist.twitterHandle,
                youtube: data.artist.youtubeHandle,
                spotify: data.artist.spotifyUrl,
                // Agregar campos de PostgreSQL para verificación de permisos
                generatedBy: data.artist.generatedBy,
                isAIGenerated: data.artist.isAIGenerated,
                postgresId: data.artist.id,
              });
              setError(false);
              setIsLoading(false);
              return;
            }
          }
        } catch (pgError) {
          console.log(`⚠️ PostgreSQL lookup failed, trying Firestore:`, pgError);
        }
        
        // Si no se encuentra en PostgreSQL, buscar en Firestore (fallback)
        console.log(`🔍 Searching in Firestore for slug: ${slug}`);
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          console.log(`✅ Artist found in Firestore:`, {
            uid: userData.uid,
            name: userData.displayName || userData.name,
            slug: userData.slug
          });
          setArtistId(userData.uid);
          setArtistData(userData);
          setError(false);
        } else {
          console.warn(`⚠️ No artist found with slug: ${slug}`);
          setError(true);
        }
      } catch (err) {
        console.error("❌ Error finding artist by slug:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    findArtistBySlug();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading profile...</p>
      </div>
    );
  }

  if (error || !artistId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Artist Not Found</h1>
          <p className="text-gray-400">
            The profile you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const fullUrl = `${window.location.origin}/artist/${slug}`;
  
  const getAbsoluteImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return `${window.location.origin}/assets/freepik__boostify_music_organe_abstract_icon.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${window.location.origin}${imageUrl}`;
  };

  // Determinar la mejor imagen para compartir en redes sociales
  // Prioridad: 1. Banner (más visual), 2. Profile Image, 3. PhotoURL
  const bannerImage = artistData?.bannerImage;
  const profileImage = artistData?.profileImage || artistData?.photoURL;
  
  // Si hay banner, usarlo. Si no, usar profile image. Si ninguno, usar default
  const shareImage = getAbsoluteImageUrl(bannerImage || profileImage);
  
  const artistName = artistData?.displayName || artistData?.name || 'Artist';
  const biography = artistData?.biography || '';
  const genre = artistData?.genre || '';
  const location = artistData?.location || '';

  // Título optimizado para SEO y redes sociales
  const title = `${artistName}${genre ? ` - ${genre}` : ''} | Boostify Music`;
  
  // Descripción optimizada con información del artista
  let description = '';
  if (biography && biography.trim().length > 0) {
    // Usar la biografía completa del artista, truncada si es necesaria
    description = biography.length > 155 ? `${biography.slice(0, 152)}...` : biography;
  } else {
    // Crear descripción automática con la información disponible
    const parts = [`Descubre la música de ${artistName}`];
    if (genre) parts.push(`artista de ${genre}`);
    if (location) parts.push(`desde ${location}`);
    description = parts.join(', ') + '. Escucha canciones, mira videos y conecta directamente en Boostify Music.';
  }

  return (
    <>
      <Head
        title={title}
        description={description}
        url={fullUrl}
        image={shareImage}
        type="profile"
        siteName="Boostify Music"
        twitterUsername="@boostifymusic"
      />
      <div className="min-h-screen bg-black pt-4">
        {slug && (
          <CrowdfundingButton 
            artistSlug={slug} 
            colors={{
              hexAccent: '#F97316',
              hexPrimary: '#FF8800',
              hexBorder: '#5E2B0C',
            }}
          />
        )}
        <ArtistProfileCard artistId={artistId} initialArtistData={artistData} />
        
        {/* Music Tokenization Section (Web3/Blockchain) */}
        <div className="container mx-auto px-4 py-8">
          <TokenizedMusicView artistId={artistId} />
        </div>
      </div>
    </>
  );
}
