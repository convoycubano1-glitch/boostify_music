import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Search, Share2, Image, FileText, Instagram, Twitter, Facebook, Sparkles, Save, Trash2, Copy, Check, Music, RssIcon, Newspaper } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db, storage } from "@/firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  promotionalContent?: string;
  hashtags?: string[];
  category: string;
  keywords: string[];
  status: 'pending' | 'published' | 'archived';
  createdAt: Date;
  publishedAt?: Date;
}

interface GeneratedContent {
  promotional: string;
  hashtags: string[];
  imageUrl?: string;
}

// Mock data for initial display
const MOCK_NEWS_ITEMS: Omit<NewsItem, 'id'>[] = [
  {
    title: "Grammy-Winning Producer Launches New Masterclass Series",
    summary: "Top producer shares industry secrets in exclusive online masterclass series focused on advanced production techniques.",
    content: "Grammy-winning producer Mark Johnson has announced the launch of a comprehensive masterclass series designed for aspiring music producers. The series will cover everything from advanced mixing techniques to creating unique sounds and navigating the music business. \"I wanted to create something that I wish I had when I was starting out,\" Johnson said. The masterclass includes over 15 hours of video content, downloadable project files, and a private community for students.",
    source: "Music Production Monthly",
    sourceUrl: "https://example.com/news/grammy-producer-masterclass",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
    category: "education",
    keywords: ["production", "masterclass", "grammy", "education"],
    status: "pending",
    createdAt: new Date(),
  },
  {
    title: "New AI Tool Revolutionizes Music Mastering Process",
    summary: "Revolutionary AI-powered platform allows independent artists to achieve professional mastering at a fraction of traditional costs.",
    content: "A startup called SoundPerfect has launched an AI-driven mastering tool that promises studio-quality results at an affordable price point. The technology, which has been trained on thousands of professionally mastered tracks, analyzes the audio characteristics of a song and applies appropriate processing to enhance its sound quality. Early reviews from independent artists suggest the results rival those of professional mastering engineers. The service offers various pricing tiers, including a free option for basic mastering.",
    source: "Tech Music News",
    sourceUrl: "https://example.com/news/ai-mastering-tool",
    imageUrl: "https://images.unsplash.com/photo-1558584673-c834fb1cc3ca",
    category: "technology",
    keywords: ["AI", "mastering", "technology", "independent artists"],
    status: "pending",
    createdAt: new Date(),
  },
  {
    title: "Major Music Streaming Platform Increases Royalty Rates for Artists",
    summary: "Leading streaming service announces new payment structure that could significantly increase income for independent musicians.",
    content: "In a move that has been welcomed by the independent music community, StreamifyMusic has announced a revised royalty payment structure that will increase payments to artists by an estimated 15-20%. The new model will particularly benefit artists with dedicated fan bases who listen to their music repeatedly. This change comes after years of criticism about the low payments typically received by artists from streaming platforms. Indie artist collectives have responded positively, calling it \"a step in the right direction\" while noting that further improvements are still needed for sustainable careers.",
    source: "Digital Music News",
    sourceUrl: "https://example.com/news/streaming-royalty-increase",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    category: "industry",
    keywords: ["streaming", "royalties", "independent artists", "income"],
    status: "pending",
    createdAt: new Date(),
  }
];

