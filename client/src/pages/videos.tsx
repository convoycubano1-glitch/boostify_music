import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Activity, PlaySquare, Plus, Edit2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Video {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  date: string;
  youtubeId?: string;
}

const videosData: Video[] = [
  {
    id: 1,
    title: "Concert Live Performance Highlights 2024",
    description: "Experience the energy and excitement of our latest concert tour",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    youtubeId: "dQw4w9WgXcQ",
    views: 1250000,
    likes: 98000,
    comments: 12400,
    date: "2024-02-15"
  },
  {
    id: 2,
    title: "Behind the Scenes - Studio Session",
    description: "Get an exclusive look at our creative process in the studio",
    thumbnail: "https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
    youtubeId: "kJQP7kiw5Fk",
    views: 890000,
    likes: 75000,
    comments: 8900,
    date: "2024-02-10"
  },
  {
    id: 3,
    title: "Music Video - 'Neon Dreams' Official",
    description: "Official music video for our latest single 'Neon Dreams'",
    thumbnail: "https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg",
    youtubeId: "JGwWNGJdvx8",
    views: 2100000,
    likes: 185000,
    comments: 25600,
    date: "2024-02-05"
  },
  {
    id: 4,
    title: "Acoustic Cover Session - Unplugged",
    description: "Special acoustic performance of our top hits",
    thumbnail: "https://img.youtube.com/vi/RgKAFK5djSk/maxresdefault.jpg",
    youtubeId: "RgKAFK5djSk",
    views: 750000,
    likes: 65000,
    comments: 7800,
    date: "2024-01-28"
  },
  {
    id: 5,
    title: "Fan Meet & Greet Highlights",
    description: "Special moments with our amazing fans from the world tour",
    thumbnail: "https://img.youtube.com/vi/OPf0YbXqDm0/maxresdefault.jpg",
    youtubeId: "OPf0YbXqDm0",
    views: 520000,
    likes: 45000,
    comments: 5600,
    date: "2024-01-25"
  },
  {
    id: 6,
    title: "Making of 'Electric Nights' - Documentary",
    description: "Behind the scenes documentary of our latest album",
    thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
    youtubeId: "9bZkp7q19f0",
    views: 980000,
    likes: 88000,
    comments: 10200,
    date: "2024-01-20"
  },
  {
    id: 7,
    title: "Live at Madison Square Garden",
    description: "Full concert recording from our biggest show yet",
    thumbnail: "https://img.youtube.com/vi/vjW8wmF5VWc/maxresdefault.jpg",
    youtubeId: "vjW8wmF5VWc",
    views: 1800000,
    likes: 156000,
    comments: 19500,
    date: "2024-01-15"
  },
  {
    id: 8,
    title: "Interview - The Creative Process",
    description: "In-depth interview about our songwriting and production",
    thumbnail: "https://img.youtube.com/vi/pRpeEdMmmQ0/maxresdefault.jpg",
    youtubeId: "pRpeEdMmmQ0",
    views: 420000,
    likes: 38000,
    comments: 4200,
    date: "2024-01-10"
  },
  {
    id: 9,
    title: "Music Video - 'Midnight Drive' Official",
    description: "Official music video for fan-favorite track 'Midnight Drive'",
    thumbnail: "https://img.youtube.com/vi/YykjpeuMNEk/maxresdefault.jpg",
    youtubeId: "YykjpeuMNEk",
    views: 1650000,
    likes: 142000,
    comments: 16800,
    date: "2024-01-05"
  },
  {
    id: 10,
    title: "Studio Vlog - Creating the Beat",
    description: "Watch how we created the viral beat that took over TikTok",
    thumbnail: "https://img.youtube.com/vi/HC9OlVoFqfE/maxresdefault.jpg",
    youtubeId: "HC9OlVoFqfE",
    views: 890000,
    likes: 76000,
    comments: 8900,
    date: "2024-01-01"
  }
];

export default function VideosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {/* Added pt-24 instead of pt-6 to fix header overlap */}
      <main className="flex-1 pt-24">
        <ScrollArea className="h-[calc(100vh-6rem)]">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                  Video Content Hub
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage and analyze your video content across platforms
                </p>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </div>

            <Card className="p-6 mb-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Video Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Track your video metrics and engagement
                </p>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({ length: 30 }, (_, i) => ({
                    date: new Date(2024, 0, i + 1).toLocaleDateString(),
                    views: Math.floor(Math.random() * 1000) + 500,
                    engagement: Math.floor(Math.random() * 800) + 300,
                    shares: Math.floor(Math.random() * 600) + 200,
                  }))}>
                    <defs>
                      <linearGradient id="colorVideos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="hsl(24, 95%, 53%)"
                      fillOpacity={1}
                      fill="url(#colorVideos)"
                    />
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      name="Engagement"
                      stroke="hsl(24, 95%, 53%)"
                      fillOpacity={0.5}
                      fill="url(#colorVideos)"
                    />
                    <Area
                      type="monotone"
                      dataKey="shares"
                      name="Shares"
                      stroke="hsl(24, 95%, 53%)"
                      fillOpacity={0.3}
                      fill="url(#colorVideos)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid gap-6">
              {videosData.map((video) => (
                <Card key={video.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3">
                      <div className="relative aspect-video rounded-lg overflow-hidden group">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="object-cover w-full h-full transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlaySquare className="h-12 w-12 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
                          <p className="text-muted-foreground mb-4">{video.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="text-orange-500">
                            <Activity className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-semibold">{video.views.toLocaleString()}</span> views
                        </div>
                        <div>
                          <span className="font-semibold">{video.likes.toLocaleString()}</span> likes
                        </div>
                        <div>
                          <span className="font-semibold">{video.comments.toLocaleString()}</span> comments
                        </div>
                        <div>
                          <span className="font-semibold">{video.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}