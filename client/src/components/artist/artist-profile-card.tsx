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
  Youtube,
  ShoppingBag,
  Ticket,
  MessageCircle,
  Share2,
  Calendar,
  HeartPulse,
  Users,
  DollarSign
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
import { Link } from "wouter";

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
  upcomingShows: [
    {
      id: 1,
      date: "2024-03-15",
      venue: "The Grand Hall",
      city: "Los Angeles, CA",
      ticketUrl: "#"
    },
    {
      id: 2,
      date: "2024-04-01",
      venue: "Sunset Arena",
      city: "San Francisco, CA",
      ticketUrl: "#"
    }
  ],
  merchandise: [
    {
      id: 1,
      name: "Limited Edition Vinyl",
      price: 29.99,
      image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&auto=format&fit=crop&q=60",
      description: "Exclusive double vinyl with special artwork and signed insert",
      inStock: true,
      category: "Music",
      url: "#"
    },
    {
      id: 2,
      name: "Tour T-Shirt 2024",
      price: 24.99,
      image: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=800&auto=format&fit=crop&q=60",
      description: "100% cotton premium quality tour shirt with unique design",
      inStock: true,
      category: "Apparel",
      sizes: ["S", "M", "L", "XL"],
      url: "#"
    },
    {
      id: 3,
      name: "Signed Poster Collection",
      price: 19.99,
      image: "https://images.unsplash.com/photo-1509347436349-7f96c36f4537?w=800&auto=format&fit=crop&q=60",
      description: "Set of 3 high-quality art prints, hand-signed",
      inStock: true,
      category: "Art",
      url: "#"
    }
  ],
  newRelease: {
    title: "Electric Dreams - New Single",
    releaseDate: "2024-03-01",
    coverArt: "https://placehold.co/500x500",
    preOrderUrl: "#"
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
  const [showMessageDialog, setShowMessageDialog] = useState(false);

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
      {/* Promotional CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4 z-20"
      >
        <Link href="/auth">
          <Button
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <User className="mr-2 h-5 w-5" />
            Create Your Artist Profile
          </Button>
        </Link>
      </motion.div>

      {/* Featured Video Section */}
      <div className="relative h-[90vh] w-screen -mx-[calc(50vw-50%)] overflow-hidden mb-8">
        <iframe
          className="absolute inset-0 w-full h-full object-cover"
          src="https://www.youtube.com/embed/O90iHkU3cPU?autoplay=1&mute=1&loop=1&playlist=O90iHkU3cPU&controls=0&showinfo=0&rel=0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
        {/* Multiple gradient layers for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent" />

        {/* Artist Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <motion.div
            variants={itemVariants}
            className="max-w-4xl mx-auto"
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-300 to-yellow-500"
              variants={itemVariants}
            >
              {mockArtist.name}
            </motion.h1>
            <motion.p
              className="text-2xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400"
              variants={itemVariants}
            >
              {mockArtist.genre}
            </motion.p>
            <div className="prose prose-invert max-w-2xl mb-8">
              {mockArtist.biography.split('\n').map((paragraph, index) => (
                <motion.p
                  key={index}
                  className="text-lg text-white/90 leading-relaxed"
                  variants={itemVariants}
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
            <motion.div
              className="flex flex-wrap gap-4"
              variants={itemVariants}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setShowMessageDialog(true)}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact Me
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share Profile
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Stats */}
        <motion.div
          className="absolute top-8 right-8 flex gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="bg-black/40 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3"
            variants={itemVariants}
          >
            <HeartPulse className="h-6 w-6 text-orange-500" />
            <div>
              <p className="text-sm text-white/70">Monthly Listeners</p>
              <p className="text-xl font-bold text-white">{mockArtist.stats.monthlyListeners}k</p>
            </div>
          </motion.div>
          <motion.div
            className="bg-black/40 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3"
            variants={itemVariants}
          >
            <Users className="h-6 w-6 text-orange-500" />
            <div>
              <p className="text-sm text-white/70">Followers</p>
              <p className="text-xl font-bold text-white">{mockArtist.stats.followers}k</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* New Release Promo with enhanced styling */}
      <Card className="p-8 mb-8 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20">
        <motion.div variants={itemVariants} className="flex items-center gap-8">
          <div className="relative group">
            <img
              src={mockArtist.newRelease.coverArt}
              alt={mockArtist.newRelease.title}
              className="w-48 h-48 rounded-lg shadow-lg transition-transform group-hover:scale-105 duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <div className="absolute bottom-4 left-4">
                <Play className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500">
              {mockArtist.newRelease.title}
            </h3>
            <p className="text-lg text-muted-foreground mb-4">
              Coming {new Date(mockArtist.newRelease.releaseDate).toLocaleDateString()}
            </p>
            <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300">
              <Music2 className="mr-2 h-5 w-5" />
              Pre-order Now
            </Button>
          </div>
        </motion.div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
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

          {/* Upcoming Shows */}
          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-orange-500" />
                Upcoming Shows
              </h3>
              <div className="space-y-4">
                {mockArtist.upcomingShows.map((show) => (
                  <div
                    key={show.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{show.venue}</p>
                      <p className="text-sm text-muted-foreground">{show.city}</p>
                      <p className="text-sm text-orange-500">
                        {new Date(show.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => window.open(show.ticketUrl, '_blank')}
                    >
                      <Ticket className="mr-2 h-4 w-4" />
                      Get Tickets
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          </Card>

          {/* Merchandise */}
          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <ShoppingBag className="w-6 h-6 mr-2 text-orange-500" />
                Official Merchandise
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockArtist.merchandise.map((item) => (
                  <motion.div
                    key={item.id}
                    className="group relative rounded-lg overflow-hidden bg-gradient-to-br from-orange-500/5 to-transparent"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="aspect-square overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="space-y-2">
                            <p className="text-white font-medium text-lg">{item.name}</p>
                            <p className="text-orange-400 font-bold text-xl">${item.price.toFixed(2)}</p>
                            <p className="text-white/80 text-sm line-clamp-2">{item.description}</p>
                            {item.sizes && (
                              <div className="flex gap-2 mt-2">
                                {item.sizes.map((size) => (
                                  <span key={size} className="px-2 py-1 text-xs bg-white/10 rounded-md text-white/90">
                                    {size}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                className="flex-1 bg-orange-500 hover:bg-orange-600"
                                onClick={() => window.open(item.url, '_blank')}
                              >
                                Buy Now
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-orange-500/50 hover:bg-orange-500/20"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-500">{item.category}</span>
                        {item.inStock ? (
                          <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">In Stock</span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-red-500/10 text-red-500 rounded-full">Out of Stock</span>
                        )}
                      </div>
                      <h4 className="font-semibold truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                    </div>
                  </motion.div>
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

          {/* Social Media */}
          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <Share2 className="w-6 h-6 mr-2 text-orange-500" />
                Connect & Follow
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="w-full bg-[#E1306C] hover:bg-[#C13584]"
                  onClick={() => window.open(mockArtist.socialMedia.instagram, '_blank')}
                >
                  <Instagram className="mr-2 h-5 w-5" />
                  Instagram
                </Button>
                <Button
                  className="w-full bg-[#1DA1F2] hover:bg-[#1A91DA]"
                  onClick={() => window.open(mockArtist.socialMedia.twitter, '_blank')}
                >
                  <Twitter className="mr-2 h-5 w-5" />
                  Twitter
                </Button>
                <Button
                  className="w-full bg-[#FF0000] hover:bg-[#CC0000]"
                  onClick={() => window.open(mockArtist.socialMedia.youtube, '_blank')}
                >
                  <Youtube className="mr-2 h-5 w-5" />
                  YouTube
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                  onClick={() => setShowMessageDialog(true)}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Message
                </Button>
              </div>
            </motion.div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <User className="w-6 h-6 mr-2 text-orange-500" />
                Contact
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
        </div>
      </div>

      {/* Add Affiliate Program Section at the bottom */}
      <Card className="p-8 mt-8 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20">
        <motion.div variants={itemVariants} className="text-center">
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500">
            Become a Boostify Affiliate
          </h2>
          <p className="text-xl text-muted-foreground mb-6">
            Promote artists and earn money with Boostify's affiliate program
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-lg bg-black/5 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Refer Artists</h3>
              <p className="text-muted-foreground">Share your unique referral link with other artists</p>
            </div>
            <div className="p-6 rounded-lg bg-black/5 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Earn Commission</h3>
              <p className="text-muted-foreground">Get paid for every successful referral</p>
            </div>
            <div className="p-6 rounded-lg bg-black/5 backdrop-blur-sm">
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <ChartBar className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Performance</h3>
              <p className="text-muted-foreground">Monitor your earnings and referrals in real-time</p>
            </div>
          </div>
          <Link href="/auth">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <DollarSign className="mr-2 h-5 w-5" />
              Join Affiliate Program
            </Button>
          </Link>
        </motion.div>
      </Card>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message to {mockArtist.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <textarea
                className="col-span-4 h-32 p-2 rounded-md border"
                placeholder="Write your message here..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="ghost" onClick={() => setShowMessageDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600">
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}