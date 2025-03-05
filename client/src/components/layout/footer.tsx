import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Youtube, 
  Music2, 
  TrendingUp, 
  MessageCircle, 
  Globe, 
  Instagram,
  ChevronRight,
  Box, 
  CircleDollarSign, 
  Brain,
  Gamepad2,
  Settings,
  Sparkles,
  Disc,
  Building2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Footer() {
  const { user } = useAuth();
  const isAdmin = user?.email === "convoycubano@gmail.com";
  
  return (
    <footer className="relative border-t bg-gradient-to-b from-background to-background/80 backdrop-blur-xl">
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-black/10" />
      <div className="container mx-auto px-4 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Platform Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/ai-agents">
                  <Button variant="link" className="p-0 h-auto font-normal">
                    <ChevronRight className="h-4 w-4 mr-2 text-orange-500" />
                    AI-Powered Marketing
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/dashboard">
                  <Button variant="link" className="p-0 h-auto font-normal">
                    <ChevronRight className="h-4 w-4 mr-2 text-orange-500" />
                    Content Management
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/analytics">
                  <Button variant="link" className="p-0 h-auto font-normal">
                    <ChevronRight className="h-4 w-4 mr-2 text-orange-500" />
                    Analytics Dashboard
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/pr">
                  <Button variant="link" className="p-0 h-auto font-normal">
                    <ChevronRight className="h-4 w-4 mr-2 text-orange-500" />
                    Audience Growth
                  </Button>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/virtual-record-label">
                  <Button variant="link" className="p-0 h-auto font-normal">
                    <Disc className="h-4 w-4 mr-2 text-orange-500" />
                    Virtual Record Label
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/record-label-services">
                  <Button variant="link" className="p-0 h-auto font-normal">
                    <Building2 className="h-4 w-4 mr-2 text-orange-500" />
                    Record Label Services
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/youtube-views">
                  <Button variant="link" className="p-0 h-auto font-normal">
                    <Youtube className="h-4 w-4 mr-2 text-orange-500" />
                    YouTube Views
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/instagram">
                  <Button variant="link" className="p-0 h-auto font-normal">
                    <Instagram className="h-4 w-4 mr-2 text-orange-500" />
                    Instagram Growth
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/promotion">
                  <Button variant="link" className="p-0 h-auto font-normal">
                    <Music2 className="h-4 w-4 mr-2 text-orange-500" />
                    Music Promotion
                  </Button>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Metafeed & Boostify</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  <Box className="h-4 w-4 mr-2" />
                  Metafeed Metaverse
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  <CircleDollarSign className="h-4 w-4 mr-2" />
                  Metafeed Token
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  <Music2 className="h-4 w-4 mr-2" />
                  One Artist One Token
                </Button>
              </li>
              <li>
                <Link href="/ecosystem">
                  <Button variant="link" className="p-0 h-auto font-normal">
                    <Globe className="h-4 w-4 mr-2" />
                    View Ecosystem
                  </Button>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Avat Pro & Boostify</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  <Brain className="h-4 w-4 mr-2" />
                  Hyper Realistic Avatars
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Unreal Engine
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  <Brain className="h-4 w-4 mr-2" />
                  Motion Capture
                </Button>
              </li>
              <li>
                <Link href="/ecosystem">
                  <Button variant="link" className="p-0 h-auto font-normal">
                    <Globe className="h-4 w-4 mr-2" />
                    View Partnership
                  </Button>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Boostify Music. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/terms">
                <Button variant="ghost" size="sm">
                  Terms
                </Button>
              </Link>
              <Link href="/privacy">
                <Button variant="ghost" size="sm">
                  Privacy
                </Button>
              </Link>
              <Link href="/cookies">
                <Button variant="ghost" size="sm">
                  Cookies
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/artist-generator">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 text-orange-500">
                    <Sparkles className="h-4 w-4" />
                    Artist Generator
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}