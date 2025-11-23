import { useState, useRef, useEffect } from "react";
import { logger } from "@/lib/logger";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { EditProfileDialog } from "./edit-profile-dialog";
import { ImageGalleryDisplay } from "./image-gallery-display";
import { EarningsChart } from "../wallet/earnings-chart";
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
  ChevronRight,
  Instagram,
  Scale,
  Headphones,
  GraduationCap,
  Briefcase,
  Eye,
  EyeOff,
  Megaphone,
  Crown,
  Zap,
  Film,
  Bot,
  AlertCircle,
  Save,
  Image,
  TrendingUp,
  DollarSign,
  Target,
  Globe,
  Twitter,
  Facebook,
  Tag,
  Settings,
  Download,
  RefreshCw,
  Newspaper
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db, storage } from "../../firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import QRCode from "react-qr-code";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, RadialBarChart, RadialBar } from "recharts";
import { CrowdfundingButton } from "../crowdfunding/crowdfunding-button";
import { CrowdfundingPanel } from "../crowdfunding/crowdfunding-panel";
import { TokenizationPanel } from "../tokenization/tokenization-panel";
import { TokenizedMusicView } from "../tokenization/tokenized-music-view";
import { NewsArticleModal } from "./news-article-modal";
import { queryClient } from "../../lib/queryClient";

export interface ArtistProfileProps {
  artistId: string;
  initialArtistData?: any; // Datos iniciales del artista (opcional)
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
  type?: 'youtube' | 'uploaded';
  storagePath?: string;
  downloadPassword?: string;
  fileFormat?: string;
  fileSize?: number;
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
  const [imagePosition, setImagePosition] = useState('center 30%');

