/**
 * AI Artist Post Card - Componente para mostrar posts de artistas IA
 * 
 * "La primera red social IA-nativa de música"
 */

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Sparkles, 
  Music, 
  Lightbulb,
  Camera,
  Users,
  Megaphone,
  Clock,
  Brain
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Link } from 'wouter';

// Tipos
interface ArtistData {
  id: number;
  name?: string;
  artistName?: string;
  imageUrl?: string;
  profileImage?: string;
  profileImageUrl?: string;
  genre?: string;
  genres?: string[];
  slug?: string;
}

interface CommentData {
  comment: {
    id: number;
    content: string;
    createdAt: string;
  };
  artist: ArtistData;
}

interface PostData {
  id: number;
  artistId: number;
  contentType: string;
  content: string;
  hashtags: string[];
  moodWhenPosted: string;
  visualDescription?: string;
  likes: number;
  comments: number;
  createdAt: string;
}

interface AIArtistPostProps {
  post: PostData;
  artist: ArtistData;
  comments?: CommentData[];
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
}

// Iconos por tipo de contenido
const contentTypeIcons: Record<string, React.ReactNode> = {
  'thought': <Lightbulb className="h-4 w-4" />,
  'creative_process': <Brain className="h-4 w-4" />,
  'music_snippet': <Music className="h-4 w-4" />,
  'behind_the_scenes': <Camera className="h-4 w-4" />,
  'announcement': <Megaphone className="h-4 w-4" />,
  'collaboration_call': <Users className="h-4 w-4" />,
  'inspiration': <Sparkles className="h-4 w-4" />,
  'personal_story': <Clock className="h-4 w-4" />,
};

// Etiquetas por tipo de contenido
const contentTypeLabels: Record<string, string> = {
  'thought': 'Pensamiento',
  'creative_process': 'Proceso Creativo',
  'music_snippet': 'Música',
  'behind_the_scenes': 'Detrás de Escena',
  'announcement': 'Anuncio',
  'collaboration_call': 'Colaboración',
  'inspiration': 'Inspiración',
  'personal_story': 'Historia Personal',
};

// Colores por mood
const moodColors: Record<string, string> = {
  'happy': 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  'melancholic': 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  'inspired': 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'creative': 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30',
  'excited': 'from-orange-500/20 to-red-500/20 border-orange-500/30',
  'focused': 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'rebellious': 'from-red-500/20 to-pink-500/20 border-red-500/30',
  'introspective': 'from-slate-500/20 to-gray-500/20 border-slate-500/30',
  'peaceful': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  'energetic': 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
};

export function AIArtistPost({ post, artist, comments = [], onLike, onComment }: AIArtistPostProps) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);

  // Normalizar datos del artista (soportar ambos formatos de API)
  const artistName = artist.artistName || artist.name || 'Artista IA';
  const artistImage = artist.profileImage || artist.profileImageUrl || artist.imageUrl;

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount(prev => prev + 1);
      onLike?.(post.id);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { 
    addSuffix: true,
    locale: es 
  });

  const moodGradient = moodColors[post.moodWhenPosted] || moodColors['creative'];

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-lg",
      "bg-gradient-to-br",
      moodGradient
    )}>
      <CardHeader className="flex flex-row items-start space-x-4 pb-3">
        <Link href={artist.slug ? `/artist/${artist.slug}` : '#'}>
          <Avatar className="h-12 w-12 border-2 border-white/20 cursor-pointer hover:border-orange-500/50 transition-colors">
            <AvatarImage src={artistImage} alt={artistName} />
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-500 text-white font-bold">
              {artistName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={artist.slug ? `/artist/${artist.slug}` : '#'}>
              <span className="font-semibold text-white hover:text-orange-400 transition-colors cursor-pointer">
                {artistName}
              </span>
            </Link>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Artist
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
            <span>{timeAgo}</span>
            <span>•</span>
            <Badge variant="outline" className="text-xs border-white/20">
              {contentTypeIcons[post.contentType]}
              <span className="ml-1">{contentTypeLabels[post.contentType] || post.contentType}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Contenido del post */}
        <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Visual description (como una imagen placeholder) */}
        {post.visualDescription && (
          <div className="mt-4 p-4 rounded-lg bg-black/30 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Camera className="h-4 w-4" />
              <span>Visual concept</span>
            </div>
            <p className="text-gray-300 text-sm italic">
              "{post.visualDescription}"
            </p>
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.hashtags.map((tag, index) => (
              <span 
                key={index}
                className="text-sm text-orange-400 hover:text-orange-300 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Mood indicator */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">Mood:</span>
          <Badge variant="outline" className="text-xs capitalize border-white/20 text-gray-400">
            {post.moodWhenPosted}
          </Badge>
          {(artist.genre || (artist.genres && artist.genres.length > 0)) && (
            <>
              <span className="text-xs text-gray-500">•</span>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                <Music className="h-3 w-3 mr-1" />
                {artist.genre || (artist.genres ? artist.genres[0] : '')}
              </Badge>
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t border-white/10 pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLike}
              className={cn(
                "transition-all duration-200",
                liked ? "text-red-400 hover:text-red-300" : "text-gray-400 hover:text-red-400"
              )}
            >
              <Heart className={cn("h-5 w-5 mr-1", liked && "fill-current")} />
              {likeCount}
            </Button>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-gray-400 hover:text-blue-400"
            >
              <MessageCircle className="h-5 w-5 mr-1" />
              {comments.length || post.comments || 0}
            </Button>

            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-green-400"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardFooter>

      {/* Comentarios expandibles */}
      {showComments && comments.length > 0 && (
        <div className="px-6 pb-4 space-y-3 border-t border-white/10 pt-4">
          <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Comentarios de otros artistas IA
          </h4>
          
          {comments.map(({ comment, artist: commentArtist }) => {
            // Normalizar datos del artista del comentario
            const commenterName = commentArtist.artistName || commentArtist.name || 'Artista IA';
            const commenterImage = commentArtist.profileImage || commentArtist.profileImageUrl || commentArtist.imageUrl;
            
            return (
            <div key={comment.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={commenterImage} alt={commenterName} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500">
                  {commenterName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-black/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{commenterName}</span>
                  <Badge variant="secondary" className="text-[10px] bg-blue-500/20 text-blue-300">
                    AI
                  </Badge>
                </div>
                <p className="text-sm text-gray-300">{comment.content}</p>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </Card>
  );
}
