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
      description: "Panel with industry experts discussing new trends, tools, and strategies defining affiliate marketing this year.",
    },
  ];

  // Render icon based on resource type
  const renderResourceIcon = (type: string) => {
    switch (type) {
      case 'guide':
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'graphics':
        return <Image className="h-4 w-4" />;
      case 'video':
      case 'webinar':
        return <Video className="h-4 w-4" />;
      case 'template':
        return <FileText className="h-4 w-4" />;
      case 'tool':
        return <Calculator className="h-4 w-4" />;
      case 'bundle':
        return <Zap className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Simulate downloading a resource
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
          setDownloadComplete(true);
          setTimeout(() => {
            setIsAlertOpen(true);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 200);
  };
  
  // Frequently asked questions
  const faqs = [
    {
      question: "How do I start promoting products as an affiliate?",
      answer: "To get started, select the products you want to promote in the affiliate links panel. Create a unique link for each product and begin sharing it across your channels. Use the marketing resources available to create engaging content that highlights the product benefits."
    },
    {
      question: "When and how do I receive my payments?",
      answer: "Payments are processed monthly on the 15th, provided you've reached the minimum threshold of $100. You'll receive payment through the method you've configured in your profile (PayPal, bank transfer, or cryptocurrency). You can view your payment history and next estimated payment in the Earnings section."
    },
    {
      question: "How can I increase my conversion rate?",
      answer: "To improve your conversion rate, consider these strategies: 1) Know the products you're promoting thoroughly, 2) Create genuine content that showcases real benefits, 3) Drive qualified traffic to your links, 4) Use the content generator to create persuasive copy, 5) Regularly analyze and optimize your campaigns based on performance data."
    },
    {
      question: "Can I promote products on any platform?",
      answer: "Yes, you can promote products on virtually any online platform, including social media, blogs, YouTube, email marketing, etc. However, be sure to follow each platform's policies regarding affiliate links. Some platforms require explicit disclosure of affiliate relationships, while others may have specific restrictions."
    },
    {
      question: "Do I have to pay for the marketing resources?",
      answer: "No, all marketing resources available in this section are completely free for our affiliates. You can download and use promotional materials, guides, templates, and tools at no additional cost. These resources are designed to help you succeed and maximize your earnings."
    },
    {
      question: "How can I know which products are most profitable to promote?",
      answer: "In the Earnings section, you can see detailed statistics about each product's performance, including conversion rates, commissions, and total earnings. Use this data to identify which products generate the best results for your specific audience. We also recommend testing different products and analyzing their performance over at least a 30-day period."
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 rounded-lg">
        <h2 className="text-2xl font-bold tracking-tight">Affiliate Resources</h2>
        <p className="text-muted-foreground mt-1">
          Tools and materials to maximize your conversions and boost earnings
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>20+ Marketing Materials</span>
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Video className="h-3.5 w-3.5" />
            <span>Educational Videos</span>
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calculator className="h-3.5 w-3.5" />
            <span>Performance Tools</span>
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" />
            <span>Global Support</span>
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="marketing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
        </TabsList>
        
        <TabsContent value="marketing" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketingResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden flex flex-col">
                <div className="aspect-video relative">
                  <img
                    src={resource.thumbnail}
                    alt={resource.title}
                    className="object-cover w-full h-full"
                  />
                  <Badge
                    className="absolute top-2 right-2"
                    variant="secondary"
                  >
                    {resource.type}
                  </Badge>
                </div>
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs flex items-center">
                      {renderResourceIcon(resource.type)}
                      <span className="ml-1">{resource.format}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">{resource.size}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex-grow">
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    Updated: {resource.lastUpdated}
                  </span>
                  <div className="flex gap-2">
                    {resource.type === 'video' || resource.type === 'webinar' ? (
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-1" />
                        Watch
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 aspect-video md:aspect-square relative">
                    <img
                      src={resource.thumbnail}
                      alt={resource.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="md:w-2/3 p-4">
                    <div className="flex flex-col h-full">
                      <div>
                        <h3 className="font-medium text-lg">{resource.title}</h3>
                        <div className="flex items-center gap-2 mt-1 mb-2">
                          <Badge variant="outline" className="text-xs flex items-center">
                            {renderResourceIcon(resource.type)}
                            <span className="ml-1">{resource.format}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">{resource.size}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {resource.description}
                        </p>
                      </div>
                      <div className="mt-auto flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Updated: {resource.lastUpdated}
                        </span>
                        <div className="flex gap-2">
                          {resource.type === 'video' ? (
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4 mr-1" />
                              Watch
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="education" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {educationResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={resource.thumbnail}
                    alt={resource.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <Badge
                      className="mb-2"
                      variant={
                        resource.level === "Principiante" ? "outline" :
                        resource.level === "Intermedio" ? "secondary" : "default"
                      }
                    >
                      {resource.level}
                    </Badge>
                    <h3 className="font-medium text-lg text-white">{resource.title}</h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm">{resource.lessons} lessons</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm">{resource.duration}</span>
                      </div>
                    </div>
                    <Button>
                      Start course
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming webinars and events</CardTitle>
              <CardDescription>
                Don't miss these live learning opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">15/03/2025 - 18:00 GMT</Badge>
                      <h3 className="font-medium text-lg">Webinar: Estrategias SEO para afiliados en 2025</h3>
                      <p className="text-muted-foreground text-sm">Aprende las últimas técnicas de SEO para destacar tu contenido de afiliado y atraer tráfico orgánico de calidad.</p>
                    </div>
                    <Button>
                      Reservar plaza
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">22/03/2025 - 17:00 GMT</Badge>
                      <h3 className="font-medium text-lg">Masterclass: Creación de contenido viral para productos musicales</h3>
                      <p className="text-muted-foreground text-sm">Descubre fórmulas probadas para crear contenido que se comparte masivamente y genera conversiones para productos de audio y música.</p>
                    </div>
                    <Button>
                      Reservar plaza
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">05/04/2025 - 16:30 GMT</Badge>
                      <h3 className="font-medium text-lg">Mesa redonda: Tendencias en marketing de afiliados para 2025</h3>
                      <p className="text-muted-foreground text-sm">Panel con expertos del sector discutiendo las nuevas tendencias, herramientas y estrategias que están definiendo el marketing de afiliados este año.</p>
                    </div>
                    <Button>
                      Reservar plaza
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Answers to the most common questions from our affiliates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Can't find the answer you're looking for?
          </p>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-1" />
            Contact affiliate support
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}