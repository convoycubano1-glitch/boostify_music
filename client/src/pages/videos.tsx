import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Activity, PlaySquare, Plus } from "lucide-react";
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
}

const videosData: Video[] = [
  {
    id: 1,
    title: "New Single - Behind the Scenes",
    description: "Get an exclusive look at the making of our latest hit",
    thumbnail: "https://source.unsplash.com/random/800x600/?recording-studio",
    views: 15000,
    likes: 1200,
    comments: 300,
    date: "2025-02-01"
  },
  {
    id: 2,
    title: "Live Performance Highlights",
    description: "Best moments from our recent concert tour",
    thumbnail: "https://source.unsplash.com/random/800x600/?concert",
    views: 25000,
    likes: 2100,
    comments: 450,
    date: "2025-01-28"
  },
  {
    id: 3,
    title: "Fan Meet & Greet Session",
    description: "Special moments with our amazing fans",
    thumbnail: "https://source.unsplash.com/random/800x600/?fans",
    views: 12000,
    likes: 980,
    comments: 230,
    date: "2025-01-25"
  }
];

export default function VideosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
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
              <Card key={video.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
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
                      <Button variant="outline">Edit</Button>
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
    </div>
  );
}
