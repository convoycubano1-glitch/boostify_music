import { motion } from "framer-motion";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  Music2,
  Video,
  FileText,
  ChartBar,
  User,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Share2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ArtistProfileProps {
  artistId: string;
  isFloating?: boolean;
}

interface ArtistData {
  name: string;
  biography: string;
  genre: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  socialMedia: {
    instagram: string;
    twitter: string;
    youtube: string;
  };
  stats: {
    monthlyListeners: number;
    followers: number;
    views: number;
  };
  technicalRider: {
    stage: string;
    sound: string;
    lighting: string;
    backline: string;
  };
  music: Array<{
    id: string;
    title: string;
    duration: string;
    url: string;
  }>;
  videos: Array<{
    id: string;
    title: string;
    thumbnail: string;
    url: string;
  }>;
}

interface ShareOptions {
  platform: 'twitter' | 'facebook' | 'linkedin';
  url: string;
  title: string;
}

export function ArtistProfileCard({ artistId, isFloating = false }: ArtistProfileProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);

  const { data: artist, isLoading } = useQuery<ArtistData>({
    queryKey: ['artist', artistId],
    queryFn: async () => {
      const response = await fetch(`/api/artists/${artistId}`);
      if (!response.ok) throw new Error('Failed to fetch artist data');
      return response.json();
    }
  });

  const handleShare = ({ platform, url, title }: ShareOptions) => {
    let shareUrl = '';
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  const content = (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto"
    >
      {/* Add share button at the top right */}
      <div className="absolute top-4 right-4 z-10">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => {
            const url = `${window.location.origin}/artist/${artistId}`;
            handleShare({
              platform: 'twitter',
              url,
              title: `Check out ${artist?.name}'s profile!`
            });
          }}
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative h-[50vh] rounded-xl overflow-hidden mb-8">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/assets/artist-background.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            variants={itemVariants}
          >
            {artist.name}
          </motion.h1>
          <motion.p 
            className="text-xl text-white/90 max-w-2xl"
            variants={itemVariants}
          >
            {artist.genre}
          </motion.p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Music Player */}
          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <Music2 className="w-6 h-6 mr-2 text-orange-500" />
                Latest Tracks
              </h3>
              <div className="space-y-4">
                {artist.music.map((track, index) => (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      currentTrack === index ? 'bg-orange-500/10' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentTrack(index);
                          setIsPlaying(!isPlaying);
                        }}
                        className="mr-2"
                      >
                        {currentTrack === index && isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>
                      <span className="font-medium">{track.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {track.duration}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </Card>

          {/* Video Gallery */}
          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <Video className="w-6 h-6 mr-2 text-orange-500" />
                Videos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {artist.videos.map((video) => (
                  <div
                    key={video.id}
                    className="relative rounded-lg overflow-hidden group cursor-pointer"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full aspect-video object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Statistics */}
          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <ChartBar className="w-6 h-6 mr-2 text-orange-500" />
                Statistics
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="w-24 h-24 mx-auto">
                  <CircularProgressbar
                    value={75}
                    text={`${artist.stats.monthlyListeners}k`}
                    styles={buildStyles({
                      pathColor: '#f97316',
                      textColor: '#f97316',
                      trailColor: '#fed7aa'
                    })}
                  />
                  <p className="text-center mt-2 text-sm text-muted-foreground">
                    Monthly Listeners
                  </p>
                </div>
                <div className="w-24 h-24 mx-auto">
                  <CircularProgressbar
                    value={85}
                    text={`${artist.stats.followers}k`}
                    styles={buildStyles({
                      pathColor: '#f97316',
                      textColor: '#f97316',
                      trailColor: '#fed7aa'
                    })}
                  />
                  <p className="text-center mt-2 text-sm text-muted-foreground">
                    Followers
                  </p>
                </div>
                <div className="w-24 h-24 mx-auto">
                  <CircularProgressbar
                    value={60}
                    text={`${artist.stats.views}M`}
                    styles={buildStyles({
                      pathColor: '#f97316',
                      textColor: '#f97316',
                      trailColor: '#fed7aa'
                    })}
                  />
                  <p className="text-center mt-2 text-sm text-muted-foreground">
                    Video Views
                  </p>
                </div>
              </div>
            </motion.div>
          </Card>

          {/* Technical Rider */}
          <Dialog>
            <DialogTrigger asChild>
              <Card className="p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                <motion.div variants={itemVariants}>
                  <h3 className="text-2xl font-semibold mb-4 flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-orange-500" />
                    Technical Rider
                  </h3>
                  <p className="text-muted-foreground">
                    View complete technical specifications and requirements
                  </p>
                </motion.div>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Technical Rider - {artist.name}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] mt-4">
                <div className="space-y-6 p-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Stage Requirements</h4>
                    <p className="text-muted-foreground">{artist.technicalRider.stage}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Sound System</h4>
                    <p className="text-muted-foreground">{artist.technicalRider.sound}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Lighting</h4>
                    <p className="text-muted-foreground">{artist.technicalRider.lighting}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Backline</h4>
                    <p className="text-muted-foreground">{artist.technicalRider.backline}</p>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Contact Information */}
          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <User className="w-6 h-6 mr-2 text-orange-500" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-orange-500 mr-3" />
                  <span>{artist.location}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-orange-500 mr-3" />
                  <span>{artist.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-orange-500 mr-3" />
                  <span>{artist.phone}</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-5 h-5 text-orange-500 mr-3" />
                  <span>{artist.website}</span>
                </div>
                <div className="flex gap-4 mt-4">
                  <Button variant="ghost" size="icon" className="hover:text-orange-500">
                    <Instagram className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-orange-500">
                    <Twitter className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-orange-500">
                    <Youtube className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </Card>
        </div>
      </div>

      {/* Biography Section */}
      <Card className="p-8 mt-8">
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-semibold mb-6">Biography</h3>
          <div className="prose prose-orange max-w-none">
            {artist.biography.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );

  // If isFloating is true, wrap content in Dialog
  if (isFloating) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-orange-500 hover:bg-orange-600">
            View Artist Profile
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Artist Profile</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise return content directly
  return content;
}