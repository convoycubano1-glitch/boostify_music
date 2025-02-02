import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Activity, Plus, Eye, MessageSquare, ThumbsUp, Clock } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
}

const blogData: BlogPost[] = [
  {
    id: 1,
    title: "The Future of Music Marketing in 2025",
    excerpt: "Exploring innovative strategies for music promotion in the digital age",
    content: "Lorem ipsum dolor sit amet...",
    image: "https://source.unsplash.com/random/800x600/?music-marketing",
    author: "John Smith",
    date: "2025-02-01",
    views: 2500,
    likes: 180,
    comments: 45,
    tags: ["Marketing", "Digital", "Strategy"]
  },
  {
    id: 2,
    title: "Building Your Artist Brand",
    excerpt: "Essential tips for creating a strong and memorable artist brand",
    content: "Lorem ipsum dolor sit amet...",
    image: "https://source.unsplash.com/random/800x600/?artist-branding",
    author: "Sarah Johnson",
    date: "2025-01-28",
    views: 1800,
    likes: 150,
    comments: 32,
    tags: ["Branding", "Identity", "Marketing"]
  },
  {
    id: 3,
    title: "Maximizing Social Media Impact",
    excerpt: "Leveraging social platforms for music promotion",
    content: "Lorem ipsum dolor sit amet...",
    image: "https://source.unsplash.com/random/800x600/?social-media",
    author: "Mike Wilson",
    date: "2025-01-25",
    views: 2100,
    likes: 165,
    comments: 38,
    tags: ["Social Media", "Engagement", "Growth"]
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Blog & Content Hub
              </h1>
              <p className="text-muted-foreground mt-2">
                Share your insights and connect with your audience
              </p>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>

          <Card className="p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Content Performance</h3>
              <p className="text-sm text-muted-foreground">
                Track your blog metrics and engagement
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
                    <linearGradient id="colorBlog" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#colorBlog)"
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    name="Engagement"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.5}
                    fill="url(#colorBlog)"
                  />
                  <Area
                    type="monotone"
                    dataKey="shares"
                    name="Shares"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.3}
                    fill="url(#colorBlog)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6">
            {blogData.map((post) => (
              <Card key={post.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                        <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded-full text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline">Edit</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {post.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {post.comments}
                      </div>
                      <div className="text-orange-500">
                        By {post.author}
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