  // Detectar orientación y ajustar posición de imagen
  useEffect(() => {
    const updateImagePosition = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth < 768;
      
      if (isMobile && isPortrait) {
        // Móvil vertical: mostrar parte superior (cabezas)
        setImagePosition('center 25%');
      } else if (isMobile && !isPortrait) {
        // Móvil horizontal: centrar más
        setImagePosition('center 35%');
      } else {
        // Desktop: posición balanceada
        setImagePosition('center 30%');
      }
    };

    updateImagePosition();
    window.addEventListener('resize', updateImagePosition);
    window.addEventListener('orientationchange', updateImagePosition);

    return () => {
      window.removeEventListener('resize', updateImagePosition);
      window.removeEventListener('orientationchange', updateImagePosition);
    };
  }, []);

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
      logger.error('Error downloading card:', error);
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
            {/* Imagen de fondo con overlay - SIEMPRE usa profileImage con posición dinámica */}
            <div className="absolute inset-0">
              <img
                src={artist.profileImage}
                alt={artist.name}
                className="w-full h-full object-cover transition-all duration-300"
                style={{
                  objectPosition: imagePosition
                }}
                onError={(e) => {
                  // Fallback si la imagen de perfil falla y el banner NO es video
                  const isVideo = artist.bannerImage?.match(/\.(mp4|mov|avi|webm)$/i);
                  if (!isVideo && artist.bannerImage) {
                    e.currentTarget.src = artist.bannerImage;
                  }
                }}
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
            <div className="relative h-full p-3 md:p-5 flex flex-col">
              {/* Header con QR Code */}
              <div className="flex justify-between items-start gap-2 mb-auto">
                {/* Logo Boostify */}
                <div 
                  className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-black backdrop-blur-md border-2"
                  style={{ 
                    background: 'rgba(0,0,0,0.6)',
                    borderColor: colors.hexAccent,
                    color: colors.hexAccent,
                    letterSpacing: '0.5px'
                  }}
                >
                  BOOSTIFY
                </div>

                {/* QR Code arriba a la derecha */}
                <div className="bg-white p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-2xl flex-shrink-0">
                  <QRCode
                    value={profileUrl}
                    size={70}
                    className="md:hidden"
                    level="H"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                  <QRCode
                    value={profileUrl}
                    size={100}
                    className="hidden md:block"
                    level="H"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>
              </div>

              {/* Nombre del artista CENTRADO con gradientes y detalles */}
              <div className="flex-1 flex items-center justify-center px-2 md:px-4 py-2">
                <div className="text-center w-full space-y-1 md:space-y-2">
                  {/* Icono decorativo superior */}
                  <div className="flex items-center justify-center gap-2 mb-1 md:mb-2">
                    <div 
                      className="h-[2px] w-8 md:w-16"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${colors.hexAccent}, transparent)`
                      }}
                    ></div>
                    <svg 
                      className="w-4 h-4 md:w-5 md:h-5" 
                      fill="none" 
                      stroke={colors.hexAccent} 
                      viewBox="0 0 24 24"
                      style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <div 
                      className="h-[2px] w-8 md:w-16"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${colors.hexAccent}, transparent)`
                      }}
                    ></div>
                  </div>

                  {/* Nombre con gradiente elegante */}
                  <h3 
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight break-words"
                    style={{
                      background: `linear-gradient(135deg, 
                        #ffffff 0%, 
                        ${colors.hexAccent} 50%, 
                        #ffffff 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 20px rgba(255,255,255,0.3))',
                      wordBreak: 'break-word',
                      hyphens: 'auto',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {artist.name}
                  </h3>
                  
                  {/* Género con icono */}
                  {artist.genre && (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill={colors.hexAccent} viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                      <p 
                        className="text-xs md:text-base lg:text-lg font-bold tracking-wide uppercase" 
                        style={{ 
                          background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))'
                        }}
                      >
                        {artist.genre}
                      </p>
                    </div>
                  )}

                  {/* Mini biografía */}
                  {artist.biography && (
                    <div className="mt-2 md:mt-3 px-2 md:px-4">
                      <p 
                        className="text-[10px] md:text-xs leading-relaxed text-white/90 line-clamp-2 md:line-clamp-3 backdrop-blur-sm bg-black/30 rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-white/10"
                        style={{
                          textShadow: '0 1px 4px rgba(0,0,0,0.8)'
                        }}
                      >
                        {artist.biography.length > 120 
                          ? `${artist.biography.substring(0, 120)}...` 
                          : artist.biography}
                      </p>
                    </div>
                  )}

                  {/* Stats compactos */}
                  <div className="flex items-center justify-center gap-3 md:gap-6 mt-2 md:mt-3 text-white/80">
                    <div className="flex items-center gap-1 backdrop-blur-sm bg-black/30 px-2 py-1 rounded-full border border-white/10">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill={colors.hexAccent} viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      <span className="text-[9px] md:text-xs font-bold">{artist.followers > 1000 ? `${(artist.followers / 1000).toFixed(1)}K` : artist.followers}</span>
                    </div>
                    <div className="flex items-center gap-1 backdrop-blur-sm bg-black/30 px-2 py-1 rounded-full border border-white/10">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill={colors.hexAccent} viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                      <span className="text-[9px] md:text-xs font-bold">Artist</span>
                    </div>
                    <div className="flex items-center gap-1 backdrop-blur-sm bg-black/30 px-2 py-1 rounded-full border border-white/10">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill={colors.hexAccent} viewBox="0 0 24 24">
                        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM10 12H8l4-4 4 4h-2v4h-4v-4z"/>
                      </svg>
                      <span className="text-[9px] md:text-xs font-bold">Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra decorativa inferior */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-2 md:h-3"
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
      
      logger.info('💳 Iniciando checkout de Stripe para:', product.name);
      
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
        logger.info('✅ Checkout session creada, redirigiendo...');
        // Redirigir a Stripe Checkout
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Error al crear sesión de checkout');
      }
    } catch (error: any) {
      logger.error('❌ Error al procesar checkout:', error);
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

export function ArtistProfileCard({ artistId, initialArtistData }: ArtistProfileProps) {
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
  const [songUploadProgress, setSongUploadProgress] = useState(0);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [showUploadSongDialog, setShowUploadSongDialog] = useState(false);
  const [showUploadVideoDialog, setShowUploadVideoDialog] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const songFileInputRef = useRef<HTMLInputElement | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  
  const [videoUploadType, setVideoUploadType] = useState<'youtube' | 'file'>('youtube');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPassword, setVideoPassword] = useState('');
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadVideoId, setDownloadVideoId] = useState<string | null>(null);
  const [downloadPasswordInput, setDownloadPasswordInput] = useState('');
  
  // Estados para drag-and-drop del layout
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [showLayoutConfig, setShowLayoutConfig] = useState(false);
  
  // Todas las secciones disponibles con metadata
  const allSections = {
    'songs': { name: 'Música', icon: Music, isOwnerOnly: false },
    'videos': { name: 'Videos', icon: VideoIcon, isOwnerOnly: false },
    'news': { name: 'Noticias', icon: Newspaper, isOwnerOnly: false },
    'social-posts': { name: 'Posts Redes Sociales', icon: Share2, isOwnerOnly: false },
    'social-hub': { name: 'Redes Sociales', icon: Share2, isOwnerOnly: false },
    'merchandise': { name: 'Merchandising', icon: ShoppingBag, isOwnerOnly: false },
    'galleries': { name: 'Galerías de Imágenes', icon: Image, isOwnerOnly: false },
    'tokenization': { name: 'Tokenización de Canciones', icon: Coins, isOwnerOnly: true },
    'monetize-cta': { name: 'Monetiza Tu Talento', icon: Sparkles, isOwnerOnly: false },
    'analytics': { name: 'Analytics', icon: TrendingUp, isOwnerOnly: false },
    'earnings': { name: 'Ganancias', icon: DollarSign, isOwnerOnly: true },
    'crowdfunding': { name: 'Crowdfunding', icon: Target, isOwnerOnly: true },
  };
  
  const defaultOrder = ['songs', 'videos', 'news', 'social-posts', 'social-hub', 'merchandise', 'galleries', 'tokenization', 'monetize-cta', 'analytics', 'earnings', 'crowdfunding'];
  const defaultVisibility: Record<string, boolean> = {
    'songs': true,
    'videos': true,
    'news': true,
    'social-posts': true,
    'social-hub': true,
    'merchandise': true,
    'galleries': true,
    'tokenization': true,
    'monetize-cta': true,
    'analytics': true,
    'earnings': true,
    'crowdfunding': true,
  };
  
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultOrder);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>(defaultVisibility);
  const [isMerchandiseExpanded, setIsMerchandiseExpanded] = useState(true);
  const [isEarningsExpanded, setIsEarningsExpanded] = useState(true);
  const [isCrowdfundingExpanded, setIsCrowdfundingExpanded] = useState(true);
  
  // Galleries refresh key
  const [galleriesRefreshKey, setGalleriesRefreshKey] = useState(0);
  
  // News article modal state
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  
  // Manejar reordenamiento de secciones
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setSectionOrder(items);
  };
  
  // Guardar layout en la base de datos
  const saveLayout = async () => {
    try {
      const response = await fetch(`/api/profile/${artistId}/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: sectionOrder,
          visibility: sectionVisibility
        })
      });
      
      if (!response.ok) throw new Error('Failed to save layout');
      
      toast({
        title: "✅ Layout guardado",
        description: "Los cambios se han guardado correctamente",
      });
      
      setIsEditingLayout(false);
      setShowLayoutConfig(false);
    } catch (error) {
      logger.error('Error saving layout:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el layout",
        variant: "destructive"
      });
    }
  };

  // Manejar edición de noticia
  const handleEditNews = (article: any) => {
    toast({
      title: "Próximamente",
      description: "La edición de noticias estará disponible pronto",
    });
    setIsNewsModalOpen(false);
  };

  // Manejar eliminación de noticia
  const handleDeleteNews = async (articleId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
      return;
    }

    try {
      const response = await fetch(`/api/artist-generator/news/${articleId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al eliminar noticia');
      }

      toast({
        title: "✅ Noticia eliminada",
        description: "La noticia se eliminó exitosamente",
      });

      // Refrescar las noticias
      queryClient.invalidateQueries({ queryKey: ['/api/artist-generator/news', artistId] });
      setIsNewsModalOpen(false);
    } catch (error: any) {
      logger.error('Error deleting news:', error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo eliminar la noticia",
        variant: "destructive"
      });
    }
  };

  // Manejar regeneración de noticia
  const handleRegenerateNews = async (articleId: number) => {
    if (!confirm('¿Estás seguro de que quieres regenerar esta noticia? El contenido actual se perderá.')) {
      return;
    }

    try {
      toast({
        title: "🔄 Regenerando noticia...",
        description: "Esto puede tomar unos momentos",
      });

      const response = await fetch(`/api/artist-generator/news/${articleId}/regenerate`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al regenerar noticia');
      }

      toast({
        title: "✅ Noticia regenerada",
        description: "La noticia se regeneró exitosamente",
      });

      // Refrescar las noticias
      queryClient.invalidateQueries({ queryKey: ['/api/artist-generator/news', artistId] });
      setIsNewsModalOpen(false);
    } catch (error: any) {
      logger.error('Error regenerating news:', error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo regenerar la noticia",
        variant: "destructive"
      });
    }
  };

  const colors = colorPalettes[selectedTheme];

  // Helper function to extract Spotify Artist ID from URL
  const getSpotifyEmbedUrl = (spotifyUrl: string): string | null => {
    if (!spotifyUrl) {
      logger.info('🎵 Spotify URL is empty');
      return null;
    }
    
    // Match patterns like:
    // https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4
    // open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4
    const artistMatch = spotifyUrl.match(/artist\/([a-zA-Z0-9]+)/);
    
    if (artistMatch && artistMatch[1]) {
      const embedUrl = `https://open.spotify.com/embed/artist/${artistMatch[1]}?utm_source=generator`;
      logger.info('🎵 Spotify embed URL generated:', embedUrl);
      return embedUrl;
    }
    
    logger.info('🎵 Spotify URL did not match pattern:', spotifyUrl);
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

  // Query para obtener perfil (combinado de Firestore + PostgreSQL)
  const { data: userProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["userProfile", artistId],
    queryFn: async () => {
      try {
        // SIEMPRE hacer fetch fresco desde PostgreSQL (fuente de verdad)
        let postgresData = null;
        try {
          const response = await fetch(`/api/profile/${artistId}`);
          if (response.ok) {
            postgresData = await response.json();
          }
        } catch (pgError) {
          logger.info("Artist not found in PostgreSQL by slug/id, trying Firestore");
        }
        
        // Buscar en Firestore usando el artistId (que puede ser el UID)
        // Intentar primero por uid, luego por el campo id personalizado
        const userDocByUid = await getDocs(query(collection(db, "users"), where("uid", "==", artistId)));
        let firestoreData = null;
        
        if (!userDocByUid.empty) {
          firestoreData = userDocByUid.docs[0].data();
          logger.info('✅ Found user in Firestore by uid:', artistId);
        } else {
          // Si no se encuentra por uid, intentar por el ID como string
          const userDocById = await getDocs(query(collection(db, "users"), where("id", "==", artistId)));
          if (!userDocById.empty) {
            firestoreData = userDocById.docs[0].data();
            logger.info('✅ Found user in Firestore by id field:', artistId);
          } else {
            logger.info('⚠️ User not found in Firestore for artistId:', artistId);
          }
        }
        
        // Combinar datos: PostgreSQL es la fuente de verdad para campos del perfil
        const combined = {
          ...firestoreData,
          ...(postgresData && {
            isAIGenerated: postgresData.isAIGenerated || false,
            firestoreId: postgresData.firestoreId,
            generatedBy: postgresData.generatedBy,
            slug: postgresData.slug,
            pgId: postgresData.id,
            role: postgresData.role || firestoreData?.role || 'artist',
            biography: postgresData.biography || firestoreData?.biography,
            bannerPosition: postgresData.bannerPosition ?? firestoreData?.bannerPosition ?? "50",
            loopVideoUrl: postgresData.loopVideoUrl || firestoreData?.loopVideoUrl,
            location: postgresData.location || firestoreData?.location,
            email: postgresData.email || firestoreData?.email || firestoreData?.contactEmail,
            phone: postgresData.phone || firestoreData?.phone || firestoreData?.contactPhone,
            instagram: postgresData.instagramHandle || firestoreData?.instagram,
            twitter: postgresData.twitterHandle || firestoreData?.twitter,
            youtube: postgresData.youtubeChannel || firestoreData?.youtube,
            spotify: postgresData.spotifyUrl || firestoreData?.spotify,
            profileLayout: postgresData.profileLayout || null,
            // ✅ Imágenes de PostgreSQL
            profileImage: postgresData.profileImage || firestoreData?.profileImage || firestoreData?.photoURL,
            bannerImage: postgresData.coverImage || firestoreData?.bannerImage,
            photoURL: postgresData.profileImage || firestoreData?.photoURL,
            displayName: postgresData.artistName?.trim() || firestoreData?.displayName || firestoreData?.name,
            name: postgresData.artistName?.trim() || firestoreData?.name || firestoreData?.displayName,
            genre: postgresData.genres?.[0] || firestoreData?.genre
          })
        };
        return combined;
      } catch (error) {
        logger.error("Error fetching user profile:", error);
        return null;
      }
    },
    enabled: !!artistId,
    staleTime: 0, // Siempre considerar datos como stale para refrescar
    gcTime: 0 // No mantener datos en caché
  });

  // Query para canciones
  const { data: songs = [] as Song[], refetch: refetchSongs } = useQuery<Song[]>({
    queryKey: ["songs", userProfile?.pgId || artistId],
    queryFn: async () => {
      try {
        const pgId = userProfile?.pgId || artistId;
        logger.info(`🎵 Fetching songs for artist: ${pgId} (PostgreSQL ID)`);
        const songsRef = collection(db, "songs");
        const q = query(songsRef, where("userId", "==", pgId));
        const querySnapshot = await getDocs(q);

        logger.info(`📊 Songs query returned ${querySnapshot.size} documents`);

        if (querySnapshot.empty) {
          logger.info('⚠️ No songs found for this artist');
          return [];
        }

        const songsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          logger.info('🎵 Song data:', { id: doc.id, name: data.name, audioUrl: data.audioUrl });
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
        
        logger.info(`✅ Successfully loaded ${songsData.length} songs`);
        return songsData;
      } catch (error) {
        logger.error("❌ Error fetching songs:", error);
        return [];
      }
    },
    enabled: !!artistId
  });

  // Query para videos
  const { data: videos = [] as Video[], refetch: refetchVideos } = useQuery<Video[]>({
    queryKey: ["videos", userProfile?.pgId || artistId],
    queryFn: async () => {
      try {
        const pgId = userProfile?.pgId || artistId;
        logger.info(`📹 Fetching videos for artist: ${pgId} (PostgreSQL ID)`);
        const videosRef = collection(db, "videos");
        const q = query(videosRef, where("userId", "==", pgId));
        const querySnapshot = await getDocs(q);

        logger.info(`📊 Videos query returned ${querySnapshot.size} documents`);

        if (querySnapshot.empty) {
          logger.info('⚠️ No videos found for this artist');
          return [];
        }

        const videosData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          
          // Solo extraer videoId si es una URL de YouTube
          const isYouTubeUrl = data.url?.includes('youtube.com') || data.url?.includes('youtu.be');
          let videoId = null;
          let thumbnailUrl = data.thumbnailUrl;
          
          if (isYouTubeUrl) {
            videoId = data.url?.split('v=')?.[1]?.split('&')[0] || data.url?.split('/')?.[3]?.split('?')?.[0];
            // Solo generar thumbnail de YouTube si no hay uno ya guardado y si tenemos un videoId válido
            if (!thumbnailUrl && videoId && videoId !== 'shorts') {
              thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }
          }
          
          logger.info('📹 Video data:', { 
            id: doc.id, 
            title: data.title, 
            url: data.url,
            isYouTube: isYouTubeUrl,
            hasStoredThumbnail: !!data.thumbnailUrl
          });
          
          return {
            id: doc.id,
            title: data.title,
            url: data.url,
            userId: data.userId || artistId,
            thumbnailUrl: thumbnailUrl,
            createdAt: data.createdAt?.toDate(),
            views: Math.floor(Math.random() * 10000) + 1000,
            likes: Math.floor(Math.random() * 500) + 50,
          };
        });
        
        logger.info(`✅ Successfully loaded ${videosData.length} videos`);
        return videosData;
      } catch (error) {
        logger.error("❌ Error fetching videos:", error);
        return [];
      }
    },
    enabled: !!artistId
  });

  // Query para productos con auto-generación
  const { data: products = [] as Product[], refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["merchandise", userProfile?.pgId || artistId],
    queryFn: async () => {
      try {
        const pgId = userProfile?.pgId || artistId;
        logger.info(`🛍️ Fetching merchandise for artist: ${pgId} (PostgreSQL ID)`);
        logger.info(`👤 User profile loaded:`, userProfile ? 'YES' : 'NO');
        logger.info(`🔍 DEBUG - Using PostgreSQL ID for query:`, pgId);
        logger.info(`🔍 DEBUG - Artist ID type:`, typeof pgId);
        
        const merchRef = collection(db, "merchandise");
        const q = query(merchRef, where("userId", "==", pgId));
        const querySnapshot = await getDocs(q);

        logger.info(`📊 Merchandise query returned ${querySnapshot.size} documents`);
        
        // Log todos los productos en Firestore con este userId
        if (!querySnapshot.empty) {
          logger.info(`📦 Products found in Firestore:`);
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            logger.info(`  - Product ID: ${doc.id}`, {
              name: data.name,
              userId: data.userId,
              hasImage: !!data.imageUrl,
              imageUrl: data.imageUrl?.substring(0, 80) + '...'
            });
          });
        } else {
          logger.info(`⚠️ No products found for userId: ${artistId}`);
        }

        if (!querySnapshot.empty) {
          // Verificar si los productos existentes tienen tallas (productos nuevos)
          const firstProduct = querySnapshot.docs[0].data();
          const hasNewFormat = firstProduct.sizes !== undefined;
          
          if (hasNewFormat) {
            // Cargar productos actualizados con tallas
            const productsData = querySnapshot.docs.map((doc) => {
              const data = doc.data();
              logger.info('🛍️ Product data:', { id: doc.id, name: data.name, price: data.price, sizes: data.sizes });
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
            logger.info(`✅ Successfully loaded ${productsData.length} existing products with sizes`);
            return productsData;
          } else {
            // Productos viejos sin tallas - borrarlos y regenerar
            logger.info('🗑️ Deleting old products without sizes...');
            const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
            await Promise.all(deletePromises);
            logger.info('✅ Old products deleted, will regenerate new ones');
            // Continuar con la generación de nuevos productos
          }
          
          // NUEVO: Detectar si todos los productos tienen la misma imagen (error de generación)
          if (querySnapshot.docs.length > 2) {
            const allImages = querySnapshot.docs.map(doc => doc.data().imageUrl);
            const uniqueImages = new Set(allImages);
            if (uniqueImages.size === 1 && allImages[0] !== undefined) {
              logger.info('⚠️ [PRODUCTION] All products have the SAME image - This is a generation error!');
              logger.info('🗑️ [PRODUCTION] Deleting products with duplicate images and regenerating...');
              const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
              await Promise.all(deletePromises);
              logger.info('✅ [PRODUCTION] Old products with duplicate images deleted');
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

        logger.info(`🏭 Generating ${productTypes.length} products with unique images for ${artistName}...`);
        const savedProducts: Product[] = [];
        
        for (const productDef of productTypes) {
          logger.info(`🎨 [PRODUCTION] Generating image for ${productDef.type}...`);
          
          let productImage = brandImage;
          try {
            logger.info(`📡 [PRODUCTION] Calling API: /api/artist-profile/generate-product-image`);
            const imageResponse = await fetch('/api/artist-profile/generate-product-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productType: productDef.type,
                artistName: artistName,
                brandImage: brandImage
              })
            });
            
            logger.info(`📊 [PRODUCTION] API Response Status: ${imageResponse.status} ${imageResponse.statusText}`);
            
            const imageResult = await imageResponse.json();
            logger.info(`🔍 [PRODUCTION] API Result for ${productDef.type}:`, {
              success: imageResult.success,
              hasImageUrl: !!imageResult.imageUrl,
              imageUrlPreview: imageResult.imageUrl?.substring(0, 100),
              error: imageResult.error,
              provider: imageResult.provider
            });
            
            if (imageResult.success && imageResult.imageUrl) {
              productImage = imageResult.imageUrl;
              logger.info(`✅ [PRODUCTION] Generated unique image for ${productDef.type} via ${imageResult.provider || 'Gemini'}`);
            } else {
              logger.warn(`⚠️ [PRODUCTION] Failed to generate image for ${productDef.type}:`, imageResult.error || 'Unknown error');
              logger.warn(`⚠️ [PRODUCTION] Using fallback brand image for ${productDef.type}`);
            }
          } catch (error) {
            logger.error(`❌ [PRODUCTION] Error generating image for ${productDef.type}:`, error);
            logger.error(`❌ [PRODUCTION] Error details:`, {
              message: error instanceof Error ? error.message : 'Unknown',
              name: error instanceof Error ? error.name : 'Unknown'
            });
            logger.warn(`⚠️ [PRODUCTION] Using fallback brand image for ${productDef.type}`);
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
          logger.info(`✅ Product created: ${product.name}`);
        }

        logger.info(`🎉 Successfully created ${savedProducts.length} products`);
        return savedProducts;
      } catch (error) {
        logger.error("❌ Error fetching/creating merchandise:", error);
        return [];
      }
    },
    enabled: !!artistId
  });

  // Log cuando products cambie
  useEffect(() => {
    logger.info(`🛍️ Products state updated: ${products.length} products`);
    if (products.length > 0) {
      logger.info('✅ MERCHANDISE SECTION SHOULD BE VISIBLE');
    } else {
      logger.info('⚠️ MERCHANDISE SECTION IS HIDDEN (no products)');
    }
  }, [products]);

  // Verificar si es perfil propio: SIMPLE Y PERMISIVO
  // ✅ Permite editar si: es creador del artista O propietario directo
  const isOwnProfile = user?.id && (
    userProfile?.generatedBy === user.id ||
    Number(user.id) === Number(userProfile?.pgId) ||
    String(user.id) === String(artistId)
  );
  
  // Debug logging para verificar autenticación
  useEffect(() => {
    logger.info('🔍 [Artist Profile] Debug info:', {
      userId: user?.id,
      userIdAsNumber: user?.id ? Number(user.id) : null,
      userIdAsString: user?.id ? String(user.id) : null,
      artistId,
      userProfilePgId: userProfile?.pgId,
      userProfileGeneratedBy: userProfile?.generatedBy,
      userProfileUid: userProfile?.uid,
      isOwnProfile,
      isCreator: userProfile?.generatedBy === user?.id,
      userAuthenticated: !!user,
      bannerImage: userProfile?.bannerImage,
      profileImage: userProfile?.profileImage,
      coverImage: userProfile?.coverImage
    });
  }, [user, artistId, userProfile, isOwnProfile]);

  // Query para shows
  const { data: shows = [] as Show[], refetch: refetchShows} = useQuery<Show[]>({
    queryKey: ["shows", userProfile?.pgId || artistId],
    queryFn: async () => {
      try {
        const pgId = userProfile?.pgId || artistId;
        logger.info(`🎤 Fetching shows for artist: ${pgId} (PostgreSQL ID)`);
        const showsRef = collection(db, "shows");
        const q = query(showsRef, where("userId", "==", pgId));
        const querySnapshot = await getDocs(q);

        logger.info(`📊 Shows query returned ${querySnapshot.size} documents`);

        if (querySnapshot.empty) {
          logger.info('⚠️ No shows found for this artist');
          return [];
        }

        const showsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          logger.info('🎤 Show data:', { id: doc.id, venue: data.venue, date: data.date });
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
        
        logger.info(`✅ Successfully loaded ${showsData.length} shows`);
        return showsData;
      } catch (error) {
        logger.error("❌ Error fetching shows:", error);
        return [];
      }
    },
    enabled: !!artistId
  });

  // Query para noticias
  interface NewsArticle {
    id: number;
    title: string;
    content: string;
    summary: string;
    imageUrl: string;
    category: 'release' | 'performance' | 'collaboration' | 'achievement' | 'lifestyle';
    views: number;
    createdAt: Date;
  }

  const { data: newsArticles = [] as NewsArticle[], refetch: refetchNews } = useQuery<NewsArticle[]>({
    queryKey: ['/api/artist-generator/news', userProfile?.pgId || artistId],
    queryFn: async () => {
      try {
        const pgId = userProfile?.pgId || artistId;
        logger.info(`📰 Fetching news for artist: ${pgId} (PostgreSQL ID)`);
        const response = await fetch(`/api/artist-generator/news/${pgId}`);
        
        if (!response.ok) {
          logger.warn('⚠️ News API returned non-OK status:', response.status);
          return [];
        }

        const result = await response.json();
        
        if (result.success && result.news) {
          logger.info(`✅ Successfully loaded ${result.news.length} news articles`);
          return result.news;
        }
        
        return [];
      } catch (error) {
        logger.error("❌ Error fetching news:", error);
        return [];
      }
    },
    enabled: !!artistId
  });

  const artist = {
    id: userProfile?.pgId || artistId,
    pgId: userProfile?.pgId || artistId,
    name: initialArtistData?.displayName || initialArtistData?.name || userProfile?.displayName || userProfile?.name || "Artist Name",
    genre: initialArtistData?.genre || userProfile?.genre || "Music Artist",
    location: initialArtistData?.location || userProfile?.location || "",
    profileImage: initialArtistData?.profileImage || initialArtistData?.photoURL || userProfile?.photoURL || userProfile?.profileImage || '/assets/freepik__boostify_music_organe_abstract_icon.png',
    bannerImage: initialArtistData?.bannerImage || userProfile?.bannerImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
    loopVideoUrl: initialArtistData?.loopVideoUrl || userProfile?.loopVideoUrl || "",
    bannerPosition: initialArtistData?.bannerPosition ?? userProfile?.bannerPosition ?? "50",
    biography: initialArtistData?.biography || userProfile?.biography || "Music artist profile",
    followers: userProfile?.followers || 0,
    instagram: initialArtistData?.instagram || userProfile?.instagram || "",
    twitter: initialArtistData?.twitter || userProfile?.twitter || "",
    youtube: initialArtistData?.youtube || userProfile?.youtube || "",
    spotify: initialArtistData?.spotify || userProfile?.spotify || "",
    website: initialArtistData?.website || userProfile?.website || "",
    profileLayout: userProfile?.profileLayout || null
  };

  // Cargar layout desde la base de datos
  useEffect(() => {
    if (artist?.profileLayout) {
      setSectionOrder(artist.profileLayout.order || defaultOrder);
      setSectionVisibility(artist.profileLayout.visibility || defaultVisibility);
    }
  }, [artist?.profileLayout]);

  // DEBUG: Log completo del perfil de usuario y spotify
  logger.info('🔍 DEBUG - userProfile completo:', userProfile);
  logger.info('🔍 DEBUG - artist.spotify:', artist.spotify);
  logger.info('🔍 DEBUG - getSpotifyEmbedUrl result:', artist.spotify ? getSpotifyEmbedUrl(artist.spotify) : 'NO SPOTIFY URL');

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
        logger.error('Error sharing:', err);
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
    setSongUploadProgress(0);
    try {
      const storageRef = ref(storage, `songs/${artistId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setSongUploadProgress(Math.round(progress));
            logger.info(`📤 Upload progress: ${progress}%`);
          },
          (error) => reject(error),
          () => resolve(uploadTask.snapshot)
        );
      });
      
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
      setSongUploadProgress(0);
      refetchSongs();
    } catch (error) {
      logger.error("Error uploading song:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload the song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingSong(false);
      setSongUploadProgress(0);
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
          logger.error("Error deleting file from storage:", err);
        }
      }

      toast({
        title: "Song deleted",
        description: "The song has been removed.",
      });

      refetchSongs();
    } catch (error) {
      logger.error("Error deleting song:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the song. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUploadVideo = async () => {
    if (!newVideoTitle.trim()) {
      toast({
        title: "Error",
        description: "Por favor proporciona un título para el video.",
        variant: "destructive",
      });
      return;
    }

    if (videoUploadType === 'youtube' && !newVideoUrl.trim()) {
      toast({
        title: "Error",
        description: "Por favor proporciona una URL de YouTube.",
        variant: "destructive",
      });
      return;
    }

    if (videoUploadType === 'file' && !videoFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de video.",
        variant: "destructive",
      });
      return;
    }

    if (videoUploadType === 'file' && !videoPassword.trim()) {
      toast({
        title: "Error",
        description: "Por favor proporciona un password para proteger la descarga del video.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingVideo(true);
    setVideoUploadProgress(0);
    try {
      if (videoUploadType === 'youtube') {
        const newDocRef = doc(collection(db, "videos"));
        await setDoc(newDocRef, {
          title: newVideoTitle,
          url: newVideoUrl,
          type: 'youtube',
          userId: artistId,
          createdAt: new Date(),
        });
      } else {
        const fileExt = videoFile!.name.split('.').pop()?.toLowerCase() || 'mp4';
        const storagePath = `videos/${artistId}/${Date.now()}_${videoFile!.name}`;
        const storageRef = ref(storage, storagePath);
        
        const uploadTask = uploadBytesResumable(storageRef, videoFile!);
        
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setVideoUploadProgress(Math.round(progress));
              logger.info(`📹 Video upload progress: ${progress}%`);
            },
            (error) => reject(error),
            () => resolve(uploadTask.snapshot)
          );
        });
        
        const downloadURL = await getDownloadURL(storageRef);
        
        const newDocRef = doc(collection(db, "videos"));
        await setDoc(newDocRef, {
          title: newVideoTitle,
          url: downloadURL,
          type: 'uploaded',
          storagePath: storagePath,
          downloadPassword: videoPassword,
          fileFormat: fileExt,
          fileSize: videoFile!.size,
          userId: artistId,
          createdAt: new Date(),
        });
      }

      toast({
        title: "¡Video agregado!",
        description: videoUploadType === 'youtube' 
          ? "Tu video de YouTube ha sido agregado exitosamente." 
          : "Tu video ha sido subido y está protegido con password.",
      });

      setNewVideoTitle('');
      setNewVideoUrl('');
      setVideoFile(null);
      setVideoPassword('');
      setShowUploadVideoDialog(false);
      setVideoUploadProgress(0);
      refetchVideos();
    } catch (error) {
      logger.error("Error uploading video:", error);
      toast({
        title: "Error al subir",
        description: "No se pudo agregar el video. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);
    }
  };

  const handleDeleteVideo = async (video: Video) => {
    if (!confirm(`Are you sure you want to delete "${video.title}"?`)) return;

    try {
      await deleteDoc(doc(db, "videos", video.id));

      if (video.storagePath && video.type === 'uploaded') {
        try {
          const storageRef = ref(storage, video.storagePath);
          await deleteObject(storageRef);
        } catch (err) {
          logger.error("Error deleting file from storage:", err);
        }
      }

      toast({
        title: "Video eliminado",
        description: "El video ha sido removido.",
      });

      refetchVideos();
    } catch (error) {
      logger.error("Error deleting video:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el video. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadVideo = async (video: Video) => {
    if (!video.downloadPassword) {
      toast({
        title: "Error",
        description: "Este video no tiene un password configurado.",
        variant: "destructive",
      });
      return;
    }

    setDownloadVideoId(video.id);
    setShowDownloadDialog(true);
  };

  const handleConfirmDownload = async () => {
    const video = videos.find(v => v.id === downloadVideoId);
    if (!video) return;

    if (downloadPasswordInput !== video.downloadPassword) {
      toast({
        title: "Password Incorrecto",
        description: "El password ingresado no es correcto.",
        variant: "destructive",
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = video.url;
      link.download = `${video.title}.${video.fileFormat || 'mp4'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "¡Descarga iniciada!",
        description: "El video se está descargando.",
      });

      setShowDownloadDialog(false);
      setDownloadVideoId(null);
      setDownloadPasswordInput('');
    } catch (error) {
      logger.error("Error downloading video:", error);
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar el video. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const cardStyles = `bg-gradient-to-b from-gray-900 to-gray-950 bg-opacity-90 rounded-3xl p-6 shadow-xl ${colors.shadow} transition-colors duration-500`;
  const primaryBtn = `py-2 px-4 rounded-full text-sm font-semibold transition duration-300 shadow-lg whitespace-nowrap`;
  
  const merchCategories = ['Todo', 'Música', 'Videos', 'Shows'];
  const totalPlays = songs.reduce((acc, song) => acc + (parseInt(song.duration?.split(':')[0] || '0') * 100), 0);

  return (
    <div className="min-h-screen text-white transition-colors duration-500" style={{ margin: 0, padding: 0, backgroundColor: '#000000' }}>
      <audio ref={audioRef} onEnded={() => setPlayingSongId(null)} />
      
      {/* Hero Header - Diseño Ultra Premium 2025 */}
      <header className="relative h-screen w-full overflow-hidden" style={{ margin: 0, padding: 0, top: 0, left: 0 }}>
        {/* Background con efecto cinematográfico */}
        <div className="absolute inset-0">
          {(() => {
            const isVideo = artist.bannerImage?.match(/\.(mp4|mov|avi|webm)$/i) || 
                           artist.bannerImage?.includes('video') ||
                           artist.bannerImage?.includes('.mp4') ||
                           artist.bannerImage?.includes('.webm') ||
                           artist.bannerImage?.includes('.mov');
            
            const videoUrl = artist.loopVideoUrl || (isVideo ? artist.bannerImage : null);
            const bannerPos = artist.bannerPosition || "50";
            const objectPositionStyle = `center ${bannerPos}%`;
            
            if (videoUrl) {
              return (
                <video
                  key={videoUrl}
                  src={videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover filter brightness-40 contrast-110 saturate-110 scale-110 transition-all duration-1000 hover:scale-105 hover:brightness-45"
                  style={{ objectPosition: objectPositionStyle }}
                  onError={(e) => logger.error('❌ Hero video error:', e)}
                />
              );
            }
            
            return (
              <img
                src={artist.bannerImage}
                alt={`${artist.name} Cover`}
                className="absolute inset-0 w-full h-full object-cover filter brightness-40 contrast-110 saturate-110 scale-110 transition-all duration-1000 hover:scale-105 hover:brightness-45"
                style={{ objectPosition: objectPositionStyle }}
                onError={(e) => { 
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.style.background = `radial-gradient(circle at 50% 50%, ${colors.hexPrimary}20 0%, #000000 100%)`;
                  }
                }}
              />
            );
          })()}
        </div>

        {/* Overlay gradiente cinematográfico */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 30% 50%, ${colors.hexAccent}15 0%, transparent 60%)`
          }}
        ></div>
        
        {/* Grid animado de fondo */}
        <div className="absolute inset-0 opacity-5" 
          style={{
            backgroundImage: `
              linear-gradient(${colors.hexAccent}40 1px, transparent 1px),
              linear-gradient(90deg, ${colors.hexAccent}40 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite'
          }}
        ></div>
        
        {/* Partículas flotantes mejoradas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full blur-sm"
              style={{
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                backgroundColor: colors.hexAccent,
                opacity: Math.random() * 0.4 + 0.1,
                animation: `float ${Math.random() * 10 + 15}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
        
        {/* Barra superior con glassmorphism */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-30">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-3 backdrop-blur-xl bg-black/30 px-4 py-2.5 rounded-2xl border border-white/10">
              <img 
                src="/assets/boostify-logo.svg" 
                alt="Boostify Logo"
                className="w-7 h-7 md:w-8 md:h-8"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-bold uppercase tracking-wider text-white">Boostify Music</div>
              </div>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button 
                className="px-4 md:px-6 py-2.5 md:py-3 rounded-2xl text-sm md:text-base font-semibold transition-all duration-300 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transform hover:scale-105 active:scale-95"
                style={{ color: colors.hexAccent }}
                onClick={handleShare}
                data-testid="button-share"
              >
                <Share2 className="h-4 w-4 md:h-5 md:w-5 inline mr-0 md:mr-2" />
                <span className="hidden md:inline">Compartir</span>
              </button>
              {isOwnProfile && (
                <Link href="/dashboard">
                  <button 
                    className="px-4 md:px-6 py-2.5 md:py-3 rounded-2xl text-sm md:text-base font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.hexAccent} 0%, ${colors.hexPrimary} 100%)`,
                      boxShadow: `0 8px 24px ${colors.hexAccent}40`
                    }}
                    data-testid="button-dashboard"
                  >
                    Dashboard
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Contenido principal del hero - Layout centrado */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center space-y-6 md:space-y-8">
              
              {/* Nombre del artista */}
              <div className="space-y-3">
                <h1 
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-none tracking-tighter"
                  style={{
                    background: `linear-gradient(135deg, #FFFFFF 0%, ${colors.hexAccent} 35%, ${colors.hexPrimary} 55%, ${colors.hexAccent} 75%, #FFFFFF 100%)`,
                    backgroundSize: '200% 200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: `drop-shadow(0 0 40px ${colors.hexAccent}99) drop-shadow(0 10px 20px rgba(0,0,0,0.9))`,
                    animation: 'gradient-x 6s ease infinite, text-glow 2s ease-in-out infinite',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.05em'
                  }}
                  data-testid="text-artist-name"
                >
                  {artist.name}
                </h1>
                
                {/* Línea decorativa bajo el nombre */}
                <div className="flex items-center justify-center gap-3">
                  <div 
                    className="h-1 w-16 md:w-24 rounded-full"
                    style={{ 
                      background: `linear-gradient(90deg, transparent, ${colors.hexAccent}, transparent)`,
                      boxShadow: `0 0 20px ${colors.hexAccent}80`
                    }}
                  ></div>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.hexAccent, boxShadow: `0 0 20px ${colors.hexAccent}` }}
                  ></div>
                  <div 
                    className="h-1 w-16 md:w-24 rounded-full"
                    style={{ 
                      background: `linear-gradient(90deg, transparent, ${colors.hexAccent}, transparent)`,
                      boxShadow: `0 0 20px ${colors.hexAccent}80`
                    }}
                  ></div>
                </div>
              </div>

              {/* Género y ubicación con íconos */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xl md:text-2xl lg:text-3xl font-bold">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5 md:h-6 md:w-6" style={{ color: colors.hexAccent }} />
                  <span className="text-white drop-shadow-2xl">{artist.genre}</span>
                </div>
                {artist.location && (
                  <>
                    <span className="text-white/30 text-3xl">•</span>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 md:h-6 md:w-6" style={{ color: colors.hexAccent }} />
                      <span className="text-white/90 drop-shadow-2xl">{artist.location}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Estadísticas mejoradas */}
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6">
                {songs.length > 0 && (
                  <div className="group relative">
                    <div 
                      className="absolute -inset-2 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition-all duration-300"
                      style={{ backgroundColor: colors.hexAccent }}
                    ></div>
                    <div className="relative backdrop-blur-2xl bg-gradient-to-br from-white/20 to-white/5 border-2 rounded-3xl px-6 md:px-8 py-4 md:py-6 transform group-hover:scale-110 transition-all duration-300"
                      style={{ borderColor: `${colors.hexAccent}60` }}
                    >
                      <div className="text-4xl md:text-5xl font-black mb-1" style={{ color: colors.hexAccent }}>{songs.length}</div>
                      <div className="text-xs md:text-sm text-white font-bold uppercase tracking-widest">Canciones</div>
                    </div>
                  </div>
                )}
                {videos.length > 0 && (
                  <div className="group relative">
                    <div 
                      className="absolute -inset-2 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition-all duration-300"
                      style={{ backgroundColor: colors.hexAccent }}
                    ></div>
                    <div className="relative backdrop-blur-2xl bg-gradient-to-br from-white/20 to-white/5 border-2 rounded-3xl px-6 md:px-8 py-4 md:py-6 transform group-hover:scale-110 transition-all duration-300"
                      style={{ borderColor: `${colors.hexAccent}60` }}
                    >
                      <div className="text-4xl md:text-5xl font-black mb-1" style={{ color: colors.hexAccent }}>{videos.length}</div>
                      <div className="text-xs md:text-sm text-white font-bold uppercase tracking-widest">Videos</div>
                    </div>
                  </div>
                )}
                {artist.instagram && (
                  <div className="group relative">
                    <div 
                      className="absolute -inset-2 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition-all duration-300"
                      style={{ backgroundColor: colors.hexAccent }}
                    ></div>
                    <div className="relative backdrop-blur-2xl bg-gradient-to-br from-white/20 to-white/5 border-2 rounded-3xl px-6 md:px-8 py-4 md:py-6 flex flex-col items-center gap-2 transform group-hover:scale-110 transition-all duration-300"
                      style={{ borderColor: `${colors.hexAccent}60` }}
                    >
                      <Instagram className="h-6 w-6 md:h-8 md:w-8" style={{ color: colors.hexAccent }} />
                      <span className="text-sm md:text-base font-black text-white">@{artist.instagram}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Foto de perfil circular abajo + Badge de verificación */}
              <div className="relative inline-block mt-4">
                <div 
                  className="absolute -inset-4 rounded-full blur-3xl opacity-50 animate-pulse"
                  style={{ backgroundColor: colors.hexAccent }}
                ></div>
                <div className="relative">
                  <img
                    src={artist.profileImage}
                    alt={`${artist.name} Avatar`}
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-4 shadow-2xl transform hover:scale-110 transition-all duration-500 mx-auto"
                    style={{ 
                      borderColor: colors.hexAccent,
                      boxShadow: `0 20px 60px ${colors.hexAccent}70, 0 0 40px ${colors.hexAccent}50, inset 0 0 20px rgba(255,255,255,0.1)`
                    }}
                    data-testid="img-profile"
                  />
                  <div 
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-black text-sm shadow-2xl transform hover:rotate-12 transition-all duration-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.hexAccent} 0%, ${colors.hexPrimary} 100%)`,
                      boxShadow: `0 10px 30px ${colors.hexAccent}70`
                    }}
                  >
                    ✓
                  </div>
                </div>
                {/* Badge de verificación - pequeño debajo de foto */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl bg-white/5 border shadow-lg mt-3"
                  style={{ 
                    borderColor: `${colors.hexAccent}30`,
                    boxShadow: `0 4px 16px ${colors.hexAccent}20`
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 8px #4ade80' }}></div>
                  <span className="text-xs font-semibold text-white/90 tracking-wide">Verificado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <ChevronDown className="h-8 w-8 md:h-10 md:w-10 text-white/60" />
        </div>

        {/* Borde inferior decorativo mejorado */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1.5"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${colors.hexAccent} 30%, ${colors.hexPrimary} 50%, ${colors.hexAccent} 70%, transparent 100%)`,
            boxShadow: `0 0 30px ${colors.hexAccent}90, 0 0 60px ${colors.hexAccent}50`
          }}
        ></div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-0 pb-20 md:pb-8">
        
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
        <main className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] xl:grid-cols-[1.2fr_1fr] gap-4 sm:gap-5 md:gap-6">
          {/* Columna Izquierda */}
          <section className="flex flex-col gap-4 sm:gap-5 md:gap-6">
            
            {/* Tarjeta de Información de Artista */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 md:gap-6">
                <div className="relative flex-shrink-0">
                  <img
                    src={artist.profileImage}
                    alt={`${artist.name} Avatar`}
                    className="w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl sm:rounded-3xl object-cover shadow-xl transition-all duration-500"
                    style={{ borderColor: colors.hexBorder, borderWidth: '1px', boxShadow: `0 4px 10px ${colors.hexAccent}50` }}
                    data-testid="img-profile"
                  />
                  <div className="absolute -right-1 -bottom-1 py-1 px-2.5 text-xs rounded-full bg-green-500 text-green-950 font-semibold shadow-xl shadow-green-500/50">
                    Verificado
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                  <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                    <div className="text-2xl sm:text-3xl font-semibold text-white">{artist.name}</div>
                    {userProfile?.role === 'admin' && (
                      <div 
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                        data-testid="badge-admin"
                      >
                        <Crown className="h-3.5 w-3.5" />
                        ADMIN
                      </div>
                    )}
                    {userProfile?.isAIGenerated && (
                      <div 
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                        data-testid="badge-virtual-artist"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        Artista Virtual
                      </div>
                    )}
                  </div>
                  <div 
                    className="text-sm sm:text-base mt-1 transition-colors duration-500" 
                    style={{ color: colors.hexAccent }}
                  >
                    {artist.genre}
                  </div>
                  <div className="text-sm sm:text-base text-gray-400 mt-2 transition-colors duration-500 line-clamp-3">
                    {artist.biography}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 justify-center sm:justify-start">
                    {isOwnProfile ? (
                      <>
                        <EditProfileDialog
                          artistId={String(userProfile?.pgId || artistId)}
                          currentData={{
                            displayName: userProfile?.displayName || userProfile?.name || "",
                            biography: userProfile?.biography || "",
                            genre: userProfile?.genre || "",
                            location: userProfile?.location || "",
                            profileImage: userProfile?.photoURL || userProfile?.profileImage || "",
                            bannerImage: userProfile?.bannerImage || "",
                            bannerPosition: String((userProfile as any)?.bannerPosition ?? "50"),
                            loopVideoUrl: (userProfile as any)?.loopVideoUrl || "",
                            slug: (userProfile as any)?.slug || "",
                            contactEmail: userProfile?.email || userProfile?.contactEmail || "",
                            contactPhone: userProfile?.phone || userProfile?.contactPhone || "",
                            instagram: userProfile?.instagram || "",
                            twitter: userProfile?.twitter || "",
                            youtube: userProfile?.youtube || "",
                            spotify: userProfile?.spotify || "",
                          }}
                          onUpdate={() => {
                            setGalleriesRefreshKey(prev => prev + 1);
                            refetchProfile();
                          }}
                          onGalleryCreated={() => {
                            logger.info('🎨 onGalleryCreated callback - Refrescando galerías...');
                            setGalleriesRefreshKey(prev => prev + 1);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: colors.hexBorder,
                            color: colors.hexAccent
                          }}
                          onClick={() => setShowLayoutConfig(true)}
                          data-testid="button-edit-layout"
                        >
                          <Layout className="h-4 w-4 mr-2" />
                          Personalizar Layout
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

            {/* Layout Configuration Modal */}
            <Dialog open={showLayoutConfig} onOpenChange={setShowLayoutConfig}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-800">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white">
                    <Layout className="h-6 w-6 inline mr-2" style={{ color: colors.hexAccent }} />
                    Personalizar Layout del Perfil
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Reordena las secciones y activa/desactiva las que quieras mostrar
                  </DialogDescription>
                </DialogHeader>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="layout-config">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className="space-y-2 py-4"
                      >
                        {sectionOrder.map((sectionId, index) => {
                          const section = allSections[sectionId as keyof typeof allSections];
                          if (!section) return null;
                          
                          // Skip owner-only sections if not owner
                          if (section.isOwnerOnly && !isOwnProfile) return null;
                          
                          const Icon = section.icon;
                          const isVisible = sectionVisibility[sectionId];
                          
                          return (
                            <Draggable key={sectionId} draggableId={sectionId} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`p-4 rounded-lg border transition-all ${
                                    snapshot.isDragging ? 'shadow-lg' : ''
                                  }`}
                                  style={{
                                    ...provided.draggableProps.style,
                                    backgroundColor: isVisible ? `${colors.hexPrimary}20` : '#18181b',
                                    borderColor: isVisible ? colors.hexBorder : '#27272a'
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div 
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="h-5 w-5 text-gray-400" />
                                    </div>
                                    
                                    <Icon 
                                      className="h-5 w-5" 
                                      style={{ color: isVisible ? colors.hexAccent : '#71717a' }}
                                    />
                                    
                                    <span 
                                      className="flex-1 font-medium"
                                      style={{ color: isVisible ? 'white' : '#71717a' }}
                                    >
                                      {section.name}
                                    </span>
                                    
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSectionVisibility(prev => ({
                                          ...prev,
                                          [sectionId]: !prev[sectionId]
                                        }));
                                      }}
                                      className="gap-2"
                                    >
                                      {isVisible ? (
                                        <>
                                          <Eye className="h-4 w-4" style={{ color: colors.hexAccent }} />
                                          <span style={{ color: colors.hexAccent }}>Visible</span>
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="h-4 w-4 text-gray-500" />
                                          <span className="text-gray-500">Oculto</span>
                                        </>
                                      )}
                                    </Button>
                                  </div>
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

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowLayoutConfig(false)}
                    className="border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={saveLayout}
                    className="gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                      color: 'white'
                    }}
                  >
                    <Save className="h-4 w-4" />
                    Guardar Layout
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
                  <Link href="/signup">
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

            {/* Render all sections based on order and visibility */}
            <div className="flex flex-col gap-6">
              {sectionOrder.filter(sectionId => sectionVisibility[sectionId]).map((sectionId: string) => {
                let sectionElement = null;
                      
                      if (sectionId === 'songs' && (songs.length > 0 || isOwnProfile)) {
                        sectionElement = (
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
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
                              disabled={isUploadingSong}
                            />
                          </div>
                          
                          {/* Barra de progreso */}
                          {isUploadingSong && songUploadProgress > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Subiendo canción...</span>
                                <span className="font-medium" style={{ color: colors.hexAccent }}>{songUploadProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className="h-2.5 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${songUploadProgress}%`,
                                    background: `linear-gradient(90deg, ${colors.hexPrimary}, ${colors.hexAccent})`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowUploadSongDialog(false);
                              setSongUploadProgress(0);
                            }}
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
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
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
                      <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Agregar Nuevo Video</DialogTitle>
                          <DialogDescription>
                            Agrega un video de YouTube o sube un archivo local
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-3">
                            <Label>Tipo de Video</Label>
                            <RadioGroup 
                              value={videoUploadType} 
                              onValueChange={(value) => setVideoUploadType(value as 'youtube' | 'file')}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="youtube" id="youtube" />
                                <Label htmlFor="youtube" className="cursor-pointer">URL de YouTube</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="file" id="file" />
                                <Label htmlFor="file" className="cursor-pointer">Subir Archivo (MP4, MPG, MOV, AVI)</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="video-title">Título del Video</Label>
                            <Input
                              id="video-title"
                              value={newVideoTitle}
                              onChange={(e) => setNewVideoTitle(e.target.value)}
                              placeholder="Mi Video Musical"
                            />
                          </div>

                          {videoUploadType === 'youtube' ? (
                            <div className="space-y-2">
                              <Label htmlFor="video-url">URL del Video de YouTube</Label>
                              <Input
                                id="video-url"
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                              />
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="video-file">Archivo de Video</Label>
                                <Input
                                  id="video-file"
                                  type="file"
                                  accept="video/mp4,video/mpeg,video/webm,.mp4,.mpg,.webm"
                                  ref={videoFileInputRef}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const ext = file.name.split('.').pop()?.toLowerCase();
                                      if (ext === 'mov' || ext === 'avi') {
                                        toast({
                                          title: "⚠️ Formato no recomendado",
                                          description: `Los archivos .${ext} no son compatibles con todos los navegadores. Para mejor compatibilidad, usa .MP4 o .WEBM`,
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                    setVideoFile(file || null);
                                  }}
                                />
                                {videoFile && (
                                  <div className="space-y-1">
                                    <p className="text-sm text-gray-400">
                                      Archivo seleccionado: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                    {videoFile.name.toLowerCase().endsWith('.mov') && (
                                      <p className="text-xs text-orange-400 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        ⚠️ Formato .MOV no funciona en Chrome/Firefox. Usa .MP4 para mejor compatibilidad.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="video-password">Password de Descarga</Label>
                                <Input
                                  id="video-password"
                                  type="password"
                                  value={videoPassword}
                                  onChange={(e) => setVideoPassword(e.target.value)}
                                  placeholder="Ingresa un password para proteger la descarga"
                                />
                                <p className="text-xs text-gray-500">
                                  Este password será requerido para descargar el video
                                </p>
                              </div>
                            </>
                          )}
                          
                          {/* Barra de progreso */}
                          {isUploadingVideo && videoUploadProgress > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Subiendo video...</span>
                                <span className="font-medium" style={{ color: colors.hexAccent }}>{videoUploadProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className="h-2.5 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${videoUploadProgress}%`,
                                    background: `linear-gradient(90deg, ${colors.hexPrimary}, ${colors.hexAccent})`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowUploadVideoDialog(false);
                              setNewVideoTitle('');
                              setNewVideoUrl('');
                              setVideoFile(null);
                              setVideoPassword('');
                              setVideoUploadType('youtube');
                              setVideoUploadProgress(0);
                            }}
                            disabled={isUploadingVideo}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleUploadVideo}
                            disabled={isUploadingVideo}
                            style={{ backgroundColor: colors.hexPrimary, color: 'white' }}
                          >
                            {isUploadingVideo ? `Subiendo... ${videoUploadProgress}%` : 'Agregar Video'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {videos.map((video, index) => {
                    logger.info('🎥 Rendering video card:', { 
                      title: video.title, 
                      url: video.url, 
                      thumbnailUrl: video.thumbnailUrl,
                      hasUrl: !!video.url,
                      isYouTube: video.url?.includes('youtube')
                    });
                    
                    return (
                    <div
                      key={video.id}
                      className="rounded-lg sm:rounded-xl overflow-hidden bg-black/50 hover:bg-gray-900/50 transition-all duration-200 border"
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
                            className="w-full h-36 sm:h-40 md:h-44 object-cover"
                          />
                        ) : video.url && !video.url.includes('youtube') ? (
                          <div className="relative w-full h-36 sm:h-40 md:h-44 bg-black">
                            <video
                              src={`${video.url}#t=0.5`}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                              onLoadedData={(e) => {
                                logger.info('✅ Video thumbnail loaded for:', video.title);
                              }}
                            />
                          </div>
                        ) : (
                          <div 
                            className="w-full h-36 sm:h-40 md:h-44 flex items-center justify-center"
                            style={{ backgroundColor: `${colors.hexPrimary}33` }}
                          >
                            <VideoIcon className="h-10 sm:h-12 w-10 sm:w-12" style={{ color: colors.hexAccent }} />
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
                        <p className="text-xs text-gray-400 mt-1">
                          {video.type === 'uploaded' ? 'Video Local' : 'Powered by Boostify'}
                        </p>
                        
                        <div className="space-y-2 mt-2">
                          {/* Botón de descarga - visible para todos si es video subido */}
                          {video.type === 'uploaded' && video.downloadPassword && (
                            <button
                              className="w-full py-2.5 sm:py-2 px-4 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-lg active:scale-95"
                              style={{ 
                                background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                                color: 'white'
                              }}
                              onClick={() => handleDownloadVideo(video)}
                              data-testid={`button-download-video-${video.id}`}
                            >
                              <Download className="h-3.5 w-3.5 sm:h-3 sm:w-3 inline mr-1.5 sm:mr-1" />
                              Descargar Video
                            </button>
                          )}

                          {isOwnProfile && (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
                        );
                      } else if (sectionId === 'news' && (newsArticles.length > 0 || isOwnProfile)) {
                        sectionElement = (
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div className="flex justify-between items-center mb-4">
                  <div 
                    className="text-base font-semibold transition-colors duration-500 flex items-center gap-2" 
                    style={{ color: colors.hexAccent }}
                  >
                    <Newspaper className="h-5 w-5" />
                    Noticias ({newsArticles.length})
                  </div>
                </div>

                {newsArticles.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay noticias disponibles aún</p>
                    {isOwnProfile && (
                      <p className="text-sm mt-2">
                        Usa el botón "Generar Noticias con IA" en editar perfil
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-4 -mx-4 px-4">
                    <div className="flex gap-4 min-w-max">
                      {newsArticles.map((article) => {
                        const categoryColors = {
                          release: { bg: '#10B981', text: 'Lanzamiento' },
                          performance: { bg: '#8B5CF6', text: 'Performance' },
                          collaboration: { bg: '#F59E0B', text: 'Colaboración' },
                          achievement: { bg: '#EF4444', text: 'Logro' },
                          lifestyle: { bg: '#3B82F6', text: 'Lifestyle' }
                        };
                        
                        const categoryInfo = categoryColors[article.category] || { bg: colors.hexPrimary, text: article.category };
                        
                        return (
                          <div
                            key={article.id}
                            className="w-80 flex-shrink-0 bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all duration-300"
                          >
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={article.imageUrl}
                                alt={article.title}
                                className="w-full h-full object-cover"
                              />
                              <div 
                                className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: categoryInfo.bg }}
                              >
                                {categoryInfo.text}
                              </div>
                            </div>
                            
                            <div className="p-4 space-y-3">
                              <h3 className="font-semibold text-white line-clamp-2 leading-tight">
                                {article.title}
                              </h3>
                              
                              <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                                {article.summary || article.content}
                              </p>
                              
                              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Eye className="h-3 w-3" />
                                  {article.views || 0} vistas
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs h-7"
                                  style={{ color: colors.hexAccent }}
                                  onClick={() => {
                                    setSelectedArticle(article);
                                    setIsNewsModalOpen(true);
                                  }}
                                  data-testid={`button-read-more-${article.id}`}
                                >
                                  Leer más →
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
                        );
                      } else if (sectionId === 'social-hub') {
                        // Elemento circular con iconos de redes sociales
                        sectionElement = (
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              
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
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
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

                {/* Nota de colaboración */}
                {isMerchandiseExpanded && (
                  <div 
                    className="mb-4 p-3 sm:p-4 rounded-lg border-2 flex items-start gap-3"
                    style={{ 
                      borderColor: colors.hexBorder,
                      background: `linear-gradient(135deg, ${colors.hexPrimary}15, ${colors.hexAccent}10)`
                    }}
                  >
                    <div 
                      className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`
                      }}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm sm:text-base font-bold text-white">
                          Colaboración Boostify x Artista
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ 
                            background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                            color: 'white'
                          }}
                        >
                          30% para ti
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                        Estos productos son una colaboración exclusiva entre <strong style={{ color: colors.hexAccent }}>Boostify</strong> y <strong style={{ color: colors.hexAccent }}>{artist.name}</strong>. 
                        <span className="block mt-1">
                          <strong className="text-white">Los artistas ganan el 30%</strong> de cada venta, sin inversión inicial ni inventario. Nosotros nos encargamos de producción, envío y atención al cliente.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Mensaje de Disponibilidad - Enero 2025 */}
                {isMerchandiseExpanded && (
                  <div 
                    className="mb-4 p-3 sm:p-4 rounded-lg border-2 flex items-start gap-3"
                    style={{ 
                      borderColor: colors.hexAccent,
                      background: `linear-gradient(135deg, rgba(234, 179, 8, 0.15), ${colors.hexAccent}15)`,
                      borderStyle: 'dashed'
                    }}
                    data-testid="message-coming-january"
                  >
                    <div 
                      className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center animate-pulse"
                      style={{ 
                        background: `linear-gradient(135deg, #eab308, ${colors.hexAccent})`
                      }}
                    >
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm sm:text-base font-bold text-white">
                          🚀 Próximamente - Enero 2025
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500 text-black"
                        >
                          PREVENTA
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                        <strong className="text-yellow-400">La tienda oficial estará disponible a partir de enero 2025.</strong> Los productos mostrados son una vista previa y <strong className="text-white">los precios finales pueden variar</strong>. 
                        <span className="block mt-1.5 text-gray-400">
                          Estamos preparando una experiencia de compra excepcional con productos de alta calidad para tus fans.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {isMerchandiseExpanded && (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className="rounded-lg md:rounded-xl overflow-hidden bg-black/50 hover:bg-gray-900/50 transition-all duration-200 border group cursor-pointer"
                      style={{ borderColor: colors.hexBorder }}
                      data-testid={`card-product-${index}`}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                      } else if (sectionId === 'galleries') {
                        sectionElement = (
                          <ImageGalleryDisplay 
                            artistId={artistId}
                            pgId={artist.pgId}
                            isOwner={isOwnProfile}
                            refreshKey={galleriesRefreshKey}
                          />
                        );
                      } else if (sectionId === 'monetize-cta') {
                        sectionElement = (
                          <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px', position: 'relative', overflow: 'hidden' }}>
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
                        );
                      } else if (sectionId === 'analytics') {
                        const analyticsData = {
                          totalPlays: songs.length * Math.floor(Math.random() * 100 + 50),
                          totalViews: videos.length * Math.floor(Math.random() * 150 + 75)
                        };
                        
                        sectionElement = (
                          <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                            <div 
                              className="text-base font-semibold mb-4 transition-colors duration-500 flex items-center gap-2" 
                              style={{ color: colors.hexAccent }}
                            >
                              <TrendingUp className="h-5 w-5" />
                              {t('profile.analytics.title')}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <motion.div 
                                className="p-3 rounded-lg text-center"
                                style={{ backgroundColor: `${colors.hexPrimary}10`, borderColor: colors.hexBorder, borderWidth: '1px' }}
                                whileHover={{ scale: 1.05 }}
                              >
                                <div className="text-xs text-gray-400 mb-1">{t('profile.analytics.totalPlays')}</div>
                                <div className="text-xl font-bold" style={{ color: colors.hexPrimary }}>
                                  {analyticsData.totalPlays.toLocaleString()}
                                </div>
                              </motion.div>
                              
                              <motion.div 
                                className="p-3 rounded-lg text-center"
                                style={{ backgroundColor: `${colors.hexAccent}10`, borderColor: colors.hexBorder, borderWidth: '1px' }}
                                whileHover={{ scale: 1.05 }}
                              >
                                <div className="text-xs text-gray-400 mb-1">{t('profile.analytics.totalViews')}</div>
                                <div className="text-xl font-bold" style={{ color: colors.hexAccent }}>
                                  {analyticsData.totalViews.toLocaleString()}
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        );
                      } else if (sectionId === 'earnings' && isOwnProfile) {
                        sectionElement = (
                          <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                            <div className="flex justify-between items-center mb-4">
                              <div className="text-base font-semibold transition-colors duration-500 flex items-center gap-2" style={{ color: colors.hexAccent }}>
                                <DollarSign className="h-5 w-5" />
                                {t('profile.earnings.title')}
                              </div>
                              <button 
                                onClick={() => setIsEarningsExpanded(!isEarningsExpanded)}
                                className="p-2 rounded-full hover:bg-white/5 transition-colors"
                                style={{ color: colors.hexAccent }}
                              >
                                <motion.div
                                  animate={{ rotate: isEarningsExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <ChevronDown className="h-5 w-5" />
                                </motion.div>
                              </button>
                            </div>

                            <motion.div
                              initial={false}
                              animate={{
                                height: isEarningsExpanded ? "auto" : 0,
                                opacity: isEarningsExpanded ? 1 : 0
                              }}
                              transition={{ duration: 0.3 }}
                              style={{ overflow: "hidden" }}
                            >
                              {isEarningsExpanded && <EarningsChart userId={user.id} days={30} />}
                            </motion.div>
                          </div>
                        );
                      } else if (sectionId === 'crowdfunding' && isOwnProfile) {
                        sectionElement = (
                          <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                            <div className="flex justify-between items-center mb-4">
                              <div 
                                className="text-base font-semibold transition-colors duration-500 flex items-center gap-2"
                                style={{ color: colors.hexAccent }}
                              >
                                <Target className="h-5 w-5" />
                                Crowdfunding
                              </div>
                              <button 
                                onClick={() => setIsCrowdfundingExpanded(!isCrowdfundingExpanded)}
                                className="p-2 rounded-full hover:bg-white/5 transition-colors"
                                style={{ color: colors.hexAccent }}
                              >
                                <motion.div
                                  animate={{ rotate: isCrowdfundingExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <ChevronDown className="h-5 w-5" />
                                </motion.div>
                              </button>
                            </div>

                            <motion.div
                              initial={false}
                              animate={{
                                height: isCrowdfundingExpanded ? "auto" : 0,
                                opacity: isCrowdfundingExpanded ? 1 : 0
                              }}
                              transition={{ duration: 0.3 }}
                              style={{ overflow: "hidden" }}
                            >
                              {isCrowdfundingExpanded && <CrowdfundingPanel colors={colors} />}
                            </motion.div>
                          </div>
                        );
                      }

                if (!sectionElement) return null;

                return (
                  <div key={sectionId}>
                    {sectionElement}
                  </div>
                );
              })}
            </div>

          </section>

          {/* Columna Derecha */}
          <section className="flex flex-col gap-4 sm:gap-5 md:gap-6">
            
            {/* Artist Card con QR Code */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <ArtistCard 
                artist={artist}
                colors={colors}
                profileUrl={`${window.location.origin}/artist/${userProfile?.slug || artistId}`}
              />
            </div>

            {/* Order Physical Cards - Solo visible para usuarios autenticados */}
            {isOwnProfile && (
              <motion.div 
                className={`${cardStyles} overflow-hidden`}
                style={{ 
                  borderColor: colors.hexBorder, 
                  borderWidth: '2px',
                  background: `linear-gradient(135deg, ${colors.hexPrimary}15 0%, ${colors.hexAccent}10 100%)`
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  {/* Badge "Nuevo" */}
                  <div className="absolute -top-2 -right-2 z-10">
                    <div 
                      className="px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                        color: 'white'
                      }}
                    >
                      ✨ NUEVO
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                    {/* Icono de tarjeta */}
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                        boxShadow: `0 8px 20px ${colors.hexPrimary}40`
                      }}
                    >
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>

                    {/* Texto */}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                        Tarjetas Físicas Premium
                      </h3>
                      <p className="text-sm text-gray-400">
                        Imprime tu Artist Card en plástico de alta calidad
                      </p>
                    </div>
                  </div>

                  {/* Detalles del producto */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.hexAccent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Plástico PVC de calidad premium (mismo que tarjetas bancarias)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.hexAccent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Impresión a todo color con acabado brillante o mate</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.hexAccent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Código QR integrado para compartir tu perfil fácilmente</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.hexAccent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Tamaño estándar de tarjeta de crédito (85.6 × 53.98 mm)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.hexAccent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Resistente al agua y duradera</span>
                    </div>
                  </div>

                  {/* Botón CTA */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        className="w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
                        style={{
                          background: `linear-gradient(135deg, ${colors.hexPrimary} 0%, ${colors.hexAccent} 100%)`,
                          color: 'white',
                          boxShadow: `0 10px 30px ${colors.hexPrimary}40`
                        }}
                      >
                        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <span className="relative flex items-center justify-center gap-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Order Your Digital Cards
                        </span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">¡Próximamente!</DialogTitle>
                        <DialogDescription className="text-base">
                          Estamos trabajando en el sistema de pedidos para traerte tarjetas físicas de la más alta calidad.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div 
                          className="p-4 rounded-lg border-2"
                          style={{ 
                            borderColor: colors.hexBorder,
                            background: `${colors.hexPrimary}10`
                          }}
                        >
                          <h4 className="font-bold text-white mb-2">¿Qué incluye?</h4>
                          <ul className="space-y-2 text-sm text-gray-300">
                            <li>• Paquetes desde 50 hasta 1000+ tarjetas</li>
                            <li>• Envío internacional disponible</li>
                            <li>• Precios especiales para pedidos grandes</li>
                            <li>• Diseño personalizado incluido</li>
                          </ul>
                        </div>
                        <div 
                          className="p-4 rounded-lg border"
                          style={{ borderColor: colors.hexBorder }}
                        >
                          <p className="text-sm text-gray-400">
                            <strong className="text-white">Nota:</strong> Las tarjetas físicas son perfectas para eventos, shows, networking y promoción de tu marca musical. Comparte tu perfil digital de forma profesional y memorable.
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm" style={{ color: colors.hexAccent }}>
                            📧 ¿Interesado? Contáctanos en <strong>cards@boostify.com</strong>
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </motion.div>
            )}

            {/* Artist Earnings - Solo visible para el dueño del perfil */}
            {isOwnProfile && user?.id && (
              <motion.div 
                className={cardStyles} 
                style={{ 
                  borderColor: colors.hexBorder, 
                  borderWidth: '2px',
                  background: `linear-gradient(135deg, ${colors.hexPrimary}10, ${colors.hexAccent}05)`
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="flex justify-between items-center cursor-pointer group mb-4"
                  onClick={() => setIsEarningsExpanded(!isEarningsExpanded)}
                  data-testid="button-toggle-earnings"
                >
                  <div 
                    className="text-base sm:text-lg font-bold transition-all duration-300 flex items-center gap-2 group-hover:gap-3" 
                    style={{ color: colors.hexAccent }}
                  >
                    <div 
                      className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                        boxShadow: `0 4px 12px ${colors.hexAccent}40`
                      }}
                    >
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Mis Ganancias
                    </span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-bold"
                      style={{ 
                        background: `${colors.hexPrimary}20`,
                        color: colors.hexAccent,
                        border: `1px solid ${colors.hexAccent}40`
                      }}
                    >
                      30%
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isEarningsExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown 
                      className="h-5 w-5 transition-colors duration-300" 
                      style={{ color: colors.hexAccent }}
                    />
                  </motion.div>
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    height: isEarningsExpanded ? "auto" : 0,
                    opacity: isEarningsExpanded ? 1 : 0
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  {isEarningsExpanded && <EarningsChart userId={user.id} days={30} />}
                </motion.div>
              </motion.div>
            )}

            {/* Crowdfunding Campaign Panel - Solo visible para el dueño del perfil */}
            {isOwnProfile && user?.id && (
              <motion.div 
                className={cardStyles} 
                style={{ 
                  borderColor: colors.hexBorder, 
                  borderWidth: '2px',
                  background: `linear-gradient(135deg, ${colors.hexPrimary}10, ${colors.hexAccent}05)`
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div 
                  className="flex justify-between items-center cursor-pointer group mb-4"
                  onClick={() => setIsCrowdfundingExpanded(!isCrowdfundingExpanded)}
                  data-testid="button-toggle-crowdfunding"
                >
                  <div 
                    className="text-base sm:text-lg font-bold transition-all duration-300 flex items-center gap-2 group-hover:gap-3" 
                    style={{ color: colors.hexAccent }}
                  >
                    <div 
                      className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                        boxShadow: `0 4px 12px ${colors.hexAccent}40`
                      }}
                    >
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      Crowdfunding
                    </span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-bold"
                      style={{ 
                        background: `${colors.hexPrimary}20`,
                        color: colors.hexAccent,
                        border: `1px solid ${colors.hexAccent}40`
                      }}
                    >
                      70%
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isCrowdfundingExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown 
                      className="h-5 w-5 transition-colors duration-300" 
                      style={{ color: colors.hexAccent }}
                    />
                  </motion.div>
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    height: isCrowdfundingExpanded ? "auto" : 0,
                    opacity: isCrowdfundingExpanded ? 1 : 0
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  {isCrowdfundingExpanded && <CrowdfundingPanel colors={colors} />}
                </motion.div>
              </motion.div>
            )}

            {/* Tarjeta de Estadísticas con Gráficos */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div 
                className="text-base font-semibold mb-4 transition-colors duration-500" 
                style={{ color: colors.hexAccent }}
              >
                Estadísticas del Perfil
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                <motion.div 
                  className="text-center p-2 sm:p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.hexPrimary}15`, borderColor: colors.hexBorder, borderWidth: '1px' }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Music2 className="h-4 sm:h-5 w-4 sm:w-5 mx-auto mb-1" style={{ color: colors.hexAccent }} />
                  <div className="text-xl sm:text-2xl font-bold text-white">{songs.length}</div>
                  <div className="text-[10px] sm:text-xs text-gray-400">Canciones</div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-2 sm:p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.hexPrimary}15`, borderColor: colors.hexBorder, borderWidth: '1px' }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <VideoIcon className="h-4 sm:h-5 w-4 sm:w-5 mx-auto mb-1" style={{ color: colors.hexAccent }} />
                  <div className="text-xl sm:text-2xl font-bold text-white">{videos.length}</div>
                  <div className="text-[10px] sm:text-xs text-gray-400">Videos</div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-2 sm:p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.hexPrimary}15`, borderColor: colors.hexBorder, borderWidth: '1px' }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Users className="h-4 sm:h-5 w-4 sm:w-5 mx-auto mb-1" style={{ color: colors.hexAccent }} />
                  <div className="text-xl sm:text-2xl font-bold text-white">{artist.followers > 1000 ? `${(artist.followers / 1000).toFixed(1)}K` : artist.followers}</div>
                  <div className="text-[10px] sm:text-xs text-gray-400">Seguidores</div>
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

            {/* Image Galleries */}
            <ImageGalleryDisplay 
              artistId={artistId}
              pgId={artist.pgId}
              isOwner={isOwnProfile}
              refreshKey={galleriesRefreshKey}
            />

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

            {/* Music Tokenization Section (Web3/Blockchain) */}
            {isOwnProfile && (
              <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px', position: 'relative', overflow: 'hidden' }}>
                <div className="absolute inset-0 opacity-10" style={{
                  background: `radial-gradient(circle at 70% 50%, ${colors.hexPrimary}, transparent 70%)`
                }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-6 w-6" style={{ color: colors.hexAccent }} />
                    <div className="text-base font-bold transition-colors duration-500" style={{ color: colors.hexAccent }}>
                      Tokenización de Música (Web3)
                    </div>
                    <div className="ml-auto px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                      <span className="text-xs font-bold text-purple-400">Blockchain</span>
                    </div>
                  </div>
                  
                  <TokenizationPanel artistId={parseInt(artistId)} />
                </div>
              </div>
            )}
            
            {/* Public View: Tokenized Music */}
            <TokenizedMusicView artistId={artistId} />

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

            {/* Premium Tools Section - Only visible when logged in */}
            {isOwnProfile && (
              <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div className="flex items-center justify-between mb-6">
                  <div 
                    className="text-lg font-bold transition-colors duration-500 flex items-center gap-2" 
                    style={{ color: colors.hexAccent }}
                  >
                    <Zap className="h-6 w-6" />
                    Premium Tools
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <Crown className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-xs font-bold text-yellow-500">PRO</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Community Manager */}
                  <Link href="/instagram-boost">
                    <div 
                      className="group relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      style={{ 
                        borderColor: colors.hexBorder,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)'
                      }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                        style={{ 
                          background: `radial-gradient(circle, ${colors.hexPrimary} 0%, transparent 70%)`
                        }}
                      />
                      <div className="flex items-start gap-3 relative z-10">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                            boxShadow: `0 4px 12px ${colors.hexPrimary}40`
                          }}
                        >
                          <Instagram className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-opacity-90 transition-colors">
                            My Community Manager
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Boost your Instagram presence with AI-powered engagement
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Lawyer */}
                  <Link href="/contracts">
                    <div 
                      className="group relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      style={{ 
                        borderColor: colors.hexBorder,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)'
                      }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                        style={{ 
                          background: `radial-gradient(circle, ${colors.hexPrimary} 0%, transparent 70%)`
                        }}
                      />
                      <div className="flex items-start gap-3 relative z-10">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                            boxShadow: `0 4px 12px ${colors.hexPrimary}40`
                          }}
                        >
                          <Scale className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-opacity-90 transition-colors">
                            My Lawyer
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Generate and manage music contracts with AI legal assistance
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Music Producer */}
                  <Link href="/producer-tools">
                    <div 
                      className="group relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      style={{ 
                        borderColor: colors.hexBorder,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)'
                      }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                        style={{ 
                          background: `radial-gradient(circle, ${colors.hexPrimary} 0%, transparent 70%)`
                        }}
                      />
                      <div className="flex items-start gap-3 relative z-10">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                            boxShadow: `0 4px 12px ${colors.hexPrimary}40`
                          }}
                        >
                          <Headphones className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-opacity-90 transition-colors">
                            My Music Producer
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Professional production tools and AI music generation
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Education */}
                  <Link href="/education">
                    <div 
                      className="group relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      style={{ 
                        borderColor: colors.hexBorder,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)'
                      }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                        style={{ 
                          background: `radial-gradient(circle, ${colors.hexPrimary} 0%, transparent 70%)`
                        }}
                      />
                      <div className="flex items-start gap-3 relative z-10">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                            boxShadow: `0 4px 12px ${colors.hexPrimary}40`
                          }}
                        >
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-opacity-90 transition-colors">
                            Education
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Master your craft with courses and tutorials
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Manager */}
                  <Link href="/manager-tools">
                    <div 
                      className="group relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      style={{ 
                        borderColor: colors.hexBorder,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)'
                      }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                        style={{ 
                          background: `radial-gradient(circle, ${colors.hexPrimary} 0%, transparent 70%)`
                        }}
                      />
                      <div className="flex items-start gap-3 relative z-10">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                            boxShadow: `0 4px 12px ${colors.hexPrimary}40`
                          }}
                        >
                          <Briefcase className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-opacity-90 transition-colors">
                            My Manager
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Manage bookings, schedules, and career opportunities
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Image Supervisor */}
                  <Link href="/ai-advisors">
                    <div 
                      className="group relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      style={{ 
                        borderColor: colors.hexBorder,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)'
                      }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                        style={{ 
                          background: `radial-gradient(circle, ${colors.hexPrimary} 0%, transparent 70%)`
                        }}
                      />
                      <div className="flex items-start gap-3 relative z-10">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                            boxShadow: `0 4px 12px ${colors.hexPrimary}40`
                          }}
                        >
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-opacity-90 transition-colors">
                            My Image Supervisor
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            AI-powered brand and visual identity management
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* PR */}
                  <Link href="/pr">
                    <div 
                      className="group relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      style={{ 
                        borderColor: colors.hexBorder,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)'
                      }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                        style={{ 
                          background: `radial-gradient(circle, ${colors.hexPrimary} 0%, transparent 70%)`
                        }}
                      />
                      <div className="flex items-start gap-3 relative z-10">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                            boxShadow: `0 4px 12px ${colors.hexPrimary}40`
                          }}
                        >
                          <Megaphone className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-opacity-90 transition-colors">
                            My PR
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Press releases, media outreach, and publicity campaigns
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Video Director */}
                  <Link href="/music-video-creator">
                    <div 
                      className="group relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      style={{ 
                        borderColor: colors.hexBorder,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)'
                      }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                        style={{ 
                          background: `radial-gradient(circle, ${colors.hexPrimary} 0%, transparent 70%)`
                        }}
                      />
                      <div className="flex items-start gap-3 relative z-10">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                          style={{ 
                            background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                            boxShadow: `0 4px 12px ${colors.hexPrimary}40`
                          }}
                        >
                          <Film className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-opacity-90 transition-colors">
                            My Video Director
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Create professional music videos with AI-powered direction
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Premium Footer */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.hexBorder }}>
                  <p className="text-xs text-center text-gray-500">
                    All tools require an active premium subscription
                  </p>
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
                <Link href="/auth?returnTo=/profile">
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

      {/* Download Password Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descargar Video</DialogTitle>
            <DialogDescription>
              Este video está protegido. Ingresa el password para descargarlo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="download-password">Password</Label>
              <Input
                id="download-password"
                type="password"
                value={downloadPasswordInput}
                onChange={(e) => setDownloadPasswordInput(e.target.value)}
                placeholder="Ingresa el password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmDownload();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDownloadDialog(false);
                setDownloadPasswordInput('');
                setDownloadVideoId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDownload}
              style={{ backgroundColor: colors.hexPrimary, color: 'white' }}
            >
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Player Modal - Optimizado para móviles */}
      <Dialog open={!!playingVideo} onOpenChange={(open) => !open && setPlayingVideo(null)}>
        <DialogContent className="max-w-4xl w-full bg-black/95 border border-gray-800 p-0">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {playingVideo && getYouTubeEmbedUrl(playingVideo.url) ? (
              <iframe
                src={getYouTubeEmbedUrl(playingVideo.url)!}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={playingVideo.title}
              />
            ) : playingVideo?.url ? (
              <video
                key={playingVideo.url}
                src={playingVideo.url}
                poster={playingVideo.thumbnailUrl || undefined}
                className="absolute top-0 left-0 w-full h-full rounded-lg bg-black"
                controls
                controlsList="nodownload"
                playsInline
                preload="auto"
                webkit-playsinline="true"
                x-webkit-airplay="allow"
                title={playingVideo.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onLoadStart={() => logger.info('📱 Video load started (mobile-friendly)')}
                onCanPlay={() => logger.info('✅ Video ready to play')}
                onError={(e) => {
                  const videoEl = e.currentTarget;
                  logger.error('❌ Error reproduciendo video móvil:', {
                    url: playingVideo.url,
                    error: videoEl.error?.code,
                    message: videoEl.error?.message,
                    networkState: videoEl.networkState,
                    readyState: videoEl.readyState
                  });
                }}
              />
            ) : null}
          </div>
          <div className="p-4 border-t border-gray-800">
            <h3 className="text-white font-semibold text-lg">{playingVideo?.title}</h3>
            <p className="text-gray-400 text-sm mt-1">
              {playingVideo?.url?.includes('youtube') ? 'YouTube' : 'Video Local'} • Powered by Boostify
            </p>
          </div>
          <button
            onClick={() => setPlayingVideo(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all z-10"
            aria-label="Cerrar"
            data-testid="button-close-video"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </DialogContent>
      </Dialog>

      {/* News Article Modal */}
      <NewsArticleModal
        article={selectedArticle}
        isOpen={isNewsModalOpen}
        onClose={() => {
          setIsNewsModalOpen(false);
          setSelectedArticle(null);
        }}
        isOwner={isOwnProfile}
        onEdit={handleEditNews}
        onDelete={handleDeleteNews}
        onRegenerate={handleRegenerateNews}
      />
    </div>
  );
}
