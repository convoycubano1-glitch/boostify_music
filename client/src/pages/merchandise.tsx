import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingBag, 
  Users, 
  Palette, 
  Share2, 
  TShirt,
  Coffee,
  Hat,
  Smartphone,
  Sticker,
  Book,
  Watch,
  Headphones,
  Badge,
  Package
} from "lucide-react";

// Product type definition
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

// Sample products data
const products: Product[] = [
  {
    id: "1",
    name: "Custom T-Shirt",
    category: "Apparel",
    basePrice: 19.99,
    image: "/assets/products/tshirt.jpg",
    icon: <TShirt className="h-8 w-8" />,
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
    icon: <Hat className="h-8 w-8" />,
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
    icon: <Badge className="h-8 w-8" />,
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
  }
];

export default function MerchandisePage() {
  const [selectedTab, setSelectedTab] = useState("products");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="relative w-full h-[40vh] bg-gradient-to-r from-orange-500 to-red-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Artist Merchandise Hub
          </h1>
          <p className="text-xl text-white/90 max-w-2xl">
            Create, customize, and sell your branded merchandise through our network of providers and influencers
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="space-y-8">
          <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 md:grid-cols-none gap-4 md:gap-0">
            <TabsTrigger value="products" className="px-8">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="providers" className="px-8">
              <Package className="w-4 h-4 mr-2" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="influencers" className="px-8">
              <Users className="w-4 h-4 mr-2" />
              Influencers
            </TabsTrigger>
            <TabsTrigger value="customize" className="px-8">
              <Palette className="w-4 h-4 mr-2" />
              Customize
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <div className="aspect-video bg-orange-500/10 flex items-center justify-center relative">
                    {product.icon}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">{product.name}</h3>
                      <span className="text-orange-500 font-medium">
                        ${product.basePrice}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4">{product.description}</p>
                    <div className="space-y-2">
                      {product.customizationOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600">
                      Customize & Order
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers">
            <div className="grid gap-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Connect with Providers</h2>
                <p className="text-muted-foreground mb-6">
                  Partner with our verified merchandise providers to bring your designs to life
                </p>
                {/* Provider content will be implemented */}
              </Card>
            </div>
          </TabsContent>

          {/* Influencers Tab */}
          <TabsContent value="influencers">
            <div className="grid gap-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Influencer Marketplace</h2>
                <p className="text-muted-foreground mb-6">
                  Connect with influencers to promote your merchandise
                </p>
                {/* Influencer content will be implemented */}
              </Card>
            </div>
          </TabsContent>

          {/* Customize Tab */}
          <TabsContent value="customize">
            <div className="grid gap-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Design Studio</h2>
                <p className="text-muted-foreground mb-6">
                  Customize your merchandise with our interactive design tools
                </p>
                {/* Customization tools will be implemented */}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
