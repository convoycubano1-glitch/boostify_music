import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Clock, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

interface MusicSectionProps {
  songs: Song[];
  isLoading: boolean;
  currentTrack: number;
  isPlaying: boolean;
  togglePlay: (song: Song, index: number) => void;
}

export function MusicSection({ 
  songs, 
  isLoading, 
  currentTrack, 
  isPlaying, 
  togglePlay 
}: MusicSectionProps) {
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
      <div className="mt-6 grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-black/20">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[70%]" />
              <Skeleton className="h-3 w-[40%]" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <Card className="bg-gradient-to-b from-black/40 to-black/20 border-orange-500/10 mt-6">
        <CardContent className="p-8 text-center">
          <Music className="w-12 h-12 mx-auto text-orange-500/50 mb-4" />
          <h3 className="text-xl font-semibold text-white/90 mb-2">No hay canciones</h3>
          <p className="text-white/60 max-w-md mx-auto">
            Este artista aún no ha subido canciones a su perfil.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div className="mt-6 grid gap-4">
      {songs.map((song, index) => (
        <motion.div
          key={song.id}
          variants={itemVariants}
          className={`
            flex items-center gap-4 p-3 rounded-lg transition-all duration-200
            ${currentTrack === index && isPlaying 
              ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/5 border border-orange-500/30' 
              : 'hover:bg-black/30 bg-black/20 border border-transparent'
            }
          `}
        >
          <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-orange-500/10 relative">
            <img
              src={song.coverArt || '/assets/freepik__boostify_music_organe_abstract_icon.png'}
              alt={song.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{song.name || song.title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-orange-300 border-orange-500/20">
                <Clock className="w-3 h-3 mr-1" />
                {song.duration || '3:45'}
              </Badge>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => togglePlay(song, index)}
            className={`rounded-full transition-transform duration-300 ${
              currentTrack === index && isPlaying
                ? "bg-orange-500 text-white hover:bg-orange-600 scale-105"
                : "hover:bg-orange-500/10"
            }`}
          >
            {currentTrack === index && isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}