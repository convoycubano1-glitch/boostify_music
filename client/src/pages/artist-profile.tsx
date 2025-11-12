import { useParams } from "wouter";
import { ArtistProfileCard } from "../components/artist/artist-profile-card";
import { Head } from "../components/ui/head";
import { useQuery } from "@tanstack/react-query";

interface ArtistProfileData {
  id: number;
  username: string;
  artistName: string;
  slug: string;
  profileImage?: string;
  coverImage?: string;
  biography?: string;
  genre?: string;
  location?: string;
  spotifyUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
}

export default function ArtistProfilePage() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch artist profile by slug from PostgreSQL API
  const { data: artistData, isLoading, error } = useQuery<ArtistProfileData>({
    queryKey: ['/api/profile', slug],
    enabled: !!slug,
  });

  const artistId = artistData?.id.toString();

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

  // Preferir cover image sobre profile image para compartir (es más visual y llamativo)
  const shareImage = getAbsoluteImageUrl(
    artistData?.coverImage || artistData?.profileImage
  );
  
  const artistName = artistData?.artistName || 'Artist';
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
