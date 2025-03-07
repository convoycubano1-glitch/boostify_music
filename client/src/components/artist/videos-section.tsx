import React from 'react';
import { motion } from 'framer-motion';
import { Play, Eye, ThumbsUp, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

interface VideosSectionProps {
  videos: Video[];
  isLoading: boolean;
}

/**
 * Extrae el ID de un video de YouTube de una URL
 */
const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  // Patrones posibles de URLs de YouTube
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

export function VideosSection({ videos, isLoading }: VideosSectionProps) {
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  if (isLoading) {
    return (
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-5 w-[80%]" />
              <Skeleton className="h-4 w-[60%]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <Card className="bg-gradient-to-b from-black/40 to-black/20 border-orange-500/10 mt-6">
        <CardContent className="p-8 text-center">
          <Video className="w-12 h-12 mx-auto text-orange-500/50 mb-4" />
          <h3 className="text-xl font-semibold text-white/90 mb-2">No hay videos</h3>
          <p className="text-white/60 max-w-md mx-auto">
            Este artista aún no ha subido videos a su perfil.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {videos.map((video) => {
        const videoId = getYoutubeVideoId(video.url);
        const thumbnailUrl = video.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '/assets/freepik__boostify_music_video_placeholder.png');
        
        return (
          <motion.div
            key={video.id}
            variants={itemVariants}
            className="group rounded-lg overflow-hidden bg-black/20 border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300"
          >
            <div className="relative aspect-video bg-gradient-to-br from-orange-800/20 to-black/40 overflow-hidden">
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-500/90 hover:bg-orange-600 text-white rounded-full w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                onClick={() => window.open(video.url, '_blank')}
              >
                <Play className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-white mb-2 line-clamp-2">{video.title}</h3>
              
              <div className="flex items-center gap-3 text-xs text-white/70">
                <Badge variant="secondary" className="bg-orange-500/10 hover:bg-orange-500/20">
                  <Eye className="w-3 h-3 mr-1" />
                  {video.views?.toLocaleString() || '0'} views
                </Badge>
                
                <Badge variant="secondary" className="bg-orange-500/10 hover:bg-orange-500/20">
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  {video.likes?.toLocaleString() || '0'}
                </Badge>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}