import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Music2, BarChart2, FileText, Radio, Settings, Menu, Youtube, Instagram, Home, Users, Mic, Briefcase, Wrench, Video, Building2, Brain, Store, Shield, Globe, Tv, GraduationCap, DollarSign, Share2, PhoneCall, MessageCircle, MessageSquare, Disc, ChevronDown, ChevronUp, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useEffect, useState, useRef } from "react";
import { useLanguageDetection } from "@/hooks/use-language-detection";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { cn } from "@/lib/utils";

export function Header() {
  const { user } = useAuth();
  const { logout } = useFirebaseAuth();
  const { detectedLanguage } = useLanguageDetection();
  const { scrollDirection, scrollY } = useScrollDirection();
  const [showFullHeader, setShowFullHeader] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(280);
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

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
  
  // Default state for menu expansion
  useEffect(() => {
    // Start with expanded menu on desktop, collapsed on mobile
    const isMobile = window.innerWidth < 768;
    setIsMenuExpanded(!isMobile);
    
    // Update menu expansion state on window resize
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMenuExpanded(!isMobile);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Track header height and update spacer
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
      }
    };

    // Update header height on mount and window resize
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    // Also update after a short delay to account for DOM manipulation
    const timerId = setTimeout(updateHeaderHeight, 500);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      clearTimeout(timerId);
    };
  }, []);

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

  // Grupos de navegación para una mejor organización
  const featuredNavigation = [
    { name: "Virtual Record Label", href: "/virtual-record-label", icon: Disc, highlight: true },
    { name: "AI Advisors", href: "/ai-advisors", icon: PhoneCall, highlight: true },
    { name: "Store", href: "/store", icon: Store, highlight: true },
    { name: "Affiliates", href: "/affiliates", icon: Share2, highlight: true },
    { name: "Investors", href: "/investors-dashboard", icon: DollarSign, highlight: true },
  ];

  const mainNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart2 },
    { name: "Artist Dashboard", href: "/artist-dashboard", icon: Mic },
    { name: "Manager Tools", href: "/manager-tools", icon: Briefcase },
    { name: "Producer Tools", href: "/producer-tools", icon: Wrench },
    { name: "Music Videos", href: "/music-video-creator", icon: Video },
  ];
  
  const secondaryNavigation = [
    { name: "Education", href: "/education", icon: GraduationCap },
    { name: "Boostify TV", href: "/boostify-tv", icon: Tv },
    { name: "Record Labels", href: "/record-label-services", icon: Building2 },
    { name: "AI Agents", href: "/ai-agents", icon: Brain },
    { name: "Artist Image", href: "/artist-image-advisor", icon: Users },
    { name: "Merch", href: "/merchandise", icon: Store },
    { name: "Spotify", href: "/spotify", icon: Music2 },
    { name: "Instagram", href: "/instagram-boost", icon: Instagram },
    { name: "YouTube", href: "/youtube-views", icon: Youtube },
    { name: "Contracts", href: "/contracts", icon: FileText },
    { name: "PR", href: "/pr", icon: Radio },
    { name: "Contacts", href: "/contacts", icon: Users },
  ];

  // Navigation agrupado para la interfaz de móvil
  const allNavigation = [
    { title: "Featured", items: featuredNavigation },
    { title: "Main", items: mainNavigation },
    { title: "More", items: secondaryNavigation },
  ];

  if (!user) return null;

  const isAdmin = user?.email === 'convoycubano@gmail.com';

  return (
    <>
      <header 
        ref={headerRef}
        className={`fixed top-0 z-50 w-full border-b border-border/40 bg-[#1B1B1B] transition-transform duration-300 ${
          scrollY > 50 && !showFullHeader ? "-translate-y-16" : "translate-y-0"
        }`}>
        <div className="container flex h-16 max-w-screen-2xl items-center">
          <div className="flex flex-1 items-center justify-between space-x-4">
            {/* Logo section - now navigates to home page */}
            <Link href="/home" className="flex items-center space-x-3">
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
              {[...mainNavigation, ...featuredNavigation].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium transition-colors hover:text-orange-500 ${
                    featuredNavigation.some(i => i.name === item.name) ? 'text-orange-500' : 'text-gray-200'
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

              {/* Globe Icon - Now navigates to International */}
              <Link href="/boostify-international">
                <Button size="sm" variant="ghost" className="text-white hover:bg-[#2A2A2A] p-2">
                  <Globe className="h-4 w-4" />
                </Button>
              </Link>
              
              {/* Social Network Icon (Firestore) - Now using MessageSquare */}
              <Link href="/firestore-social">
                <Button size="sm" variant="ghost" className="text-white hover:bg-[#2A2A2A] p-2 mr-2 relative group">
                  <MessageSquare className="h-5 w-5 text-orange-400" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                  <span className="absolute hidden group-hover:block -bottom-10 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-xs">
                    Social Network
                  </span>
                </Button>
              </Link>
              
              {/* International Text Link to International Page */}
              <Link href="/boostify-international" className="hidden sm:block">
                <Button size="sm" variant="ghost" className="text-white hover:bg-[#2A2A2A]">
                  <span>International</span>
                </Button>
              </Link>

              {/* AI Advisors with orange highlight */}
              <Link href="/ai-advisors">
                <Button size="sm" variant="ghost" className="text-orange-500 hover:bg-orange-500/10 gap-2">
                  <PhoneCall className="h-4 w-4 text-orange-500" />
                  <span className="hidden sm:inline">AI Advisors</span>
                </Button>
              </Link>

              {/* Settings */}
              <Link href="/settings">
                <Button size="sm" variant="ghost" className="text-white hover:bg-[#2A2A2A] gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
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

              {/* Hamburger Menu - Always visible */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-[#2A2A2A]">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px] bg-[#1B1B1B] border-[#2A2A2A]">
                  {/* Agrupación del menú desplegable por categorías */}
                  <div className="py-1 px-3 text-xs text-orange-500 font-semibold">Featured</div>
                  {featuredNavigation.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <DropdownMenuItem className="py-2 text-sm text-gray-200 hover:bg-[#2A2A2A] hover:text-orange-500">
                        <item.icon className="mr-2 h-4 w-4 text-orange-500" />
                        {item.name}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                  
                  <div className="py-1 px-3 text-xs text-gray-400 font-semibold border-t border-gray-800 mt-1">Main</div>
                  {mainNavigation.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <DropdownMenuItem className="py-2 text-sm text-gray-200 hover:bg-[#2A2A2A] hover:text-orange-500">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                  
                  <div className="py-1 px-3 text-xs text-gray-400 font-semibold border-t border-gray-800 mt-1">More</div>
                  {secondaryNavigation.map((item) => (
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

        {/* Secondary Navigation Bar - Inspired by Freepik with Vertical Scroll */}
        <div className="border-t border-border/40 bg-black/80 backdrop-blur-sm relative">
          <div className="container max-w-screen-2xl relative">
            {/* Toggle expand/collapse button */}
            <button 
              onClick={() => setIsMenuExpanded(!isMenuExpanded)}
              className="absolute right-3 top-1 z-20 text-gray-300 hover:text-orange-500 transition-colors"
            >
              {isMenuExpanded 
                ? <ChevronUp className="h-5 w-5" /> 
                : <ChevronDown className="h-5 w-5" />
              }
            </button>
            
            {/* Fade indicators for vertical scroll */}
            <div className="absolute left-0 right-0 top-0 h-4 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute left-0 right-0 bottom-0 h-4 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
            
            <nav className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 px-3 py-3 transition-all duration-300 ${
              isMenuExpanded ? 'max-h-[240px]' : 'max-h-[65px]'
            } overflow-y-auto mobile-tabs-container`}>
              {/* Featured navigation items first with highlight */}
              {featuredNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-black/40 text-orange-500 font-medium text-xs hover:text-orange-400 transition-colors touch-target"
                >
                  <item.icon 
                    className="h-5 w-5 mb-1 text-orange-500 drop-shadow-[0_0_3px_rgba(249,115,22,0.5)]" 
                  />
                  <span className="text-center">{item.name}</span>
                </Link>
              ))}
              
              {/* Main navigation items */}
              {mainNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-black/40 text-gray-300 text-xs hover:text-orange-400 transition-colors touch-target"
                >
                  <item.icon className="h-5 w-5 mb-1 text-gray-300" />
                  <span className="text-center">{item.name}</span>
                </Link>
              ))}
              
              {/* Secondary navigation items */}
              {secondaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-black/40 text-gray-300 text-xs hover:text-orange-400 transition-colors touch-target"
                >
                  <item.icon className="h-5 w-5 mb-1 text-gray-300" />
                  <span className="text-center">{item.name}</span>
                </Link>
              ))}
              
              {/* Settings Link */}
              <Link
                href="/settings"
                className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-black/40 text-gray-300 text-xs hover:text-orange-400 transition-colors"
              >
                <Settings className="h-5 w-5 mb-1 text-gray-300" />
                <span className="text-center">Settings</span>
              </Link>
              
              {/* Admin Icon - Only visible to admins */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-black/40 text-gray-300 text-xs hover:text-orange-400 transition-colors"
                >
                  <Shield className="h-5 w-5 mb-1 text-gray-300" />
                  <span className="text-center">Admin</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
      {/* Spacer to prevent content from hiding under the fixed header */}
      <div style={{ height: `${headerHeight}px` }} className="transition-all duration-300" />
    </>
  );
}