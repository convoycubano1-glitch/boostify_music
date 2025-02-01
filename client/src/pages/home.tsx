import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiSpotify } from "react-icons/si";
import { ArrowRight, Music2, Users2, TrendingUp, FileText } from "lucide-react";
import { Link } from "wouter";

const features = [
  {
    icon: <Music2 className="h-6 w-6" />,
    title: "Spotify Integration",
    description: "Connect your Spotify account to manage playlists and track performance metrics"
  },
  {
    icon: <Users2 className="h-6 w-6" />,
    title: "PR Management",
    description: "Manage your public relations and grow your audience effectively"
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Analytics Dashboard",
    description: "Track your growth with comprehensive analytics and insights"
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Contract Management",
    description: "Handle your contracts and legal documents in one place"
  }
];

const plans = [
  {
    name: "Basic",
    price: "19",
    features: [
      "Basic Analytics",
      "Spotify Integration",
      "1 Artist Profile",
      "Email Support"
    ]
  },
  {
    name: "Pro",
    price: "49",
    popular: true,
    features: [
      "Advanced Analytics",
      "Priority Spotify Integration",
      "5 Artist Profiles",
      "PR Management Tools",
      "24/7 Support"
    ]
  },
  {
    name: "Enterprise",
    price: "99",
    features: [
      "Custom Analytics",
      "Multiple Artist Management",
      "Dedicated Account Manager",
      "API Access",
      "Custom Integrations"
    ]
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/30" />
        
        <div className="container relative mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary">
              Elevate Your Music Career
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              The ultimate platform for artists to manage their marketing, connect with Spotify, and grow their audience.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <Card key={i} className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <div className="text-primary">{feature.icon}</div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Spotify Integration Section */}
      <section className="py-24 bg-black/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 text-[#1DB954]">
                <SiSpotify className="h-8 w-8" />
                <span className="text-lg font-medium">Spotify Integration</span>
              </div>
              <h2 className="text-4xl font-bold">Connect With Your Audience</h2>
              <p className="text-lg text-muted-foreground">
                Seamlessly integrate with Spotify to manage your playlists, track performance metrics, and grow your listener base.
              </p>
              <Button className="bg-[#1DB954] hover:bg-[#1ed760] text-white gap-2">
                <SiSpotify className="h-5 w-5" />
                Connect Spotify
              </Button>
            </div>
            <div className="flex-1 relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-lg blur opacity-75" />
              <div className="relative bg-black rounded-lg p-8">
                {/* Mockup de estadísticas de Spotify */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Monthly Listeners</span>
                    <span className="text-xl font-bold">245.8K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Playlist Reaches</span>
                    <span className="text-xl font-bold">1.2M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    <span className="text-xl font-bold">4.7%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <Card 
              key={i} 
              className={`p-6 relative ${
                plan.popular 
                  ? 'border-primary bg-primary/5' 
                  : 'bg-card/50 backdrop-blur-sm border-primary/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm rounded-full px-3 py-1">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24">
                      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className={`w-full ${
                  plan.popular ? 'bg-primary text-primary-foreground' : ''
                }`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                Get Started
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
