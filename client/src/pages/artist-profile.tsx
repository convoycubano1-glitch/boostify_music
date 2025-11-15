import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArtistProfileCard } from "../components/artist/artist-profile-card";
import { Head } from "../components/ui/head";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ChevronDown, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

interface Artist {
  id: string;
  uid: string;
  name: string;
  slug: string;
  profileImage?: string;
  createdAt?: any;
}

export default function ArtistProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [currentPath, navigate] = useLocation();
  const [artistId, setArtistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [artistData, setArtistData] = useState<any>(null);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [userArtists, setUserArtists] = useState<Artist[]>([]);
  const [showArtistSelector, setShowArtistSelector] = useState(false);

  const isEditMode = currentPath.includes('edit=true');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserUid(user.uid);
        if (isEditMode) {
          loadUserArtists(user.uid);
        }
      }
    });

    return () => unsubscribe();
  }, [isEditMode]);

  const loadUserArtists = async (userUid: string) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", userUid));
      const querySnapshot = await getDocs(q);

      const artists: Artist[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          name: data.name || data.displayName || "Sin nombre",
          slug: data.slug,
          profileImage: data.profileImage,
          createdAt: data.createdAt,
        };
      });

      // Ordenar en el frontend
      artists.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setUserArtists(artists);
      setShowArtistSelector(artists.length > 1);
    } catch (error) {
      console.error("Error loading user artists:", error);
    }
  };

  const switchArtist = (newSlug: string) => {
    navigate(`/artist/${newSlug}?edit=true`);
  };

  useEffect(() => {
    const findArtistBySlug = async () => {
      if (!slug) {
        setError(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log(`🔍 [MOBILE] Looking for artist with slug: ${slug}`);
        console.log(`🔍 [MOBILE] User Agent:`, navigator.userAgent);
        console.log(`🔍 [MOBILE] Window width:`, window.innerWidth);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 15000);
        });

        const queryPromise = (async () => {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("slug", "==", slug));
          return await getDocs(q);
        })();

        const querySnapshot = await Promise.race([queryPromise, timeoutPromise]) as any;

        console.log(`🔍 [MOBILE] Query completed: ${querySnapshot.size} users found`);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          console.log(`✅ [MOBILE] Artist found:`, {
            uid: userData.uid,
            name: userData.displayName || userData.name,
            slug: userData.slug
          });
          setArtistId(userData.uid);
          setArtistData(userData);
          setError(false);
        } else {
          console.warn(`⚠️ [MOBILE] No artist found with slug: ${slug}`);
          setError(true);
        }
      } catch (err: any) {
        console.error("❌ [MOBILE] Error finding artist by slug:", err);
        console.error("❌ [MOBILE] Error details:", {
          message: err.message,
          code: err.code,
          stack: err.stack?.substring(0, 200)
        });
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    findArtistBySlug();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white text-sm md:text-base">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !artistId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Artista No Encontrado</h1>
          <p className="text-gray-400 text-sm md:text-base mb-4">
            El perfil que buscas no existe o fue eliminado.
          </p>
          <p className="text-gray-500 text-xs md:text-sm mb-6">
            Slug buscado: {slug}
          </p>
          <a 
            href="/" 
            className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Volver al Inicio
          </a>
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
      <div className="min-h-screen bg-black pt-2 md:pt-4 pb-20 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
          {isEditMode && showArtistSelector && userArtists.length > 0 && (
            <Card className="bg-gray-900 border-orange-500 p-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-500" />
                  <span className="text-white font-medium">Editando:</span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white min-w-[200px] justify-between"
                    >
                      <div className="flex items-center gap-2 flex-1 overflow-hidden">
                        {artistData?.profileImage && (
                          <img
                            src={artistData.profileImage}
                            alt={artistName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="truncate">{artistName}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[250px] bg-gray-800 border-gray-700">
                    {userArtists.map((artist) => (
                      <DropdownMenuItem
                        key={artist.id}
                        onClick={() => switchArtist(artist.slug)}
                        className={`cursor-pointer hover:bg-gray-700 ${
                          artist.slug === slug ? 'bg-orange-500/20 text-orange-500' : 'text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {artist.profileImage ? (
                            <img
                              src={artist.profileImage}
                              alt={artist.name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <span className="truncate">{artist.name}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={() => navigate('/my-artists')}
                  variant="outline"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                >
                  Ver Todos
                </Button>
              </div>
            </Card>
          )}
          
          <ArtistProfileCard artistId={artistId} />
        </div>
      </div>
    </>
  );
}
