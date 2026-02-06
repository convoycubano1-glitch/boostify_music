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
  Newspaper,
  Coins,
  FileText,
  Copy,
  Clock,
  Info
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
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
import { SocialPostsDisplay } from "./social-posts-display";
import { NewsArticleModal } from "./news-article-modal";
import { queryClient } from "../../lib/queryClient";
import { HitScoreBar, calculateHitScore } from "../ui/hit-score-bar";

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
  genre?: string;
  description?: string;
  isrc?: string;
  upc?: string;
  composers?: string[];
  lyrics?: string;
}

// Song Metadata Modal Component for Distribution
function SongMetadataModal({ 
  song, 
  artistName,
  artistImages,
  colors, 
  isOpen, 
  onClose,
  onSongUpdate
}: { 
  song: Song; 
  artistName: string;
  artistImages?: string[];
  colors: any; 
  isOpen: boolean; 
  onClose: () => void;
  onSongUpdate?: (updatedSong: Song) => void;
}) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Editable metadata state
  const [editableData, setEditableData] = useState({
    isrc: song.isrc || '',
    upc: song.upc || '',
    composers: song.composers?.join(', ') || artistName,
    genre: song.genre || '',
    lyrics: song.lyrics || '',
  });
  
  // Cover art generation state
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [generatedCoverArt, setGeneratedCoverArt] = useState<string | null>(song.coverArt || null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date instanceof Date) return date.toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  // Generate cover art using FAL AI
  const handleGenerateCoverArt = async () => {
    setIsGeneratingCover(true);
    try {
      const songTitle = song.title || song.name;
      const genre = editableData.genre || song.genre || 'music';
      
      // Create a prompt based on song data
      const prompt = `Album cover art for a ${genre} song titled "${songTitle}" by ${artistName}. Professional music album artwork, high quality, artistic, vibrant colors, modern design.`;
      
      const response = await fetch('/api/songs/generate-cover-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          songId: song.id,
          artistName,
          referenceImage: artistImages?.[0] || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover art');
      }

      const result = await response.json();
      if (result.success && result.coverArtUrl) {
        setGeneratedCoverArt(result.coverArtUrl);
        setHasChanges(true);
        toast({
          title: '🎨 Cover Art Generated!',
          description: 'Your album cover has been created with AI.',
        });
      }
    } catch (error) {
      console.error('Error generating cover art:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate cover art. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCover(false);
    }
  };

  // Save metadata to database
  const handleSaveMetadata = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/songs/${song.id}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isrc: editableData.isrc || null,
          upc: editableData.upc || null,
          composers: editableData.composers.split(',').map(c => c.trim()).filter(Boolean),
          genre: editableData.genre || null,
          lyrics: editableData.lyrics || null,
          coverArt: generatedCoverArt || song.coverArt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save metadata');
      }

      const result = await response.json();
      
      toast({
        title: '✅ Metadata Saved!',
        description: 'Song information has been updated.',
      });
      
      setHasChanges(false);
      
      // Notify parent of update
      if (onSongUpdate && result.song) {
        onSongUpdate(result.song);
      }
    } catch (error) {
      console.error('Error saving metadata:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save metadata. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const copyAllMetadata = () => {
    const allData = [
      `Track Title: ${song.title || song.name}`,
      `Artist Name: ${artistName}`,
      `Duration: ${song.duration || '3:45'}`,
      `Genre: ${editableData.genre || 'Not specified'}`,
      `ISRC Code: ${editableData.isrc || 'Not assigned'}`,
      `UPC Code: ${editableData.upc || 'Not assigned'}`,
      `Composers: ${editableData.composers}`,
      `Release Date: ${formatDate(song.createdAt)}`,
    ].join('\n');
    
    navigator.clipboard.writeText(allData);
    toast({
      title: 'All Metadata Copied!',
      description: 'Song metadata copied to clipboard',
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gray-950 border max-h-[90vh] overflow-y-auto" style={{ borderColor: colors.hexBorder }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: colors.hexAccent }}>
            <FileText className="h-5 w-5" />
            Song Metadata for Distribution
          </DialogTitle>
          <DialogDescription>
            Edit metadata and generate cover art for distribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cover Art Section */}
          <div className="p-4 rounded-xl bg-black/50 border" style={{ borderColor: colors.hexBorder }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white flex items-center gap-2">
                <Image className="h-4 w-4" style={{ color: colors.hexAccent }} />
                Cover Art
              </span>
              <Button
                size="sm"
                onClick={handleGenerateCoverArt}
                disabled={isGeneratingCover}
                style={{ 
                  background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                  color: 'white'
                }}
              >
                {isGeneratingCover ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex justify-center">
              {generatedCoverArt ? (
                <div className="relative group">
                  <img 
                    src={generatedCoverArt} 
                    alt={song.title || song.name}
                    className="w-32 h-32 rounded-lg object-cover shadow-lg"
                    style={{ boxShadow: `0 4px 12px ${colors.hexPrimary}40` }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleGenerateCoverArt}
                      disabled={isGeneratingCover}
                      className="text-white"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="w-32 h-32 rounded-lg flex flex-col items-center justify-center gap-2 border-2 border-dashed cursor-pointer hover:bg-gray-800/50 transition-colors"
                  style={{ borderColor: colors.hexBorder }}
                  onClick={handleGenerateCoverArt}
                >
                  <Image className="h-8 w-8" style={{ color: colors.hexAccent }} />
                  <span className="text-xs text-gray-400 text-center">Click to generate<br/>cover art</span>
                </div>
              )}
            </div>
          </div>

          {/* Read-only Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-black/50 border" style={{ borderColor: colors.hexBorder }}>
              <div className="flex-1">
                <span className="text-xs text-gray-400">Track Title</span>
                <p className="text-sm text-white font-medium">{song.title || song.name}</p>
              </div>
              <button onClick={() => copyToClipboard(song.title || song.name, 'Track Title')} className="p-1.5 rounded-lg hover:bg-gray-800">
                <Copy className="h-4 w-4" style={{ color: colors.hexAccent }} />
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-black/50 border" style={{ borderColor: colors.hexBorder }}>
              <div className="flex-1">
                <span className="text-xs text-gray-400">Artist Name</span>
                <p className="text-sm text-white font-medium">{artistName}</p>
              </div>
              <button onClick={() => copyToClipboard(artistName, 'Artist Name')} className="p-1.5 rounded-lg hover:bg-gray-800">
                <Copy className="h-4 w-4" style={{ color: colors.hexAccent }} />
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-black/50 border" style={{ borderColor: colors.hexBorder }}>
              <div className="flex-1">
                <span className="text-xs text-gray-400">Duration</span>
                <p className="text-sm text-white font-medium">{song.duration || '3:45'}</p>
              </div>
              <button onClick={() => copyToClipboard(song.duration || '3:45', 'Duration')} className="p-1.5 rounded-lg hover:bg-gray-800">
                <Copy className="h-4 w-4" style={{ color: colors.hexAccent }} />
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-black/50 border" style={{ borderColor: colors.hexBorder }}>
              <div className="flex-1">
                <span className="text-xs text-gray-400">Release Date</span>
                <p className="text-sm text-white font-medium">{formatDate(song.createdAt)}</p>
              </div>
              <button onClick={() => copyToClipboard(formatDate(song.createdAt), 'Release Date')} className="p-1.5 rounded-lg hover:bg-gray-800">
                <Copy className="h-4 w-4" style={{ color: colors.hexAccent }} />
              </button>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-3 pt-2 border-t" style={{ borderColor: colors.hexBorder }}>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Editable Fields (will be saved to database)
            </p>

            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Genre</Label>
              <Input
                value={editableData.genre}
                onChange={(e) => handleFieldChange('genre', e.target.value)}
                placeholder="e.g., Pop, Rock, Hip-Hop"
                className="bg-black/50 border text-white"
                style={{ borderColor: colors.hexBorder }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-400">ISRC Code</Label>
              <Input
                value={editableData.isrc}
                onChange={(e) => handleFieldChange('isrc', e.target.value)}
                placeholder="e.g., USRC17607839"
                className="bg-black/50 border text-white"
                style={{ borderColor: colors.hexBorder }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-400">UPC Code</Label>
              <Input
                value={editableData.upc}
                onChange={(e) => handleFieldChange('upc', e.target.value)}
                placeholder="e.g., 012345678905"
                className="bg-black/50 border text-white"
                style={{ borderColor: colors.hexBorder }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Composers (comma separated)</Label>
              <Input
                value={editableData.composers}
                onChange={(e) => handleFieldChange('composers', e.target.value)}
                placeholder="e.g., John Doe, Jane Smith"
                className="bg-black/50 border text-white"
                style={{ borderColor: colors.hexBorder }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Lyrics (optional)</Label>
              <textarea
                value={editableData.lyrics}
                onChange={(e) => handleFieldChange('lyrics', e.target.value)}
                placeholder="Enter song lyrics..."
                rows={3}
                className="w-full bg-black/50 border text-white rounded-md p-2 text-sm resize-none"
                style={{ borderColor: colors.hexBorder }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t" style={{ borderColor: colors.hexBorder }}>
          {/* Save Changes */}
          {hasChanges && (
            <Button
              onClick={handleSaveMetadata}
              disabled={isSaving}
              className="w-full text-white"
              style={{ background: '#22C55E' }}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}

          {/* Copy All Button */}
          <Button
            variant="outline"
            onClick={copyAllMetadata}
            className="w-full"
            style={{ borderColor: colors.hexBorder, color: colors.hexAccent }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy All Metadata
          </Button>

          {/* Go to Distribution */}
          <Button
            onClick={() => {
              onClose();
              setLocation('/artist-dashboard');
            }}
            className="w-full text-white"
            style={{ background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})` }}
          >
            <Globe className="h-4 w-4 mr-2" />
            Go to Distribution
          </Button>

          {/* Register Directly - Coming Soon */}
          <Button
            variant="outline"
            disabled
            className="w-full relative overflow-hidden"
            style={{ borderColor: colors.hexBorder, color: 'gray' }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Register Directly
            <span 
              className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: colors.hexPrimary, color: 'white' }}
            >
              Coming Soon
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
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
              Cancel
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
  
  // State for song metadata modal
  const [selectedSongForMetadata, setSelectedSongForMetadata] = useState<Song | null>(null);
  
  const [isUploadingSong, setIsUploadingSong] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [songUploadProgress, setSongUploadProgress] = useState(0);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [showUploadSongDialog, setShowUploadSongDialog] = useState(false);
  const [showGenerateAISongDialog, setShowGenerateAISongDialog] = useState(false);
  const [isGeneratingAISong, setIsGeneratingAISong] = useState(false);
  const [aiSongPrompt, setAiSongPrompt] = useState('');
  const [aiSongMood, setAiSongMood] = useState<'energetic' | 'mellow' | 'upbeat' | 'dark' | 'romantic'>('energetic');
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
    'songs': { name: 'Music', icon: Music, isOwnerOnly: false },
    'videos': { name: 'Videos', icon: VideoIcon, isOwnerOnly: false },
    'news': { name: 'News', icon: Newspaper, isOwnerOnly: false },
    'social-posts': { name: 'Social Posts', icon: Share2, isOwnerOnly: false },
    'social-hub': { name: 'Social Hub', icon: Share2, isOwnerOnly: false },
    'merchandise': { name: 'Merchandise', icon: ShoppingBag, isOwnerOnly: false },
    'galleries': { name: 'Image Galleries', icon: Image, isOwnerOnly: false },
    'tokenization': { name: 'Song Tokenization', icon: Coins, isOwnerOnly: true },
    'monetize-cta': { name: 'Monetize Your Talent', icon: Sparkles, isOwnerOnly: false },
    'analytics': { name: 'Activity Analytics', icon: TrendingUp, isOwnerOnly: false },
    'earnings': { name: 'Earnings', icon: DollarSign, isOwnerOnly: true },
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
  const [sectionExpanded, setSectionExpanded] = useState<Record<string, boolean>>({
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
  });
  const [isMerchandiseExpanded, setIsMerchandiseExpanded] = useState(true);
  
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
          visibility: sectionVisibility,
          expanded: sectionExpanded
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

  // Expandir todas las secciones
  const expandAll = () => {
    const allExpanded = Object.keys(allSections).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setSectionExpanded(allExpanded);
  };

  // Contraer todas las secciones
  const collapseAll = () => {
    const allCollapsed = Object.keys(allSections).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setSectionExpanded(allCollapsed);
  };

  // Activar todas las secciones
  const activateAll = () => {
    const allActive = Object.keys(allSections).reduce((acc, key) => {
      const section = allSections[key as keyof typeof allSections];
      if (!section.isOwnerOnly || isOwnProfile) {
        acc[key] = true;
      }
      return acc;
    }, {} as Record<string, boolean>);
    setSectionVisibility(prev => ({ ...prev, ...allActive }));
  };

  // Desactivar todas las secciones
  const deactivateAll = () => {
    const allInactive = Object.keys(allSections).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setSectionVisibility(allInactive);
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
    if (!confirm('Are you sure you want to delete this news?')) {
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
    if (!confirm('Are you sure you want to regenerate this news? The current content will be lost.')) {
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
    queryKey: ["songs", userProfile?.firestoreId || artistId],
    queryFn: async () => {
      try {
        // Buscar canciones por artistId (Firestore ID del artista)
        const firestoreArtistId = String(userProfile?.firestoreId || artistId);
        logger.info(`🎵 Fetching songs for artist Firestore ID: ${firestoreArtistId}`);
        
        const songsRef = collection(db, "songs");
        let allSongs: any[] = [];
        
        // Buscar por artistId (Firestore ID) - PRINCIPAL
        try {
          const q1 = query(songsRef, where("artistId", "==", firestoreArtistId));
          const snap1 = await getDocs(q1);
          allSongs = [...snap1.docs.map(doc => ({ id: doc.id, ...doc.data() }))];
          logger.info(`📊 Found ${snap1.size} songs by artistId (Firestore ID): ${firestoreArtistId}`);
        } catch (e) {
          logger.warn('⚠️ Error searching by artistId:', e);
        }
        
        // FALLBACK: Si no se encontraron por artistId, intentar por userId con postgresId
        if (allSongs.length === 0 && userProfile?.pgId) {
          const pgIdStr = String(userProfile.pgId);
          const pgIdNum = Number(userProfile.pgId);
          logger.info(`🔄 Fallback: Searching by userId (postgresId): ${pgIdStr}`);
          
          try {
            const q2 = query(songsRef, where("userId", "==", pgIdStr));
            const snap2 = await getDocs(q2);
            allSongs = [...snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }))];
            logger.info(`📊 Found ${snap2.size} songs by userId (string): ${pgIdStr}`);
          } catch (e) {
            logger.warn('⚠️ Error searching by userId (string):', e);
          }
          
          // También intentar como número
          if (allSongs.length === 0 && !isNaN(pgIdNum)) {
            try {
              const q3 = query(songsRef, where("userId", "==", pgIdNum));
              const snap3 = await getDocs(q3);
              allSongs = [...snap3.docs.map(doc => ({ id: doc.id, ...doc.data() }))];
              logger.info(`📊 Found ${snap3.size} songs by userId (number): ${pgIdNum}`);
            } catch (e) {
              logger.warn('⚠️ Error searching by userId (number):', e);
            }
          }
        }
        
        const querySnapshot = allSongs;
        logger.info(`📊 Songs query returned ${querySnapshot.length} documents total`);

        if (querySnapshot.length === 0) {
          logger.info('⚠️ No songs found for this artist');
          return [];
        }

        const songsData = querySnapshot.map((doc: any) => {
          const data = typeof doc.data === 'function' ? doc.data() : doc;
          const docId = doc.id || doc.id;
          logger.info('🎵 Song data:', { id: docId, name: data.name, audioUrl: data.audioUrl });
          return {
            id: docId,
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
    queryKey: ["videos", userProfile?.pgId || userProfile?.uid || artistId],
    queryFn: async () => {
      try {
        const pgId = userProfile?.pgId || artistId;
        const firebaseUid = userProfile?.uid || artistId;
        logger.info(`📹 Fetching videos for artist: ${pgId} (PostgreSQL ID) or ${firebaseUid} (Firebase UID)`);
        
        const videosRef = collection(db, "videos");
        let allVideos: any[] = [];
        
        // Intentar buscar por pgId primero (para artistas generados)
        try {
          const q1 = query(videosRef, where("userId", "==", pgId));
          const snap1 = await getDocs(q1);
          allVideos = [...snap1.docs.map(doc => ({ id: doc.id, ...doc.data() }))];
          logger.info(`📊 Found ${snap1.size} videos by pgId`);
        } catch (e) {
          logger.warn('⚠️ Error searching videos by pgId:', e);
        }
        
        // Si no se encontraron por pgId, intentar por Firebase UID (para usuarios personales)
        if (allVideos.length === 0 && firebaseUid !== pgId) {
          try {
            const q2 = query(videosRef, where("userId", "==", firebaseUid));
            const snap2 = await getDocs(q2);
            allVideos = [...snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }))];
            logger.info(`📊 Found ${snap2.size} videos by Firebase UID`);
          } catch (e) {
            logger.warn('⚠️ Error searching videos by Firebase UID:', e);
          }
        }
        
        const querySnapshot = allVideos;
        logger.info(`📊 Videos query returned ${querySnapshot.length} documents total`);

        if (querySnapshot.length === 0) {
          logger.info('⚠️ No videos found for this artist');
          return [];
        }

        const videosData = querySnapshot.map((doc: any) => {
          const data = typeof doc.data === 'function' ? doc.data() : doc;
          const docId = doc.id || doc.id;
          
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
            id: docId, 
            title: data.title, 
            url: data.url,
            isYouTube: isYouTubeUrl,
            hasStoredThumbnail: !!data.thumbnailUrl
          });
          
          return {
            id: docId,
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

  // Query para Music Video Projects con video renderizado
  interface MusicVideoProject {
    id: number;
    artistName: string;
    songName: string;
    finalVideoUrl?: string;
    thumbnail?: string;
    status: string;
    createdAt: string;
  }
  
  const { data: musicVideoProjects = [] as MusicVideoProject[] } = useQuery<MusicVideoProject[]>({
    queryKey: ["musicVideoProjects", userProfile?.slug || artistId],
    queryFn: async () => {
      try {
        const slug = userProfile?.slug || artistId;
        logger.info(`🎬 Fetching music video projects for artist: ${slug}`);
        
        // Buscar proyectos completados por slug del artista
        const response = await fetch(`/api/music-video-projects/by-artist/${slug}`);
        
        if (!response.ok) {
          logger.warn(`⚠️ No music video projects found for ${slug}`);
          return [];
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.projects)) {
          // Filtrar solo los que tienen video final
          const completedProjects = data.projects.filter(
            (p: any) => p.finalVideoUrl && p.status === 'completed'
          );
          logger.info(`✅ Found ${completedProjects.length} completed music videos`);
          return completedProjects;
        }
        
        return [];
      } catch (error) {
        logger.error("❌ Error fetching music video projects:", error);
        return [];
      }
    },
    enabled: !!artistId
  });

  // Query para productos con auto-generación
  const { data: products = [] as Product[], refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["merchandise", userProfile?.pgId, artistId],
    queryFn: async () => {
      try {
        // Usar pgId si está disponible, sino artistId (que puede ser slug)
        const pgId = userProfile?.pgId;
        const slug = userProfile?.slug || artistId;
        
        logger.info(`🛍️ Fetching merchandise for artist:`, { pgId, slug, artistId });
        
        const merchRef = collection(db, "merchandise");
        let allProducts: any[] = [];
        
        // Buscar por múltiples identificadores para encontrar todos los productos
        // 1. Buscar por pgId (número)
        if (pgId) {
          const q1 = query(merchRef, where("userId", "==", pgId));
          const snap1 = await getDocs(q1);
          snap1.docs.forEach(doc => {
            if (!allProducts.find(p => p.id === doc.id)) {
              allProducts.push({ id: doc.id, ...doc.data() });
            }
          });
          logger.info(`📊 Found ${snap1.size} products by pgId: ${pgId}`);
          
          // También buscar por pgId como string
          const q1b = query(merchRef, where("userId", "==", String(pgId)));
          const snap1b = await getDocs(q1b);
          snap1b.docs.forEach(doc => {
            if (!allProducts.find(p => p.id === doc.id)) {
              allProducts.push({ id: doc.id, ...doc.data() });
            }
          });
          if (snap1b.size > 0) {
            logger.info(`📊 Found ${snap1b.size} additional products by pgId as string`);
          }
        }
        
        // 2. Buscar por slug (string)
        if (slug && slug !== String(pgId)) {
          const q2 = query(merchRef, where("userId", "==", slug));
          const snap2 = await getDocs(q2);
          snap2.docs.forEach(doc => {
            if (!allProducts.find(p => p.id === doc.id)) {
              allProducts.push({ id: doc.id, ...doc.data() });
            }
          });
          if (snap2.size > 0) {
            logger.info(`📊 Found ${snap2.size} products by slug: ${slug}`);
          }
        }
        
        // 3. Buscar por artistId original si es diferente
        if (artistId !== slug && artistId !== String(pgId)) {
          const q3 = query(merchRef, where("userId", "==", artistId));
          const snap3 = await getDocs(q3);
          snap3.docs.forEach(doc => {
            if (!allProducts.find(p => p.id === doc.id)) {
              allProducts.push({ id: doc.id, ...doc.data() });
            }
          });
          if (snap3.size > 0) {
            logger.info(`📊 Found ${snap3.size} products by artistId: ${artistId}`);
          }
        }
        
        // 4. Si no encontramos nada, buscar en generated_artists (productos generados por IA)
        if (allProducts.length === 0) {
          logger.info(`🔍 No products in merchandise collection, checking generated_artists...`);
          
          // Buscar el documento del artista en generated_artists usando firestoreId
          const firestoreId = userProfile?.firestoreId;
          if (firestoreId) {
            try {
              // Usar getDoc para obtener el documento directamente por ID
              const genArtistDocRef = doc(db, "generated_artists", firestoreId);
              const genArtistSnap = await getDoc(genArtistDocRef);
              
              if (genArtistSnap.exists()) {
                const artistData = genArtistSnap.data();
                if (artistData.merchandise && Array.isArray(artistData.merchandise)) {
                  logger.info(`📊 Found ${artistData.merchandise.length} products in generated_artists`);
                  
                  // Migrar productos a la colección merchandise y agregarlos a allProducts
                  for (const product of artistData.merchandise) {
                    const merchDoc = {
                      name: product.name,
                      description: `Official ${artistData.name || userProfile?.name} merchandise - ${product.type}`,
                      price: product.price,
                      imageUrl: product.imageUrl,
                      category: product.type === 'T-Shirt' || product.type === 'Hoodie' ? 'Apparel' : 
                                product.type === 'Cap' || product.type === 'Sticker Pack' ? 'Accessories' :
                                product.type === 'Poster' ? 'Art' : 'Music',
                      sizes: product.type === 'T-Shirt' || product.type === 'Hoodie' ? ['S', 'M', 'L', 'XL', 'XXL'] :
                             product.type === 'Cap' ? ['One Size'] :
                             product.type === 'Poster' ? ['18x24"', '24x36"'] :
                             product.type === 'Vinyl' ? ['12"'] : ['Standard'],
                      userId: pgId || artistId,
                      createdAt: new Date(),
                      generatedByAI: true
                    };
                    
                    // Guardar en colección merchandise para futuras consultas
                    const newDocRef = doc(collection(db, "merchandise"));
                    await setDoc(newDocRef, merchDoc);
                    allProducts.push({ id: newDocRef.id, ...merchDoc });
                    logger.info(`✅ Migrated product: ${product.name}`);
                  }
                  
                  logger.info(`✅ Migrated ${allProducts.length} products from generated_artists to merchandise`);
                }
              } else {
                logger.info(`⚠️ No generated_artists document found for firestoreId: ${firestoreId}`);
              }
            } catch (error) {
              logger.error('Error checking generated_artists:', error);
            }
          }
        }
        
        logger.info(`📊 Total unique products found: ${allProducts.length}`);
        
        // Log todos los productos encontrados
        if (allProducts.length > 0) {
          logger.info(`📦 Products found in Firestore:`);
          allProducts.forEach((product) => {
            logger.info(`  - Product ID: ${product.id}`, {
              name: product.name,
              userId: product.userId,
              hasImage: !!product.imageUrl,
              imageUrl: product.imageUrl?.substring(0, 80) + '...'
            });
          });
        } else {
          logger.info(`⚠️ No products found for artist`);
        }

        if (allProducts.length > 0) {
          // 🧹 LIMPIEZA: Eliminar productos duplicados y con imágenes incorrectas
          // Productos válidos tienen imágenes en 'merchandise-images/' no en 'artist-images/'
          const validProducts: typeof allProducts = [];
          const seenTypes = new Set<string>();
          const productsToDelete: string[] = [];
          
          for (const product of allProducts) {
            const productType = product.name?.split(' ').pop() || product.category || 'Unknown';
            const hasValidMerchImage = product.imageUrl?.includes('merchandise-imag') || 
                                        product.imageUrl?.includes('merchandise_') ||
                                        (product.generatedByAI === true && !product.imageUrl?.includes('artist-images'));
            const isArtistImage = product.imageUrl?.includes('artist-images/');
            const isUnsplashFallback = product.imageUrl?.includes('unsplash.com');
            
            // Mantener solo productos con imágenes válidas de merchandise (1 por tipo)
            if (!seenTypes.has(productType) && hasValidMerchImage && !isArtistImage && !isUnsplashFallback) {
              seenTypes.add(productType);
              validProducts.push(product);
            } else {
              // Marcar para eliminación si es duplicado o tiene imagen incorrecta
              productsToDelete.push(product.id);
            }
          }
          
          // Si hay productos inválidos, eliminarlos
          if (productsToDelete.length > 0 && validProducts.length >= 6) {
            logger.info(`🗑️ Cleaning up ${productsToDelete.length} invalid/duplicate products...`);
            // Eliminar en batches para no sobrecargar
            const batchSize = 10;
            for (let i = 0; i < productsToDelete.length; i += batchSize) {
              const batch = productsToDelete.slice(i, i + batchSize);
              await Promise.all(batch.map(id => deleteDoc(doc(db, "merchandise", id)).catch(() => {})));
            }
            logger.info(`✅ Cleaned up products, keeping ${validProducts.length} valid ones`);
            allProducts = validProducts;
          } else if (validProducts.length === 0 && allProducts.length > 6) {
            // Todos los productos tienen imágenes inválidas - eliminar y regenerar
            logger.info(`⚠️ All ${allProducts.length} products have invalid images - cleaning up...`);
            const batchSize = 10;
            for (let i = 0; i < allProducts.length; i += batchSize) {
              const batch = allProducts.slice(i, i + batchSize);
              await Promise.all(batch.map(p => deleteDoc(doc(db, "merchandise", p.id)).catch(() => {})));
            }
            logger.info(`✅ Deleted all invalid products, will regenerate`);
            allProducts = [];
          }
          
          // Verificar si los productos existentes tienen tallas (productos nuevos)
          const firstProduct = allProducts[0];
          const hasNewFormat = firstProduct?.sizes !== undefined;
          
          if (allProducts.length > 0 && hasNewFormat) {
            // Cargar productos actualizados con tallas - limitar a 6 productos
            const productsData = allProducts.slice(0, 6).map((product) => {
              logger.info('🛍️ Product data:', { id: product.id, name: product.name, price: product.price, sizes: product.sizes });
              return {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                imageUrl: product.imageUrl,
                category: product.category,
                sizes: product.sizes,
                userId: product.userId,
                createdAt: product.createdAt?.toDate ? product.createdAt.toDate() : product.createdAt,
              };
            });
            logger.info(`✅ Successfully loaded ${productsData.length} existing products with sizes`);
            return productsData;
          } else if (allProducts.length > 0 && !hasNewFormat) {
            // Productos viejos sin tallas - borrarlos y regenerar
            logger.info('🗑️ Deleting old products without sizes...');
            const deletePromises = allProducts.map(product => deleteDoc(doc(db, "merchandise", product.id)));
            await Promise.all(deletePromises);
            logger.info('✅ Old products deleted, will regenerate new ones');
            allProducts = []; // Clear to trigger regeneration
          }
        }

        // Si no hay productos, generar 6 automáticamente con imágenes únicas
        if (allProducts.length === 0) {
        const artistName = userProfile?.displayName || userProfile?.name || "Artist";
        const brandImage = userProfile?.profileImage || userProfile?.photoURL || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';
        
        // Usar pgId para guardar los productos (consistencia)
        const userIdForProducts = userProfile?.pgId || artistId;
        
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
            userId: userIdForProducts, // Usar pgId para consistencia
            createdAt: new Date(),
          };
          
          const newDocRef = doc(collection(db, "merchandise"));
          await setDoc(newDocRef, product);
          savedProducts.push({ ...product, id: newDocRef.id });
          logger.info(`✅ Product created: ${product.name} for userId: ${userIdForProducts}`);
        }

        logger.info(`🎉 Successfully created ${savedProducts.length} products`);
        return savedProducts;
        } // End of if (allProducts.length === 0)
        
        // Retornar productos existentes (nunca debería llegar aquí pero por seguridad)
        return allProducts;
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

  // Query para verificar si este artista está en my-artists del usuario actual
  // Este query se ejecuta independientemente de userProfile para ser más rápido
  // Usamos user.id > 0 en lugar de !!user.id porque id puede ser 0 temporalmente
  const { data: isInMyArtists, isLoading: isCheckingMyArtists } = useQuery({
    queryKey: ["isInMyArtists", artistId, user?.id],
    queryFn: async () => {
      logger.info('🔍 Executing isInMyArtists query for artistId:', artistId);
      try {
        const response = await fetch('/api/artist-generator/my-artists');
        if (response.ok) {
          const data = await response.json();
          
          // Comparar usando TODOS los identificadores posibles
          // artistId puede ser: slug, firestoreId, o pgId numérico
          const found = data.artists?.some((a: any) => {
            // Comparar por slug (URL)
            if (a.slug && a.slug === artistId) return true;
            // Comparar por firestoreId
            if (a.firestoreId && a.firestoreId === artistId) return true;
            // Comparar por id numérico
            if (a.id && String(a.id) === String(artistId)) return true;
            return false;
          });
          
          logger.info('🔍 isInMyArtists check:', {
            artistIdFromUrl: artistId,
            myArtistsCount: data.artists?.length,
            myArtistsSlugs: data.artists?.map((a: any) => a.slug),
            found
          });
          
          return found === true;
        }
        logger.warn('⚠️ my-artists response not ok:', response.status);
        return false;
      } catch (error) {
        logger.error('Error checking isInMyArtists:', error);
        return false;
      }
    },
    // Habilitar cuando hay un usuario autenticado (user existe, incluso si id es 0)
    enabled: !!user && !!artistId,
    staleTime: 5000, // Cache por 5 segundos
  });

  // Verificar si es perfil propio: SIMPLE Y PERMISIVO
  // ✅ Permite editar si: es creador del artista O propietario directo O está en my-artists
  // Mejorado para manejar el caso donde user.id puede ser 0 temporalmente
  const isOwnProfile = (() => {
    if (!user) return false;
    
    // ✅ PRIORIDAD 1: Si está en my-artists del usuario, es SU perfil y puede editarlo
    // Esto funciona para artistas generados por IA
    if (isInMyArtists === true) {
      logger.info('✅ isOwnProfile=true porque isInMyArtists=true');
      return true;
    }
    
    // Si user.id es 0 pero tenemos clerkId, intentar comparar con clerkId
    const userId = user.id > 0 ? user.id : null;
    const userClerkId = (user as any).clerkId;
    
    // Comparación por ID numérico de PostgreSQL
    if (userId && userProfile?.pgId && Number(userId) === Number(userProfile.pgId)) {
      return true;
    }
    
    // Comparación por generatedBy (artistas creados por este usuario)
    if (userId && userProfile?.generatedBy && Number(userProfile.generatedBy) === Number(userId)) {
      return true;
    }
    
    // Comparación por clerkId (si el artista tiene el mismo clerkId)
    if (userClerkId && (userProfile as any)?.clerkId && userClerkId === (userProfile as any).clerkId) {
      return true;
    }
    
    // Comparación por artistId en la URL vs userId
    if (userId && String(userId) === String(artistId)) {
      return true;
    }
    
    // Comparación por firestoreId
    if (userClerkId && userProfile?.uid && userClerkId === userProfile.uid) {
      return true;
    }
    
    return false;
  })();
  
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
      userProfileRole: userProfile?.role,
      userProfileIsAIGenerated: userProfile?.isAIGenerated,
      isInMyArtists,
      isOwnProfile,
      isCreator: userProfile?.generatedBy === user?.id,
      userAuthenticated: !!user,
      bannerImage: userProfile?.bannerImage,
      profileImage: userProfile?.profileImage,
      coverImage: userProfile?.coverImage
    });
  }, [user, artistId, userProfile, isOwnProfile, isInMyArtists]);

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
      // Ensure order is a valid array before setting
      const order = artist.profileLayout.order;
      setSectionOrder(Array.isArray(order) && order.length > 0 ? order : defaultOrder);
      
      // Ensure visibility is a valid object before setting
      const visibility = artist.profileLayout.visibility;
      setSectionVisibility(visibility && typeof visibility === 'object' && !Array.isArray(visibility) ? visibility : defaultVisibility);
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
      // Validate that audioUrl exists and is playable (not IPFS placeholder)
      if (!song.audioUrl || song.audioUrl.startsWith('ipfs://')) {
        toast({
          title: "Audio no disponible",
          description: "Esta canción es una versión tokenizada. El audio real se añadirá próximamente.",
        });
        return;
      }
      
      if (audioRef.current) {
        audioRef.current.src = song.audioUrl;
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
          toast({
            title: "Error de reproducción",
            description: "No se pudo reproducir este archivo de audio.",
            variant: "destructive"
          });
          setPlayingSongId(null);
        });
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

  // Función para generar canción con IA (FAL AI MiniMax)
  const handleGenerateAISong = async () => {
    // Título es opcional - si no se proporciona, el backend genera uno automáticamente

    setIsGeneratingAISong(true);
    try {
      const artistName = artist?.name || artist?.artistName || 'Artist';
      const genre = artist?.genre || artist?.genres?.[0] || 'pop';
      const firestoreArtistId = userProfile?.firestoreId || artistId;
      const artistBio = artist?.biography || artist?.bio || '';
      
      // Llamar al endpoint de generación de canciones
      // Si no hay título, el backend generará uno automáticamente
      const response = await fetch('/api/artist-generator/generate-single-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistName,
          songTitle: aiSongPrompt.trim() || '', // Permitir vacío - el backend generará título
          genre,
          mood: aiSongMood,
          artistId: firestoreArtistId,
          artistGender: artist?.gender || 'male',
          artistBio
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate song');
      }

      const result = await response.json();
      const generatedTitle = result.song?.title || aiSongPrompt || 'New Song';
      
      toast({
        title: "🎵 Song Generated!",
        description: `"${generatedTitle}" has been created with AI.`,
      });

      setAiSongPrompt('');
      setShowGenerateAISongDialog(false);
      refetchSongs();
    } catch (error) {
      logger.error("Error generating AI song:", error);
      toast({
        title: "Generation failed",
        description: "Could not generate the song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAISong(false);
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
  
  const merchCategories = ['Todo', 'Music', 'Videos', 'Shows'];
  const totalPlays = songs.reduce((acc, song) => {
    // Handle duration as string "M:SS" or number (seconds)
    if (typeof song.duration === 'string' && song.duration.includes(':')) {
      return acc + (parseInt(song.duration.split(':')[0] || '0') * 100);
    } else if (typeof song.duration === 'number') {
      return acc + (Math.floor(song.duration / 60) * 100);
    }
    return acc;
  }, 0);

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
                  <span className="text-xs font-semibold text-white/90 tracking-wide">Verified</span>
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
              Customize Your Style:
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
            
            {/* Tarjeta de Information de Artista */}
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
                    Verified
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
                        Virtual Artist
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
                          Customize Layout
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
                          Share Profile
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
                    Customize Layout del Perfil
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Reorder sections and enable/disable the ones you want to show
                  </DialogDescription>
                </DialogHeader>

                {/* Control Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={expandAll}
                      className="flex-1 text-xs"
                      style={{
                        backgroundColor: colors.hexPrimary,
                        color: 'white'
                      }}
                      data-testid="button-expand-all"
                    >
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Expand All
                    </Button>
                    <Button
                      size="sm"
                      onClick={collapseAll}
                      variant="outline"
                      className="flex-1 text-xs border-zinc-700"
                      data-testid="button-collapse-all"
                    >
                      <ChevronRight className="h-3 w-3 mr-1" />
                      Collapse All
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={activateAll}
                      className="flex-1 text-xs"
                      style={{
                        backgroundColor: colors.hexAccent,
                        color: 'black'
                      }}
                      data-testid="button-activate-all"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Activate All
                    </Button>
                    <Button
                      size="sm"
                      onClick={deactivateAll}
                      variant="outline"
                      className="flex-1 text-xs border-zinc-700"
                      data-testid="button-deactivate-all"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Deactivate All
                    </Button>
                  </div>
                </div>

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
                                    
                                    <div className="flex gap-2 ml-auto">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setSectionExpanded(prev => ({
                                            ...prev,
                                            [sectionId]: !prev[sectionId]
                                          }));
                                        }}
                                        className="gap-1"
                                        data-testid={`button-toggle-expand-${sectionId}`}
                                      >
                                        {sectionExpanded[sectionId] ? (
                                          <ChevronDown className="h-4 w-4 text-gray-400" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-gray-400" />
                                        )}
                                      </Button>
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
                                        data-testid={`button-toggle-visible-${sectionId}`}
                                      >
                                        {isVisible ? (
                                          <>
                                            <Eye className="h-4 w-4" style={{ color: colors.hexAccent }} />
                                            <span style={{ color: colors.hexAccent }}>Visible</span>
                                          </>
                                        ) : (
                                          <>
                                            <EyeOff className="h-4 w-4 text-gray-500" />
                                            <span className="text-gray-500">Hidden</span>
                                          </>
                                        )}
                                      </Button>
                                    </div>
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
                    Cancel
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
                    Save Layout
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
                    <h3 className="text-2xl font-bold text-white mb-2">Are you a musician?</h3>
                    <p className="text-gray-400">
                      Create your professional artist profile for free and reach more fans
                    </p>
                  </div>
                  <Link href="/auth">
                    <Button
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg gap-2 px-6 py-6 text-base font-bold rounded-full hover:scale-105 transition-all duration-300"
                      data-testid="button-cta-middle"
                    >
                      <Sparkles className="h-5 w-5" />
                      Create My Free Profile
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
                  <button
                    onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                    className="flex-1 text-left flex items-center gap-2 hover:opacity-80 transition-opacity"
                    data-testid={`button-toggle-section-${sectionId}`}
                  >
                    <div 
                      className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1" 
                      style={{ color: colors.hexAccent }}
                    >
                      {sectionExpanded[sectionId] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <Music className="h-5 w-5" />
                      {t('profile.sections.music')} ({songs.length})
                    </div>
                  </button>
                  {isOwnProfile && (
                    <div className="flex gap-2">
                      <Dialog open={showUploadSongDialog} onOpenChange={setShowUploadSongDialog}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="rounded-full"
                            style={{ backgroundColor: colors.hexPrimary, color: 'white' }}
                            data-testid="button-upload-song"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Upload Song
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload New Song</DialogTitle>
                          <DialogDescription>
                            Add a new song to your profile
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
                            Cancel
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Botón para generar canción con IA */}
                    <Button
                      size="sm"
                      className="rounded-full"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                        color: 'white' 
                      }}
                      onClick={() => setShowGenerateAISongDialog(true)}
                      data-testid="button-generate-ai-song"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generate AI
                    </Button>
                    
                    {/* Dialog para generar canción con IA */}
                    <Dialog open={showGenerateAISongDialog} onOpenChange={setShowGenerateAISongDialog}>
                      <DialogContent className="bg-gray-900 border-gray-800">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-white">
                            <Sparkles className="h-5 w-5" style={{ color: colors.hexAccent }} />
                            Generate AI Song
                          </DialogTitle>
                          <DialogDescription>
                            Create a unique song using FAL AI MiniMax with real vocals. 
                            Based on {artist?.artistName || artist?.name || 'Artist'}'s style ({artist?.genres?.[0] || 'pop'})
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="ai-song-title" className="text-white">
                              Song Title <span className="text-gray-500 text-sm font-normal">(optional)</span>
                            </Label>
                            <Input
                              id="ai-song-title"
                              value={aiSongPrompt}
                              onChange={(e) => setAiSongPrompt(e.target.value)}
                              placeholder="Leave empty for AI-generated title"
                              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                              disabled={isGeneratingAISong}
                            />
                            <p className="text-xs text-gray-500">
                              💡 If empty, AI will create a creative title based on the artist's genre and mood
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ai-song-mood" className="text-white">Mood / Style</Label>
                            <select
                              id="ai-song-mood"
                              value={aiSongMood}
                              onChange={(e) => setAiSongMood(e.target.value as any)}
                              className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-white"
                              disabled={isGeneratingAISong}
                            >
                              <option value="energetic">🔥 Energetic</option>
                              <option value="mellow">🌙 Mellow</option>
                              <option value="upbeat">🎉 Upbeat</option>
                              <option value="dark">🖤 Dark</option>
                              <option value="romantic">💕 Romantic</option>
                            </select>
                          </div>
                          
                          {isGeneratingAISong && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                                <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full" style={{ borderColor: colors.hexAccent, borderTopColor: 'transparent' }} />
                                <span>Generating song with AI... (~20-30 seconds)</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="h-2 rounded-full animate-pulse"
                                  style={{ 
                                    width: '100%',
                                    background: `linear-gradient(90deg, ${colors.hexPrimary}, ${colors.hexAccent})`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <DialogFooter className="gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowGenerateAISongDialog(false);
                              setAiSongPrompt('');
                            }}
                            disabled={isGeneratingAISong}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleGenerateAISong}
                            disabled={isGeneratingAISong}
                            style={{ 
                              background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                              color: 'white' 
                            }}
                          >
                            {isGeneratingAISong ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full mr-2" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                {aiSongPrompt.trim() ? 'Generate Song' : 'Generate Random Song'}
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    </div>
                  )}
                </div>
                
                {sectionExpanded[sectionId] && (
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
                        {/* Hit Score Bar - Indicador de potencial de hit */}
                        <div className="mt-2">
                          <HitScoreBar 
                            score={calculateHitScore({
                              plays: song.plays || Math.floor(Math.random() * 15000),
                              likes: song.likes || Math.floor(Math.random() * 2000),
                              shares: song.shares || Math.floor(Math.random() * 500),
                              mood: song.mood,
                              genre: song.genre,
                              createdAt: song.createdAt
                            })}
                            size="sm"
                            showLabel={true}
                            animated={true}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* Metadata Info Button */}
                        <button
                          className="p-1.5 md:p-2 rounded-full text-xs md:text-sm font-medium transition duration-300 hover:scale-110"
                          style={{ 
                            backgroundColor: 'transparent',
                            borderColor: colors.hexBorder,
                            borderWidth: '1px',
                            color: colors.hexAccent
                          }}
                          onClick={() => setSelectedSongForMetadata(song)}
                          data-testid={`button-metadata-${song.id}`}
                          title="View Metadata for Distribution"
                        >
                          <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </button>
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
                            <button
                              className="py-1.5 md:py-2 px-3 md:px-4 rounded-full text-xs md:text-sm font-medium transition duration-300 bg-gradient-to-r hover:opacity-80"
                              style={{ 
                                backgroundImage: `linear-gradient(to right, ${colors.hexPrimary}, ${colors.hexAccent})`,
                                color: 'white'
                              }}
                              onClick={() => {
                                const url = `/music-video-creator?artist=${encodeURIComponent(artist.name)}&artistId=${artist.pgId || artist.id}&song=${encodeURIComponent(song.name)}&songId=${song.id}${song.audioUrl ? `&audioUrl=${encodeURIComponent(song.audioUrl)}` : ''}${song.coverArt ? `&coverArt=${encodeURIComponent(song.coverArt)}` : ''}${artist.profileImage ? `&images=${encodeURIComponent(artist.profileImage)}` : ''}`;
                                console.log('🎬 [CREATE VIDEO] Navigating with URL:', url);
                                console.log('🎬 [CREATE VIDEO] Artist:', artist.name);
                                console.log('🎬 [CREATE VIDEO] Song:', song.name);
                                console.log('🎬 [CREATE VIDEO] Audio URL:', song.audioUrl);
                                window.location.href = url;
                              }}
                              data-testid={`button-create-video-${song.id}`}
                            >
                              <VideoIcon className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
                              <span className="hidden sm:inline">Create Video</span>
                              <span className="sm:hidden">Video</span>
                            </button>
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
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
                        );
                      } else if (sectionId === 'videos' && (videos.length > 0 || isOwnProfile)) {
                        sectionElement = (
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                    className="flex-1 text-left flex items-center gap-2 hover:opacity-80 transition-opacity"
                    data-testid={`button-toggle-section-${sectionId}`}
                  >
                    <div 
                      className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1" 
                      style={{ color: colors.hexAccent }}
                    >
                      {sectionExpanded[sectionId] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <VideoIcon className="h-5 w-5" />
                      {t('profile.sections.videos')} ({videos.length})
                    </div>
                  </button>
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
                            Cancel
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

                {/* AI Generated Music Videos Section */}
                {musicVideoProjects.length > 0 && (
                  <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.hexBorder }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.hexPrimary}20` }}>
                        <Sparkles className="h-4 w-4" style={{ color: colors.hexAccent }} />
                      </div>
                      <h3 className="font-semibold text-sm" style={{ color: colors.hexAccent }}>
                        AI Music Videos ({musicVideoProjects.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {musicVideoProjects.map((project, index) => (
                        <div
                          key={project.id}
                          className="rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/30 to-orange-900/30 hover:from-purple-900/50 hover:to-orange-900/50 transition-all duration-200 border"
                          style={{ borderColor: colors.hexBorder }}
                          data-testid={`card-ai-video-${index}`}
                        >
                          <div className="relative group">
                            {project.thumbnail ? (
                              <img
                                src={project.thumbnail}
                                alt={project.songName}
                                className="w-full h-36 sm:h-40 md:h-44 object-cover"
                              />
                            ) : project.finalVideoUrl ? (
                              <video
                                src={`${project.finalVideoUrl}#t=0.5`}
                                className="w-full h-36 sm:h-40 md:h-44 object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <div 
                                className="w-full h-36 sm:h-40 md:h-44 flex items-center justify-center"
                                style={{ backgroundColor: `${colors.hexPrimary}33` }}
                              >
                                <Film className="h-10 sm:h-12 w-10 sm:w-12" style={{ color: colors.hexAccent }} />
                              </div>
                            )}
                            {/* AI Badge */}
                            <div className="absolute top-2 left-2">
                              <span 
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1"
                                style={{ background: `linear-gradient(135deg, ${colors.hexPrimary}, #8B5CF6)` }}
                              >
                                <Bot className="h-3 w-3" />
                                AI Generated
                              </span>
                            </div>
                            {/* Play overlay */}
                            {project.finalVideoUrl && (
                              <a
                                href={project.finalVideoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              >
                                <div 
                                  className="w-16 h-16 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: colors.hexPrimary }}
                                >
                                  <Play className="h-8 w-8 text-white ml-1" fill="white" />
                                </div>
                              </a>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-white text-sm">{project.songName || 'Music Video'}</h3>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Created with Boostify AI
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
                        );
                      } else if (sectionId === 'news' && (newsArticles.length > 0 || isOwnProfile)) {
                        sectionElement = (
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                    className="flex-1 text-left flex items-center gap-2 hover:opacity-80 transition-opacity"
                    data-testid={`button-toggle-section-${sectionId}`}
                  >
                    <div 
                      className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1" 
                      style={{ color: colors.hexAccent }}
                    >
                      {sectionExpanded[sectionId] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <Newspaper className="h-5 w-5" />
                      News ({newsArticles.length})
                    </div>
                  </button>
                </div>

                {sectionExpanded[sectionId] && (
                  <>
                    {newsArticles.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No hay noticias disponibles aún</p>
                        {isOwnProfile && (
                          <p className="text-sm mt-2">
                            Usa el botón "Generar News con IA" en editar perfil
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
                  </>
                )}
              </div>
                        );
                      } else if (sectionId === 'social-hub') {
                        // Elemento circular con iconos de redes sociales
                        sectionElement = (
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <button
                onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                className="w-full text-left mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
                data-testid={`button-toggle-section-${sectionId}`}
              >
                <div className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1" style={{ color: colors.hexAccent }}>
                  {sectionExpanded[sectionId] ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <Share2 className="h-5 w-5" />
                  Social Media
                </div>
              </button>
              
              {sectionExpanded[sectionId] && (
                <>
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
              </>
              )}
            </div>
                        );
                      } else if (sectionId === 'social-posts') {
                        sectionElement = (
                          <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                            <button
                              onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                              className="w-full text-left mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
                              data-testid={`button-toggle-section-${sectionId}`}
                            >
                              <div className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1" style={{ color: colors.hexAccent }}>
                                {sectionExpanded[sectionId] ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                                <Share2 className="h-5 w-5" />
                                Posts Social Media
                              </div>
                            </button>
                            {sectionExpanded[sectionId] && (
                              <SocialPostsDisplay userId={artist.pgId} />
                            )}
                          </div>
                        );
                      } else if (sectionId === 'tokenization' && isOwnProfile) {
                        sectionElement = (
                          <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                            <button
                              onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                              className="w-full text-left mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
                              data-testid={`button-toggle-section-${sectionId}`}
                            >
                              <div className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1" style={{ color: colors.hexAccent }}>
                                {sectionExpanded[sectionId] ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                                <Coins className="h-5 w-5" />
                                Song Tokenization
                              </div>
                            </button>
                            {sectionExpanded[sectionId] && (
                              <TokenizationPanel 
                                artistId={artist.pgId}
                                artistName={artist.name}
                                artistImage={artist.profileImage}
                              />
                            )}
                          </div>
                        );
                      } else if (sectionId === 'merchandise' && (products.length > 0 || isOwnProfile)) {
                        sectionElement = (
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                    className="flex-1 text-left flex items-center gap-2 hover:opacity-80 transition-opacity"
                    data-testid={`button-toggle-section-${sectionId}`}
                  >
                    <div 
                      className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1"
                      style={{ color: colors.hexAccent }}
                    >
                      {sectionExpanded[sectionId] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <ShoppingBag className="h-5 w-5" />
                      Official Store ({products.length})
                    </div>
                  </button>
                </div>

                {/* Nota de colaboración */}
                {sectionExpanded[sectionId] && (
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
                          Boostify x Artist Collaboration
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ 
                            background: `linear-gradient(135deg, ${colors.hexPrimary}, ${colors.hexAccent})`,
                            color: 'white'
                          }}
                        >
                          30% for you
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                        These products are an exclusive collaboration between <strong style={{ color: colors.hexAccent }}>Boostify</strong> y <strong style={{ color: colors.hexAccent }}>{artist.name}</strong>. 
                        <span className="block mt-1">
                          <strong className="text-white">Artists earn 30%</strong> of each sale, no upfront investment or inventory. We handle production, shipping and customer service.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Mensaje de Disponibilidad - Enero 2025 */}
                {sectionExpanded[sectionId] && (
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
                          🚀 Coming Soon - January 2025
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500 text-black"
                        >
                          PRE-ORDER
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                        <strong className="text-yellow-400">The official store will be available from January 2025.</strong> The products shown are a preview and <strong className="text-white">final prices may vary</strong>. 
                        <span className="block mt-1.5 text-gray-400">
                          We are preparing an exceptional shopping experience with high-quality products for your fans.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {sectionExpanded[sectionId] && (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {products.slice(0, 10).map((product, index) => (
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
                {isOwnProfile && sectionExpanded[sectionId] && (
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
                      Access advanced tools to boost your sales
                    </p>
                  </div>
                )}
              </div>
                        );
                      } else if (sectionId === 'galleries') {
                        sectionElement = (
                          <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                            <button
                              onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                              className="w-full text-left mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
                              data-testid={`button-toggle-section-${sectionId}`}
                            >
                              <div className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1" style={{ color: colors.hexAccent }}>
                                {sectionExpanded[sectionId] ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                                <Image className="h-5 w-5" />
                                Galleries de Imágenes
                              </div>
                            </button>
                            {sectionExpanded[sectionId] && (
                              <ImageGalleryDisplay 
                                artistId={artistId}
                                pgId={artist.pgId}
                                isOwner={!!isOwnProfile}
                                refreshKey={galleriesRefreshKey}
                              />
                            )}
                          </div>
                        );
                      } else if (sectionId === 'monetize-cta') {
                        sectionElement = (
                          <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px', position: 'relative', overflow: 'hidden' }}>
                            <button
                              onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                              className="w-full text-left mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
                              data-testid={`button-toggle-section-${sectionId}`}
                            >
                              <div className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1" style={{ color: colors.hexAccent }}>
                                {sectionExpanded[sectionId] ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                                <Sparkles className="h-5 w-5" />
                                Monetize Your Talent
                              </div>
                            </button>
                            {sectionExpanded[sectionId] && (
                              <>
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
                                  Mixing
                                </span>
                                <span className="flex items-center gap-1">
                                  <Check className="h-3 w-3" style={{ color: colors.hexAccent }} />
                                  Master
                                </span>
                              </div>
                            </div>
                              </>
                            )}
                          </div>
                        );
                      } else if (sectionId === 'analytics') {
                        const analyticsData = {
                          totalPlays: songs.reduce((sum, song) => sum + (song.plays || 0), 0),
                          totalViews: videos.reduce((sum, video) => sum + (video.views || 0), 0)
                        };
                        
                        sectionElement = (
                          <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                            <button
                              onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                              className="w-full text-left mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
                              data-testid={`button-toggle-section-${sectionId}`}
                            >
                              <div className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1" style={{ color: colors.hexAccent }}>
                                {sectionExpanded[sectionId] ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                                <TrendingUp className="h-5 w-5" />
                                {t('profile.analytics.title')}
                              </div>
                            </button>
                            {sectionExpanded[sectionId] && (
                            
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
                            )}
                          </div>
                        );
                      } else if (sectionId === 'earnings' && isOwnProfile) {
                        sectionElement = (
                          <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                            <button
                              onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                              className="w-full text-left mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
                              data-testid={`button-toggle-section-${sectionId}`}
                            >
                              <div className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1" style={{ color: colors.hexAccent }}>
                                {sectionExpanded[sectionId] ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                                <DollarSign className="h-5 w-5" />
                                Earnings
                              </div>
                            </button>

                            {sectionExpanded[sectionId] && (
                              <EarningsChart userId={user.id} days={30} />
                            )}
                          </div>
                        );
                      } else if (sectionId === 'crowdfunding' && isOwnProfile) {
                        sectionElement = (
                          <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                            <button
                              onClick={() => setSectionExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))}
                              className="w-full text-left mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
                              data-testid={`button-toggle-section-${sectionId}`}
                            >
                              <div className="text-base font-semibold transition-colors duration-500 flex items-center gap-2 flex-1" style={{ color: colors.hexAccent }}>
                                {sectionExpanded[sectionId] ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                                <Target className="h-5 w-5" />
                                Crowdfunding Campaign
                              </div>
                            </button>

                            {sectionExpanded[sectionId] && (
                              <CrowdfundingPanel colors={colors} />
                            )}
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
                        Premium Physical Cards
                      </h3>
                      <p className="text-sm text-gray-400">
                        Print your Artist Card on high-quality plastic
                      </p>
                    </div>
                  </div>

                  {/* Detalles del producto */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.hexAccent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Premium PVC plastic (same as bank cards)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.hexAccent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Full-color printing with glossy or matte finish</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.hexAccent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Integrated QR code to easily share your profile</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.hexAccent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Standard credit card size (85.6 × 53.98 mm)</span>
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
                          Order Your Physical Cards
                        </span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Coming Soon!</DialogTitle>
                        <DialogDescription className="text-base">
                          We are working on the ordering system to bring you the highest quality physical cards.
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
                          <h4 className="font-bold text-white mb-2">What's Included?</h4>
                          <ul className="space-y-2 text-sm text-gray-300">
                            <li>• Packages from 50 to 1000+ cards</li>
                            <li>• International shipping available</li>
                            <li>• Special pricing for large orders</li>
                            <li>• Custom design included</li>
                          </ul>
                        </div>
                        <div 
                          className="p-4 rounded-lg border"
                          style={{ borderColor: colors.hexBorder }}
                        >
                          <p className="text-sm text-gray-400">
                            <strong className="text-white">Note:</strong> Physical cards are perfect for events, shows, networking and promoting your music brand. Share your digital profile in a professional and memorable way.
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm" style={{ color: colors.hexAccent }}>
                            📧 Interested? Contact us at <strong>cards@boostify.com</strong>
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </motion.div>
            )}

            {/* Tarjeta de Estadísticas con Gráficos */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div 
                className="text-base font-semibold mb-4 transition-colors duration-500" 
                style={{ color: colors.hexAccent }}
              >
                Profile Statistics
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
                  <div className="text-[10px] sm:text-xs text-gray-400">Followers</div>
                </motion.div>
              </div>

              {/* Gráfico de Progreso Radial */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-300">Completion Level</div>
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


            {/* Image Galleries */}
            <ImageGalleryDisplay 
              artistId={artistId}
              pgId={artist.pgId}
              isOwner={!!isOwnProfile}
              refreshKey={galleriesRefreshKey}
            />

            {/* Tarjeta CTA: Monetize Your Talent - Visible para todos */}
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
                    Mixing
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" style={{ color: colors.hexAccent }} />
                    Master
                  </span>
                </div>
              </div>
            </div>

            {/* Public View: Tokenized Music */}
            <TokenizedMusicView artistId={artistId} />

            {/* Tarjeta de Information */}
            <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
              <div 
                className="text-base font-semibold mb-3 transition-colors duration-500" 
                style={{ color: colors.hexAccent }}
              >
                Information
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

            {/* Tarjeta de Social Media */}
            {(artist.instagram || artist.twitter || artist.youtube) && (
              <div className={cardStyles} style={{ borderColor: colors.hexBorder, borderWidth: '1px' }}>
                <div 
                  className="text-base font-semibold mb-3 transition-colors duration-500" 
                  style={{ color: colors.hexAccent }}
                >
                  Social Media
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
                        View Channel
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
                      <span className="font-semibold">Open on Spotify</span>
                    </a>
                  </div>
                </div>
                
                {/* Mensaje de ayuda para móviles */}
                <div className="mt-2 text-xs text-gray-400 text-center md:hidden">
                  Si no ves el reproductor, usa el botón "Open on Spotify"
                </div>
              </div>
            )}
            
            {/* DEBUG: Mostrar si Spotify debería estar visible */}
            {artist.spotify && !getSpotifyEmbedUrl(artist.spotify) && (
              <div className={cardStyles} style={{ borderColor: 'red', borderWidth: '2px' }}>
                <div className="text-red-500 font-bold">⚠️ DEBUG: Invalid Spotify URL</div>
                <div className="text-sm text-gray-400 mt-2">
                  URL: {artist.spotify}
                </div>
              </div>
            )}
            
            {!artist.spotify && (
              <div className={cardStyles} style={{ borderColor: 'yellow', borderWidth: '2px' }}>
                <div className="text-yellow-500 font-bold">⚠️ DEBUG: No Spotify URL added</div>
                <div className="text-sm text-gray-400 mt-2">
                  Add your Spotify URL in "Edit Profile"
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

                  {/* Industry Contacts & Outreach */}
                  <Link href="/contacts">
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
                          <Globe className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-opacity-90 transition-colors">
                            Industry Outreach
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Connect with labels, publishers & sync opportunities
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
              Cancel
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
        isOwner={!!isOwnProfile}
        onEdit={handleEditNews}
        onDelete={handleDeleteNews}
        onRegenerate={handleRegenerateNews}
      />

      {/* Song Metadata Modal for Distribution */}
      {selectedSongForMetadata && (
        <SongMetadataModal
          song={selectedSongForMetadata}
          artistName={artist?.name || artist?.artistName || userProfile?.displayName || 'Artist'}
          artistImages={[
            artist?.profileImage || userProfile?.profileImage || userProfile?.photoURL,
            artist?.bannerImage || userProfile?.bannerImage,
          ].filter(Boolean) as string[]}
          colors={colors}
          isOpen={!!selectedSongForMetadata}
          onClose={() => setSelectedSongForMetadata(null)}
          onSongUpdate={() => refetchSongs()}
        />
      )}
    </div>
  );
}
