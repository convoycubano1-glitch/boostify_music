import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { 
  Video,
  Music2,
  BarChart2,
  DollarSign,
  Users,
  Plus,
  PlayCircle,
  Mic2,
  Link as LinkIcon,
  Upload
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ArtistDashboardPage() {
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVideoSubmit = () => {
    // Here we would handle saving the video URL
    console.log("Saving video URL:", videoUrl);
    setIsVideoDialogOpen(false);
    setVideoUrl("");
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const audioUrl = URL.createObjectURL(file);
      if (currentAudio) {
        currentAudio.pause();
        URL.revokeObjectURL(currentAudio.src);
      }
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Artist Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your content, strategy, and growth
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* My Videos Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Video className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">My Videos</h2>
                    <p className="text-sm text-muted-foreground">Manage your video content</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <PlayCircle className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Latest Upload</p>
                        <p className="text-sm text-muted-foreground">Music Video - Summer Vibes</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                  <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Video
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Video</DialogTitle>
                        <DialogDescription>
                          Add your YouTube video link below
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="video-url">YouTube URL</Label>
                          <div className="flex gap-2">
                            <Input
                              id="video-url"
                              placeholder="https://youtube.com/watch?v=..."
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        {videoUrl && (
                          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${videoUrl.split("v=")[1]}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}
                        <Button onClick={handleVideoSubmit} className="w-full">
                          Save Video
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            </motion.div>

            {/* My Songs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Music2 className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">My Songs</h2>
                    <p className="text-sm text-muted-foreground">Track your music portfolio</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mic2 className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Latest Release</p>
                        <p className="text-sm text-muted-foreground">Summer Vibes - Single</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={togglePlay}
                    >
                      {isPlaying ? "Pause" : "Play"}
                    </Button>
                  </div>
                  <Dialog open={isSongDialogOpen} onOpenChange={setIsSongDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Song
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Song</DialogTitle>
                        <DialogDescription>
                          Upload your MP3 or WAV file
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="song-file">Audio File (MP3/WAV)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="song-file"
                              type="file"
                              accept=".mp3,.wav"
                              onChange={handleAudioUpload}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        {currentAudio && (
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={togglePlay}
                                  className="h-8 w-8 p-0"
                                >
                                  {isPlaying ? (
                                    <span className="sr-only">Pause</span>
                                  ) : (
                                    <span className="sr-only">Play</span>
                                  )}
                                  {isPlaying ? "⏸️" : "▶️"}
                                </Button>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium leading-none">
                                    Preview
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {currentAudio.src.split("/").pop()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <Button className="w-full">Upload Song</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            </motion.div>

            {/* Rest of the sections remain unchanged */}
            {/* My Strategy Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <BarChart2 className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">My Strategy</h2>
                    <p className="text-sm text-muted-foreground">Plan your growth</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Current Focus</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Increase social media presence</li>
                      <li>• Launch new EP campaign</li>
                      <li>• Collaborate with other artists</li>
                    </ul>
                  </div>
                  <Button className="w-full">Update Strategy</Button>
                </div>
              </Card>
            </motion.div>

            {/* My Budget Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">My Budget</h2>
                    <p className="text-sm text-muted-foreground">Track your finances</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Monthly Budget</p>
                      <p className="text-lg font-semibold">$2,500</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="text-lg font-semibold">$1,200</p>
                    </div>
                  </div>
                  <Button className="w-full">Manage Budget</Button>
                </div>
              </Card>
            </motion.div>

            {/* My Contacts Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">My Contacts</h2>
                    <p className="text-sm text-muted-foreground">Manage your network</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Recent Contacts</p>
                      <span className="text-sm text-muted-foreground">Total: 24</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        • Sarah Johnson - Producer
                      </div>
                      <div className="text-sm text-muted-foreground">
                        • Mike Smith - Studio Manager
                      </div>
                    </div>
                  </div>
                  <Link href="/contacts">
                    <Button className="w-full">View All Contacts</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}