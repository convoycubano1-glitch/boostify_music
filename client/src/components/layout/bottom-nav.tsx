import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Video, Music2, Bot, User, Radio } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
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
      title: "Studio",
      icon: Music2,
      href: "/producer-tools",
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-t border-orange-500/20">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className="flex flex-col items-center gap-1 p-2 min-w-[4rem] rounded-lg transition-all duration-300 hover:bg-orange-500/10">
                <div className="relative flex items-center justify-center">
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      location === item.href
                        ? "text-orange-500 scale-125"
                        : "text-muted-foreground"
                    )}
                  />
                  {location === item.href && (
                    <div className="absolute -inset-1 bg-orange-500/20 rounded-full blur animate-pulse" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] transition-colors duration-300 whitespace-nowrap",
                    location === item.href
                      ? "text-orange-500 font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {item.title}
                </span>
              </a>
            </Link>
          ))}
          <button
            className="flex flex-col items-center gap-1 p-2 min-w-[4rem] rounded-lg transition-all duration-300 hover:bg-orange-500/10"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-radio'))}
          >
            <div className="relative flex items-center justify-center">
              <Radio className="w-5 h-5 text-muted-foreground hover:text-orange-500 transition-all duration-300" />
            </div>
            <span className="text-[10px] text-muted-foreground">
              Radio
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}