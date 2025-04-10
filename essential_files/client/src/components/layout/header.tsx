import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Menu, 
  X,
  ChevronDown,
  Search,
  LogIn,
  UserCircle 
} from "lucide-react";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "../../components/ui/button";

export function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { user, logout } = useAuth() || {};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to search page with query
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/assets/freepik__boostify_music_organe_abstract_icon.png" 
                alt="Boostify Music" 
                className="h-8 w-8" 
              />
              <span className="text-xl font-bold">Boostify Music</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link 
              href="/" 
              className={`text-sm font-medium ${isActive("/") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Home
            </Link>
            <Link 
              href="/features" 
              className={`text-sm font-medium ${isActive("/features") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className={`text-sm font-medium ${isActive("/pricing") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Pricing
            </Link>
            <Link 
              href="/social-network" 
              className={`text-sm font-medium ${isActive("/social-network") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Social Network
            </Link>
            <Link 
              href="/affiliates" 
              className={`text-sm font-medium ${isActive("/affiliates") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Affiliates
            </Link>
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-48 py-1.5 px-3 pr-8 text-sm rounded-md bg-background border border-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </form>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="gap-1">
                    <UserCircle className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => logout && logout()}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth-page">
                <Button size="sm" className="gap-1">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              className="text-muted-foreground hover:text-foreground"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full py-2 px-3 pr-8 text-sm rounded-md bg-background border border-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </form>
            
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className={`text-sm font-medium ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}
                onClick={closeMenu}
              >
                Home
              </Link>
              <Link 
                href="/features" 
                className={`text-sm font-medium ${isActive("/features") ? "text-primary" : "text-muted-foreground"}`}
                onClick={closeMenu}
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                className={`text-sm font-medium ${isActive("/pricing") ? "text-primary" : "text-muted-foreground"}`}
                onClick={closeMenu}
              >
                Pricing
              </Link>
              <Link 
                href="/social-network" 
                className={`text-sm font-medium ${isActive("/social-network") ? "text-primary" : "text-muted-foreground"}`}
                onClick={closeMenu}
              >
                Social Network
              </Link>
              <Link 
                href="/affiliates" 
                className={`text-sm font-medium ${isActive("/affiliates") ? "text-primary" : "text-muted-foreground"}`}
                onClick={closeMenu}
              >
                Affiliates
              </Link>
            </nav>

            <div className="pt-4 border-t border-border">
              {user ? (
                <div className="flex flex-col space-y-2">
                  <Link href="/dashboard" onClick={closeMenu}>
                    <Button variant="outline" className="w-full gap-1">
                      <UserCircle className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      if (logout) {
                        logout();
                        closeMenu();
                      }
                    }}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Link href="/auth" onClick={closeMenu}>
                  <Button className="w-full gap-1">
                    <LogIn className="h-4 w-4" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}