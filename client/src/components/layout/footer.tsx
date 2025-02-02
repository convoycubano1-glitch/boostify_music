import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Youtube, 
  Music2, 
  TrendingUp, 
  MessageCircle, 
  Globe, 
  Instagram,
  ChevronRight
} from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t bg-gradient-to-b from-background to-background/80 backdrop-blur-xl">
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-black/10" />
      <div className="container mx-auto px-4 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Platform Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 mr-2 text-orange-500" />
                <span>AI-Powered Marketing</span>
              </li>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 mr-2 text-orange-500" />
                <span>Content Management</span>
              </li>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 mr-2 text-orange-500" />
                <span>Analytics Dashboard</span>
              </li>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 mr-2 text-orange-500" />
                <span>Audience Growth</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center">
                <Youtube className="h-4 w-4 mr-2 text-orange-500" />
                <span>YouTube Views Boost</span>
              </li>
              <li className="flex items-center">
                <Instagram className="h-4 w-4 mr-2 text-orange-500" />
                <span>Instagram Growth</span>
              </li>
              <li className="flex items-center">
                <Music2 className="h-4 w-4 mr-2 text-orange-500" />
                <span>Music Promotion</span>
              </li>
              <li className="flex items-center">
                <Globe className="h-4 w-4 mr-2 text-orange-500" />
                <span>Global Reach</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  Success Stories
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  Artist Guide
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  Marketing Tips
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  Blog
                </Button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  Support
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  Sales
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto font-normal">
                  Partnerships
                </Button>
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
              <Button variant="ghost" size="sm">
                Terms
              </Button>
              <Button variant="ghost" size="sm">
                Privacy
              </Button>
              <Button variant="ghost" size="sm">
                Cookies
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
