import { useEffect, useState } from "react";
import { logger } from "../lib/logger";
import { useParams } from "wouter";
import { ArtistProfileCard } from "../components/artist/artist-profile-card";
import { CrowdfundingButton } from "../components/crowdfunding/crowdfunding-button";
import { Head } from "../components/ui/head";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/use-auth";

export default function ArtistProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user: currentUser } = useAuth();
  const [artistId, setArtistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [artistData, setArtistData] = useState<any>(null);
  const [postgresId, setPostgresId] = useState<number | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const findArtistBySlug = async () => {
      if (!slug) {
        setError(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        logger.info(`🔍 Looking for artist with slug: ${slug}`);
        
        // Primero intentar buscar en PostgreSQL
        try {
          const response = await fetch(`/api/artist/by-slug/${slug}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.artist) {
              logger.info(`✅ Artist found in PostgreSQL:`, data.artist);
              
              // Usar el firestoreId o el id como artistId
              const artistIdToUse = data.artist.firestoreId || String(data.artist.id);
              setArtistId(artistIdToUse);
              setPostgresId(data.artist.id);
              
              // Check if current user owns this profile
              if (currentUser && currentUser.id === data.artist.id) {
                setIsOwnProfile(true);
              }
              
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
          logger.info(`⚠️ PostgreSQL lookup failed, trying Firestore:`, pgError);
        }
        
        // Si no se encuentra en PostgreSQL, buscar en Firestore (fallback)
        logger.info(`🔍 Searching in Firestore for slug: ${slug}`);
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          logger.info(`✅ Artist found in Firestore:`, {
            uid: userData.uid,
            name: userData.displayName || userData.name,
            slug: userData.slug
          });
          setArtistId(userData.uid);
          setArtistData(userData);
          setError(false);
        } else {
          logger.warn(`⚠️ No artist found with slug: ${slug}`);
          setError(true);
        }
      } catch (err) {
        logger.error("❌ Error finding artist by slug:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    findArtistBySlug();
  }, [slug, currentUser]);

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
  
  // Función helper para obtener URL absoluta de imagen
  const getAbsoluteImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return `${window.location.origin}/assets/freepik__boostify_music_organe_abstract_icon.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${window.location.origin}${imageUrl}`;
  };

  // Prioridad: 1. Cover/Banner (más visual), 2. Profile Image
  const bannerImage = artistData?.bannerImage;
  const profileImage = artistData?.profileImage || artistData?.photoURL;
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
    description = biography.length > 155 ? `${biography.slice(0, 152)}...` : biography;
  } else {
    const parts = [`Discover the music of ${artistName}`];
    if (genre) parts.push(`${genre} artist`);
    if (location) parts.push(`from ${location}`);
    description = parts.join(', ') + '. Listen to songs, watch videos and connect directly on Boostify Music.';
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
      </div>
    </>
  );
}
