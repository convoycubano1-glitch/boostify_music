import { ArtistProfileCard } from "../components/artist/artist-profile-card";
import { useParams } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Head } from "../components/ui/head";
import { useQuery } from "@tanstack/react-query";
import { SignIn } from "@clerk/clerk-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Sparkles,
  Music,
  TrendingUp,
  Globe,
  Star,
  ArrowRight,
  Share2,
  Video,
  Zap,
  Check,
} from "lucide-react";

interface ArtistData {
  name: string;
  biography: string;
  profileImage: string;
  genre?: string;
  location?: string;
  socialLinks?: {
    spotify?: string;
    instagram?: string;
    youtube?: string;
  };
}

// Features for the landing page
const FEATURES = [
  {
    icon: Music,
    title: "Professional Artist Profile",
    description: "Showcase your music, bio, and brand in one stunning page",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  },
  {
    icon: Video,
    title: "AI Music Videos",
    description: "Create stunning music videos with AI in minutes",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  {
    icon: TrendingUp,
    title: "Growth Analytics",
    description: "Track your streams, views, and audience engagement",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    icon: Share2,
    title: "Smart Link-in-Bio",
    description: "One link for all your music platforms and socials",
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Connect with fans and industry contacts worldwide",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10"
  },
  {
    icon: Zap,
    title: "AI Marketing Tools",
    description: "Generate social content, EPKs, and promo materials",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  }
];

// Stats for social proof
const STATS = [
  { value: "10,000+", label: "Artists" },
  { value: "5M+", label: "Page Views" },
  { value: "500K+", label: "Videos Created" },
  { value: "4.9★", label: "Rating" }
];

// Testimonials
const TESTIMONIALS = [
  {
    quote: "Boostify transformed my career. The AI music videos alone got me 50K new followers.",
    name: "DJ Nova",
    role: "Electronic Producer • Berlin",
    avatar: "🎧"
  },
  {
    quote: "Finally, a platform built FOR musicians. Everything I need in one place.",
    name: "Maya Santos",
    role: "R&B Singer • Atlanta",
    avatar: "🎤"
  },
  {
    quote: "The analytics helped me understand my audience and book better gigs.",
    name: "The Groove Collective",
    role: "Jazz Fusion Band • NYC",
    avatar: "🎷"
  }
];

// Landing page component for non-logged users
function ProfileLandingPage() {

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-purple-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-500 text-sm font-medium mb-6">
                  <Sparkles className="h-4 w-4" />
                  <span>Free Forever • No Credit Card</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Your Music Career{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    Starts Here
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-400 mb-8">
                  Join <span className="text-white font-semibold">10,000+ artists</span> using Boostify to grow their fanbase, create AI music videos, and manage their entire music career.
                </p>

                {/* Quick benefits */}
                <div className="space-y-3 mb-8">
                  {[
                    "Professional artist profile in 60 seconds",
                    "AI-powered music video creation",
                    "Smart analytics & growth tools"
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-500" />
                      </div>
                      <span className="text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Clerk SignIn */}
              <Card className="bg-gradient-to-b from-gray-900/95 to-gray-900/80 border border-gray-700/50 p-8 backdrop-blur-xl shadow-2xl shadow-black/50 rounded-2xl">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-orange-500/30">
                    <Music className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Create Your Free Profile</h2>
                  <p className="text-gray-400">Sign up in seconds with Google or Email</p>
                </div>

                {/* Clerk SignIn Component with Custom Styling */}
                <SignIn 
                  appearance={{
                    variables: {
                      colorPrimary: "#f97316",
                      colorBackground: "transparent",
                      colorText: "#ffffff",
                      colorTextSecondary: "#9ca3af",
                      colorInputBackground: "#1f2937",
                      colorInputText: "#ffffff",
                      borderRadius: "0.75rem",
                    },
                    elements: {
                      rootBox: "mx-auto w-full",
                      card: "bg-transparent shadow-none p-0 gap-4",
                      header: "hidden",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      main: "gap-4",
                      form: "gap-4",
                      formFieldRow: "mb-3",
                      formFieldLabel: "text-gray-300 font-medium text-sm mb-1.5",
                      formFieldInput: "bg-gray-800/90 border border-gray-600 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-12 px-4 transition-all",
                      formFieldInputShowPasswordButton: "text-gray-400 hover:text-white transition-colors",
                      formButtonPrimary: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/30 rounded-xl h-14 text-base transition-all hover:shadow-orange-500/40 hover:scale-[1.02]",
                      footerAction: "hidden",
                      footerActionLink: "text-orange-400 hover:text-orange-300 font-medium",
                      // Social buttons - white background so icons show their original colors
                      socialButtons: "gap-3",
                      socialButtonsBlockButton: "bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 hover:border-gray-300 rounded-xl h-12 transition-all hover:scale-[1.02] gap-3 shadow-sm",
                      socialButtonsBlockButtonText: "text-gray-800 font-medium text-sm",
                      socialButtonsProviderIcon: "w-5 h-5", // Keep original colors on white background
                      socialButtonsBlockButtonArrow: "hidden",
                      // Divider
                      dividerRow: "my-4",
                      dividerLine: "bg-gray-700",
                      dividerText: "text-gray-500 text-sm px-3",
                      // Other elements
                      identityPreview: "bg-gray-800/50 border border-gray-700 rounded-xl",
                      identityPreviewText: "text-white",
                      identityPreviewEditButton: "text-orange-400 hover:text-orange-300",
                      otpCodeFieldInput: "bg-gray-800 border-gray-600 text-white rounded-lg",
                      alert: "bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl",
                      alertText: "text-red-400",
                      footer: "hidden",
                      // Alternative actions
                      alternativeMethodsBlockButton: "bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700 rounded-xl",
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      showOptionalFields: false,
                    }
                  }}
                  routing="hash"
                  afterSignInUrl="/profile"
                  afterSignUpUrl="/profile"
                />
                
                <p className="text-xs text-gray-500 text-center mt-4">
                  No credit card required • Free forever
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-gray-800/50 bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="text-orange-500">Succeed</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Built specifically for independent musicians. All the tools to grow, create, and manage your career.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((feature, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-800 p-6 hover:border-gray-700 transition-colors">
                <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Artists <span className="text-orange-500">Love</span> Boostify
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-800 p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 text-sm italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{testimonial.name}</div>
                    <div className="text-gray-500 text-xs">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent" />
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Zap className="h-16 w-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to <span className="text-orange-500">Level Up</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Join 10,000+ artists already growing on Boostify. Your professional profile is just one click away.
            </p>
            
            <Button
              onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl"
            >
              🚀 Create My Free Profile
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <p className="mt-6 text-gray-500 text-sm">
              No credit card required • Setup in 60 seconds • Free forever
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="py-8 text-center border-t border-gray-800">
        <p className="text-gray-500 text-sm">
          © 2026 Boostify Music • Built for independent artists
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Use the URL id or fallback to the authenticated user's id
  // Use user.id > 0 check to ensure we have a valid ID from the database
  const artistId = id || (user?.id && user.id > 0 ? String(user.id) : null);
  
  // Check if this is the user's own profile
  const isOwnProfile = !id && !!user && user.id > 0;

  // Query para obtener datos del artista
  const { data: artistData, isLoading: isArtistLoading } = useQuery<ArtistData>({
    queryKey: ["/api/artist", artistId],
    enabled: !!artistId && (!isOwnProfile || user?.id !== 0)
  });

  // Show loading only while auth is initially loading (brief moment)
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black pt-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  // If no user and no id in URL, show premium landing page
  if (!artistId) {
    return <ProfileLandingPage />;
  }

  if (isArtistLoading) {
    return (
      <div className="min-h-screen bg-black pt-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const fullUrl = window.location.origin + '/profile/' + artistId;

  // Usar imagen Open Graph dinámica generada por el servidor
  // Esta imagen incluye: nombre del artista, género, biografía, imagen de perfil, badge AI si aplica
  const ogImageUrl = `${window.location.origin}/api/og-image/artist/${artistId}`;
  
  // Fallback a imagen de perfil si la OG image falla
  const getAbsoluteImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return `${window.location.origin}/assets/freepik__boostify_music_organe_abstract_icon.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${window.location.origin}${imageUrl}`;
  };

  const profileImage = getAbsoluteImageUrl(artistData?.profileImage);

  // Valores por defecto para meta tags
  const title = artistData?.name 
    ? `${artistData.name} - Music Artist Profile | Boostify Music`
    : "Discover Amazing Musicians on Boostify Music";

  const description = artistData?.biography 
    ? `Check out ${artistData.name}'s music profile on Boostify Music. ${artistData.biography.slice(0, 150)}${artistData.biography.length > 150 ? '...' : ''}`
    : `Discover and connect with talented musicians on Boostify Music. Join our community of artists, producers, and music enthusiasts.`;

  return (
    <>
      {/* Solo renderizar Head cuando tenemos los datos necesarios */}
      {artistData && (
        <Head
          title={title}
          description={description}
          url={fullUrl}
          image={ogImageUrl}
          type="profile"
          siteName="Boostify Music"
        />
      )}
      <div className="min-h-screen bg-black pt-4">
        <ArtistProfileCard artistId={artistId} />
      </div>
    </>
  );
}