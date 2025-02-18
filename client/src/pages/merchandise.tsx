import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  Users,
  Palette,
  Share2,
  Shirt,
  Coffee,
  BackpackIcon,
  Smartphone,
  Sticker,
  Book,
  Watch,
  Headphones,
  Badge as BadgeIcon,
  Package,
  ArrowRight,
  Printer,
  LineChart,
  ShoppingCart,
  Building2,
  Settings,
  ImageIcon,
  Music,
  BarChart2
} from "lucide-react";
import { SiShopify } from "react-icons/si";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { Download, Video } from "lucide-react";

// Product type definition from original code
interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  image: string;
  icon: JSX.Element;
  description: string;
  customizationOptions: string[];
}

// Products data from original code and edited snippet
const products: Product[] = [
  {
    id: "1",
    name: "Custom T-Shirt",
    category: "Apparel",
    basePrice: 19.99,
    image: "/assets/products/tshirt.jpg",
    icon: <Shirt className="h-8 w-8" />,
    description: "High-quality cotton t-shirts with custom designs",
    customizationOptions: ["Print Location", "Size", "Color", "Material"]
  },
  {
    id: "2",
    name: "Coffee Mug",
    category: "Accessories",
    basePrice: 14.99,
    image: "/assets/products/mug.jpg",
    icon: <Coffee className="h-8 w-8" />,
    description: "Ceramic mugs perfect for merchandise",
    customizationOptions: ["Print Type", "Size", "Handle Color"]
  },
  {
    id: "3",
    name: "Snapback Cap",
    category: "Apparel",
    basePrice: 24.99,
    image: "/assets/products/cap.jpg",
    icon: <BackpackIcon className="h-8 w-8" />,
    description: "Adjustable snapback caps with embroidered designs",
    customizationOptions: ["Embroidery Location", "Color", "Size"]
  },
  {
    id: "4",
    name: "Phone Case",
    category: "Accessories",
    basePrice: 19.99,
    image: "/assets/products/phone-case.jpg",
    icon: <Smartphone className="h-8 w-8" />,
    description: "Custom phone cases for various models",
    customizationOptions: ["Phone Model", "Case Type", "Design Placement"]
  },
  {
    id: "5",
    name: "Sticker Pack",
    category: "Accessories",
    basePrice: 9.99,
    image: "/assets/products/stickers.jpg",
    icon: <Sticker className="h-8 w-8" />,
    description: "Die-cut stickers with custom artwork",
    customizationOptions: ["Size", "Material", "Shape"]
  },
  {
    id: "6",
    name: "Tour Book",
    category: "Print",
    basePrice: 29.99,
    image: "/assets/products/book.jpg",
    icon: <Book className="h-8 w-8" />,
    description: "High-quality photo books and tour programs",
    customizationOptions: ["Page Count", "Size", "Paper Type", "Cover Style"]
  },
  {
    id: "7",
    name: "Wristband",
    category: "Accessories",
    basePrice: 7.99,
    image: "/assets/products/wristband.jpg",
    icon: <Watch className="h-8 w-8" />,
    description: "Silicone wristbands with custom text",
    customizationOptions: ["Color", "Size", "Text Style"]
  },
  {
    id: "8",
    name: "Headphones",
    category: "Electronics",
    basePrice: 59.99,
    image: "/assets/products/headphones.jpg",
    icon: <Headphones className="h-8 w-8" />,
    description: "Branded wireless headphones",
    customizationOptions: ["Color Scheme", "Logo Placement", "Packaging"]
  },
  {
    id: "9",
    name: "Enamel Pin",
    category: "Accessories",
    basePrice: 12.99,
    image: "/assets/products/pin.jpg",
    icon: <BadgeIcon className="h-8 w-8" />,
    description: "Custom enamel pins with your designs",
    customizationOptions: ["Size", "Backing Type", "Finish"]
  },
  {
    id: "10",
    name: "Merch Bundle",
    category: "Bundles",
    basePrice: 79.99,
    image: "/assets/products/bundle.jpg",
    icon: <Package className="h-8 w-8" />,
    description: "Curated merchandise bundles",
    customizationOptions: ["Bundle Items", "Packaging", "Price Tier"]
  },
  {
    id: "11",
    name: "Limited Edition Vinyl Box Set",
    category: "Music",
    basePrice: 149.99,
    image: "/assets/products/vinyl-box.jpg",
    icon: <Music className="h-8 w-8" />,
    description: "Collector's edition vinyl box set with exclusive artwork",
    customizationOptions: ["Box Design", "Vinyl Color", "Artwork Style", "Packaging"]
  },
  {
    id: "12",
    name: "Artist Signature Guitar Pick",
    category: "Accessories",
    basePrice: 15.99,
    image: "/assets/products/pick.jpg",
    icon: <Music className="h-8 w-8" />,
    description: "Custom guitar picks with artist signature and design",
    customizationOptions: ["Material", "Thickness", "Design", "Finish"]
  },
  {
    id: "13",
    name: "Tour Photo Book",
    category: "Print",
    basePrice: 39.99,
    image: "/assets/products/photobook.jpg",
    icon: <ImageIcon className="h-8 w-8" />,
    description: "High-quality photo book featuring tour moments",
    customizationOptions: ["Size", "Cover Type", "Paper Quality", "Layout"]
  },
  {
    id: "14",
    name: "Premium Leather Jacket",
    category: "Apparel",
    basePrice: 199.99,
    image: "/assets/products/jacket.jpg",
    icon: <Shirt className="h-8 w-8" />,
    description: "Custom leather jacket with embroidered artist logo",
    customizationOptions: ["Size", "Color", "Logo Placement", "Hardware Finish"]
  },
  {
    id: "15",
    name: "Digital Music Bundle",
    category: "Digital",
    basePrice: 24.99,
    image: "/assets/products/digital-bundle.jpg",
    icon: <Download className="h-8 w-8" />,
    description: "Exclusive digital content package with unreleased tracks",
    customizationOptions: ["Format", "Bonus Content", "Artwork", "Resolution"]
  },
  {
    id: "16",
    name: "Concert Photography Print",
    category: "Print",
    basePrice: 29.99,
    image: "/assets/products/concert-print.jpg",
    icon: <ImageIcon className="h-8 w-8" />,
    description: "Limited edition concert photography prints",
    customizationOptions: ["Size", "Frame", "Paper Type", "Finish"]
  },
  {
    id: "17",
    name: "Artist Collection Backpack",
    category: "Accessories",
    basePrice: 69.99,
    image: "/assets/products/backpack.jpg",
    icon: <BackpackIcon className="h-8 w-8" />,
    description: "Premium backpack with custom artist designs",
    customizationOptions: ["Style", "Color", "Size", "Pattern"]
  },
  {
    id: "18",
    name: "Premium Sound Pack",
    category: "Digital",
    basePrice: 49.99,
    image: "/assets/products/sound-pack.jpg",
    icon: <Music className="h-8 w-8" />,
    description: "Exclusive sound samples and production elements",
    customizationOptions: ["Format", "Genre", "Sample Rate", "Pack Size"]
  },
  {
    id: "19",
    name: "Artist Documentary",
    category: "Digital",
    basePrice: 19.99,
    image: "/assets/products/documentary.jpg",
    icon: <Video className="h-8 w-8" />,
    description: "Behind-the-scenes documentary with exclusive footage",
    customizationOptions: ["Format", "Resolution", "Subtitles", "Extras"]
  },
  {
    id: "20",
    name: "VIP Meet & Greet Package",
    category: "Experience",
    basePrice: 299.99,
    image: "/assets/products/vip-package.jpg",
    icon: <Users className="h-8 w-8" />,
    description: "Exclusive VIP experience with merchandise bundle",
    customizationOptions: ["Event Date", "Package Tier", "Merchandise", "Experience Type"]
  }
];

