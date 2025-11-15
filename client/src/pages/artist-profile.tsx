import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { ArtistProfileCard } from "../components/artist/artist-profile-card";
import { CrowdfundingButton } from "../components/crowdfunding/crowdfunding-button";
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
        console.log(`🔍 [PRODUCTION] Looking for artist with slug: ${slug}`);
        console.log(`🔍 [PRODUCTION] Current URL:`, window.location.href);
        console.log(`🔍 [PRODUCTION] Firebase configured:`, !!db);
        
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        console.log(`🔍 [PRODUCTION] Query result: ${querySnapshot.size} users found`);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          console.log(`✅ [PRODUCTION] Artist found:`, {
            uid: userData.uid,
            name: userData.displayName || userData.name,
            slug: userData.slug
          });
          setArtistId(userData.uid);
          setArtistData(userData);
          setError(false);
        } else {
          console.warn(`⚠️ [PRODUCTION] No artist found with slug: ${slug}`);
          setError(true);
        }
      } catch (err) {
        console.error("❌ [PRODUCTION] Error finding artist by slug:", err);
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

  // Preferir banner sobre profile image para compartir (es más visual y llamativo)
  const shareImage = getAbsoluteImageUrl(
    artistData?.bannerImage || artistData?.profileImage || artistData?.photoURL
  );
  
  const artistName = artistData?.displayName || artistData?.name || 'Artist';
  const biography = artistData?.biography || '';
  const genre = artistData?.genre || '';
  const location = artistData?.location || '';

  // Título optimizado para SEO y redes sociales (sin emojis que pueden causar problemas)
  const title = `${artistName}${genre ? ` - ${genre}` : ''} | Boostify Music`;
  
  // Descripción optimizada con más contexto y sin emojis problemáticos
  let description = '';
  if (biography && biography.trim().length > 0) {
    description = `${biography.slice(0, 140)}${biography.length > 140 ? '...' : ''}`;
  } else {
    const parts = [`Descubre la música de ${artistName}`];
    if (genre) parts.push(`artista de ${genre}`);
    if (location) parts.push(`desde ${location}`);
    description = parts.join(', ') + '. Escucha sus canciones, mira sus videos y conecta directamente.';
  }
  
  // Agregar call-to-action al final (limitado para no exceder 200 caracteres)
  if (description.length < 170) {
    description += ' | Únete a Boostify Music';
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
        <ArtistProfileCard artistId={artistId} />
      </div>
    </>
  );
}
