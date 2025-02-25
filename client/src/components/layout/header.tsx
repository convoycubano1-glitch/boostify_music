import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Music2, BarChart2, FileText, Radio, Settings, Menu, Youtube, Instagram, Home, Users, Mic, Briefcase, Wrench, Video, Building2, Brain, Store, Shield, Globe, Tv, GraduationCap, DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useEffect, useState } from "react";
import { useLanguageDetection } from "@/hooks/use-language-detection";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

export function Header() {
  const { user } = useAuth();
  const { logout } = useFirebaseAuth();
  const { detectedLanguage } = useLanguageDetection();
  const { scrollDirection, scrollY } = useScrollDirection();
  const [showFullHeader, setShowFullHeader] = useState(true);

  // Handle scroll effect for header
  useEffect(() => {
    if (scrollY > 50) {
      if (scrollDirection === "down") {
        setShowFullHeader(false);
      } else {
        setShowFullHeader(true);
      }
    } else {
      setShowFullHeader(true);
    }
  }, [scrollDirection, scrollY]);
  
  useEffect(() => {
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
  }, [detectedLanguage]);

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
    { name: "Store", href: "/store", icon: Store, highlight: true }
  ];

  const secondaryNavigation = [
    { name: "Artist Image", href: "/artist-image-advisor", icon: Users },
    { name: "Merch", href: "/merchandise", icon: Store },
    { name: "Spotify", href: "/spotify", icon: Music2 },
    { name: "Instagram", href: "/instagram-boost", icon: Instagram },
    { name: "YouTube", href: "/youtube-views", icon: Youtube },
    { name: "Contracts", href: "/contracts", icon: FileText },
    { name: "PR", href: "/pr", icon: Radio },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Inversores", href: "/investors-dashboard", icon: DollarSign, highlight: true },
  ];

  if (!user) return null;

  const isAdmin = user?.email === 'convoycubano@gmail.com';

  return (
    <>
      <header className={`fixed top-0 z-50 w-full border-b border-border/40 bg-[#1B1B1B] transition-transform duration-300 ${
        scrollY > 50 && !showFullHeader ? "-translate-y-16" : "translate-y-0"
      }`}>
        <div className="container flex h-16 max-w-screen-2xl items-center">
          <div className="flex flex-1 items-center justify-between space-x-4">
            {/* Logo section */}
            <Link href="/" className="flex items-center space-x-3">
              <img
                src="/assets/freepik__boostify_music_organe_abstract_icon.png"
                alt="Boostify Music"
                className="h-8 w-8"
              />
              <div className="hidden md:block">
                <span className="text-lg font-bold text-white">
                  Boostify
                </span>
              </div>
            </Link>

            {/* Primary Navigation - Now always hidden */}
            <nav className="hidden items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium transition-colors hover:text-orange-500 ${
                    item.highlight ? 'text-orange-500' : 'text-gray-200'
                  }`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Search - Removed */}

              {/* International */}
              <Link href="/boostify-international">
                <Button size="sm" variant="ghost" className="text-white hover:bg-[#2A2A2A] gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">International</span>
                </Button>
              </Link>

              {/* Google Translate */}
              <div
                id="google_translate_element"
                className="hidden sm:flex items-center justify-center bg-[#2A2A2A] rounded-md px-2 h-9"
              />

              {/* Admin Panel */}
              {isAdmin && (
                <Link href="/admin">
                  <Button size="sm" variant="ghost" className="text-white hover:bg-[#2A2A2A] gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
              )}

              {/* Settings - Now always hidden, moved to menu dropdown only */}

              {/* Hamburger Menu - Always visible */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-[#2A2A2A]">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px] bg-[#1B1B1B] border-[#2A2A2A]">
                  {[...navigation, ...secondaryNavigation].map((item) => (
                    <Link key={item.name} href={item.href}>
                      <DropdownMenuItem className="py-2 text-sm text-gray-200 hover:bg-[#2A2A2A] hover:text-orange-500">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                  
                  {/* Settings link */}
                  <Link href="/settings">
                    <DropdownMenuItem className="py-2 text-sm text-gray-200 hover:bg-[#2A2A2A] hover:text-orange-500">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  
                  {/* Admin panel link - only visible to admins */}
                  {isAdmin && (
                    <Link href="/admin">
                      <DropdownMenuItem className="py-2 text-sm text-gray-200 hover:bg-[#2A2A2A] hover:text-orange-500">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    </Link>
                  )}
                  
                  <DropdownMenuItem 
                    onSelect={() => logout()} 
                    className="py-2 text-sm text-gray-200 hover:bg-[#2A2A2A]"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User avatar"}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                        <span className="text-sm font-medium text-orange-500">
                          {user.displayName?.[0] || user.email?.[0] || "U"}
                        </span>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1B1B1B] border-[#2A2A2A]">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.displayName && (
                        <p className="text-sm font-medium text-white">{user.displayName}</p>
                      )}
                      {user.email && (
                        <p className="text-xs text-gray-400">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="text-sm text-gray-200 hover:bg-[#2A2A2A]">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={() => logout()} 
                    className="text-sm text-gray-200 hover:bg-[#2A2A2A]"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Bar - Inspired by Freepik */}
        <div className="border-t border-border/40 bg-black/80 backdrop-blur-sm">
          <div className="container flex h-8 max-w-screen-2xl items-center">
            <nav className="flex items-center justify-between w-full px-4">
              {[...navigation, ...secondaryNavigation].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/5 transition-colors"
                  title={item.name}
                >
                  <item.icon 
                    className="h-3.5 w-3.5 text-orange-500 transition-all duration-300 group-hover:text-orange-400 group-hover:drop-shadow-[0_0_3px_rgba(249,115,22,0.5)]" 
                  />
                </Link>
              ))}
              
              {/* Admin Icon - Only visible to admins */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="group flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/5 transition-colors"
                  title="Admin Panel"
                >
                  <Shield 
                    className="h-3.5 w-3.5 text-orange-500 transition-all duration-300 group-hover:text-orange-400 group-hover:drop-shadow-[0_0_3px_rgba(249,115,22,0.5)]" 
                  />
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
      {/* Spacer to prevent content from hiding under the fixed header */}
      <div className="h-[96px]" />
    </>
  );
}