const salesData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

export default function MerchandisePage() {
  const [selectedTab, setSelectedTab] = useState("products");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section with Video Background */}
      <div className="relative w-full h-[50vh] mt-16 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover"
          poster="/assets/cover.jpg"
        >
          <source src="/assets/style_advisor_bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Merchandise Manager
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mb-8">
            Create, customize, and manage your merchandise with powerful tools and integrations
          </p>
          <Button
            className="w-fit bg-orange-500 hover:bg-orange-600 text-lg px-8 py-6"
            onClick={() => setSelectedTab("products")}
          >
            Start Creating
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="products" value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <div className="flex flex-col items-center mb-12">
            <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 md:grid-cols-none gap-4 md:gap-0 p-1">
              <TabsTrigger value="products" className="px-8 data-[state=active]:bg-orange-500">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Products
              </TabsTrigger>
              <TabsTrigger value="shopify" className="px-8 data-[state=active]:bg-orange-500">
                <SiShopify className="w-4 h-4 mr-2" />
                Shopify
              </TabsTrigger>
              <TabsTrigger value="analytics" className="px-8 data-[state=active]:bg-orange-500">
                <LineChart className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="marketing" className="px-8 data-[state=active]:bg-orange-500">
                <Share2 className="w-4 h-4 mr-2" />
                Marketing
              </TabsTrigger>
              <TabsTrigger value="providers" className="px-8 data-[state=active]:bg-orange-500">
                <Building2 className="w-4 h-4 mr-2" />
                Providers
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* T-shirt Designer */}
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-orange-500/10">
                <div className="aspect-video bg-gradient-to-br from-orange-500/5 to-orange-500/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors">
                    <Shirt className="h-12 w-12 text-orange-500" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold group-hover:text-orange-500 transition-colors mb-3">
                    T-shirt Designer
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Create custom t-shirt designs with our advanced design tools
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">DTG Printing</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Screen Printing</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Embroidery</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Custom Colors</Badge>
                    </div>
                  </div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Launch Designer
                  </Button>
                </div>
              </Card>

              {/* Poster Creator */}
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-orange-500/10">
                <div className="aspect-video bg-gradient-to-br from-orange-500/5 to-orange-500/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors">
                    <ImageIcon className="h-12 w-12 text-orange-500" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold group-hover:text-orange-500 transition-colors mb-3">
                    Poster Creator
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Design eye-catching posters and promotional materials
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">High Quality</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Multiple Sizes</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Templates</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Custom Designs</Badge>
                    </div>
                  </div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Create Poster
                  </Button>
                </div>
              </Card>

              {/* Vinyl Creator */}
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-orange-500/10">
                <div className="aspect-video bg-gradient-to-br from-orange-500/5 to-orange-500/10 flex items-center justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors">
                    <Music className="h-12 w-12 text-orange-500" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold group-hover:text-orange-500 transition-colors mb-3">
                    Vinyl Creator
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Create custom vinyl records and merchandise
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Album Covers</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Packaging</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Limited Editions</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Custom Colors</Badge>
                    </div>
                  </div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Design Vinyl
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Shopify Integration Tab */}
          <TabsContent value="shopify">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <SiShopify className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Shopify Integration</h3>
                    <p className="text-muted-foreground">
                      Connect and manage your Shopify store
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-orange-500/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Store Status</p>
                        <p className="text-sm text-muted-foreground">mystore.shopify.com</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">Connected</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button className="justify-start" variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Store Settings
                    </Button>
                    <Button className="justify-start" variant="outline">
                      <Package className="mr-2 h-4 w-4" />
                      Products
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Share2 className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Available Plugins</h3>
                    <p className="text-muted-foreground">
                      Enhance your store with powerful plugins
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Print on Demand</h4>
                      <Badge>Popular</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Automatically fulfill print on demand orders
                    </p>
                    <Button variant="outline" size="sm">Install</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Order Tracking</h4>
                      <Badge>Essential</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Real-time order tracking and notifications
                    </p>
                    <Button variant="outline" size="sm">Install</Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <BarChart2 className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Sales Analytics</h3>
                    <p className="text-muted-foreground">
                      Track your merchandise performance
                    </p>
                  </div>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(249, 115, 22)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="rgb(249, 115, 22)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="rgb(249, 115, 22)"
                        fillOpacity={1}
                        fill="url(#colorSales)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Package className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Top Products</h3>
                    <p className="text-muted-foreground">
                      Best selling merchandise items
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shirt className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">Band T-Shirt</p>
                          <p className="text-sm text-muted-foreground">Black, All Sizes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$1,234</p>
                        <p className="text-sm text-green-500">+12%</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Music className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">Limited Vinyl</p>
                          <p className="text-sm text-muted-foreground">Special Edition</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$987</p>
                        <p className="text-sm text-green-500">+8%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Share2 className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Marketing Tools</h3>
                    <p className="text-muted-foreground">
                      Promote your merchandise effectively
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Email Marketing</h4>
                      <Badge>Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Send promotional emails to your customers
                    </p>
                    <Progress value={75} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Last campaign: 75% open rate
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Social Media</h4>
                      <Badge>Connected</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Automatic social media promotion
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Post Update</Button>
                      <Button variant="outline" size="sm">Schedule</Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Settings className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Marketing Plugins</h3>
                    <p className="text-muted-foreground">
                      Enhance your marketing capabilities
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {['Abandoned Cart Recovery', 'Customer Reviews', 'Loyalty Program', 'SEO Optimizer'].map((plugin) => (
                    <div key={plugin} className="p-4 border rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{plugin}</h4>
                        <p className="text-sm text-muted-foreground">
                          Click to configure settings
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Building2 className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Connected Providers</h3>
                    <p className="text-muted-foreground">
                      Manage your merchandise providers
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'PrintfulPro', type: 'Print Provider', status: 'Active' },
                    { name: 'VinylPress', type: 'Vinyl Manufacturer', status: 'Active' },
                    { name: 'ShirtWorks', type: 'Clothing Provider', status: 'Pending' }
                  ].map((provider) => (
                    <div key={provider.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-sm text-muted-foreground">{provider.type}</p>
                        </div>
                        <Badge variant={provider.status === 'Active' ? 'default' : 'secondary'}>
                          {provider.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">Configure</Button>
                        <Button variant="outline" size="sm">View Orders</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-lg">
                    <Package className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">Provider Directory</h3>
                    <p className="text-muted-foreground">
                      Find and connect with new providers
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input placeholder="Search providers..." className="mb-4" />

                  {[
                    { name: 'Global Print Solutions', rating: 4.8, speciality: 'All Print Products' },
                    { name: 'Vinyl Masters', rating: 4.7, speciality: 'Vinyl Records' },
                    { name: 'Eco Merch', rating: 4.9, speciality: 'Sustainable Products' }
                  ].map((provider) => (
                    <div key={provider.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-sm text-muted-foreground">{provider.speciality}</p>
                        </div>
                        <div className="text-sm">
                          ⭐ {provider.rating}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="mt-4">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}