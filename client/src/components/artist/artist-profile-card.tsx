import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { EditProfileDialog } from "./edit-profile-dialog";
import { useAuth } from "../../hooks/use-auth";
import {
  Play,
  Pause,
  Music2,
  Video as VideoIcon,
  Share2,
  ShoppingBag,
  ShoppingCart,
  MapPin,
  ExternalLink,
  Calendar,
  Users,
  Music,
  Check
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../hooks/use-toast";

export interface ArtistProfileProps {
  artistId: string;
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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  userId: string;
  createdAt?: any;
}

// Paletas de colores
const colorPalettes = {
  'Boostify Naranja': {
    hexAccent: '#F97316',
    hexPrimary: '#FF8800',
    hexBorder: '#5E2B0C',
    textMuted: 'gray-400',
    bgGradient: "bg-gradient-to-br from-black via-gray-950 to-orange-950",
    shadow: 'shadow-orange-900/10',
  },
  'Clásico Azul': {
    hexAccent: '#3B82F6',
    hexPrimary: '#2563EB',
    hexBorder: '#1E40AF',
    textMuted: 'slate-400',
    bgGradient: "bg-gradient-to-br from-black via-slate-950 to-blue-950",
    shadow: 'shadow-blue-900/10',
  },
  'Neon Verde': {
    hexAccent: '#A3E635',
    hexPrimary: '#84CC16',
    hexBorder: '#4D7C0F',
    textMuted: 'gray-400',
    bgGradient: "bg-gradient-to-br from-black via-gray-950 to-green-950",
    shadow: 'shadow-lime-900/10',
  },
  'Cyber Morado': {
    hexAccent: '#F472B6',
    hexPrimary: '#8B5CF6',
    hexBorder: '#6D28D9',
    textMuted: 'violet-300',
    bgGradient: "bg-gradient-to-br from-black via-gray-950 to-violet-950",
    shadow: 'shadow-violet-900/10',
  },
  'Tierra Suave': {
    hexAccent: '#FBBF24',
    hexPrimary: '#D97706',
    hexBorder: '#78350F',
    textMuted: 'stone-400',
    bgGradient: "bg-gradient-to-br from-black via-stone-900 to-amber-950",
    shadow: 'shadow-amber-900/10',
  }
};

export function ArtistProfileCard({ artistId }: ArtistProfileProps) {
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof colorPalettes>('Boostify Naranja');
  const [merchFilter, setMerchFilter] = useState('Todo');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isOwnProfile = user?.uid === artistId;
  const colors = colorPalettes[selectedTheme];

  // Query para obtener perfil
  const { data: userProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["userProfile", artistId],
    queryFn: async () => {
      try {
        const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", artistId)));
        if (!userDoc.empty) {
          return userDoc.docs[0].data();
        }
        return null;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
    },
    enabled: !!artistId
  });

  // Query para canciones
  const { data: songs = [] as Song[] } = useQuery<Song[]>({
    queryKey: ["songs", artistId],
    queryFn: async () => {
      try {
        const songsRef = collection(db, "songs");
        const q = query(songsRef, where("userId", "==", artistId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return [];

        return querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            title: data.name,
            audioUrl: data.audioUrl,
            duration: data.duration || "3:45",
            userId: data.userId,
            createdAt: data.createdAt?.toDate(),
            storageRef: data.storageRef,
            coverArt: data.coverArt || '/assets/freepik__boostify_music_organe_abstract_icon.png'
          };
        });
      } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
      }
    },
    enabled: !!artistId
  });

  // Query para videos
  const { data: videos = [] as Video[] } = useQuery<Video[]>({
    queryKey: ["videos", artistId],
    queryFn: async () => {
      try {
        const videosRef = collection(db, "videos");
        const q = query(videosRef, where("userId", "==", artistId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return [];

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
      } catch (error) {
        console.error("Error fetching videos:", error);
        return [];
      }
    },
    enabled: !!artistId
  });

  // Query para productos con auto-generación
  const { data: products = [] as Product[], refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["merchandise", artistId],
    queryFn: async () => {
      try {
        const merchRef = collection(db, "merchandise");
        const q = query(merchRef, where("userId", "==", artistId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              description: data.description,
              price: data.price,
              imageUrl: data.imageUrl,
              category: data.category,
              userId: data.userId,
              createdAt: data.createdAt?.toDate(),
            };
          });
        }

        // Si no hay productos, generar 5 automáticamente
        const artistName = userProfile?.displayName || userProfile?.name || "Artist";
        const defaultProducts: Omit<Product, 'id'>[] = [
          {
            name: `${artistName} T-Shirt`,
            description: `Official ${artistName} merchandise t-shirt with exclusive design`,
            price: 29.99,
            imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
            category: 'Apparel',
            userId: artistId,
            createdAt: new Date(),
          },
          {
            name: `${artistName} Hoodie`,
            description: `Premium quality hoodie featuring ${artistName}'s brand logo`,
            price: 49.99,
            imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
            category: 'Apparel',
            userId: artistId,
            createdAt: new Date(),
          },
          {
            name: `${artistName} Cap`,
            description: `Stylish cap with embroidered ${artistName} logo`,
            price: 24.99,
            imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400',
            category: 'Accessories',
            userId: artistId,
            createdAt: new Date(),
          },
          {
            name: `${artistName} Poster`,
            description: `High-quality poster perfect for your room or studio`,
            price: 14.99,
            imageUrl: 'https://images.unsplash.com/photo-1626379801173-d0f23242cb27?w=400',
            category: 'Art',
            userId: artistId,
            createdAt: new Date(),
          },
          {
            name: `${artistName} Sticker Pack`,
            description: `Pack of 10 exclusive stickers featuring ${artistName}'s brand`,
            price: 9.99,
            imageUrl: 'https://images.unsplash.com/photo-1609520778163-a16fb3b0453e?w=400',
            category: 'Accessories',
            userId: artistId,
            createdAt: new Date(),
          },
        ];

        // Guardar productos en Firebase
        const savedProducts: Product[] = [];
        for (const product of defaultProducts) {
          const newDocRef = doc(collection(db, "merchandise"));
          await setDoc(newDocRef, product);
          savedProducts.push({ ...product, id: newDocRef.id });
        }

        return savedProducts;
      } catch (error) {
        console.error("Error fetching/creating merchandise:", error);
        return [];
      }
    },
    enabled: !!artistId && !!userProfile
  });

  const artist = {
    name: userProfile?.displayName || userProfile?.name || "Artist Name",
    genre: userProfile?.genre || "Music Artist",
    location: userProfile?.location || "",
    profileImage: userProfile?.photoURL || userProfile?.profileImage || '/assets/freepik__boostify_music_organe_abstract_icon.png',
    bannerImage: userProfile?.bannerImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
    biography: userProfile?.biography || "Music artist profile",
    followers: userProfile?.followers || 0,
    instagram: userProfile?.instagram || "",
    twitter: userProfile?.twitter || "",
    youtube: userProfile?.youtube || "",
    website: userProfile?.website || ""
  };

  const handlePlayPause = (song: Song) => {
    if (playingSongId === song.id) {
      audioRef.current?.pause();
      setPlayingSongId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = song.audioUrl;
        audioRef.current.play();
      }
      setPlayingSongId(song.id);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${artist.name} - Boostify Music`,
          text: `Check out ${artist.name}'s profile on Boostify Music!`,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard.",
      });
    }
  };

  const cardStyles = `bg-gradient-to-b from-gray-900 to-gray-950 bg-opacity-90 rounded-3xl p-6 shadow-xl ${colors.shadow} transition-colors duration-500`;
  const primaryBtn = `py-2 px-4 rounded-full text-sm font-semibold transition duration-300 shadow-lg whitespace-nowrap`;
  
  const merchCategories = ['Todo', 'Música', 'Videos', 'Shows'];
  const totalPlays = songs.reduce((acc, song) => acc + (parseInt(song.duration?.split(':')[0] || '0') * 100), 0);

  return (
    <div className={`min-h-screen ${colors.bgGradient} text-white transition-colors duration-500`}>
      <audio ref={audioRef} onEnded={() => setPlayingSongId(null)} />
      
      {/* Hero Header */}
      <header className="relative h-96 lg:h-[450px] w-full mb-8 overflow-hidden">
        <img
          src={artist.bannerImage}
          alt={`${artist.name} Cover`}
          className="absolute inset-0 w-full h-full object-cover filter brightness-75 transition-all duration-500"
          onError={(e) => { 
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.parentElement) {
              e.currentTarget.parentElement.style.background = 'black';
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        
        {/* Barra superior */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <div 
              className="w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-sm tracking-widest text-white transition-colors duration-500"
              style={{ backgroundImage: `linear-gradient(to bottom right, ${colors.hexAccent}, ${colors.hexPrimary})` }}
            >
              B
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/80">Boostify Music</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="py-2 px-4 rounded-full text-sm font-semibold transition duration-200 bg-black/50 hover:bg-gray-800 backdrop-blur-sm"
              style={{ borderColor: colors.hexBorder, borderWidth: '1px', color: colors.hexAccent }}
              onClick={handleShare}
              data-testid="button-share"
            >
              <Share2 className="h-4 w-4 inline mr-2" />
              Compartir
            </button>
            {isOwnProfile && (
              <Link href="/dashboard">
                <button 
                  className="py-2 px-4 rounded-full text-sm font-semibold transition duration-200 bg-black/50 hover:bg-gray-800 backdrop-blur-sm"
                  style={{ borderColor: colors.hexBorder, borderWidth: '1px', color: colors.hexAccent }}
                  data-testid="button-dashboard"
                >
                  Ir al dashboard
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Contenido del artista en el hero */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-10">
          <div className="text-4xl lg:text-6xl font-extrabold mb-2 text-white drop-shadow-lg" data-testid="text-artist-name">
            {artist.name}
          </div>
          <div className="text-lg transition-colors duration-500" style={{ color: colors.hexAccent }}>
            {artist.genre} {artist.location && `· ${artist.location}`}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {artist.instagram && (
              <span 
                className="text-xs rounded-full py-1 px-3 bg-black/50 backdrop-blur-sm border transition-colors duration-500"
                style={{ borderColor: colors.hexBorder, color: colors.hexAccent }}
              >
                📸 @{artist.instagram}
              </span>
            )}
            {videos.length > 0 && (
              <span 
                className="text-xs rounded-full py-1 px-3 bg-black/50 backdrop-blur-sm border transition-colors duration-500"
                style={{ borderColor: colors.hexBorder, color: colors.hexAccent }}
              >
                🎬 {videos.length} Video{videos.length > 1 ? 's' : ''}
              </span>
            )}
            {songs.length > 0 && (
              <span 
                className="text-xs rounded-full py-1 px-3 bg-black/50 backdrop-blur-sm border transition-colors duration-500"
                style={{ borderColor: colors.hexBorder, color: colors.hexAccent }}
              >
                🎵 {songs.length} {songs.length === 1 ? 'Canción' : 'Canciones'}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-8 pt-0 pb-20 md:pb-8">
        
        {/* Selector de Paleta */}
        <div 
          className="mb-6 p-4 rounded-xl bg-gray-900/80 backdrop-blur-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-500"
          style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}
        >
          <label htmlFor="theme-selector" className="text-sm font-medium text-white whitespace-nowrap">
            Personaliza tu Estilo:
          </label>
          <div className="flex-1 w-full max-w-sm">
            <select
              id="theme-selector"
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as keyof typeof colorPalettes)}
              className="block w-full py-2 px-3 text-sm rounded-full border bg-black text-white focus:ring-4 appearance-none cursor-pointer transition-colors duration-500"
              style={{ borderColor: colors.hexBorder }}
            >
              {Object.keys(colorPalettes).map(themeName => (
                <option key={themeName} value={themeName}>
                  {themeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Layout */}
        <main className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          {/* Columna Izquierda */}
          <section className="flex flex-col gap-6">
            
            {/* Tarjeta de Información de Artista */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="relative">
                  <img
                    src={artist.profileImage}
                    alt={`${artist.name} Avatar`}
                    className="w-44 h-44 rounded-3xl object-cover shadow-xl transition-colors duration-500"
                    style={{ borderColor: colors.hexBorder, borderWidth: '1px', boxShadow: `0 4px 10px ${colors.hexAccent}50` }}
                    data-testid="img-profile"
                  />
                  <div className="absolute -right-1 -bottom-1 py-1 px-2.5 text-xs rounded-full bg-green-500 text-green-950 font-semibold shadow-xl shadow-green-500/50">
                    Verificado
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-3xl font-semibold text-white">{artist.name}</div>
                  <div 
                    className="text-sm mt-1 transition-colors duration-500" 
                    style={{ color: colors.hexAccent }}
                  >
                    {artist.genre}
                  </div>
                  <div className="text-sm text-gray-400 mt-2 transition-colors duration-500">
                    {artist.biography}
                  </div>
                  
                  <div className="flex flex-wrap gap-3 mt-4">
                    {isOwnProfile ? (
                      <EditProfileDialog
                        artistId={artistId}
                        currentData={{
                          displayName: userProfile?.displayName || userProfile?.name || "",
                          biography: userProfile?.biography || "",
                          genre: userProfile?.genre || "",
                          location: userProfile?.location || "",
                          profileImage: userProfile?.photoURL || userProfile?.profileImage || "",
                          bannerImage: userProfile?.bannerImage || "",
                          contactEmail: userProfile?.email || userProfile?.contactEmail || "",
                          contactPhone: userProfile?.contactPhone || "",
                          instagram: userProfile?.instagram || "",
                          twitter: userProfile?.twitter || "",
                          youtube: userProfile?.youtube || "",
                          spotify: userProfile?.spotify || "",
                        }}
                        onUpdate={() => refetchProfile()}
                      />
                    ) : (
                      <>
                        {artist.website && (
                          <a 
                            href={artist.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${primaryBtn} text-white hover:opacity-80`}
                            style={{ backgroundColor: colors.hexPrimary }}
                            data-testid="button-website"
                          >
                            <ExternalLink className="h-4 w-4 inline mr-2" />
                            Website
                          </a>
                        )}
                        <button 
                          className={`${primaryBtn} bg-black hover:bg-gray-800`}
                          style={{ borderColor: colors.hexBorder, borderWidth: '1px', color: colors.hexAccent }}
                          onClick={handleShare}
                          data-testid="button-share-profile"
                        >
                          Compartir perfil
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Songs/Tracks */}
            {songs.length > 0 && (
              <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div className="flex justify-between items-center mb-4">
                  <div 
                    className="text-base font-semibold transition-colors duration-500 flex items-center gap-2" 
                    style={{ color: colors.hexAccent }}
                  >
                    <Music className="h-5 w-5" />
                    Música ({songs.length})
                  </div>
                </div>
                
                <div className="space-y-3">
                  {songs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-black/50 hover:bg-gray-900/50 transition-all duration-200 border"
                      style={{ borderColor: colors.hexBorder }}
                      data-testid={`card-song-${song.id}`}
                    >
                      <div className="flex-shrink-0">
                        {song.coverArt ? (
                          <img
                            src={song.coverArt}
                            alt={song.title || song.name}
                            className="w-14 h-14 rounded-lg object-cover"
                            data-testid={`img-song-cover-${song.id}`}
                          />
                        ) : (
                          <div 
                            className="w-14 h-14 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${colors.hexPrimary}33` }}
                          >
                            <Music className="h-6 w-6" style={{ color: colors.hexAccent }} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate text-white" data-testid={`text-song-title-${song.id}`}>
                          {song.title || song.name}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {song.duration || "3:45"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="py-2 px-4 rounded-full text-sm font-medium transition duration-300"
                          style={{ 
                            backgroundColor: playingSongId === song.id ? colors.hexPrimary : 'transparent',
                            borderColor: colors.hexBorder,
                            borderWidth: '1px',
                            color: playingSongId === song.id ? 'white' : colors.hexAccent
                          }}
                          onClick={() => handlePlayPause(song)}
                          data-testid={`button-play-${song.id}`}
                        >
                          {playingSongId === song.id ? (
                            <>
                              <Pause className="h-4 w-4 inline mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 inline mr-1" />
                              Play
                            </>
                          )}
                        </button>
                        <Link href={`/ai-video-creation?song=${encodeURIComponent(song.name)}&songId=${song.id}`}>
                          <button
                            className="py-2 px-4 rounded-full text-sm font-medium transition duration-300 bg-gradient-to-r hover:opacity-80"
                            style={{ 
                              backgroundImage: `linear-gradient(to right, ${colors.hexPrimary}, ${colors.hexAccent})`,
                              color: 'white'
                            }}
                            data-testid={`button-create-video-${song.id}`}
                          >
                            <VideoIcon className="h-4 w-4 inline mr-1" />
                            Crear Video
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tarjeta de Videos */}
            {videos.length > 0 && (
              <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div className="flex justify-between items-center mb-4">
                  <div 
                    className="text-base font-semibold transition-colors duration-500 flex items-center gap-2" 
                    style={{ color: colors.hexAccent }}
                  >
                    <VideoIcon className="h-5 w-5" />
                    Videos ({videos.length})
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videos.map((video, index) => (
                    <a
                      key={video.id}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl overflow-hidden bg-black/50 hover:bg-gray-900/50 transition-all duration-200 border cursor-pointer"
                      style={{ borderColor: colors.hexBorder }}
                      data-testid={`card-video-${index}`}
                    >
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div 
                          className="w-full h-40 flex items-center justify-center"
                          style={{ backgroundColor: `${colors.hexPrimary}33` }}
                        >
                          <VideoIcon className="h-12 w-12" style={{ color: colors.hexAccent }} />
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="font-medium text-white text-sm">{video.title || 'Music Video'}</h3>
                        <p className="text-xs text-gray-400 mt-1">Powered by Boostify</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tarjeta de Tienda/Merchandise */}
            {products.length > 0 && (
              <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div className="flex justify-between items-center mb-4">
                  <div 
                    className="text-base font-semibold transition-colors duration-500 flex items-center gap-2" 
                    style={{ color: colors.hexAccent }}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Tienda Oficial ({products.length})
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className="rounded-xl overflow-hidden bg-black/50 hover:bg-gray-900/50 transition-all duration-200 border group cursor-pointer"
                      style={{ borderColor: colors.hexBorder }}
                      data-testid={`card-product-${index}`}
                    >
                      <div className="relative">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <span 
                            className="text-xs font-bold py-1 px-2 rounded-full text-white"
                            style={{ backgroundColor: colors.hexPrimary }}
                          >
                            ${product.price}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-white text-sm">{product.name}</h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                        <button
                          className="mt-2 w-full py-2 px-4 rounded-full text-xs font-medium transition duration-300"
                          style={{ 
                            backgroundColor: colors.hexPrimary,
                            color: 'white'
                          }}
                          data-testid={`button-buy-${product.id}`}
                        >
                          <ShoppingCart className="h-3 w-3 inline mr-1" />
                          Comprar Ahora
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>

          {/* Columna Derecha */}
          <section className="flex flex-col gap-6">
            
            {/* Tarjeta de Estadísticas */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div 
                className="text-base font-semibold mb-4 transition-colors duration-500" 
                style={{ color: colors.hexAccent }}
              >
                Estadísticas del Perfil
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Canciones</span>
                  <span className="text-xl font-bold text-white">{songs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Videos</span>
                  <span className="text-xl font-bold text-white">{videos.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Seguidores</span>
                  <span className="text-xl font-bold text-white">{artist.followers.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Tarjeta de Biografía */}
            {artist.biography && (
              <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div 
                  className="text-base font-semibold mb-3 transition-colors duration-500" 
                  style={{ color: colors.hexAccent }}
                >
                  Bio
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {artist.biography}
                </p>
              </div>
            )}

            {/* Tarjeta de Información */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div 
                className="text-base font-semibold mb-3 transition-colors duration-500" 
                style={{ color: colors.hexAccent }}
              >
                Información
              </div>
              <div className="space-y-3">
                {artist.genre && (
                  <div className="flex items-center gap-2">
                    <Music2 className="h-4 w-4" style={{ color: colors.hexAccent }} />
                    <span className="text-sm text-gray-300">{artist.genre}</span>
                  </div>
                )}
                {artist.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" style={{ color: colors.hexAccent }} />
                    <span className="text-sm text-gray-300">{artist.location}</span>
                  </div>
                )}
                {artist.website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" style={{ color: colors.hexAccent }} />
                    <a 
                      href={artist.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                      style={{ color: colors.hexAccent }}
                    >
                      {artist.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Tarjeta de Redes Sociales */}
            {(artist.instagram || artist.twitter || artist.youtube) && (
              <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div 
                  className="text-base font-semibold mb-3 transition-colors duration-500" 
                  style={{ color: colors.hexAccent }}
                >
                  Redes Sociales
                </div>
                <div className="space-y-2">
                  {artist.instagram && (
                    <a 
                      href={`https://instagram.com/${artist.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                      style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}
                    >
                      <span className="text-sm">📸 Instagram</span>
                      <span className="text-sm ml-auto" style={{ color: colors.hexAccent }}>
                        @{artist.instagram}
                      </span>
                    </a>
                  )}
                  {artist.twitter && (
                    <a 
                      href={`https://twitter.com/${artist.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                      style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}
                    >
                      <span className="text-sm">𝕏 Twitter</span>
                      <span className="text-sm ml-auto" style={{ color: colors.hexAccent }}>
                        @{artist.twitter}
                      </span>
                    </a>
                  )}
                  {artist.youtube && (
                    <a 
                      href={artist.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                      style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}
                    >
                      <span className="text-sm">▶️ YouTube</span>
                      <span className="text-sm ml-auto" style={{ color: colors.hexAccent }}>
                        Ver canal
                      </span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Upcoming Shows - Empty State */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div 
                className="text-base font-semibold mb-3 transition-colors duration-500 flex items-center gap-2" 
                style={{ color: colors.hexAccent }}
              >
                <Calendar className="h-5 w-5" />
                Upcoming Shows
              </div>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-2" style={{ color: colors.hexAccent, opacity: 0.3 }} />
                <p className="text-gray-400 text-sm">No upcoming shows</p>
              </div>
            </div>

          </section>
        </main>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t" style={{ borderColor: colors.hexBorder }}>
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Powered by <span style={{ color: colors.hexAccent }} className="font-semibold">Boostify Music</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
