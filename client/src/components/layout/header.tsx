import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Music2, BarChart2, FileText, Radio, Settings, Menu, Youtube, Instagram, Home, Users, Mic, Briefcase, Wrench, Video, Building2, Brain, Store, Shield, Globe, Tv, GraduationCap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useEffect } from "react";
import { useLanguageDetection } from "@/hooks/use-language-detection";

export function Header() {
  const { user } = useAuth();
  const { logout } = useFirebaseAuth();
  const { detectedLanguage } = useLanguageDetection();

  useEffect(() => {
    // Wait for Google Translate script to load
    const initTranslate = () => {
      if (window.google && window.google.translate) {
        const translateElement = document.getElementById('google_translate_element');
        if (translateElement && translateElement.innerHTML === '') {
          console.log('Initializing Google Translate');
          window.googleTranslateElementInit();
        }
      } else {
        console.log('Google Translate not loaded yet, retrying...');
        setTimeout(initTranslate, 500);
      }
    };

    initTranslate();
  }, [detectedLanguage]); // Re-init when language changes

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart2 },
    { name: "Artist Dashboard", href: "/artist-dashboard", icon: Mic },
    { name: "Manager Tools", href: "/manager-tools", icon: Briefcase },
    { name: "Producer Tools", href: "/producer-tools", icon: Wrench },
    { name: "Music Videos", href: "/music-video-creator", icon: Video },
    { name: "Education", href: "/education", icon: GraduationCap },
    { name: "Boostify TV", href: "/boostify-tv", icon: Tv },
    { name: "Record Labels", href: "/record-label-services", icon: Building2 },
    { name: "AI Agents", href: "/ai-agents", icon: Brain },
    { name: "Store", href: "/store", icon: Store, highlight: true },
    { name: "Artist Image", href: "/artist-image-advisor", icon: Users },
    { name: "Merch", href: "/merchandise", icon: Store },
    { name: "Spotify", href: "/spotify", icon: Music2 },
    { name: "Instagram", href: "/instagram-boost", icon: Instagram },
    { name: "YouTube", href: "/youtube-views", icon: Youtube },
    { name: "Contracts", href: "/contracts", icon: FileText },
    { name: "PR", href: "/pr", icon: Radio },
    { name: "Contacts", href: "/contacts", icon: Users },
  ];

  if (!user) return null;

  const isAdmin = user?.email === 'admin@example.com' || user?.email?.includes('admin');

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
              <img
                src="/assets/freepik__boostify-music___orange__una_forma_con_estilo (1).png"
                alt="Boostify Music"
                className="h-6 w-6"
              />
              <div className="hidden lg:block">
                <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                  Boostify
                </span>
                <span className="text-[10px] block text-muted-foreground -mt-1">
                  Music Marketing Platform
                </span>
              </div>
            </Link>

            <Link href="/">
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Home className="h-4 w-4" />
              </Button>
            </Link>

            <nav className="hidden lg:flex items-center space-x-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center text-xs font-medium transition-colors hover:text-orange-500 ${
                    item.highlight ? 'text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full' : 'px-1'
                  }`}
                >
                  <item.icon className="mr-1 h-3 w-3" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/boostify-international">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 gap-1 text-xs h-8">
                <Globe className="h-3 w-3" />
                <span className="hidden sm:inline">Boostify International</span>
                <span className="sm:hidden">Int'l</span>
              </Button>
            </Link>

            <div
              id="google_translate_element"
              className="min-w-[100px] flex items-center justify-center bg-background/80 rounded-md px-2 h-8"
            ></div>

            {isAdmin && (
              <Link href="/admin">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 gap-1 text-xs h-8">
                  <Shield className="h-3 w-3" />
                  <span className="hidden sm:inline">Admin Panel</span>
                  <span className="sm:hidden">Admin</span>
                </Button>
              </Link>
            )}

            <Link href="/settings">
              <Button variant="ghost" size="icon" className="hidden lg:flex h-8 w-8">
                <Settings className="h-3 w-3" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-3 w-3" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px] max-h-[80vh] overflow-y-auto">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <DropdownMenuItem className={`py-2 text-xs ${
                      item.highlight ? 'text-orange-500 bg-orange-500/10' : ''
                    }`}>
                      <item.icon className="mr-2 h-3 w-3" />
                      <span>{item.name}</span>
                    </DropdownMenuItem>
                  </Link>
                ))}
                <DropdownMenuItem onSelect={() => logout()} className="py-2 text-xs">
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-7 w-7 rounded-full">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User avatar"}
                      className="h-7 w-7 rounded-full"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/10">
                      <span className="text-xs font-medium text-orange-500">
                        {user.displayName?.[0] || user.email?.[0] || "U"}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.displayName && (
                      <p className="text-xs font-medium">{user.displayName}</p>
                    )}
                    {user.email && (
                      <p className="text-[10px] text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="text-xs">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => logout()} className="text-xs">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}