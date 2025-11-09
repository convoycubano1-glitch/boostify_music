import { ArtistProfileCard } from "../components/artist/artist-profile-card";
import { EditableProfileHeader } from "../components/artist/editable-profile-header";
import { MusicSection } from "../components/artist/music-section";
import { VideosSection } from "../components/artist/videos-section";
import { useParams } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Head } from "../components/ui/head";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

interface ArtistData {
  name: string;
  biography: string;
  profileImage: string;
  genre?: string;
  location?: string;
  socialLinks?: {
    spotify?: string;
    instagram?: string;
    youtube?: string;
  };
}

interface Song {
  id: string;
  name: string;
  title?: string;
  duration?: string;
  audioUrl: string;
  userId: string;
  createdAt?: any;
  storageRef?: string;
  coverArt?: string;
}

interface Video {
  id: string;
  title: string;
  thumbnailUrl?: string;
  url: string;
  userId: string;
  createdAt?: any;
  views?: number;
  likes?: number;
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();

  // Use the URL id or fallback to the authenticated user's id
  const artistId = id || user?.uid || null;
  const isOwner = user?.uid === artistId;

  // Query para obtener datos del artista desde Firestore
  const { data: artistData, isLoading: isLoadingProfile } = useQuery<ArtistData>({
    queryKey: ["/api/artist/profile", artistId],
    queryFn: async () => {
      const response = await fetch(`/api/artist/profile/${artistId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: !!artistId
  });

  // Query para obtener canciones
  const { data: songs = [] as Song[], isLoading: isLoadingSongs } = useQuery<Song[]>({
    queryKey: ["songs", artistId],
    queryFn: async () => {
      if (!artistId) return [];
      const songsRef = collection(db, "songs");
      const q = query(songsRef, where("userId", "==", artistId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        title: doc.data().name,
        audioUrl: doc.data().audioUrl,
        duration: doc.data().duration || "3:45",
        userId: doc.data().userId,
        createdAt: doc.data().createdAt?.toDate(),
        storageRef: doc.data().storageRef,
        coverArt: doc.data().coverArt || '/assets/freepik__boostify_music_organe_abstract_icon.png'
      }));
    },
    enabled: !!artistId
  });

  // Query para obtener videos
  const { data: videos = [] as Video[], isLoading: isLoadingVideos } = useQuery<Video[]>({
    queryKey: ["videos", artistId],
    queryFn: async () => {
      if (!artistId) return [];
      const videosRef = collection(db, "videos");
      const q = query(videosRef, where("userId", "==", artistId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const videoId = data.url?.split('v=')?.[1] || data.url?.split('/')?.[3]?.split('?')?.[0];
        return {
          id: doc.id,
          title: data.title,
          url: data.url,
          userId: data.userId || artistId,
          thumbnailUrl: data.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined),
          createdAt: data.createdAt?.toDate(),
          views: Math.floor(Math.random() * 10000) + 1000,
          likes: Math.floor(Math.random() * 500) + 50,
        };
      });
    },
    enabled: !!artistId
  });

  if (!artistId || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-black pt-4 flex items-center justify-center">
        <p className="text-white">Loading profile...</p>
      </div>
    );
  }

  const fullUrl = window.location.origin + '/profile/' + artistId;

  // Asegurar que la imagen sea una URL absoluta
  const getAbsoluteImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return `${window.location.origin}/assets/freepik__boostify_music_organe_abstract_icon.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${window.location.origin}${imageUrl}`;
  };

  const profileImage = getAbsoluteImageUrl(artistData?.profileImage);

  // Valores por defecto para meta tags
  const title = artistData?.name 
    ? `${artistData.name} - Music Artist Profile | Boostify Music`
    : "Discover Amazing Musicians on Boostify Music";

  const description = artistData?.biography 
    ? `Check out ${artistData.name}'s music profile on Boostify Music. ${artistData.biography.slice(0, 150)}${artistData.biography.length > 150 ? '...' : ''}`
    : `Discover and connect with talented musicians on Boostify Music. Join our community of artists, producers, and music enthusiasts.`;

  return (
    <>
      {/* Solo renderizar Head cuando tenemos los datos necesarios */}
      {artistData && (
        <Head
          title={title}
          description={description}
          url={fullUrl}
          image={profileImage}
          type="profile"
          siteName="Boostify Music"
        />
      )}
      <div className="min-h-screen bg-black pt-4">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <EditableProfileHeader
            artistId={artistId}
            initialData={artistData}
            songsCount={songs.length}
            videosCount={videos.length}
            isOwner={isOwner}
          />
          
          <div className="grid grid-cols-1 gap-6">
            <MusicSection
              songs={songs}
              isLoading={isLoadingSongs}
              currentTrack={-1}
              isPlaying={false}
              togglePlay={() => {}}
            />
            
            <VideosSection
              videos={videos}
              isLoading={isLoadingVideos}
            />
          </div>
        </div>
      </div>
    </>
  );
}