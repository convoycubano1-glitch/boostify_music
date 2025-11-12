import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { EditProfileDialog } from "./edit-profile-dialog";
import { useAuth } from "../../hooks/use-auth";
import { useTranslation } from "react-i18next";
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
  Check,
  Trash2,
  Upload,
  Plus,
  X,
  GripVertical,
  Layout,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useToast } from "../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import QRCode from "react-qr-code";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, RadialBarChart, RadialBar } from "recharts";

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
  sizes?: string[];
  createdAt?: any;
}

interface Show {
  id: string;
  venue: string;
  date: string;
  location: string;
  ticketUrl?: string;
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

// Componente de Tarjeta de Artista con QR Code
function ArtistCard({ artist, colors, profileUrl }: { artist: any, colors: any, profileUrl: string }) {
  const [showDownload, setShowDownload] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownloadCard = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = cardRef.current;
      
      if (!element) return;
      
      const opt = {
        margin: 0,
        filename: `${artist.name}-artist-card.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: [85.6, 53.98] as any, orientation: 'landscape' as const }
      };
      
      await html2pdf().set(opt).from(element).save();
      
      toast({
        title: "¡Tarjeta descargada!",
        description: "Tu Artist Card ha sido descargada exitosamente",
      });
    } catch (error) {
      console.error('Error downloading card:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar la tarjeta",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón para obtener la tarjeta */}
      <button
        onClick={() => setShowDownload(!showDownload)}
        className="w-full py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
        style={{
          background: `linear-gradient(135deg, ${colors.hexPrimary} 0%, ${colors.hexAccent} 100%)`,
          color: 'white',
          boxShadow: `0 10px 30px ${colors.hexPrimary}40`
        }}
      >
        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        <span className="relative flex items-center justify-center gap-2 md:gap-3">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <span className="hidden sm:inline">{showDownload ? 'Ocultar Artist Card' : 'Get Your Artist Card'}</span>
          <span className="sm:hidden">{showDownload ? 'Ocultar' : 'Artist Card'}</span>
        </span>
      </button>

      {/* Tarjeta elegante del artista */}
      {showDownload && (
        <div className="space-y-4">
          <div 
            ref={cardRef}
            className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl"
            style={{
              aspectRatio: '1.586',
              maxWidth: '100%',
              margin: '0 auto'
            }}
          >
            {/* Imagen de fondo con overlay */}
            <div className="absolute inset-0">
              <img
                src={artist.bannerImage || artist.profileImage}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
              {/* Overlay oscuro con gradiente */}
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, 
                    rgba(0,0,0,0.85) 0%, 
                    rgba(0,0,0,0.7) 40%, 
                    ${colors.hexPrimary}40 70%,
                    ${colors.hexAccent}30 100%)`
                }}
              ></div>
              {/* Patrón de puntos */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>
            </div>

            {/* Contenido de la tarjeta */}
            <div className="relative h-full p-4 md:p-6 flex flex-col justify-between">
              {/* Header con QR Code */}
              <div className="flex justify-between items-start gap-4">
                {/* Logo Boostify */}
                <div 
                  className="px-4 py-2 rounded-full text-xs md:text-sm font-black backdrop-blur-md border-2"
                  style={{ 
                    background: 'rgba(0,0,0,0.5)',
                    borderColor: colors.hexAccent,
                    color: colors.hexAccent
                  }}
                >
                  BOOSTIFY
                </div>

                {/* QR Code arriba a la derecha */}
                <div className="bg-white p-2 md:p-3 rounded-xl shadow-2xl">
                  <QRCode
                    value={profileUrl}
                    size={80}
                    className="md:hidden"
                    level="H"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                  <QRCode
                    value={profileUrl}
                    size={120}
                    className="hidden md:block"
                    level="H"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>
              </div>

              {/* Sección principal */}
              <div className="flex items-end gap-4 md:gap-6">
                {/* Imagen del artista */}
                <div className="relative flex-shrink-0">
                  <img
                    src={artist.profileImage}
                    alt={artist.name}
                    className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-2xl object-cover border-4 shadow-2xl"
                    style={{ borderColor: colors.hexAccent }}
                  />
                </div>

                {/* Info del artista */}
                <div className="flex-1 pb-2">
                  <h3 className="text-2xl md:text-3xl lg:text-5xl font-black text-white mb-1 md:mb-2 drop-shadow-lg">
                    {artist.name}
                  </h3>
                  <p 
                    className="text-sm md:text-base lg:text-xl font-bold mb-2 md:mb-3 drop-shadow-lg" 
                    style={{ color: colors.hexAccent }}
                  >
                    {artist.genre}
                  </p>
                  
                  {/* Links rápidos */}
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-bold backdrop-blur-md border transition-all duration-200 flex items-center gap-1 hover:scale-105"
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        borderColor: 'rgba(255,255,255,0.3)',
                        color: 'white'
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="hidden sm:inline">Profile</span>
                    </a>
                    <a
                      href={`${profileUrl}#merchandise`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-bold backdrop-blur-md border transition-all duration-200 flex items-center gap-1 hover:scale-105"
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        borderColor: 'rgba(255,255,255,0.3)',
                        color: 'white'
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span className="hidden sm:inline">Merch</span>
                    </a>
                    <a
                      href={`${profileUrl}#shows`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-bold backdrop-blur-md border transition-all duration-200 flex items-center gap-1 hover:scale-105"
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        borderColor: 'rgba(255,255,255,0.3)',
                        color: 'white'
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="hidden sm:inline">Shows</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Barra decorativa inferior */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-1.5 md:h-2"
                style={{
                  background: `linear-gradient(90deg, ${colors.hexPrimary} 0%, ${colors.hexAccent} 50%, ${colors.hexPrimary} 100%)`
                }}
              ></div>
            </div>
          </div>

          {/* Botón de descarga */}
          <button
            onClick={handleDownloadCard}
            className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            style={{
              backgroundColor: colors.hexPrimary,
              color: 'white',
              boxShadow: `0 4px 14px ${colors.hexPrimary}50`
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Artist Card
          </button>
        </div>
      )}
    </div>
  );
}

// Componente para comprar producto con selección de talla y Stripe Checkout
function ProductBuyButton({ product, colors, artistName }: { product: Product, colors: any, artistName: string }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleBuyClick = () => {
    if (!product.sizes || product.sizes.length === 0) {
      // Si no tiene tallas, comprar directamente
      handleCheckout('');
    } else if (product.sizes.length === 1) {
      // Si solo hay una talla, seleccionarla automáticamente
      handleCheckout(product.sizes[0]);
    } else {
      // Si hay múltiples tallas, mostrar diálogo
      setShowDialog(true);
    }
  };

  const handleCheckout = async (size: string) => {
    try {
      setIsProcessing(true);
      
      console.log('💳 Iniciando checkout de Stripe para:', product.name);
      
      const response = await fetch('/api/artist-profile/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          productPrice: product.price,
          productImage: product.imageUrl,
          artistName: artistName,
          productId: product.id,
          size: size
        })
      });

      const result = await response.json();
      
      if (result.success && result.url) {
        console.log('✅ Checkout session creada, redirigiendo...');
        // Redirigir a Stripe Checkout
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Error al crear sesión de checkout');
      }
    } catch (error: any) {
      console.error('❌ Error al procesar checkout:', error);
      toast({
        title: "Error al procesar la compra",
        description: error.message || "Intenta de nuevo más tarde",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      {product.sizes && product.sizes.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {product.sizes.map((size, idx) => (
            <span 
              key={idx}
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{ 
                borderColor: colors.hexBorder,
                color: colors.hexAccent 
              }}
            >
              {size}
            </span>
          ))}
        </div>
      )}
      
      <button
        onClick={handleBuyClick}
        disabled={isProcessing}
        className="mt-2 w-full py-1.5 md:py-2.5 px-3 md:px-4 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ 
          backgroundColor: colors.hexPrimary,
          color: 'white',
          boxShadow: `0 4px 14px 0 ${colors.hexPrimary}40`
        }}
        data-testid={`button-buy-${product.id}`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-1 md:gap-2">
            <div className="animate-spin h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span className="hidden sm:inline">Procesando...</span>
          </span>
        ) : (
          <>
            <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">Comprar Ahora ${product.price}</span>
            <span className="sm:hidden">${product.price}</span>
          </>
        )}
      </button>

      {/* Diálogo para seleccionar talla */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-gray-950 border border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Selecciona tu talla</DialogTitle>
            <DialogDescription className="text-gray-400">
              Elige la talla para {product.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-2 py-4">
            {product.sizes?.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  selectedSize === size 
                    ? 'ring-2 scale-105' 
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: selectedSize === size ? colors.hexPrimary : 'transparent',
                  borderColor: colors.hexBorder,
                  borderWidth: '1px',
                  color: selectedSize === size ? 'white' : colors.hexAccent
                }}
              >
                {size}
              </button>
            ))}
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => setShowDialog(false)}
              variant="outline"
              className="border-gray-700 text-gray-400 hover:bg-gray-900"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleCheckout(selectedSize)}
              disabled={!selectedSize || isProcessing}
              className="font-semibold"
              style={{
                backgroundColor: colors.hexPrimary,
                color: 'white'
              }}
            >
              {isProcessing ? 'Procesando...' : `Continuar con ${selectedSize}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ArtistProfileCard({ artistId }: ArtistProfileProps) {
  const { t } = useTranslation();
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof colorPalettes>('Boostify Naranja');
  const [merchFilter, setMerchFilter] = useState('Todo');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isUploadingSong, setIsUploadingSong] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [showUploadSongDialog, setShowUploadSongDialog] = useState(false);
  const [showUploadVideoDialog, setShowUploadVideoDialog] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const songFileInputRef = useRef<HTMLInputElement | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  
  // Estados para drag-and-drop del layout
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [leftSections, setLeftSections] = useState<string[]>(['songs', 'videos', 'social-hub', 'merchandise']);
  const [isMerchandiseExpanded, setIsMerchandiseExpanded] = useState(true);
  
  // Cargar orden guardado al montar
  useEffect(() => {
    const savedLayout = localStorage.getItem(`profile-layout-${artistId}`);
    if (savedLayout) {
      setLeftSections(JSON.parse(savedLayout));
    }
  }, [artistId]);
  
  // Manejar reordenamiento de secciones
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(leftSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setLeftSections(items);
    localStorage.setItem(`profile-layout-${artistId}`, JSON.stringify(items));
    
    toast({
      title: "Layout actualizado",
      description: "El orden de las secciones se ha guardado",
    });
  };

  
  const isOwnProfile = user?.uid === artistId;
  const colors = colorPalettes[selectedTheme];

  // Helper function to extract Spotify Artist ID from URL
  const getSpotifyEmbedUrl = (spotifyUrl: string): string | null => {
    if (!spotifyUrl) {
      console.log('🎵 Spotify URL is empty');
      return null;
    }
    
    // Match patterns like:
    // https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4
    // open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4
    const artistMatch = spotifyUrl.match(/artist\/([a-zA-Z0-9]+)/);
    
    if (artistMatch && artistMatch[1]) {
      const embedUrl = `https://open.spotify.com/embed/artist/${artistMatch[1]}?utm_source=generator`;
      console.log('🎵 Spotify embed URL generated:', embedUrl);
      return embedUrl;
    }
    
    console.log('🎵 Spotify URL did not match pattern:', spotifyUrl);
    return null;
  };

  // Helper function to convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    
    // Match patterns:
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://youtube.com/watch?v=VIDEO_ID
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
      }
    }
    
    return null;
  };

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
  const { data: songs = [] as Song[], refetch: refetchSongs } = useQuery<Song[]>({
    queryKey: ["songs", artistId],
    queryFn: async () => {
      try {
        console.log(`🎵 Fetching songs for artist: ${artistId}`);
        const songsRef = collection(db, "songs");
        const q = query(songsRef, where("userId", "==", artistId));
        const querySnapshot = await getDocs(q);

        console.log(`📊 Songs query returned ${querySnapshot.size} documents`);

        if (querySnapshot.empty) {
          console.log('⚠️ No songs found for this artist');
          return [];
        }

        const songsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log('🎵 Song data:', { id: doc.id, name: data.name, audioUrl: data.audioUrl });
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
        
        console.log(`✅ Successfully loaded ${songsData.length} songs`);
        return songsData;
      } catch (error) {
        console.error("❌ Error fetching songs:", error);
        return [];
      }
    },
    enabled: !!artistId
  });

  // Query para videos
  const { data: videos = [] as Video[], refetch: refetchVideos } = useQuery<Video[]>({
    queryKey: ["videos", artistId],
    queryFn: async () => {
      try {
        console.log(`📹 Fetching videos for artist: ${artistId}`);
        const videosRef = collection(db, "videos");
        const q = query(videosRef, where("userId", "==", artistId));
        const querySnapshot = await getDocs(q);

        console.log(`📊 Videos query returned ${querySnapshot.size} documents`);

        if (querySnapshot.empty) {
          console.log('⚠️ No videos found for this artist');
          return [];
        }

        const videosData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const videoId = data.url?.split('v=')?.[1] || data.url?.split('/')?.[3]?.split('?')?.[0];
          console.log('📹 Video data:', { id: doc.id, title: data.title, url: data.url });
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
        
        console.log(`✅ Successfully loaded ${videosData.length} videos`);
        return videosData;
      } catch (error) {
        console.error("❌ Error fetching videos:", error);
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
        console.log(`🛍️ Fetching merchandise for artist: ${artistId}`);
        console.log(`👤 User profile loaded:`, userProfile ? 'YES' : 'NO');
        console.log(`🔍 DEBUG - Artist ID being used for query:`, artistId);
        console.log(`🔍 DEBUG - Artist ID type:`, typeof artistId);
        
        const merchRef = collection(db, "merchandise");
        const q = query(merchRef, where("userId", "==", artistId));
        const querySnapshot = await getDocs(q);

        console.log(`📊 Merchandise query returned ${querySnapshot.size} documents`);
        
        // Log todos los productos en Firestore con este userId
        if (!querySnapshot.empty) {
          console.log(`📦 Products found in Firestore:`);
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`  - Product ID: ${doc.id}`, {
              name: data.name,
              userId: data.userId,
              hasImage: !!data.imageUrl,
              imageUrl: data.imageUrl?.substring(0, 80) + '...'
            });
          });
        } else {
          console.log(`⚠️ No products found for userId: ${artistId}`);
        }

        if (!querySnapshot.empty) {
          // Verificar si los productos existentes tienen tallas (productos nuevos)
          const firstProduct = querySnapshot.docs[0].data();
          const hasNewFormat = firstProduct.sizes !== undefined;
          
          if (hasNewFormat) {
            // Cargar productos actualizados con tallas
            const productsData = querySnapshot.docs.map((doc) => {
              const data = doc.data();
              console.log('🛍️ Product data:', { id: doc.id, name: data.name, price: data.price, sizes: data.sizes });
              return {
                id: doc.id,
                name: data.name,
                description: data.description,
                price: data.price,
                imageUrl: data.imageUrl,
                category: data.category,
                sizes: data.sizes,
                userId: data.userId,
                createdAt: data.createdAt?.toDate(),
              };
            });
            console.log(`✅ Successfully loaded ${productsData.length} existing products with sizes`);
            return productsData;
          } else {
            // Productos viejos sin tallas - borrarlos y regenerar
            console.log('🗑️ Deleting old products without sizes...');
            const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
            await Promise.all(deletePromises);
            console.log('✅ Old products deleted, will regenerate new ones');
            // Continuar con la generación de nuevos productos
          }
          
          // NUEVO: Detectar si todos los productos tienen la misma imagen (error de generación)
          if (querySnapshot.docs.length > 2) {
            const allImages = querySnapshot.docs.map(doc => doc.data().imageUrl);
            const uniqueImages = new Set(allImages);
            if (uniqueImages.size === 1 && allImages[0] !== undefined) {
              console.log('⚠️ [PRODUCTION] All products have the SAME image - This is a generation error!');
              console.log('🗑️ [PRODUCTION] Deleting products with duplicate images and regenerating...');
              const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
              await Promise.all(deletePromises);
              console.log('✅ [PRODUCTION] Old products with duplicate images deleted');
              // Continuar con la generación de nuevos productos
            }
          }
        }

        // Si no hay productos, generar 6 automáticamente con imágenes únicas
        const artistName = userProfile?.displayName || userProfile?.name || "Artist";
        const brandImage = userProfile?.profileImage || userProfile?.photoURL || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';
        
        const productTypes = [
          {
            type: 'T-Shirt',
            name: `${artistName} T-Shirt`,
            description: `Official ${artistName} merchandise t-shirt with exclusive design`,
            price: 29.99,
            category: 'Apparel',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          },
          {
            type: 'Hoodie',
            name: `${artistName} Hoodie`,
            description: `Premium quality hoodie featuring ${artistName}'s brand logo`,
            price: 49.99,
            category: 'Apparel',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          },
          {
            type: 'Cap',
            name: `${artistName} Cap`,
            description: `Stylish cap with embroidered ${artistName} logo`,
            price: 24.99,
            category: 'Accessories',
            sizes: ['One Size'],
          },
          {
            type: 'Poster',
            name: `${artistName} Poster`,
            description: `High-quality poster perfect for your room or studio`,
            price: 14.99,
            category: 'Art',
            sizes: ['18x24"', '24x36"'],
          },
          {
            type: 'Sticker Pack',
            name: `${artistName} Sticker Pack`,
            description: `Pack of 10 exclusive stickers featuring ${artistName}'s brand`,
            price: 9.99,
            category: 'Accessories',
            sizes: ['3"', '5"'],
          },
          {
            type: 'Vinyl Record',
            name: `${artistName} Vinyl Record`,
            description: `Limited edition vinyl featuring ${artistName}'s best tracks`,
            price: 34.99,
            category: 'Music',
            sizes: ['12"'],
          },
        ];

        console.log(`🏭 Generating ${productTypes.length} products with unique images for ${artistName}...`);
        const savedProducts: Product[] = [];
        
        for (const productDef of productTypes) {
          console.log(`🎨 [PRODUCTION] Generating image for ${productDef.type}...`);
          
          let productImage = brandImage;
          try {
            console.log(`📡 [PRODUCTION] Calling API: /api/artist-profile/generate-product-image`);
            const imageResponse = await fetch('/api/artist-profile/generate-product-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productType: productDef.type,
                artistName: artistName,
                brandImage: brandImage
              })
            });
            
            console.log(`📊 [PRODUCTION] API Response Status: ${imageResponse.status} ${imageResponse.statusText}`);
            
            const imageResult = await imageResponse.json();
            console.log(`🔍 [PRODUCTION] API Result for ${productDef.type}:`, {
              success: imageResult.success,
              hasImageUrl: !!imageResult.imageUrl,
              imageUrlPreview: imageResult.imageUrl?.substring(0, 100),
              error: imageResult.error,
              provider: imageResult.provider
            });
            
            if (imageResult.success && imageResult.imageUrl) {
              productImage = imageResult.imageUrl;
              console.log(`✅ [PRODUCTION] Generated unique image for ${productDef.type} via ${imageResult.provider || 'Gemini'}`);
            } else {
              console.warn(`⚠️ [PRODUCTION] Failed to generate image for ${productDef.type}:`, imageResult.error || 'Unknown error');
              console.warn(`⚠️ [PRODUCTION] Using fallback brand image for ${productDef.type}`);
            }
          } catch (error) {
            console.error(`❌ [PRODUCTION] Error generating image for ${productDef.type}:`, error);
            console.error(`❌ [PRODUCTION] Error details:`, {
              message: error instanceof Error ? error.message : 'Unknown',
              name: error instanceof Error ? error.name : 'Unknown'
            });
            console.warn(`⚠️ [PRODUCTION] Using fallback brand image for ${productDef.type}`);
          }
          
          const product = {
            name: productDef.name,
            description: productDef.description,
            price: productDef.price,
            imageUrl: productImage,
            category: productDef.category,
            sizes: productDef.sizes,
            userId: artistId,
            createdAt: new Date(),
          };
          
          const newDocRef = doc(collection(db, "merchandise"));
          await setDoc(newDocRef, product);
          savedProducts.push({ ...product, id: newDocRef.id });
          console.log(`✅ Product created: ${product.name}`);
        }

        console.log(`🎉 Successfully created ${savedProducts.length} products`);
        return savedProducts;
      } catch (error) {
        console.error("❌ Error fetching/creating merchandise:", error);
        return [];
      }
    },
    enabled: !!artistId
  });

  // Log cuando products cambie
  useEffect(() => {
    console.log(`🛍️ Products state updated: ${products.length} products`);
    if (products.length > 0) {
      console.log('✅ MERCHANDISE SECTION SHOULD BE VISIBLE');
    } else {
      console.log('⚠️ MERCHANDISE SECTION IS HIDDEN (no products)');
    }
  }, [products]);

  // Query para shows
  const { data: shows = [] as Show[], refetch: refetchShows } = useQuery<Show[]>({
    queryKey: ["shows", artistId],
    queryFn: async () => {
      try {
        console.log(`🎤 Fetching shows for artist: ${artistId}`);
        const showsRef = collection(db, "shows");
        const q = query(showsRef, where("userId", "==", artistId));
        const querySnapshot = await getDocs(q);

        console.log(`📊 Shows query returned ${querySnapshot.size} documents`);

        if (querySnapshot.empty) {
          console.log('⚠️ No shows found for this artist');
          return [];
        }

        const showsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log('🎤 Show data:', { id: doc.id, venue: data.venue, date: data.date });
          return {
            id: doc.id,
            venue: data.venue,
            date: data.date,
            location: data.location,
            ticketUrl: data.ticketUrl,
          };
        });
        
        // Ordenar por fecha (más próximos primero)
        showsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        console.log(`✅ Successfully loaded ${showsData.length} shows`);
        return showsData;
      } catch (error) {
        console.error("❌ Error fetching shows:", error);
        return [];
      }
    },
    enabled: !!artistId
  });

  const artist = {
    name: userProfile?.displayName || userProfile?.name || "Artist Name",
    genre: userProfile?.genre || "Music Artist",
    location: userProfile?.location || "",
    profileImage: userProfile?.photoURL || userProfile?.profileImage || '/assets/freepik__boostify_music_organe_abstract_icon.png',
    bannerImage: userProfile?.bannerImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
    loopVideoUrl: userProfile?.loopVideoUrl || "",
    bannerPosition: userProfile?.bannerPosition || "50",
    biography: userProfile?.biography || "Music artist profile",
    followers: userProfile?.followers || 0,
    instagram: userProfile?.instagram || "",
    twitter: userProfile?.twitter || "",
    youtube: userProfile?.youtube || "",
    spotify: userProfile?.spotify || "",
    website: userProfile?.website || ""
  };

  // DEBUG: Log completo del perfil de usuario y spotify
  console.log('🔍 DEBUG - userProfile completo:', userProfile);
  console.log('🔍 DEBUG - artist.spotify:', artist.spotify);
  console.log('🔍 DEBUG - getSpotifyEmbedUrl result:', artist.spotify ? getSpotifyEmbedUrl(artist.spotify) : 'NO SPOTIFY URL');

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

  const handleUploadSong = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newSongTitle.trim()) {
      toast({
        title: "Error",
        description: "Please provide a song title and select a file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingSong(true);
    try {
      const storageRef = ref(storage, `songs/${artistId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const audioUrl = await getDownloadURL(storageRef);

      const newDocRef = doc(collection(db, "songs"));
      await setDoc(newDocRef, {
        name: newSongTitle,
        audioUrl,
        userId: artistId,
        createdAt: new Date(),
        storageRef: storageRef.fullPath,
      });

      toast({
        title: "Song uploaded!",
        description: "Your song has been added successfully.",
      });

      setNewSongTitle('');
      setShowUploadSongDialog(false);
      refetchSongs();
    } catch (error) {
      console.error("Error uploading song:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload the song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingSong(false);
    }
  };

  const handleDeleteSong = async (song: Song) => {
    if (!confirm(`Are you sure you want to delete "${song.name}"?`)) return;

    try {
      await deleteDoc(doc(db, "songs", song.id));
      
      if (song.storageRef) {
        try {
          const storageRef = ref(storage, song.storageRef);
          await deleteObject(storageRef);
        } catch (err) {
          console.error("Error deleting file from storage:", err);
        }
      }

      toast({
        title: "Song deleted",
        description: "The song has been removed.",
      });

      refetchSongs();
    } catch (error) {
      console.error("Error deleting song:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the song. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUploadVideo = async () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please provide a video title and URL.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingVideo(true);
    try {
      const newDocRef = doc(collection(db, "videos"));
      await setDoc(newDocRef, {
        title: newVideoTitle,
        url: newVideoUrl,
        userId: artistId,
        createdAt: new Date(),
      });

      toast({
        title: "Video added!",
        description: "Your video has been added successfully.",
      });

      setNewVideoTitle('');
      setNewVideoUrl('');
      setShowUploadVideoDialog(false);
      refetchVideos();
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Upload failed",
        description: "Could not add the video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleDeleteVideo = async (video: Video) => {
    if (!confirm(`Are you sure you want to delete "${video.title}"?`)) return;

    try {
      await deleteDoc(doc(db, "videos", video.id));

      toast({
        title: "Video deleted",
        description: "The video has been removed.",
      });

      refetchVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the video. Please try again.",
        variant: "destructive",
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
      <header className="relative h-72 md:h-96 lg:h-[450px] w-full mb-6 md:mb-8 overflow-hidden">
        {(() => {
          // Detectar si es video (por extensión o por metadata)
          const isVideo = artist.bannerImage?.match(/\.(mp4|mov|avi|webm)$/i) || 
                         artist.bannerImage?.includes('video') ||
                         artist.bannerImage?.includes('.mp4') ||
                         artist.bannerImage?.includes('.webm') ||
                         artist.bannerImage?.includes('.mov');
          
          const videoUrl = artist.loopVideoUrl || (isVideo ? artist.bannerImage : null);
          
          console.log('🎬 Video detection:', { 
            bannerImage: artist.bannerImage?.substring(0, 100), 
            loopVideoUrl: artist.loopVideoUrl,
            isVideo, 
            videoUrl: videoUrl?.substring(0, 100) 
          });
          
          if (videoUrl) {
            return (
              <video
                key={videoUrl}
                src={videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover filter brightness-75 transition-all duration-500"
                style={{ objectPosition: `center ${artist.bannerPosition}%` }}
                onCanPlay={() => console.log('✅ Hero video can play')}
                onError={(e) => console.error('❌ Hero video error:', e)}
              />
            );
          }
          
          return (
            <img
              src={artist.bannerImage}
              alt={`${artist.name} Cover`}
              className="absolute inset-0 w-full h-full object-cover filter brightness-75 transition-all duration-500"
              style={{ objectPosition: `center ${artist.bannerPosition}%` }}
              onError={(e) => { 
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.background = 'black';
                }
              }}
            />
          );
        })()}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        
        {/* Barra superior */}
        <div className="absolute top-0 left-0 right-0 p-3 md:p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-1.5 md:gap-2">
            <img 
              src="/assets/boostify-logo.svg" 
              alt="Boostify Logo"
              className="w-8 h-8 md:w-9 md:h-9 transition-all duration-500"
            />
            <div className="hidden sm:block">
              <div className="text-xs uppercase tracking-widest text-white/80">Boostify Music</div>
            </div>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            <button 
              className="py-1.5 md:py-2 px-3 md:px-4 rounded-full text-xs md:text-sm font-semibold transition duration-200 bg-black/50 hover:bg-gray-800 backdrop-blur-sm"
              style={{ borderColor: colors.hexBorder, borderWidth: '1px', color: colors.hexAccent }}
              onClick={handleShare}
              data-testid="button-share"
            >
              <Share2 className="h-3 w-3 md:h-4 md:w-4 inline md:mr-2" />
              <span className="hidden md:inline">{t('profile.share')}</span>
            </button>
            {isOwnProfile && (
              <Link href="/dashboard">
                <button 
                  className="py-1.5 md:py-2 px-3 md:px-4 rounded-full text-xs md:text-sm font-semibold transition duration-200 bg-black/50 hover:bg-gray-800 backdrop-blur-sm"
                  style={{ borderColor: colors.hexBorder, borderWidth: '1px', color: colors.hexAccent }}
                  data-testid="button-dashboard"
                >
                  <span className="hidden md:inline">Ir al dashboard</span>
                  <span className="md:hidden">Dashboard</span>
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
        
        {/* Selector de Paleta - Solo visible para el dueño del perfil */}
        {isOwnProfile && (
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
        )}

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
                      <>
                        <EditProfileDialog
                          artistId={artistId}
                          currentData={{
                            displayName: userProfile?.displayName || userProfile?.name || "",
                            biography: userProfile?.biography || "",
                            genre: userProfile?.genre || "",
                            location: userProfile?.location || "",
                            profileImage: userProfile?.photoURL || userProfile?.profileImage || "",
                            bannerImage: userProfile?.bannerImage || "",
                            bannerPosition: String((userProfile as any)?.bannerPosition || "50"),
                            loopVideoUrl: (userProfile as any)?.loopVideoUrl || "",
                            slug: (userProfile as any)?.slug || "",
                            contactEmail: userProfile?.email || userProfile?.contactEmail || "",
                            contactPhone: userProfile?.contactPhone || "",
                            instagram: userProfile?.instagram || "",
                            twitter: userProfile?.twitter || "",
                            youtube: userProfile?.youtube || "",
                            spotify: userProfile?.spotify || "",
                          }}
                          onUpdate={() => refetchProfile()}
                        />
                        <Button
                          size="sm"
                          variant={isEditingLayout ? "default" : "outline"}
                          className="rounded-full"
                          style={{
                            backgroundColor: isEditingLayout ? colors.hexPrimary : 'transparent',
                            borderColor: colors.hexBorder,
                            color: isEditingLayout ? 'white' : colors.hexAccent
                          }}
                          onClick={() => setIsEditingLayout(!isEditingLayout)}
                          data-testid="button-edit-layout"
                        >
                          <Layout className="h-4 w-4 mr-2" />
                          {isEditingLayout ? 'Guardar Layout' : 'Personalizar Layout'}
                        </Button>
                      </>
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

            {/* CTA for non-authenticated visitors - Between bio and music */}
            {!isOwnProfile && !user && (
              <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Sparkles className="h-12 w-12 mx-auto mb-3" style={{ color: colors.hexAccent }} />
                    <h3 className="text-2xl font-bold text-white mb-2">¿Eres músico?</h3>
                    <p className="text-gray-400">
                      Crea tu perfil de artista profesional gratis y llega a más fans
                    </p>
                  </div>
                  <Link href="/">
                    <Button
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg gap-2 px-6 py-6 text-base font-bold rounded-full hover:scale-105 transition-all duration-300"
                      data-testid="button-cta-middle"
                    >
                      <Sparkles className="h-5 w-5" />
                      Crear Mi Perfil Gratis
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="profile-sections" isDropDisabled={!isEditingLayout}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-6">
                    {leftSections.map((sectionId: string, index: number) => {
                      let sectionElement = null;
                      
                      if (sectionId === 'songs' && (songs.length > 0 || isOwnProfile)) {
                        sectionElement = (
            <div className={`${cardStyles} ${isEditingLayout ? 'relative pl-8' : ''}`} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              {isEditingLayout && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-6 w-6" style={{ color: colors.hexAccent }} />
                </div>
              )}
                <div className="flex justify-between items-center mb-4">
                  <div 
                    className="text-base font-semibold transition-colors duration-500 flex items-center gap-2" 
                    style={{ color: colors.hexAccent }}
                  >
                    <Music className="h-5 w-5" />
                    {t('profile.sections.music')} ({songs.length})
                  </div>
                  {isOwnProfile && (
                    <Dialog open={showUploadSongDialog} onOpenChange={setShowUploadSongDialog}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="rounded-full"
                          style={{ backgroundColor: colors.hexPrimary, color: 'white' }}
                          data-testid="button-upload-song"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Subir Canción
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Subir Nueva Canción</DialogTitle>
                          <DialogDescription>
                            Agrega una nueva canción a tu perfil
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="song-title">Título de la Canción</Label>
                            <Input
                              id="song-title"
                              value={newSongTitle}
                              onChange={(e) => setNewSongTitle(e.target.value)}
                              placeholder="Mi Nueva Canción"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="song-file">Archivo de Audio</Label>
                            <Input
                              id="song-file"
                              type="file"
                              accept="audio/*"
                              ref={songFileInputRef}
                              onChange={handleUploadSong}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowUploadSongDialog(false)}
                            disabled={isUploadingSong}
                          >
                            Cancelar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="py-1.5 md:py-2 px-3 md:px-4 rounded-full text-xs md:text-sm font-medium transition duration-300"
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
                              <Pause className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
                              <span className="hidden sm:inline">Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
                              <span className="hidden sm:inline">Play</span>
                            </>
                          )}
                        </button>
                        {isOwnProfile && (
                          <>
                            <Link href={`/music-video-creator?song=${encodeURIComponent(song.name)}&songId=${song.id}`}>
                              <button
                                className="py-1.5 md:py-2 px-3 md:px-4 rounded-full text-xs md:text-sm font-medium transition duration-300 bg-gradient-to-r hover:opacity-80"
                                style={{ 
                                  backgroundImage: `linear-gradient(to right, ${colors.hexPrimary}, ${colors.hexAccent})`,
                                  color: 'white'
                                }}
                                data-testid={`button-create-video-${song.id}`}
                              >
                                <VideoIcon className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
                                <span className="hidden sm:inline">Crear Video</span>
                                <span className="sm:hidden">Video</span>
                              </button>
                            </Link>
                            <button
                              className="py-1.5 md:py-2 px-3 md:px-4 rounded-full text-xs md:text-sm font-medium transition duration-300 hover:bg-red-600"
                              style={{ 
                                backgroundColor: 'transparent',
                                borderColor: '#EF4444',
                                borderWidth: '1px',
                                color: '#EF4444'
                              }}
                              onClick={() => handleDeleteSong(song)}
                              data-testid={`button-delete-song-${song.id}`}
                            >
                              <Trash2 className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
                              <span className="hidden sm:inline">Borrar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                        );
                      } else if (sectionId === 'videos' && (videos.length > 0 || isOwnProfile)) {
                        sectionElement = (
            <div className={`${cardStyles} ${isEditingLayout ? 'relative pl-8' : ''}`} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              {isEditingLayout && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-6 w-6" style={{ color: colors.hexAccent }} />
                </div>
              )}
                <div className="flex justify-between items-center mb-4">
                  <div 
                    className="text-base font-semibold transition-colors duration-500 flex items-center gap-2" 
                    style={{ color: colors.hexAccent }}
                  >
                    <VideoIcon className="h-5 w-5" />
                    {t('profile.sections.videos')} ({videos.length})
                  </div>
                  {isOwnProfile && (
                    <Dialog open={showUploadVideoDialog} onOpenChange={setShowUploadVideoDialog}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="rounded-full"
                          style={{ backgroundColor: colors.hexPrimary, color: 'white' }}
                          data-testid="button-upload-video"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar Video
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agregar Nuevo Video</DialogTitle>
                          <DialogDescription>
                            Agrega un video de YouTube u otra plataforma a tu perfil
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="video-title">Título del Video</Label>
                            <Input
                              id="video-title"
                              value={newVideoTitle}
                              onChange={(e) => setNewVideoTitle(e.target.value)}
                              placeholder="Mi Video Musical"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="video-url">URL del Video</Label>
                            <Input
                              id="video-url"
                              value={newVideoUrl}
                              onChange={(e) => setNewVideoUrl(e.target.value)}
                              placeholder="https://youtube.com/watch?v=..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowUploadVideoDialog(false)}
                            disabled={isUploadingVideo}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleUploadVideo}
                            disabled={isUploadingVideo}
                            style={{ backgroundColor: colors.hexPrimary, color: 'white' }}
                          >
                            {isUploadingVideo ? 'Agregando...' : 'Agregar Video'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videos.map((video, index) => (
                    <div
                      key={video.id}
                      className="rounded-xl overflow-hidden bg-black/50 hover:bg-gray-900/50 transition-all duration-200 border"
                      style={{ borderColor: colors.hexBorder }}
                      data-testid={`card-video-${index}`}
                    >
                      <div
                        onClick={() => setPlayingVideo(video)}
                        className="block cursor-pointer relative group"
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
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: colors.hexPrimary }}
                          >
                            <Play className="h-8 w-8 text-white ml-1" fill="white" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-white text-sm">{video.title || 'Music Video'}</h3>
                        <p className="text-xs text-gray-400 mt-1">Powered by Boostify</p>
                        {isOwnProfile && (
                          <div className="space-y-2 mt-2">
                            {/* Botón promocional para YouTube Views */}
                            <Link href="/youtube-views">
                              <button
                                className="w-full py-2 px-4 rounded-full text-xs font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                                style={{ 
                                  background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                                  color: 'white'
                                }}
                                data-testid={`button-promote-video-${video.id}`}
                              >
                                <Sparkles className="h-3 w-3 inline mr-1" />
                                Promocionar Video
                              </button>
                            </Link>
                            
                            {/* Botón de borrar */}
                            <button
                              className="w-full py-2 px-4 rounded-full text-xs font-medium transition duration-300 hover:bg-red-600"
                              style={{ 
                                backgroundColor: 'transparent',
                                borderColor: '#EF4444',
                                borderWidth: '1px',
                                color: '#EF4444'
                              }}
                              onClick={() => handleDeleteVideo(video)}
                              data-testid={`button-delete-video-${video.id}`}
                            >
                              <Trash2 className="h-3 w-3 inline mr-1" />
                              Borrar Video
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                        );
                      } else if (sectionId === 'social-hub') {
                        // Elemento circular con iconos de redes sociales
                        sectionElement = (
            <div className={`${cardStyles} ${isEditingLayout ? 'relative pl-8' : ''}`} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              {isEditingLayout && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-6 w-6" style={{ color: colors.hexAccent }} />
                </div>
              )}
              
              {/* Contenedor del elemento circular */}
              <div className="relative py-8 md:py-12 overflow-hidden bg-black rounded-2xl">
                {/* Fondo degradado animado */}
                <div className="absolute inset-0" style={{
                  background: `radial-gradient(circle at 50% 50%, ${colors.hexPrimary}30 0%, ${colors.hexAccent}20 30%, #000000 70%)`
                }}></div>
                
                {/* Patrón de puntos */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '30px 30px'
                }}></div>

                {/* Elemento circular central con iconos de redes sociales */}
                <div className="relative flex items-center justify-center">
                  <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                    {/* Círculos decorativos de fondo */}
                    <div 
                      className="absolute inset-0 rounded-full opacity-20 blur-2xl animate-pulse"
                      style={{ background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})` }}
                    ></div>
                    <div 
                      className="absolute inset-4 rounded-full opacity-30"
                      style={{ 
                        background: `conic-gradient(from 0deg, ${colors.hexPrimary}, ${colors.hexAccent}, ${colors.hexPrimary})`,
                        animation: 'spin 20s linear infinite'
                      }}
                    ></div>
                    
                    {/* Imagen del artista en el centro */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56">
                        <img
                          src={artist.profileImage}
                          alt={artist.name}
                          className="w-full h-full rounded-full object-cover border-4 shadow-2xl"
                          style={{ borderColor: colors.hexAccent }}
                        />
                      </div>
                    </div>

                    {/* Iconos de redes sociales alrededor del círculo */}
                    {(() => {
                      const socialIcons = [
                        { icon: '🌐', name: 'Website', show: true, url: `/artist/${(artist as any).slug}` },
                        { icon: '▶️', name: 'YouTube', show: artist.youtube, url: artist.youtube },
                        { icon: '🎵', name: 'TikTok', show: true, url: '#' },
                        { icon: '📸', name: 'Instagram', show: artist.instagram, url: artist.instagram },
                        { icon: '🎧', name: 'Spotify', show: artist.spotify, url: artist.spotify },
                        { icon: '📱', name: 'Twitter', show: artist.twitter, url: artist.twitter },
                        { icon: '🎶', name: 'Music', show: true, url: '#' },
                        { icon: '📹', name: 'Videos', show: true, url: '#' },
                      ];

                      const visibleIcons = socialIcons.filter(s => s.show);
                      const angleStep = 360 / visibleIcons.length;
                      const radius = 140; // Radio en pixels para desktop
                      const radiusMd = 120; // Radio para tablet
                      const radiusSm = 100; // Radio para móvil

                      return visibleIcons.map((social, index) => {
                        const angle = (angleStep * index - 90) * (Math.PI / 180);
                        const xSm = Math.cos(angle) * radiusSm;
                        const ySm = Math.sin(angle) * radiusSm;

                        return (
                          <a
                            key={index}
                            href={isOwnProfile ? social.url : '/auth'}
                            onClick={(e) => {
                              if (!isOwnProfile) {
                                e.preventDefault();
                                window.location.href = '/auth';
                              }
                            }}
                            className="absolute group cursor-pointer"
                            style={{
                              top: `calc(50% + ${ySm}px)`,
                              left: `calc(50% + ${xSm}px)`,
                              transform: 'translate(-50%, -50%)',
                            }}
                          >
                            <div 
                              className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full backdrop-blur-md border-2 flex items-center justify-center text-xl md:text-2xl lg:text-3xl transition-all duration-300 hover:scale-125 hover:rotate-12 shadow-xl"
                              style={{ 
                                background: 'rgba(0,0,0,0.7)',
                                borderColor: colors.hexAccent,
                                boxShadow: `0 0 20px ${colors.hexAccent}50`
                              }}
                            >
                              {social.icon}
                            </div>
                            {!isOwnProfile && (
                              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="text-xs bg-black/90 px-2 py-1 rounded-md" style={{ color: colors.hexAccent }}>
                                  Join Boostify
                                </div>
                              </div>
                            )}
                          </a>
                        );
                      });
                    })()}
                  </div>
                </div>

                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}} />
              </div>
            </div>
                        );
                      } else if (sectionId === 'merchandise' && (products.length > 0 || isOwnProfile)) {
                        sectionElement = (
            <div className={`${cardStyles} ${isEditingLayout ? 'relative pl-8' : ''}`} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              {isEditingLayout && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-6 w-6" style={{ color: colors.hexAccent }} />
                </div>
              )}
                <div className="flex justify-between items-center mb-4">
                  <div 
                    className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 cursor-pointer"
                    style={{ color: colors.hexAccent }}
                    onClick={() => setIsMerchandiseExpanded(!isMerchandiseExpanded)}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Tienda Oficial ({products.length})
                    {isMerchandiseExpanded ? (
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </div>
                </div>
                {isMerchandiseExpanded && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-3">
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className="rounded-lg md:rounded-xl overflow-hidden bg-black/50 hover:bg-gray-900/50 transition-all duration-200 border group cursor-pointer"
                      style={{ borderColor: colors.hexBorder }}
                      data-testid={`card-product-${index}`}
                    >
                      <div className="relative">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-32 md:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';
                          }}
                        />
                        <div className="absolute top-1 right-1 md:top-2 md:right-2">
                          <span 
                            className="text-xs font-bold py-0.5 px-1.5 md:py-1 md:px-2 rounded-full text-white"
                            style={{ backgroundColor: colors.hexPrimary }}
                          >
                            ${product.price}
                          </span>
                        </div>
                      </div>
                      <div className="p-2 md:p-3">
                        <h3 className="font-medium text-white text-xs md:text-sm truncate">{product.name}</h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1 md:line-clamp-2 hidden md:block">{product.description}</p>
                        <ProductBuyButton 
                          product={product} 
                          colors={colors} 
                          artistName={artist.name}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                )}
                
                {/* Botón promocional para manejar tienda - Solo visible para el artista */}
                {isOwnProfile && isMerchandiseExpanded && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.hexBorder }}>
                    <Link href="/merchandise">
                      <button
                        className="w-full py-4 px-6 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center justify-center gap-2"
                        style={{ 
                          background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                          color: 'white'
                        }}
                        data-testid="button-manage-store"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        <span>Gestiona Tu Tienda Premium</span>
                        <Sparkles className="h-5 w-5" />
                      </button>
                    </Link>
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Accede a herramientas avanzadas para potenciar tus ventas
                    </p>
                  </div>
                )}
              </div>
                        );
                      }

                      if (!sectionElement) return null;

                      return (
                        <Draggable key={sectionId} draggableId={sectionId} index={index} isDragDisabled={!isEditingLayout}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'opacity-50' : ''}
                            >
                              {sectionElement}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

          </section>

          {/* Columna Derecha */}
          <section className="flex flex-col gap-6">
            
            {/* Artist Card con QR Code */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <ArtistCard 
                artist={artist}
                colors={colors}
                profileUrl={`${window.location.origin}/artist/${userProfile?.slug || artistId}`}
              />
            </div>

            {/* Tarjeta de Estadísticas con Gráficos */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div 
                className="text-base font-semibold mb-4 transition-colors duration-500" 
                style={{ color: colors.hexAccent }}
              >
                Estadísticas del Perfil
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <motion.div 
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.hexPrimary}15`, borderColor: colors.hexBorder, borderWidth: '1px' }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Music2 className="h-5 w-5 mx-auto mb-1" style={{ color: colors.hexAccent }} />
                  <div className="text-2xl font-bold text-white">{songs.length}</div>
                  <div className="text-xs text-gray-400">Canciones</div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.hexPrimary}15`, borderColor: colors.hexBorder, borderWidth: '1px' }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <VideoIcon className="h-5 w-5 mx-auto mb-1" style={{ color: colors.hexAccent }} />
                  <div className="text-2xl font-bold text-white">{videos.length}</div>
                  <div className="text-xs text-gray-400">Videos</div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.hexPrimary}15`, borderColor: colors.hexBorder, borderWidth: '1px' }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Users className="h-5 w-5 mx-auto mb-1" style={{ color: colors.hexAccent }} />
                  <div className="text-2xl font-bold text-white">{artist.followers > 1000 ? `${(artist.followers / 1000).toFixed(1)}K` : artist.followers}</div>
                  <div className="text-xs text-gray-400">Seguidores</div>
                </motion.div>
              </div>

              {/* Gráfico de Progreso Radial */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-300">Nivel de Completitud</div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      innerRadius="50%" 
                      outerRadius="100%" 
                      data={[
                        {
                          name: 'Perfil',
                          value: (() => {
                            let score = 0;
                            if (artist.profileImage) score += 20;
                            if (artist.bannerImage) score += 20;
                            if (artist.biography) score += 15;
                            if (songs.length > 0) score += 15;
                            if (videos.length > 0) score += 15;
                            if (artist.instagram || artist.twitter || artist.youtube) score += 15;
                            return score;
                          })(),
                          fill: colors.hexPrimary
                        }
                      ]}
                      startAngle={180}
                      endAngle={0}
                    >
                      <RadialBar
                        background={{ fill: '#1a1a1a' }}
                        dataKey="value"
                        cornerRadius={10}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="text-3xl font-bold"
                    style={{ color: colors.hexAccent }}
                  >
                    {(() => {
                      let score = 0;
                      if (artist.profileImage) score += 20;
                      if (artist.bannerImage) score += 20;
                      if (artist.biography) score += 15;
                      if (songs.length > 0) score += 15;
                      if (videos.length > 0) score += 15;
                      if (artist.instagram || artist.twitter || artist.youtube) score += 15;
                      return score;
                    })()}%
                  </div>
                  <div className="text-sm text-gray-400">{t('profile.analytics.complete')}</div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Análisis de Actividad - Visible para todos */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div 
                className="text-base font-semibold mb-4 transition-colors duration-500" 
                style={{ color: colors.hexAccent }}
              >
                {t('profile.analytics.title')}
              </div>
              
              {/* Gráfico de Área - Actividad Semanal */}
              <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-2">{t('profile.analytics.lastSevenDays')}</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { day: t('profile.days.mon'), plays: Math.floor(Math.random() * 50) + 20, views: Math.floor(Math.random() * 30) + 10 },
                          { day: t('profile.days.tue'), plays: Math.floor(Math.random() * 50) + 20, views: Math.floor(Math.random() * 30) + 10 },
                          { day: t('profile.days.wed'), plays: Math.floor(Math.random() * 50) + 20, views: Math.floor(Math.random() * 30) + 10 },
                          { day: t('profile.days.thu'), plays: Math.floor(Math.random() * 50) + 20, views: Math.floor(Math.random() * 30) + 10 },
                          { day: t('profile.days.fri'), plays: Math.floor(Math.random() * 50) + 20, views: Math.floor(Math.random() * 30) + 10 },
                          { day: t('profile.days.sat'), plays: Math.floor(Math.random() * 50) + 20, views: Math.floor(Math.random() * 30) + 10 },
                          { day: t('profile.days.sun'), plays: Math.floor(Math.random() * 50) + 20, views: Math.floor(Math.random() * 30) + 10 },
                        ]}
                        margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                      >
                        <defs>
                          <linearGradient id={`colorPlays-${artistId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colors.hexPrimary} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={colors.hexPrimary} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id={`colorViews-${artistId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colors.hexAccent} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={colors.hexAccent} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="day" 
                          stroke="#666" 
                          tick={{ fill: '#999', fontSize: 11 }}
                          axisLine={{ stroke: '#333' }}
                        />
                        <YAxis 
                          stroke="#666" 
                          tick={{ fill: '#999', fontSize: 11 }}
                          axisLine={{ stroke: '#333' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1a1a1a', 
                            border: `1px solid ${colors.hexBorder}`,
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="plays" 
                          stroke={colors.hexPrimary} 
                          fillOpacity={1} 
                          fill={`url(#colorPlays-${artistId})`}
                          strokeWidth={2}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="views" 
                          stroke={colors.hexAccent} 
                          fillOpacity={1} 
                          fill={`url(#colorViews-${artistId})`}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.hexPrimary }}></div>
                      <span className="text-gray-400">{t('profile.analytics.plays')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.hexAccent }}></div>
                      <span className="text-gray-400">{t('profile.analytics.views')}</span>
                    </div>
                  </div>
                </div>

                {/* Métricas rápidas */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.div 
                    className="p-3 rounded-lg text-center"
                    style={{ backgroundColor: `${colors.hexPrimary}10`, borderColor: colors.hexBorder, borderWidth: '1px' }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-xs text-gray-400 mb-1">{t('profile.analytics.totalPlays')}</div>
                    <div className="text-xl font-bold" style={{ color: colors.hexPrimary }}>
                      {(songs.length * Math.floor(Math.random() * 100 + 50)).toLocaleString()}
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="p-3 rounded-lg text-center"
                    style={{ backgroundColor: `${colors.hexAccent}10`, borderColor: colors.hexBorder, borderWidth: '1px' }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-xs text-gray-400 mb-1">{t('profile.analytics.totalViews')}</div>
                    <div className="text-xl font-bold" style={{ color: colors.hexAccent }}>
                      {(videos.length * Math.floor(Math.random() * 150 + 75)).toLocaleString()}
                    </div>
                  </motion.div>
                </div>
            </div>

            {/* Tarjeta CTA: Monetiza Tu Talento - Visible para todos */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px', position: 'relative', overflow: 'hidden' }}>
              {/* Fondo decorativo */}
              <div className="absolute inset-0 opacity-10" style={{
                background: `radial-gradient(circle at 30% 50%, ${colors.hexPrimary}, transparent 70%)`
              }}></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="h-6 w-6" style={{ color: colors.hexAccent }} />
                  <div 
                    className="text-base font-bold transition-colors duration-500" 
                    style={{ color: colors.hexAccent }}
                  >
                    {t('profile.monetize.title')}
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                  {t('profile.monetize.description')}
                </p>
                
                <Link href="/producer-tools">
                  <button
                    className="w-full py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                      color: 'white'
                    }}
                    data-testid="button-producer-tools"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{t('profile.monetize.cta')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" style={{ color: colors.hexAccent }} />
                    Beats
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" style={{ color: colors.hexAccent }} />
                    Mezclas
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" style={{ color: colors.hexAccent }} />
                    Master
                  </span>
                </div>
              </div>
            </div>

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

            {/* Spotify Player Embed */}
            {artist.spotify && getSpotifyEmbedUrl(artist.spotify) && (
              <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }} data-testid="spotify-widget">
                <div 
                  className="text-base font-semibold mb-3 transition-colors duration-500 flex items-center gap-2" 
                  style={{ color: colors.hexAccent }}
                >
                  <Music className="h-5 w-5" />
                  Spotify
                </div>
                {/* Contenedor mejorado con background artístico */}
                <div 
                  className="rounded-lg overflow-hidden w-full relative" 
                  style={{ 
                    minHeight: '400px',
                    background: `
                      linear-gradient(135deg, 
                        ${colors.hexPrimary}15 0%, 
                        rgba(0,0,0,0.4) 25%, 
                        rgba(0,0,0,0.6) 50%,
                        rgba(0,0,0,0.4) 75%,
                        ${colors.hexAccent}10 100%
                      )
                    `,
                    position: 'relative'
                  }}
                >
                  {/* Elementos decorativos de fondo */}
                  <div 
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 30%, ${colors.hexPrimary}40 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, ${colors.hexAccent}30 0%, transparent 50%)
                      `
                    }}
                  />
                  
                  {/* Patrón de ondas musicales */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-32 opacity-10 pointer-events-none"
                    style={{
                      background: `repeating-linear-gradient(
                        90deg,
                        ${colors.hexPrimary} 0px,
                        transparent 2px,
                        transparent 20px,
                        ${colors.hexPrimary} 22px
                      )`
                    }}
                  />

                  {/* Iframe de Spotify con mejor visibilidad */}
                  <iframe
                    style={{ 
                      borderRadius: '12px', 
                      minHeight: '400px',
                      height: '400px',
                      border: 'none',
                      display: 'block',
                      background: 'transparent',
                      position: 'relative',
                      zIndex: 1
                    }}
                    src={getSpotifyEmbedUrl(artist.spotify) || ''}
                    width="100%"
                    height="400"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
                    loading="eager"
                    title="Spotify Artist Profile"
                    className="w-full spotify-embed"
                    data-testid="spotify-iframe"
                  />
                  
                  {/* Botón de Spotify siempre visible en móviles */}
                  <div className="md:absolute md:bottom-3 md:right-3 mt-3 md:mt-0 flex justify-center md:justify-end" style={{ position: 'relative', zIndex: 2 }}>
                    <a
                      href={artist.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                      style={{ backgroundColor: '#1DB954', color: 'white' }}
                      data-testid="button-open-spotify"
                    >
                      <Music className="h-5 w-5" />
                      <span className="font-semibold">Abrir en Spotify</span>
                    </a>
                  </div>
                </div>
                
                {/* Mensaje de ayuda para móviles */}
                <div className="mt-2 text-xs text-gray-400 text-center md:hidden">
                  Si no ves el reproductor, usa el botón "Abrir en Spotify"
                </div>
              </div>
            )}
            
            {/* DEBUG: Mostrar si Spotify debería estar visible */}
            {artist.spotify && !getSpotifyEmbedUrl(artist.spotify) && (
              <div className={cardStyles} style={{ borderColor: 'red', borderWidth: '2px' }}>
                <div className="text-red-500 font-bold">⚠️ DEBUG: Spotify URL inválida</div>
                <div className="text-sm text-gray-400 mt-2">
                  URL: {artist.spotify}
                </div>
              </div>
            )}
            
            {!artist.spotify && (
              <div className={cardStyles} style={{ borderColor: 'yellow', borderWidth: '2px' }}>
                <div className="text-yellow-500 font-bold">⚠️ DEBUG: No hay URL de Spotify</div>
                <div className="text-sm text-gray-400 mt-2">
                  Agrega tu URL de Spotify en "Editar Perfil"
                </div>
              </div>
            )}

            {/* Upcoming Shows */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div 
                className="text-base font-semibold mb-3 transition-colors duration-500 flex items-center gap-2" 
                style={{ color: colors.hexAccent }}
              >
                <Calendar className="h-5 w-5" />
                {t('profile.shows.title')}
              </div>
              {shows.length > 0 ? (
                <div className="space-y-3">
                  {shows.map((show) => {
                    const showDate = new Date(show.date);
                    const formattedDate = showDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                    const formattedTime = showDate.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });
                    
                    return (
                      <div 
                        key={show.id}
                        className="p-3 rounded-lg border transition-colors duration-200 hover:bg-gray-800/30"
                        style={{ borderColor: colors.hexBorder }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-white">{show.venue}</h4>
                          {show.ticketUrl && (
                            <a
                              href={show.ticketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded font-medium hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: colors.hexPrimary, color: 'white' }}
                            >
                              {t('profile.shows.tickets')}
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formattedDate} • {formattedTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span>{show.location}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-2" style={{ color: colors.hexAccent, opacity: 0.3 }} />
                  <p className="text-gray-400 text-sm">{t('profile.shows.noShows')}</p>
                </div>
              )}
            </div>

          </section>
        </main>

        {/* CTA for non-authenticated visitors - Bottom of page */}
        {!isOwnProfile && !user && (
          <div className="mt-8">
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div className="text-center py-10">
                <div className="mb-6">
                  <Music2 className="h-16 w-16 mx-auto mb-4" style={{ color: colors.hexAccent }} />
                  <h3 className="text-3xl font-bold text-white mb-3">{t('profile.cta.title')}</h3>
                  <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    {t('profile.cta.description')}
                  </p>
                </div>
                <Link href="/">
                  <Button
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-2xl shadow-orange-500/50 gap-2 px-8 py-7 text-lg font-bold rounded-full hover:scale-105 transition-all duration-300"
                    data-testid="button-cta-bottom"
                  >
                    <Sparkles className="h-6 w-6" />
                    {t('profile.cta.button')}
                    <ArrowRight className="h-6 w-6" />
                  </Button>
                </Link>
                <p className="text-gray-500 text-sm mt-4">
                  {t('profile.cta.subtitle')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t" style={{ borderColor: colors.hexBorder }}>
          <div className="text-center">
            <p className="text-sm text-gray-400">
              {t('profile.footer.poweredBy')} <span style={{ color: colors.hexAccent }} className="font-semibold">Boostify Music</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </footer>

      </div>

      {/* Video Player Modal */}
      <Dialog open={!!playingVideo} onOpenChange={(open) => !open && setPlayingVideo(null)}>
        <DialogContent className="max-w-4xl w-full bg-black/95 border border-gray-800 p-0">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {playingVideo && getYouTubeEmbedUrl(playingVideo.url) && (
              <iframe
                src={getYouTubeEmbedUrl(playingVideo.url)!}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={playingVideo.title}
              />
            )}
          </div>
          <div className="p-4 border-t border-gray-800">
            <h3 className="text-white font-semibold text-lg">{playingVideo?.title}</h3>
            <p className="text-gray-400 text-sm mt-1">Powered by Boostify</p>
          </div>
          <button
            onClick={() => setPlayingVideo(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all"
            aria-label="Cerrar"
            data-testid="button-close-video"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
