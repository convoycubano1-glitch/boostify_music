import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { ArtistProfileCard } from "../components/artist/artist-profile-card";
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
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setArtistId(userData.uid);
          setArtistData(userData);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error finding artist by slug:", err);
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

  // Título más llamativo y atractivo
  const title = `🎵 ${artistName}${genre ? ` - ${genre}` : ''} | Boostify Music`;
  
  // Descripción mejorada con más contexto
  let description = '';
  if (biography) {
    description = `${biography.slice(0, 150)}${biography.length > 150 ? '...' : ''}`;
  } else {
    description = `Descubre la música de ${artistName}${genre ? `, artista de ${genre}` : ''}${location ? ` desde ${location}` : ''}. Escucha sus canciones, mira sus videos y conecta directamente en Boostify Music 🎶`;
  }
  
  // Agregar call-to-action al final
  description += ` | Únete ahora a Boostify Music ✨`;

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
        <ArtistProfileCard artistId={artistId} />
      </div>
    </>
  );
}
