import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Music2, BarChart2, FileText, Radio, Settings, Menu, Youtube, Instagram, Home, Users, Mic, Briefcase, Wrench, Video } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

export function Header() {
  const { user } = useAuth();
  const { logout } = useFirebaseAuth();
  const scrollDirection = useScrollDirection();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart2 },
    { name: "Artist Dashboard", href: "/artist-dashboard", icon: Mic },
    { name: "Manager Tools", href: "/manager-tools", icon: Briefcase },
    { name: "Producer Tools", href: "/producer-tools", icon: Wrench },
    { name: "Music Videos", href: "/music-video-creator", icon: Video },
    { name: "Spotify", href: "/spotify", icon: Music2 },
    { name: "Instagram Boost", href: "/instagram-boost", icon: Instagram },
    { name: "YouTube Views", href: "/youtube-views", icon: Youtube },
    { name: "Contracts", href: "/contracts", icon: FileText },
    { name: "PR", href: "/pr", icon: Radio },
    { name: "Contacts", href: "/contacts", icon: Users },
  ];

  if (!user) return null;

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
      scrollDirection === "down" ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
    }`}>
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
              <img 
                src="/assets/freepik__boostify-music___orange.png" 
                alt="Boostify Music" 
                className="h-6 w-6"
              />
              <div className="hidden md:block">
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                  Boostify
                </span>
                <span className="text-xs block text-muted-foreground -mt-1">
                  Music Marketing Platform
                </span>
              </div>
            </Link>

            <Link href="/">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Home className="h-4 w-4" />
              </Button>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="flex items-center text-sm font-medium transition-colors hover:text-orange-500"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>

            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <DropdownMenuItem>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                    </DropdownMenuItem>
                  </Link>
                ))}
                <DropdownMenuItem onSelect={() => logout()}>
                  <span>Logout</span>
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
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.displayName && (
                      <p className="font-medium">{user.displayName}</p>
                    )}
                    {user.email && (
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => logout()}>
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