import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../../firebase';
import { Link, useLocation } from 'wouter';
import { useUser } from '../../hooks/use-user';
import { useNavigationVisibility } from '../../hooks/use-navigation-visibility';
import { 
  Users, Search, PieChart, FileText, Home, Music, Video, Rss, 
  ShoppingBag, Calendar, Headphones, Radio, Shield, ClipboardList, 
  LogOut, ChevronDown, ChevronUp, Settings, Menu, Globe, PhoneCall,
  Send, MessageSquare, Mic, Zap, Award, BookOpen, BarChart, MoveRight,
  User, BarChart2, Layers, Sparkles
} from "lucide-react";
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function Header() {
  const { user, logout } = useUser();
  const { isVisible, setIsVisible, toggle } = useNavigationVisibility();
  const [scrollY, setScrollY] = useState(0);
  const [showFullHeader, setShowFullHeader] = useState(true);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showHeaderHint, setShowHeaderHint] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Mostrar la pista para doble clic después de un tiempo
  useEffect(() => {
    // Solo en dispositivos móviles
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      const timer = setTimeout(() => {
        setShowHeaderHint(true);
      }, 3000);
      
      const hideTimer = setTimeout(() => {
        setShowHeaderHint(false);
      }, 10000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  // Actualizar la altura del header
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [isMenuExpanded, isVisible, showFullHeader]);

  // Manejar el scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Auto-colapsar el menú expandido al hacer scroll
      if (window.scrollY > 100 && isMenuExpanded) {
        setIsMenuExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuExpanded]);
  
  // Navegar al clic de botones
  const navigateTo = (path: string) => {
    // window.location.href = path;
    console.log("Navigating to", path);
  };

  // Elementos de navegación principales
  const mainNavigation = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Artist Dashboard", href: "/artist-dashboard", icon: BarChart },
    { name: "Campaigns", href: "/campaigns", icon: Rss },
    { name: "Marketing", href: "/marketing", icon: PieChart },
    { name: "Promotion", href: "/promotion", icon: MoveRight },
    { name: "YouTube", href: "/youtube-views", icon: Video },
  ];

  // Elementos de navegación destacados
  const featuredNavigation = [
    { name: "AI Tools", href: "/ai-tools", icon: Zap },
    { name: "Music", href: "/music-generator", icon: Music },
    { name: "Videos", href: "/videos", icon: Video },
  ];

  // Elementos de navegación secundarios - "More" section (páginas completas)
  const secondaryNavigation = [
    // Navegación principal existente
    { name: "Store", href: "/store", icon: ShoppingBag },
    { name: "Education", href: "/education", icon: BookOpen },
    { name: "PR", href: "/pr", icon: Send },
    
    // Artist Dashboard and Profile
    { name: "Artist Dashboard", href: "/artist-dashboard", icon: BarChart2 },
    { name: "Artist Profile", href: "/artist-profile", icon: User },
    
    // Secciones de afiliados e inversores
    { name: "Affiliates", href: "/affiliates", icon: Users },
    { name: "Affiliate Dashboard", href: "/affiliate-dashboard", icon: Users },
    { name: "Investors", href: "/investors", icon: Layers },
    { name: "Investors Dashboard", href: "/investors-dashboard", icon: BarChart },
    
    // Secciones de contenido y aprendizaje
    { name: "Boostify TV", href: "/boostify-tv", icon: Video },
    { name: "News", href: "/news", icon: Rss },
    { name: "Resources", href: "/resources", icon: FileText },
    { name: "Guides", href: "/guides", icon: BookOpen },
    { name: "Tips", href: "/tips", icon: MessageSquare },
    
    // Herramientas y servicios de música
    { name: "Record Label Services", href: "/record-label-services", icon: Headphones },
    { name: "Virtual Record Label", href: "/virtual-record-label", icon: Radio },
    { name: "Music Mastering", href: "/music-mastering", icon: Music },
    { name: "Music Generator", href: "/music-generator", icon: Music },
    { name: "Marketing Plan", href: "/marketing-plan", icon: BarChart },
    { name: "Music Distribution", href: "/music-distribution", icon: Music },
    
    // Redes sociales y promoción
    { name: "Instagram Boost", href: "/instagram-boost", icon: Rss },
    { name: "Spotify", href: "/spotify", icon: Music },
    { name: "YouTube Views", href: "/youtube-views", icon: Video },
    { name: "Tiktok", href: "/tiktok", icon: Video },
    { name: "Facebook", href: "/facebook", icon: Rss },
    { name: "Social Network", href: "/social-network", icon: Users },
    { name: "Firestore Social", href: "/firestore-social", icon: Users },
    
    // Herramientas de AI y creación
    { name: "AI Advisors", href: "/ai-advisors", icon: PhoneCall },
    { name: "AI Agents", href: "/ai-agents", icon: MessageSquare },
    { name: "AI Chat", href: "/ai-chat", icon: MessageSquare },
    { name: "Artist Image Advisor", href: "/artist-image-advisor", icon: FileText },
    { name: "Image Generator", href: "/image-generator", icon: FileText },
    { name: "Video Generator", href: "/video-generator", icon: Video },
    { name: "Face Swap", href: "/face-swap", icon: Users },
    { name: "Try On", href: "/try-on-page", icon: ShoppingBag },
    { name: "Real-time Translator", href: "/real-time-translator", icon: Globe },
    
    // Herramientas profesionales
    { name: "Producer Tools", href: "/producer-tools", icon: Music },
    { name: "Manager Tools", href: "/manager-tools", icon: Settings },
    { name: "Professional Editor", href: "/professional-editor", icon: FileText },
    { name: "Contracts", href: "/contracts", icon: FileText },
    { name: "Contacts", href: "/contacts", icon: Users },
    
    // Analytics y métricas
    { name: "Analytics", href: "/analytics", icon: BarChart },
    { name: "Analytics Dashboard", href: "/analytics-dashboard", icon: BarChart },
    { name: "Achievements", href: "/achievements-page", icon: Award },
    { name: "Smart Cards", href: "/smart-cards", icon: FileText },
    
    // Otras funcionalidades
    { name: "Tokenization", href: "/tokenization", icon: Shield },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Merchandise", href: "/merchandise", icon: ShoppingBag },
    { name: "NFT Marketplace", href: "/nft-marketplace", icon: BarChart },
    { name: "Creators Fund", href: "/creators-fund", icon: DollarSign },
    { name: "Plugins", href: "/plugins", icon: Settings },
    { name: "Tools", href: "/tools", icon: Settings },
    { name: "Ecosystem", href: "/ecosystem", icon: Globe },
    { name: "International", href: "/boostify-international", icon: Globe },
    
    // Información legal y de la plataforma
    { name: "Blog", href: "/blog", icon: FileText },
    { name: "Profile", href: "/profile", icon: Users },
    { name: "Account", href: "/account", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Privacy", href: "/privacy", icon: Shield },
    { name: "Terms", href: "/terms", icon: FileText },
    { name: "Cookies", href: "/cookies", icon: FileText },
  ];

  const isAdmin = user?.email === 'convoycubano@gmail.com';

  return (
    <>
      <header 
        ref={headerRef}
        className={`fixed top-0 z-50 w-full border-b border-border/40 bg-[#1B1B1B] transition-transform duration-300 ${
          !isVisible ? "-translate-y-full" : 
          scrollY > 50 && !showFullHeader ? "-translate-y-16" : "translate-y-0"
        }`}
        onDoubleClick={() => toggle()}>
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
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User avatar"}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                        <span className="text-sm font-medium text-orange-500">
                          {user?.displayName?.[0] || user?.email?.[0] || "U"}
                        </span>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1B1B1B] border-[#2A2A2A]">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.displayName && (
                        <p className="text-sm font-medium text-white">{user.displayName}</p>
                      )}
                      {user?.email && (
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
              aria-label={isMenuExpanded ? "Collapse navigation" : "Expand navigation"}
            >
              {isMenuExpanded 
                ? <ChevronUp className="h-5 w-5" /> 
                : <ChevronDown className="h-5 w-5" />
              }
            </button>
            
            {/* Fade indicators for vertical scroll */}
            <div className="absolute left-0 right-0 top-0 h-4 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute left-0 right-0 bottom-0 h-4 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
            
            {/* Double click indicator for mobile */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 sm:hidden">
              <span className={cn(
                "bg-orange-500/20 text-xs rounded-t-lg px-2 py-1 text-orange-500/70 transition-opacity duration-500",
                showHeaderHint ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                Doble clic para ocultar/mostrar
              </span>
            </div>
            
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

export default Header;