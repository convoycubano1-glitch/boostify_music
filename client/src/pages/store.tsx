import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { SiInstagram, SiFacebook, SiTelegram, SiTiktok, SiYoutube, SiX, SiLinkedin, SiPinterest } from "react-icons/si";
import {
  Download,
  Zap,
  Shield,
  Bot,
  Users,
  Settings,
  MessageCircle,
  Activity,
  ChevronRight,
  CheckCircle2
} from "lucide-react";

const products = [
  {
    id: 1,
    name: "InstagramPro Bot",
    description: "Advanced automation bot for organic Instagram growth",
    price: 49.99,
    platform: "instagram",
    features: [
      "Automated follow/unfollow",
      "Comment management",
      "Post scheduling",
      "Engagement analysis",
      "Custom audience filters"
    ],
    icon: SiInstagram,
    popular: true
  },
  {
    id: 2,
    name: "Facebook Growth Engine",
    description: "Complete automation for Facebook pages and groups",
    price: 59.99,
    platform: "facebook",
    features: [
      "Multi-page management",
      "Group automation",
      "Auto-responses",
      "Content scheduling",
      "Performance analytics"
    ],
    icon: SiFacebook
  },
  {
    id: 3,
    name: "TelegramMaster Bot",
    description: "Multi-purpose bot for Telegram management and growth",
    price: 39.99,
    platform: "telegram",
    features: [
      "Channel management",
      "Auto-responses",
      "Member analytics",
      "Spam filtering",
      "Message scheduling"
    ],
    icon: SiTelegram
  },
  {
    id: 4,
    name: "Instagram Engagement Pro",
    description: "Specialized bot for maximizing Instagram engagement",
    price: 44.99,
    platform: "instagram",
    features: [
      "AI comment management",
      "Smart auto-liking",
      "Hashtag analysis",
      "Detailed reporting",
      "Custom engagement"
    ],
    icon: SiInstagram
  },
  {
    id: 5,
    name: "Facebook Ads Assistant",
    description: "Bot for Facebook ad optimization and management",
    price: 69.99,
    platform: "facebook",
    features: [
      "Campaign optimization",
      "Audience analysis",
      "Automated A/B testing",
      "ROI reporting",
      "Budget adjustment"
    ],
    icon: SiFacebook
  },
  {
    id: 6,
    name: "Telegram Business Bot",
    description: "Advanced business bot for Telegram",
    price: 49.99,
    platform: "telegram",
    features: [
      "Integrated CRM",
      "AI chatbot",
      "Sales automation",
      "Conversion tracking",
      "Payment integration"
    ],
    icon: SiTelegram
  },
  {
    id: 7,
    name: "Instagram Story Pro",
    description: "Specialized bot for Story automation",
    price: 34.99,
    platform: "instagram",
    features: [
      "Story scheduling",
      "View analytics",
      "Auto-responses",
      "Auto highlights",
      "Advanced statistics"
    ],
    icon: SiInstagram
  },
  {
    id: 8,
    name: "Social Media Suite",
    description: "Complete bot suite for all platforms",
    price: 99.99,
    platform: "all",
    features: [
      "Multi-platform management",
      "Unified dashboard",
      "Cross-platform automation",
      "Integrated analytics",
      "Priority support"
    ],
    icon: Bot,
    premium: true
  },
  {
    id: 9,
    name: "TikTok Growth Pro",
    description: "Advanced automation for TikTok growth and engagement",
    price: 54.99,
    platform: "tiktok",
    features: [
      "Trend analysis",
      "Content scheduling",
      "Hashtag optimization",
      "Engagement automation",
      "Performance tracking"
    ],
    icon: SiTiktok,
    popular: true
  },
  {
    id: 10,
    name: "YouTube Channel Manager",
    description: "Comprehensive bot for YouTube channel growth",
    price: 64.99,
    platform: "youtube",
    features: [
      "Comment management",
      "Video optimization",
      "Subscriber growth",
      "Analytics dashboard",
      "SEO automation"
    ],
    icon: SiYoutube
  },
  {
    id: 11,
    name: "X Engagement Bot",
    description: "Smart automation for X (formerly Twitter) growth and engagement",
    price: 44.99,
    platform: "x",
    features: [
      "Tweet scheduling",
      "Auto-engagement",
      "Follower growth",
      "Analytics tools",
      "Content curation"
    ],
    icon: SiX
  },
  {
    id: 12,
    name: "LinkedIn Business Pro",
    description: "Professional automation for LinkedIn growth",
    price: 79.99,
    platform: "linkedin",
    features: [
      "Connection automation",
      "Content scheduling",
      "Lead generation",
      "Profile optimization",
      "Business analytics"
    ],
    icon: SiLinkedin,
    premium: true
  },
  {
    id: 13,
    name: "Pinterest Growth Engine",
    description: "Automated Pinterest marketing and management",
    price: 49.99,
    platform: "pinterest",
    features: [
      "Pin scheduling",
      "Board management",
      "Traffic analysis",
      "SEO optimization",
      "Engagement tracking"
    ],
    icon: SiPinterest
  },
  {
    id: 14,
    name: "Cross-Platform Analytics",
    description: "Unified analytics for all social media platforms",
    price: 89.99,
    platform: "all",
    features: [
      "Multi-platform tracking",
      "Performance comparison",
      "ROI calculation",
      "Custom reporting",
      "Trend analysis"
    ],
    icon: Activity
  },
  {
    id: 15,
    name: "Social CRM Pro",
    description: "Advanced CRM system for social media management",
    price: 74.99,
    platform: "all",
    features: [
      "Lead tracking",
      "Customer segmentation",
      "Automated responses",
      "Campaign management",
      "Integration APIs"
    ],
    icon: Users
  },
  {
    id: 16,
    name: "Enterprise Social Suite",
    description: "Complete enterprise solution for social media automation",
    price: 149.99,
    platform: "all",
    features: [
      "Full platform access",
      "Priority support",
      "Custom development",
      "Advanced security",
      "Team collaboration"
    ],
    icon: Shield,
    premium: true
  }
];

export default function StorePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Automation{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                  Store
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Power up your social media presence with our automation bots. Optimize your time and maximize your results.
              </p>
            </motion.div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="relative p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-orange-500/5 border-orange-500/20 hover:border-orange-500/40">
                  {product.popular && (
                    <Badge className="absolute top-4 right-4 bg-orange-500">Popular</Badge>
                  )}
                  {product.premium && (
                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-purple-500">Premium</Badge>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                      <product.icon className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    {product.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-orange-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">${product.price}</span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
                        {product.platform === 'all' ? 'All platforms' :
                          product.platform.charAt(0).toUpperCase() + product.platform.slice(1)}
                      </Badge>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Purchase Now
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Features Section */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold mb-10">
              Why Choose Our{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                Bots
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Zap, title: "High Performance", description: "Optimized for maximum efficiency" },
                { icon: Shield, title: "100% Secure", description: "Compliant with all regulations" },
                { icon: Users, title: "24/7 Support", description: "Technical team always available" },
                { icon: Activity, title: "Updates", description: "Continuous improvements guaranteed" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-6 rounded-xl bg-orange-500/5 border border-orange-500/20"
                >
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                      <feature.icon className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}