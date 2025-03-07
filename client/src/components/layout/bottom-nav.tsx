import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Video, Music2, Bot, User, Radio, Menu, ChevronLeft, ChevronRight, Mic, BarChart, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigationVisibility } from "@/hooks/use-navigation-visibility";

export function BottomNav() {
  const [location] = useLocation();
  const [showRadioIndicator, setShowRadioIndicator] = useState(false);
  const [showAllNav, setShowAllNav] = useState(false);
  const { isVisible, setIsVisible, toggle } = useNavigationVisibility();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const lastClickTimeRef = useRef<number>(0);
  const doubleClickThreshold = 300; // ms

  // Todos los elementos de navegación
  const allNavItems = [
    {
      title: "Home",
      icon: Home,
      href: "/dashboard",
    },
    {
      title: "Video",
      icon: Video,
      href: "/music-video-creator",
    },
    {
      title: "Music",
      icon: Music2,
      href: "/producer-tools",
    },
    {
      title: "Social",
      icon: MessageSquare,
      href: "/firestore-social",
    },
    {
      title: "Stats",
      icon: BarChart,
      href: "/analytics-dashboard",
    },
    {
      title: "Artist",
      icon: Mic,
      href: "/artist-dashboard",
    },
    {
      title: "AI",
      icon: Bot,
      href: "/ai-agents",
    },
    {
      title: "Profile",
      icon: User,
      href: "/profile",
    },
  ];

  // Listen for radio toggle event
  useEffect(() => {
    const handleRadioToggle = () => {
      setShowRadioIndicator(true);
      setTimeout(() => setShowRadioIndicator(false), 3000);
    };
    
    window.addEventListener('toggle-radio', handleRadioToggle);
    
    return () => {
      window.removeEventListener('toggle-radio', handleRadioToggle);
    };
  }, []);

  // Double-click handler implementado en el hook global useNavigationVisibility
  // Ya no necesitamos el manejo local de doble clic, ya que ahora está centralizado
  // en el hook que afecta a todos los componentes de navegación

  // Handle showing navigation by swiping up from bottom
  useEffect(() => {
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const diff = touchStartY - touchY;
      
      // Detect swipe up from bottom
      if (diff > 50 && touchStartY > window.innerHeight - 50 && !isVisible) {
        setIsVisible(true);
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isVisible, setIsVisible]);

  // Scroll controls for horizontal navigation
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  // Toggle between compact and expanded views
  const toggleAllNav = () => {
    setShowAllNav(!showAllNav);
  };

  // State para mostrar el mensaje de ayuda temporal
  const [showHelpToast, setShowHelpToast] = useState(true);
  
  // Efecto para ocultar el mensaje de ayuda después de unos segundos
  useEffect(() => {
    if (showHelpToast) {
      const timer = setTimeout(() => {
        setShowHelpToast(false);
      }, 5000); // 5 segundos
      
      return () => clearTimeout(timer);
    }
  }, [showHelpToast]);
  
  return (
    <>
      {/* Navigation bar - adaptable for mobile */}
      <div 
        ref={navRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300",
          !isVisible ? "translate-y-full" : "translate-y-0"
        )}
      >
        {/* Hidden navigation indicator - visible when nav is hidden */}
        {!isVisible && (
          <div 
            className="absolute -top-6 left-0 right-0 flex justify-center"
            onClick={() => setIsVisible(true)}
          >
            <div className="bg-black/90 rounded-t-lg px-6 py-1 border-t border-x border-orange-500/30">
              <ChevronLeft className="w-5 h-5 text-orange-500/70 transform -rotate-90" />
            </div>
          </div>
        )}
        
        <nav className="bg-black/90 backdrop-blur-lg border-t border-orange-500/20 shadow-lg">
          <div className="relative max-w-screen-xl mx-auto">
            {/* Expanded view - shows all navigation items in a horizontally scrollable container */}
            {showAllNav && (
              <div className="px-2 py-4 overflow-hidden bg-black/95">
                <div className="flex items-center">
                  <button 
                    onClick={scrollLeft} 
                    className="scroll-control flex-shrink-0 p-2 z-10 bg-gradient-to-r from-black to-transparent pr-4"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  
                  <div 
                    ref={scrollContainerRef}
                    className="horizontal-scroll-container flex-1 overflow-x-auto scrollbar-hide flex items-center space-x-3 px-1 py-2"
                  >
                    {allNavItems.map((item) => (
                      <Link key={item.title} href={item.href} className="horizontal-scroll-item">
                        <div className={cn(
                          "nav-btn flex-shrink-0 flex flex-col items-center p-3 min-w-[5rem] rounded-lg",
                          location === item.href ? "nav-btn-active" : ""
                        )}>
                          <div className="relative flex items-center justify-center">
                            <item.icon
                              className={cn(
                                "w-7 h-7 transition-all duration-300",
                                location === item.href
                                  ? "text-orange-500"
                                  : "text-muted-foreground"
                              )}
                            />
                            {location === item.href && (
                              <div className="absolute -inset-2 bg-orange-500/20 rounded-full blur animate-pulse" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium transition-colors duration-300 whitespace-nowrap mt-2",
                              location === item.href
                                ? "text-orange-500"
                                : "text-muted-foreground"
                            )}
                          >
                            {item.title}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  <button 
                    onClick={scrollRight} 
                    className="scroll-control flex-shrink-0 p-2 z-10 bg-gradient-to-l from-black to-transparent pl-4"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="absolute bottom-0 w-full flex justify-center">
                  <button
                    onClick={toggleAllNav}
                    className="nav-toggle mb-[-0.75rem] bg-black border-2 border-orange-500/50 rounded-full p-2 text-orange-500"
                    aria-label="Close expanded navigation"
                  >
                    <ChevronLeft className="w-5 h-5 transform rotate-90" />
                  </button>
                </div>
              </div>
            )}

            {/* Compact view - shows limited navigation items */}
            {!showAllNav && (
              <div className="flex items-center justify-between px-3 py-3">
                {/* First 4 primary navigation items */}
                {allNavItems.slice(0, 4).map((item) => (
                  <Link key={item.title} href={item.href} className="mobile-nav-item">
                    <div className={cn(
                      "nav-btn flex flex-col items-center p-2 min-w-[4.5rem] rounded-lg",
                      location === item.href ? "nav-btn-active" : ""
                    )}>
                      <div className="relative flex items-center justify-center">
                        <item.icon
                          className={cn(
                            "w-6 h-6 transition-all duration-300",
                            location === item.href
                              ? "text-orange-500"
                              : "text-muted-foreground"
                          )}
                        />
                        {location === item.href && (
                          <div className="absolute -inset-1 bg-orange-500/20 rounded-full blur animate-pulse" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium mt-1 transition-colors duration-300",
                          location === item.href
                            ? "text-orange-500"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.title}
                      </span>
                    </div>
                  </Link>
                ))}
                
                {/* More button - shows expanded menu with all options */}
                <button
                  onClick={toggleAllNav}
                  className="mobile-nav-item nav-btn flex flex-col items-center p-2 min-w-[4.5rem] rounded-lg"
                  aria-label="Show more navigation options"
                >
                  <div className="relative flex items-center justify-center">
                    <Menu className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium mt-1 text-muted-foreground">
                    More
                  </span>
                </button>
                
                {/* Radio button */}
                <button
                  className="mobile-nav-item nav-btn flex flex-col items-center p-2 min-w-[4.5rem] rounded-lg"
                  onClick={() => window.dispatchEvent(new CustomEvent('toggle-radio'))}
                  aria-label="Toggle radio"
                >
                  <div className="relative flex items-center justify-center">
                    <Radio 
                      className={cn(
                        "w-6 h-6 transition-all duration-300",
                        showRadioIndicator 
                          ? "text-orange-500" 
                          : "text-muted-foreground hover:text-orange-500"
                      )}
                    />
                    {showRadioIndicator && (
                      <div className="absolute -inset-1 bg-orange-500/20 rounded-full blur animate-pulse" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium mt-1 transition-colors duration-300",
                    showRadioIndicator 
                      ? "text-orange-500" 
                      : "text-muted-foreground"
                  )}>
                    Radio
                  </span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
      
      {/* Toast message for double-click instruction - shown briefly on load */}
      <div className={cn(
        "toast-notification fixed bottom-28 left-0 right-0 mx-auto w-max py-3 px-6 bg-black/90 backdrop-blur-md border border-orange-500/40 rounded-lg text-white text-sm shadow-lg transition-opacity duration-500 z-50 flex items-center space-x-2",
        (showHelpToast && isVisible) ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <span className="bg-orange-500/20 rounded-full p-1">
          <ChevronLeft className="w-4 h-4 text-orange-500" />
        </span>
        <span>Doble clic para ocultar/mostrar menú</span>
      </div>
    </>
  );
}