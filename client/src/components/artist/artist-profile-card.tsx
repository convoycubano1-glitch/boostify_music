import { useState } from "react";
import { motion } from "framer-motion";
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
  MapPin,
  Mail,
  Phone,
  Globe,
  Instagram,
  Twitter,
  Youtube
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ArtistProfileProps {
  artistId: string;
}

const mockArtist = {
  name: "Sarah Anderson",
  biography: "A groundbreaking artist who seamlessly blends electronic and acoustic elements.\n\nWith over a decade of experience in the music industry, Sarah has developed a unique sound that resonates with audiences worldwide. Her innovative approach to music production and compelling live performances have earned her a dedicated following.",
  genre: "Electronic/Pop/Alternative",
  location: "Los Angeles, CA",
  email: "contact@sarahanderson.com",
  phone: "+1 (310) 555-0123",
  website: "https://sarahanderson.com",
  socialMedia: {
    instagram: "https://instagram.com/sarahanderson",
    twitter: "https://twitter.com/sarahanderson",
    youtube: "https://youtube.com/sarahanderson"
  },
  stats: {
    monthlyListeners: 250,
    followers: 15,
    views: 1
  },
  technicalRider: {
    stage: "Minimum stage size: 24x16 feet\nDrums riser: 8x8 feet, height 1 foot\nKeyboard riser: 6x8 feet, height 1 foot",
    sound: "Professional PA system with subwoofers\n4 monitor speakers\n32 channel digital mixing console\nWireless microphone system",
    lighting: "Full lighting rig with DMX control\nLED wash lights\nMoving head spots\nHaze machine",
    backline: "Drum kit (DW or Pearl)\nTwo guitar amps (Fender Twin Reverb)\nBass amp (Ampeg)\nKeyboard stand\nAll necessary microphones and DI boxes"
  }
};

const mockSongs = [
  {
    id: "1",
    name: "Electric Dreams",
    duration: "3:45",
    audioUrl: "/assets/sample-track-1.mp3"
  },
  {
    id: "2",
    name: "Midnight Echo",
    duration: "4:12",
    audioUrl: "/assets/sample-track-2.mp3"
  },
  {
    id: "3",
    name: "Neon Lights",
    duration: "3:58",
    audioUrl: "/assets/sample-track-3.mp3"
  }
];

const mockVideos = [
  {
    id: "1",
    title: "Live at Sunset Festival",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    id: "2",
    title: "Studio Session - New Album",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    id: "3",
    title: "Behind the Scenes",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
];

export function ArtistProfileCard({ artistId }: ArtistProfileProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showTechnicalRider, setShowTechnicalRider] = useState(false);

  // Handle audio playback
  const togglePlay = (song: typeof mockSongs[0], index: number) => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
    }

    if (song.audioUrl) {
      const audio = new Audio(song.audioUrl);
      audio.play();
      setCurrentAudio(audio);
      setCurrentTrack(index);
      setIsPlaying(true);
    }
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto"
    >
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
            {mockArtist.name}
          </motion.h1>
          <motion.p 
            className="text-xl text-white/90 max-w-2xl"
            variants={itemVariants}
          >
            {mockArtist.genre}
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
                {mockSongs.map((song, index) => (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      currentTrack === index ? 'bg-orange-500/10' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePlay(song, index)}
                        className="mr-2"
                      >
                        {currentTrack === index && isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>
                      <span className="font-medium">{song.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {song.duration}
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
                {mockVideos.map((video) => (
                  <div
                    key={video.id}
                    className="relative rounded-lg overflow-hidden group cursor-pointer"
                    onClick={() => window.open(video.url, '_blank')}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full aspect-video object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80">
                      <p className="text-sm text-white truncate">{video.title}</p>
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
                    text={`${mockArtist.stats.monthlyListeners}k`}
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
                    text={`${mockArtist.stats.followers}k`}
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
                    text={`${mockArtist.stats.views}M`}
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
                <DialogTitle>Technical Rider - {mockArtist.name}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] mt-4">
                <div className="space-y-6 p-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Stage Requirements</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{mockArtist.technicalRider.stage}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Sound System</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{mockArtist.technicalRider.sound}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Lighting</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{mockArtist.technicalRider.lighting}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Backline</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{mockArtist.technicalRider.backline}</p>
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
                  <span>{mockArtist.location}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-orange-500 mr-3" />
                  <span>{mockArtist.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-orange-500 mr-3" />
                  <span>{mockArtist.phone}</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-5 h-5 text-orange-500 mr-3" />
                  <a href={mockArtist.website} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500">
                    {mockArtist.website}
                  </a>
                </div>
                <div className="flex gap-4 mt-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-orange-500"
                    onClick={() => window.open(mockArtist.socialMedia.instagram, '_blank')}
                  >
                    <Instagram className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-orange-500"
                    onClick={() => window.open(mockArtist.socialMedia.twitter, '_blank')}
                  >
                    <Twitter className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-orange-500"
                    onClick={() => window.open(mockArtist.socialMedia.youtube, '_blank')}
                  >
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
            {mockArtist.biography.split('\n').map((paragraph, index) => (
              <p key={index} className="text-muted-foreground">{paragraph}</p>
            ))}
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
}