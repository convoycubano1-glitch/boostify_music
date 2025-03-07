import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Video, Music2, Bot, User, Radio, Menu, ChevronLeft, ChevronRight, Mic, BarChart2, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function BottomNav() {
  const [location] = useLocation();
  const [showRadioIndicator, setShowRadioIndicator] = useState(false);
  const [showAllNav, setShowAllNav] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      icon: BarChart2,
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

  return (
    <>
      {/* Navigation bar - adaptable for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-t border-orange-500/20 shadow-lg">
        <div className="relative max-w-screen-xl mx-auto">
          {/* Expanded view - shows all navigation items in a horizontally scrollable container */}
          {showAllNav && (
            <div className="px-2 py-3 overflow-hidden">
              <div className="flex items-center">
                <button 
                  onClick={scrollLeft} 
                  className="scroll-control flex-shrink-0 p-1 z-10 bg-gradient-to-r from-black/80 to-transparent pr-3"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div 
                  ref={scrollContainerRef}
                  className="horizontal-scroll-container flex-1 overflow-x-auto scrollbar-hide flex items-center space-x-2 px-1 py-1"
                >
                  {allNavItems.map((item) => (
                    <Link key={item.title} href={item.href} className="horizontal-scroll-item">
                      <div className={cn(
                        "nav-btn flex-shrink-0 flex flex-col items-center p-2 min-w-[4.5rem] rounded-lg",
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
                            "text-xs font-medium transition-colors duration-300 whitespace-nowrap mt-1",
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
                  className="scroll-control flex-shrink-0 p-1 z-10 bg-gradient-to-l from-black/80 to-transparent pl-3"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="absolute bottom-0 w-full flex justify-center">
                <button
                  onClick={toggleAllNav}
                  className="nav-toggle mb-[-0.5rem]"
                  aria-label="Close expanded navigation"
                >
                  <ChevronLeft className="w-4 h-4 transform rotate-90" />
                </button>
              </div>
            </div>
          )}

          {/* Compact view - shows limited navigation items */}
          {!showAllNav && (
            <div className="flex items-center justify-between px-4 py-2">
              {/* First 4 primary navigation items */}
              {allNavItems.slice(0, 4).map((item) => (
                <Link key={item.title} href={item.href} className="mobile-nav-item">
                  <div className={cn(
                    "nav-btn flex flex-col items-center gap-1 p-2 min-w-[4rem] rounded-lg",
                    location === item.href ? "nav-btn-active" : ""
                  )}>
                    <div className="relative flex items-center justify-center">
                      <item.icon
                        className={cn(
                          "w-5 h-5 transition-all duration-300",
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
                        "text-[10px] transition-colors duration-300",
                        location === item.href
                          ? "text-orange-500 font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.title}
                    </span>
                  </div>
                </Link>
              ))}
              
              {/* More button */}
              <button
                onClick={toggleAllNav}
                className="mobile-nav-item nav-btn flex flex-col items-center gap-1 p-2 min-w-[4rem] rounded-lg"
                aria-label="Show more navigation options"
              >
                <div className="relative flex items-center justify-center">
                  <Menu className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  More
                </span>
              </button>
              
              {/* Radio button */}
              <button
                className="mobile-nav-item nav-btn flex flex-col items-center gap-1 p-2 min-w-[4rem] rounded-lg"
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
                  "text-[10px] transition-colors duration-300",
                  showRadioIndicator 
                    ? "text-orange-500 font-medium" 
                    : "text-muted-foreground"
                )}>
                  Radio
                </span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}