export default function MusicNewsPlugin() {
  const { toast } = useToast();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [loadingProcess, setLoadingProcess] = useState<string | null>(null);
  
  // List of news sources that could be used for real implementation
  const newsSources = [
    { name: "Billboard", url: "https://www.billboard.com/", apiAvailable: true },
    { name: "Rolling Stone", url: "https://www.rollingstone.com/", apiAvailable: true },
    { name: "Pitchfork", url: "https://pitchfork.com/", apiAvailable: true },
    { name: "Music Business Worldwide", url: "https://www.musicbusinessworldwide.com/", apiAvailable: false },
    { name: "NME", url: "https://www.nme.com/", apiAvailable: true },
    { name: "Consequence of Sound", url: "https://consequenceofsound.net/", apiAvailable: false },
  ];

  // List of keywords for searching news
  const popularKeywords = [
    "music production", "new release", "industry trends", "streaming", "indie artist", 
    "music education", "music technology", "AI music", "producer", "masterclass",
    "grammy", "songwriting", "distribution", "promotion", "artist development"
  ];

  useEffect(() => {
    const fetchNewsItems = async () => {
      try {
        // In a real implementation, this would fetch from Firestore
        // For now, we'll use the mock data
        setNewsItems(MOCK_NEWS_ITEMS.map((item, index) => ({
          ...item,
          id: `mock-${index}`
        })));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching news items:', error);
        toast({
          title: "Error",
          description: "Failed to load news items",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    fetchNewsItems();
  }, [toast]);

  const fetchLatestNews = async () => {
    setRefreshing(true);
    setLoadingProcess("Connecting to news APIs...");
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLoadingProcess("Processing news articles...");
      
      // Simulate another processing delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      setLoadingProcess("Filtering relevant content...");
      
      // Final delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For demonstration, we'll just add a new mock item
      const newItem: Omit<NewsItem, 'id'> = {
        title: "New DJ Software Uses AI to Match Beats Perfectly",
        summary: "Revolutionary DJ application leverages machine learning to create seamless transitions between tracks of different BPMs and keys.",
        content: "A team of software engineers and professional DJs have collaborated to create 'BeatSync Pro', a DJ application that uses artificial intelligence to analyze and match tracks for perfect transitions. The software can automatically adjust tempo, key, and even suggest optimal mix points based on song structure analysis. Early beta testers report that the AI suggestions have improved their sets and allowed for creative combinations that wouldn't have been attempted manually. The product is set to launch next month with both subscription and one-time purchase options.",
        source: "DJ Tech Reviews",
        sourceUrl: "https://example.com/news/beatsync-ai-dj-software",
        imageUrl: "https://images.unsplash.com/photo-1571935614846-3bcf3bfba75d",
        category: "technology",
        keywords: ["DJ", "software", "AI", "music technology", "mixing"],
        status: "pending",
        createdAt: new Date(),
      };
      
      // Add the new item to our state
      setNewsItems(prev => [{
        ...newItem,
        id: `mock-${prev.length}`
      }, ...prev]);
      
      toast({
        title: "Success",
        description: "News database updated with latest articles",
      });
    } catch (error) {
      console.error('Error fetching latest news:', error);
      toast({
        title: "Error",
        description: "Failed to fetch latest news. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
      setLoadingProcess(null);
    }
  };

  const generatePromotionalContent = async (newsItem: NewsItem) => {
    setIsGenerating(true);
    setSelectedItem(newsItem);
    
    try {
      // Simulate API call delay
      setLoadingProcess("Connecting to OpenRouter API...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLoadingProcess("Generating promotional content...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLoadingProcess("Creating social media copy...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate generated content (in a real implementation, this would call the OpenRouter API)
      const generatedContent: GeneratedContent = {
        promotional: `🎵 ${newsItem.title} 🎵\n\nExciting news for music creators! ${newsItem.summary}\n\nThis development could dramatically change how artists approach their craft. At Boostify, we provide the education and tools you need to stay ahead of industry changes like this.\n\nCheck out our platform to learn more about how you can leverage these opportunities in your music career!`,
        hashtags: generateHashtags(newsItem.keywords),
        imageUrl: newsItem.imageUrl,
      };
      
      setGeneratedContent(generatedContent);
      
      toast({
        title: "Content Generated",
        description: "Promotional content has been created for this news item",
      });
    } catch (error) {
      console.error('Error generating promotional content:', error);
      toast({
        title: "Error",
        description: "Failed to generate promotional content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setLoadingProcess(null);
    }
  };

  const generateHashtags = (keywords: string[]) => {
    // Create hashtags from keywords and add some standard platform hashtags
    const standardTags = ["MusicEducation", "BoostifyMusic", "MusicProduction", "LearnMusic"];
    const keywordTags = keywords.map(k => k.replace(/\s+/g, ''));
    
    // Combine arrays and then use filter to ensure uniqueness
    const combinedTags = [...keywordTags, ...standardTags];
    const uniqueTags = combinedTags.filter((tag, index) => combinedTags.indexOf(tag) === index);
    
    // Add hashtag symbol to each tag
    return uniqueTags.map(tag => `#${tag}`);
  };

  const regenerateImage = async () => {
    if (!selectedItem) return;
    
    setIsGenerating(true);
    setLoadingProcess("Connecting to Fal.ai API...");
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLoadingProcess("Generating promotional image...");
      
      // In a real implementation, this would call the Fal.ai API
      const newImageUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4";
      
      // Update the generated content with the new image
      setGeneratedContent(prev => prev ? {
        ...prev,
        imageUrl: newImageUrl
      } : null);
      
      toast({
        title: "Image Regenerated",
        description: "New promotional image has been created",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setLoadingProcess(null);
    }
  };

  const savePromotionalContent = async () => {
    if (!selectedItem || !generatedContent) return;
    
    try {
      // In a real implementation, this would save to Firestore
      // For now, we'll just show a success message
      
      toast({
        title: "Success",
        description: "Promotional content saved successfully",
      });
      
      // Update the status of the selected item
      setNewsItems(prev => prev.map(item => 
        item.id === selectedItem.id 
          ? { ...item, status: 'published' as const, publishedAt: new Date(), promotionalContent: generatedContent.promotional, hashtags: generatedContent.hashtags }
          : item
      ));
      
      // Reset selected item and generated content
      setSelectedItem(null);
      setGeneratedContent(null);
    } catch (error) {
      console.error('Error saving promotional content:', error);
      toast({
        title: "Error",
        description: "Failed to save promotional content",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
      duration: 2000,
    });
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    
    // Add the keyword to our list and reset the input
    setKeywordInput("");
    
    toast({
      title: "Keyword Added",
      description: `"${keywordInput}" added to search keywords`,
      duration: 2000,
    });
  };

  // Filter the news items based on search term, category, and status
  const filteredNewsItems = newsItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading news data...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Music News Plugin</h1>
          <p className="text-muted-foreground mt-1">
            Gather relevant music news and create promotional content
          </p>
        </div>
        
        <Button
          onClick={fetchLatestNews}
          disabled={refreshing}
          variant="default"
          className="flex items-center gap-2"
        >
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Refresh News</span>
            </>
          )}
        </Button>
      </div>

      {/* Loading process indicator */}
      {loadingProcess && (
        <div className="bg-muted/50 border p-4 rounded-lg mb-6 animate-pulse">
          <div className="flex items-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            <p className="font-medium">{loadingProcess}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: News feed and filters */}
        <div className="md:col-span-2">
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search news by title, summary or keywords..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="industry">Industry</SelectItem>
                  <SelectItem value="artist">Artist News</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4 mt-2">
              {filteredNewsItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Newspaper className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  <h3 className="text-lg font-medium">No news items found</h3>
                  <p className="text-sm">Try different search terms or filters</p>
                </div>
              ) : (
                filteredNewsItems.map(item => (
                  <Card key={item.id} className={`p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
                    item.status === 'published' ? 'border-l-green-500' : 
                    item.status === 'archived' ? 'border-l-gray-500' : 'border-l-orange-500'
                  }`} onClick={() => setSelectedItem(item)}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.category === 'education' ? 'bg-blue-100 text-blue-800' :
                            item.category === 'technology' ? 'bg-purple-100 text-purple-800' :
                            item.category === 'industry' ? 'bg-amber-100 text-amber-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.source} • {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-medium text-base">{item.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.summary}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.keywords.map((keyword, i) => (
                            <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation();
                            generatePromotionalContent(item);
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          Create Promo
                        </Button>
                        
                        {item.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              // View analytics (would be implemented in a real version)
                              toast({
                                title: "Analytics",
                                description: "Promotional analytics would show here"
                              });
                            }}
                          >
                            <Share2 className="h-3.5 w-3.5 mr-1.5" />
                            Analytics
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* News sources section */}
            <Card>
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center">
                  <RssIcon className="h-4 w-4 mr-2 text-orange-500" />
                  News Sources
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {newsSources.map((source, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-sm">{source.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        source.apiAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {source.apiAvailable ? 'Connected' : 'Manual'}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button variant="outline" className="w-full mt-4" size="sm">
                  Configure Sources
                </Button>
              </div>
            </Card>
            
            {/* Keywords section */}
            <Card>
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  Search Keywords
                </h3>
              </div>
              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <Input 
                    placeholder="Add keyword..." 
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addKeyword();
                    }}
                  />
                  <Button onClick={addKeyword} size="sm">Add</Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {popularKeywords.map((keyword, index) => (
                    <div key={index} className="bg-muted px-2 py-1 rounded-full text-xs flex items-center">
                      {keyword}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Right column: Selected news and promotional content */}
        <div>
          <Card className="p-4 mb-6">
            <h2 className="font-semibold text-lg mb-3">Selected News</h2>
            
            {selectedItem ? (
              <div>
                <h3 className="font-medium">{selectedItem.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedItem.summary}</p>
                
                <div className="mt-4 space-y-2">
                  <div className="h-40 bg-muted rounded-md overflow-hidden">
                    {selectedItem.imageUrl && (
                      <img 
                        src={selectedItem.imageUrl}
                        alt={selectedItem.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="text-sm mt-2">
                    <div className="font-medium">Source:</div>
                    <a 
                      href={selectedItem.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedItem.source}
                    </a>
                  </div>
                  
                  <div className="text-sm mt-1">
                    <div className="font-medium">Full Content:</div>
                    <p className="whitespace-pre-wrap">{selectedItem.content}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Music className="mx-auto h-12 w-12 mb-2 opacity-20" />
                <h3 className="text-lg font-medium">No news selected</h3>
                <p className="text-sm">Select a news item to view details</p>
              </div>
            )}
          </Card>
          
          <Card className="p-4">
            <h2 className="font-semibold text-lg mb-3">Promotional Content</h2>
            
            {selectedItem && generatedContent ? (
              <div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">Social Media Post</div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.promotional)}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-muted rounded-md p-3 text-sm">
                      <p className="whitespace-pre-wrap">{generatedContent.promotional}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">Hashtags</div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.hashtags.join(' '))}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.hashtags.map((tag, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">Promotional Image</div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={regenerateImage}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Regenerate
                      </Button>
                    </div>
                    <div className="h-40 bg-muted rounded-md overflow-hidden">
                      {generatedContent.imageUrl && (
                        <img 
                          src={generatedContent.imageUrl}
                          alt="Promotional image"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="font-medium mb-2">Post To:</div>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="instagram" />
                        <Label htmlFor="instagram" className="flex items-center">
                          <Instagram className="h-4 w-4 mr-1.5" />
                          Instagram
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="twitter" />
                        <Label htmlFor="twitter" className="flex items-center">
                          <Twitter className="h-4 w-4 mr-1.5" />
                          Twitter
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="facebook" />
                        <Label htmlFor="facebook" className="flex items-center">
                          <Facebook className="h-4 w-4 mr-1.5" />
                          Facebook
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedItem(null);
                        setGeneratedContent(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={savePromotionalContent}>
                      <Save className="h-4 w-4 mr-1.5" />
                      Save & Schedule
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Sparkles className="mx-auto h-12 w-12 mb-2 opacity-20" />
                <h3 className="text-lg font-medium">No promotional content</h3>
                <p className="text-sm">Select a news item and click "Create Promo"</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}