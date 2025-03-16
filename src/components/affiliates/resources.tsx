import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Play, FileText, Image, Video, Zap, BookOpen, Calculator, ChevronRight, Clock, Check, Gift, Star, Award, Search, Globe } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AffiliateResources() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Affiliate marketing resources
  const marketingResources = [
    {
      id: "res-1",
      title: "Ultimate Music Affiliate Marketing Guide",
      description: "Learn proven strategies to promote music products and maximize your conversions with this comprehensive guide.",
      type: "guide",
      format: "PDF",
      size: "4.2 MB",
      lastUpdated: "Jan 25, 2025",
      thumbnail: "https://placehold.co/400x225",
      featured: true,
    },
    {
      id: "res-2",
      title: "Social Media Banner Pack",
      description: "Collection of 20 optimized banners for all social platforms with space for your affiliate link. Perfect for promotions.",
      type: "graphics",
      format: "ZIP (PNG/JPG)",
      size: "15.8 MB",
      lastUpdated: "Feb 12, 2025",
      thumbnail: "https://placehold.co/400x225",
    },
    {
      id: "res-3",
      title: "Tutorial: Instagram Conversion Optimization",
      description: "Step-by-step video tutorial for creating effective Instagram campaigns that drive conversions for music products.",
      type: "video",
      format: "MP4",
      size: "85.3 MB",
      lastUpdated: "Feb 05, 2025",
      thumbnail: "https://placehold.co/400x225",
      duration: "28:45",
    },
    {
      id: "res-4",
      title: "Email Marketing Templates",
      description: "10 responsive HTML templates for your email campaigns with customizable blocks designed for music product promotion.",
      type: "template",
      format: "HTML/CSS",
      size: "2.1 MB",
      lastUpdated: "Feb 18, 2025",
      thumbnail: "https://placehold.co/400x225",
      featured: true,
    },
    {
      id: "res-5",
      title: "Affiliate Earnings Calculator",
      description: "Spreadsheet to project your earnings based on conversion rates, traffic volumes, and commission structures.",
      type: "tool",
      format: "XLSX",
      size: "1.3 MB",
      lastUpdated: "Feb 01, 2025",
      thumbnail: "https://placehold.co/400x225",
    },
    {
      id: "res-6",
      title: "Webinar: Advanced Affiliate Strategies",
      description: "Recorded session with experts sharing advanced techniques to scale your affiliate income in the music industry.",
      type: "webinar",
      format: "MP4",
      size: "320.5 MB",
      lastUpdated: "Jan 10, 2025",
      thumbnail: "https://placehold.co/400x225",
      duration: "1:15:30",
    },
  ];

  // Product-specific resources
  const productResources = [
    {
      id: "prod-res-1",
      title: "Promotion Kit - Music Production Masterclass",
      description: "Complete resources for promoting our flagship music production course. Includes images, copy, and video testimonials.",
      type: "bundle",
      format: "ZIP (various)",
      size: "45.2 MB",
      lastUpdated: "Feb 15, 2025",
      thumbnail: "https://placehold.co/400x225",
      productId: "prod1",
      commissionRate: "30%",
    },
    {
      id: "prod-res-2",
      title: "Promo Images - Pro Mastering Plugin",
      description: "High-quality image pack showcasing the interface and results of our professional mastering plugin.",
      type: "graphics",
      format: "ZIP (PNG)",
      size: "22.4 MB",
      lastUpdated: "Feb 20, 2025",
      thumbnail: "https://placehold.co/400x225",
      productId: "prod2",
      commissionRate: "25%",
    },
    {
      id: "prod-res-3",
      title: "Demo & Testimonials - Music Distribution Package",
      description: "Video testimonial and demonstration of our music distribution platform with real success stories from artists.",
      type: "video",
      format: "MP4",
      size: "128.7 MB",
      lastUpdated: "Feb 08, 2025",
      thumbnail: "https://placehold.co/400x225",
      productId: "prod3",
      commissionRate: "35%",
      duration: "12:45",
    },
    {
      id: "prod-res-4",
      title: "FAQ - Music Marketing Course",
      description: "Document with answers to the most frequently asked questions by potential customers about our marketing course.",
      type: "document",
      format: "PDF",
      size: "1.8 MB",
      lastUpdated: "Feb 22, 2025",
      thumbnail: "https://placehold.co/400x225",
      productId: "prod4",
      commissionRate: "40%",
    },
  ];

  // Educational resources
  const educationResources = [
    {
      id: "edu-1",
      title: "Course: Affiliate Marketing Fundamentals",
      description: "Complete course to master the fundamentals of affiliate marketing in the music industry.",
      lessons: 12,
      duration: "3 hours",
      level: "Beginner",
      lastUpdated: "Jan 05, 2025",
      thumbnail: "https://placehold.co/400x225",
      certification: true,
    },
    {
      id: "edu-2",
      title: "Workshop: Copywriting for Conversions",
      description: "Learn persuasive writing techniques specific to music products and audio technology promotion.",
      lessons: 5,
      duration: "1.5 hours",
      level: "Intermediate",
      lastUpdated: "Jan 15, 2025",
      thumbnail: "https://placehold.co/400x225",
    },
    {
      id: "edu-3",
      title: "Masterclass: SEO for Music Affiliates",
      description: "Optimize your content to rank for searches related to music production and equipment.",
      lessons: 8,
      duration: "2 hours",
      level: "Advanced",
      lastUpdated: "Jan 20, 2025",
      thumbnail: "https://placehold.co/400x225",
      certification: true,
    },
    {
      id: "edu-4",
      title: "Guide: Effective Social Media Strategy",
      description: "Platform-specific strategies that work in the music and audio niche for maximum engagement.",
      lessons: 6,
      duration: "1.8 hours",
      level: "Intermediate",
      lastUpdated: "Feb 10, 2025",
      thumbnail: "https://placehold.co/400x225",
    },
  ];

  // Upcoming webinars
  const upcomingWebinars = [
    {
      id: "webinar-1",
      title: "SEO Strategies for Music Affiliates in 2025",
      date: "Mar 15, 2025 - 6:00 PM GMT",
      host: "Sarah Johnson",
      hostTitle: "SEO Specialist",
      description: "Learn the latest SEO techniques to help your music affiliate content rank higher and attract qualified traffic.",
    },
    {
      id: "webinar-2",
      title: "Creating Viral Content for Music Products",
      date: "Mar 22, 2025 - 5:00 PM GMT",
      host: "David Martinez",
      hostTitle: "Content Marketing Expert",
      description: "Discover proven formulas for creating content that gets shared widely and drives conversions for music products.",
    },
    {
      id: "webinar-3",
      title: "Panel: Affiliate Marketing Trends for 2025",
      date: "Apr 05, 2025 - 4:30 PM GMT",
      host: "Industry Panel",
      hostTitle: "Various Experts",
      description: "Join industry leaders as they discuss emerging trends and opportunities in music affiliate marketing.",
    },
  ];

  // Function to handle resource download simulation
  const handleDownload = (resource: any) => {
    setSelectedResource(resource);
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadComplete(false);
    
    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          setDownloadComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  // Get resource icon based on type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'guide':
      case 'document':
        return <FileText className="h-5 w-5" />;
      case 'graphics':
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'video':
      case 'webinar':
        return <Video className="h-5 w-5" />;
      case 'template':
        return <FileText className="h-5 w-5" />;
      case 'tool':
        return <Calculator className="h-5 w-5" />;
      case 'bundle':
        return <Gift className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Resource card component
  const ResourceCard = ({ resource }: { resource: any }) => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              {getResourceIcon(resource.type)}
            </div>
            <div>
              <Badge variant="outline" className="capitalize">
                {resource.type}
              </Badge>
            </div>
          </div>
          {resource.featured && (
            <Badge className="bg-amber-500 hover:bg-amber-600">Featured</Badge>
          )}
        </div>
        <CardTitle className="text-base mt-2">{resource.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4 h-[120px] rounded-md bg-muted flex items-center justify-center overflow-hidden">
          {resource.duration ? (
            <div className="relative w-full h-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-black/60 w-12 h-12 flex items-center justify-center hover:bg-black/70 cursor-pointer">
                  <Play className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs rounded px-2 py-1">
                {resource.duration}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {getResourceIcon(resource.type)}
              <span className="text-xs text-muted-foreground mt-2">{resource.format}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {resource.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{resource.lastUpdated}</span>
          </div>
          <div>{resource.size}</div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 pb-4 flex justify-between">
        <Button variant="outline" size="sm" className="gap-1">
          <ExternalLink className="h-4 w-4" />
          Preview
        </Button>
        <Button size="sm" className="gap-1" onClick={() => handleDownload(resource)}>
          <Download className="h-4 w-4" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );

  // Educational resource card component
  const EducationResourceCard = ({ resource }: { resource: any }) => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <Badge variant="outline">
              {resource.level}
            </Badge>
          </div>
          {resource.certification && (
            <Badge className="bg-primary hover:bg-primary/90">Certification</Badge>
          )}
        </div>
        <CardTitle className="text-base mt-2">{resource.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4 h-[120px] rounded-md bg-muted flex items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-2">Course Preview</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {resource.description}
        </p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{resource.duration}</span>
          </div>
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{resource.lessons} lessons</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 pb-4 flex justify-between">
        <div className="text-xs text-muted-foreground">
          Updated: {resource.lastUpdated}
        </div>
        <Button size="sm" className="gap-1">
          <Zap className="h-4 w-4" />
          Start Learning
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Affiliate Resources</h2>
          <p className="text-muted-foreground">
            Marketing materials, training, and tools to boost your success
          </p>
        </div>
        
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search resources..." 
            className="pl-9 pr-4 py-2 w-full sm:w-[250px] rounded-md border"
          />
        </div>
      </div>

      <Tabs defaultValue="marketing" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="webinars">Webinars</TabsTrigger>
        </TabsList>
        
        <TabsContent value="marketing" className="space-y-4 pt-4">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {marketingResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4 pt-4">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {productResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="education" className="space-y-4 pt-4">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {educationResources.map((resource) => (
              <EducationResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
          
          <Card className="w-full mt-6">
            <CardHeader>
              <CardTitle>Your Learning Progress</CardTitle>
              <CardDescription>
                Track your progress through affiliate education resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Affiliate Marketing Fundamentals</span>
                    <span className="font-medium">4/12 lessons completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={33} className="flex-1 h-2" />
                    <span className="text-xs">33%</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Copywriting for Conversions</span>
                    <span className="font-medium">2/5 lessons completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={40} className="flex-1 h-2" />
                    <span className="text-xs">40%</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>SEO for Music Affiliates</span>
                    <span className="font-medium">0/8 lessons completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={0} className="flex-1 h-2" />
                    <span className="text-xs">0%</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                <p>Continue where you left off</p>
              </div>
              <Button className="gap-1">
                <Play className="h-4 w-4" />
                Resume Learning
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="webinars" className="space-y-4 pt-4">
          <div className="bg-primary/5 rounded-lg border p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Premium Affiliate Webinar Series</h3>
                <p className="text-muted-foreground">
                  Join our exclusive live sessions with industry experts to master advanced affiliate marketing techniques
                </p>
              </div>
              <div className="md:ml-auto">
                <Button className="gap-1">
                  <Globe className="h-4 w-4" />
                  Register Now
                </Button>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-4">Upcoming Webinars</h3>
          <div className="space-y-4">
            {upcomingWebinars.map((webinar) => (
              <Card key={webinar.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 bg-muted/50 p-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-medium text-primary mb-1">
                        {webinar.date.split('-')[0].trim()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {webinar.date.split('-')[1].trim()}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-medium">{webinar.title}</h4>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <span className="font-medium">{webinar.host}</span>
                          <span className="mx-2">•</span>
                          <span>{webinar.hostTitle}</span>
                        </div>
                      </div>
                      <Button className="sm:flex-shrink-0 gap-1">
                        <Calendar className="h-4 w-4" />
                        Add to Calendar
                      </Button>
                    </div>
                    <p className="mt-4 text-muted-foreground">{webinar.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <h3 className="text-lg font-medium mt-8 mb-4">Recorded Webinars</h3>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <Badge variant="outline">Recorded</Badge>
                <CardTitle className="text-base mt-2">Social Media Strategies for Music Products</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="relative mb-4 h-[120px] rounded-md bg-muted overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 w-12 h-12 flex items-center justify-center hover:bg-black/70 cursor-pointer">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs rounded px-2 py-1">
                    58:24
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn how to leverage social media platforms effectively for promoting music products and maximizing conversions.
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Recorded Feb 12, 2025</span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 pb-4">
                <Button size="sm" className="w-full gap-1">
                  <Video className="h-4 w-4" />
                  Watch Recording
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <Badge variant="outline">Recorded</Badge>
                <CardTitle className="text-base mt-2">Affiliate Email Marketing Masterclass</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="relative mb-4 h-[120px] rounded-md bg-muted overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 w-12 h-12 flex items-center justify-center hover:bg-black/70 cursor-pointer">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs rounded px-2 py-1">
                    1:12:18
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover effective email marketing strategies specifically designed for music product affiliates.
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Recorded Jan 28, 2025</span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 pb-4">
                <Button size="sm" className="w-full gap-1">
                  <Video className="h-4 w-4" />
                  Watch Recording
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <Badge variant="outline">Recorded</Badge>
                <CardTitle className="text-base mt-2">Maximizing Affiliate Commissions</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="relative mb-4 h-[120px] rounded-md bg-muted overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 w-12 h-12 flex items-center justify-center hover:bg-black/70 cursor-pointer">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs rounded px-2 py-1">
                    45:36
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn advanced techniques to increase your conversion rates and maximize your affiliate earnings.
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Recorded Jan 15, 2025</span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 pb-4">
                <Button size="sm" className="w-full gap-1">
                  <Video className="h-4 w-4" />
                  Watch Recording
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Download progress alert dialog */}
      <AlertDialog open={isDownloading || downloadComplete} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {downloadComplete ? "Download Complete" : "Downloading Resource"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {downloadComplete ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span>
                    {selectedResource?.title} has been downloaded successfully.
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>Downloading: {selectedResource?.title}</p>
                  <div className="space-y-2">
                    <Progress value={downloadProgress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{downloadProgress}%</span>
                      <span>{selectedResource?.size}</span>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {downloadComplete ? (
              <Button onClick={() => setDownloadComplete(false)}>Close</Button>
            ) : (
              <Button variant="outline" onClick={() => setIsDownloading(false)}>
                Cancel
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}