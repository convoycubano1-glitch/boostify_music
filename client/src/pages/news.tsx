import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Header } from "../components/layout/header";
import { Activity, Clock, Eye, MessageSquare, ThumbsUp, RefreshCw, Filter, TrendingUp, HashIcon } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { fetchMusicIndustryNews, type NewsArticle } from "../lib/news-service";
import { format } from "date-fns";
import { useState } from "react";
import { Badge } from "../components/ui/badge";

const COLORS = ['#f97316', '#ea580c', '#c2410c', '#9a3412'];

const categoryData = [
  { name: 'Industry News', value: 35 },
  { name: 'Artist Updates', value: 25 },
  { name: 'Technology', value: 20 },
  { name: 'Events', value: 20 },
];

const platformEngagement = [
  { platform: 'Twitter', engagement: 4500 },
  { platform: 'Facebook', engagement: 3200 },
  { platform: 'Instagram', engagement: 5800 },
  { platform: 'LinkedIn', engagement: 2100 },
];

export default function NewsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: news = [], refetch } = useQuery({
    queryKey: ['music-industry-news'],
    queryFn: fetchMusicIndustryNews,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const categories = ['Industry News', 'Artist Updates', 'Technology', 'Events'];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6 pt-20"> {/* Increased top padding */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Industry News Hub
              </h1>
              <p className="text-muted-foreground mt-2">
                Stay updated with the latest music industry trends and updates
              </p>
            </div>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Category Filters */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-orange-500" />
              <h3 className="font-semibold">Filter by Category</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer hover:bg-orange-500/20"
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">News Distribution</h3>
                <p className="text-sm text-muted-foreground">
                  Content distribution by category
                </p>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Engagement Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track how your audience interacts with industry news
                </p>
              </div>
              <div className="h-[300px]">
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

            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Platform Engagement</h3>
                <p className="text-sm text-muted-foreground">
                  Social media engagement distribution
                </p>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformEngagement}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="platform" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="engagement" fill="hsl(24, 95%, 53%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Trending Topics */}
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h3 className="text-xl font-semibold">Trending Topics</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['#AIMusic', '#VirtualConcerts', '#MusicTech', '#StreamingWars', '#NFTMusic', '#MetaverseMusic'].map((topic) => (
                <div key={topic} className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-3 py-1.5 rounded-full">
                  <HashIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{topic}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* News Feed */}
          <div className="grid gap-6">
            {news.map((article: NewsArticle, index: number) => (
              <Card key={index} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <img
                        src={article.urlToImage || 'https://source.unsplash.com/random/800x600/?music'}
                        alt={article.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-orange-500 transition-colors"
                      >
                        {article.title}
                      </a>
                    </h3>
                    <p className="text-muted-foreground mb-4">{article.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(article.publishedAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {Math.floor(Math.random() * 1000) + 100} views
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {Math.floor(Math.random() * 50) + 5} comments
                      </div>
                      <div>
                        Source: {article.source.name}
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