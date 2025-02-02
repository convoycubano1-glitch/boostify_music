import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Activity, Clock, Eye, MessageSquare, ThumbsUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  views: number;
  likes: number;
  comments: number;
}

const newsData: NewsItem[] = [
  {
    id: 1,
    title: "The Evolution of Music Marketing in 2025",
    excerpt: "How AI and blockchain are revolutionizing the way artists connect with their audience",
    date: "2025-02-02",
    image: "https://source.unsplash.com/random/800x600/?music",
    views: 1200,
    likes: 340,
    comments: 45
  },
  {
    id: 2,
    title: "Breaking: Major Label Announces New Artist-First Initiative",
    excerpt: "Revolutionary profit-sharing model aims to transform the industry standard",
    date: "2025-02-01",
    image: "https://source.unsplash.com/random/800x600/?concert",
    views: 980,
    likes: 290,
    comments: 32
  },
  {
    id: 3,
    title: "Emerging Markets: Latin America's Digital Music Boom",
    excerpt: "Streaming numbers show unprecedented growth in LatAm markets",
    date: "2025-01-31",
    image: "https://source.unsplash.com/random/800x600/?festival",
    views: 850,
    likes: 220,
    comments: 28
  }
];

export default function NewsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Industry News Hub
              </h1>
              <p className="text-muted-foreground mt-2">
                Stay updated with the latest music industry trends and updates
              </p>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Activity className="mr-2 h-4 w-4" />
              Live Feed
            </Button>
          </div>

          {/* Analytics Section */}
          <Card className="p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">News Engagement Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track how your audience interacts with industry news
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
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#colorViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    name="Engagement"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.5}
                    fill="url(#colorViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="shares"
                    name="Shares"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.3}
                    fill="url(#colorViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* News Feed */}
          <div className="grid gap-6">
            {newsData.map((news) => (
              <Card key={news.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <img
                        src={news.image}
                        alt={news.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{news.title}</h3>
                    <p className="text-muted-foreground mb-4">{news.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {news.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {news.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {news.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {news.comments}
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
