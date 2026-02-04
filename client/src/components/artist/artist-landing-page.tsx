import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { SignIn } from "@clerk/clerk-react";
import {
  Sparkles,
  Music,
  BarChart3,
  Link2,
  Smartphone,
  Search,
  Check,
  ArrowRight,
  Star,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// FAQ items
const FAQ_ITEMS = [
  {
    question: "Is it really 100% free?",
    answer: "Yes! Your artist landing page is completely free forever. No hidden fees, no credit card required. We offer optional premium features for advanced users, but the core landing page is always free."
  },
  {
    question: "How long does it take to create my page?",
    answer: "About 60 seconds! Just enter your artist name and email, and we'll set up your professional page instantly. You can customize it anytime after."
  },
  {
    question: "Can I use my own domain?",
    answer: "Yes! Premium users can connect their own custom domain. Free users get a boostifymusic.com/artist/your-name URL which is already SEO-optimized."
  },
  {
    question: "What platforms can I connect?",
    answer: "Spotify, Apple Music, YouTube, SoundCloud, Instagram, TikTok, Twitter, and many more. All your links in one place."
  },
  {
    question: "Do I get analytics?",
    answer: "Yes! Track page views, click-through rates, and see where your fans are coming from. All included free."
  }
];

// Features grid
const FEATURES = [
  {
    icon: Sparkles,
    title: "Professional Design",
    description: "Beautiful, mobile-optimized landing page in 60 seconds",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "See who's visiting your page and track engagement",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    icon: Link2,
    title: "Smart Link-in-Bio",
    description: "One link for all your platforms and music",
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  {
    icon: Music,
    title: "Music Integration",
    description: "Embed Spotify, Apple Music, SoundCloud & more",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Looks perfect on any device, any screen size",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10"
  },
  {
    icon: Search,
    title: "SEO Ready",
    description: "Get found on Google with optimized metadata",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  }
];

// Testimonials
const TESTIMONIALS = [
  {
    quote: "Finally, a landing page built FOR musicians. My streams increased 40% after adding my Boostify link to my bio.",
    name: "Marcus Chen",
    role: "Hip-Hop Artist • LA",
    avatar: "🎤"
  },
  {
    quote: "I used to pay $12/month for Linktree. Boostify is free AND has music-specific features. No brainer.",
    name: "Sarah Williams",
    role: "Indie Pop • Nashville",
    avatar: "🎸"
  },
  {
    quote: "The analytics helped me understand my audience. Now I know which songs to promote where.",
    name: "DJ Pulse",
    role: "Electronic • Miami",
    avatar: "🎧"
  }
];

// Comparison table data
const COMPARISON = [
  { feature: "Built for Musicians", boostify: true, linktree: false, carrd: false },
  { feature: "Free Forever", boostify: true, linktree: false, carrd: false },
  { feature: "Music Embeds", boostify: true, linktree: false, carrd: "paid" },
  { feature: "Analytics", boostify: true, linktree: "paid", carrd: false },
  { feature: "SEO Optimized", boostify: true, linktree: false, carrd: false },
  { feature: "Custom Domain", boostify: "premium", linktree: "paid", carrd: "paid" },
];

export function ArtistLandingPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-purple-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-500 text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              <span>Free Forever • No Credit Card</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Create Your{" "}
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Free Artist
              </span>
              <br />
              Landing Page
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Join <span className="text-white font-semibold">5,000+ independent artists</span> who've claimed their professional page. All your music, links, and analytics in one beautiful place.
            </p>

            {/* Clerk SignIn */}
            <Card className="max-w-md mx-auto bg-gradient-to-b from-gray-900/95 to-gray-900/80 border border-gray-700/50 p-4 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50 rounded-2xl overflow-hidden">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                  <Music className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Create Your Free Page</h2>
                <p className="text-gray-400 text-sm">Sign up with Google or Email</p>
              </div>

              {/* Clerk SignIn Component */}
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
                    rootBox: "mx-auto w-full max-w-full overflow-hidden",
                    card: "bg-transparent shadow-none p-0 gap-4 w-full max-w-full",
                    header: "hidden",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    main: "gap-4 w-full",
                    form: "gap-4 w-full",
                    formFieldRow: "mb-3",
                    formFieldLabel: "text-gray-300 font-medium text-sm mb-1.5",
                    formFieldInput: "bg-gray-800/90 border border-gray-600 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-12 px-4 transition-all w-full",
                    formFieldInputShowPasswordButton: "text-gray-400 hover:text-white transition-colors",
                    formButtonPrimary: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/30 rounded-xl h-14 text-base transition-all hover:shadow-orange-500/40 hover:scale-[1.02] w-full",
                    footerAction: "hidden",
                    footerActionLink: "text-orange-400 hover:text-orange-300 font-medium",
                    socialButtons: "flex flex-col gap-2 w-full",
                    socialButtonsBlockButton: "bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 hover:border-gray-300 rounded-xl h-12 transition-all hover:scale-[1.02] gap-3 shadow-sm w-full flex items-center justify-center",
                    socialButtonsBlockButtonText: "text-gray-800 font-medium text-sm",
                    socialButtonsProviderIcon: "w-5 h-5 flex-shrink-0",
                    socialButtonsBlockButtonArrow: "hidden",
                    socialButtonsIconButton: "bg-white/10 border border-gray-600 rounded-xl h-12 w-12 flex items-center justify-center hover:bg-white/20 transition-all",
                    socialButtonsProviderIcon__apple: "w-5 h-5",
                    socialButtonsProviderIcon__facebook: "w-5 h-5",
                    socialButtonsProviderIcon__google: "w-5 h-5",
                    dividerRow: "my-4",
                    dividerLine: "bg-gray-700",
                    dividerText: "text-gray-500 text-sm px-3",
                    identityPreview: "bg-gray-800/50 border border-gray-700 rounded-xl",
                    identityPreviewText: "text-white",
                    identityPreviewEditButton: "text-orange-400 hover:text-orange-300",
                    otpCodeFieldInput: "bg-gray-800 border-gray-600 text-white rounded-lg",
                    alert: "bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl",
                    alertText: "text-red-400",
                    footer: "hidden",
                    alternativeMethodsBlockButton: "bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700 rounded-xl w-full",
                  },
                  layout: {
                    socialButtonsPlacement: "top",
                    showOptionalFields: false,
                  }
                }}
                routing="hash"
                afterSignInUrl="/my-artists"
                afterSignUpUrl="/my-artists"
              />
              
              <p className="text-xs text-gray-500 text-center mt-4">
                No credit card required • Free forever
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Visual Mockup Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-black to-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Browser mockup */}
              <div className="bg-gray-800 rounded-t-xl p-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 ml-4">
                  <div className="bg-gray-700 rounded-md py-1 px-3 text-xs text-gray-400 max-w-sm">
                    boostifymusic.com/artist/your-name
                  </div>
                </div>
              </div>
              {/* Screenshot placeholder - gradient preview */}
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 aspect-video rounded-b-xl flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Music className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Your Artist Name</h3>
                  <p className="text-gray-400 mb-6">Hip-Hop • Atlanta, GA</p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    <div className="px-4 py-2 bg-green-500 rounded-full text-sm font-medium text-white">Spotify</div>
                    <div className="px-4 py-2 bg-pink-500 rounded-full text-sm font-medium text-white">Apple Music</div>
                    <div className="px-4 py-2 bg-red-500 rounded-full text-sm font-medium text-white">YouTube</div>
                    <div className="px-4 py-2 bg-orange-500 rounded-full text-sm font-medium text-white">SoundCloud</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="text-orange-500">Stand Out</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Built specifically for independent musicians. Not another generic link-in-bio tool.
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

      {/* Social Proof Section */}
      <section className="py-16 md:py-24 bg-gray-900/30">
        <div className="container mx-auto px-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16">
            {[
              { value: "5,000+", label: "Artists" },
              { value: "2M+", label: "Page Views" },
              { value: "150K+", label: "Link Clicks" },
              { value: "4.9★", label: "Rating" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
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

          {/* Platform logos */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm mb-6">Works with your favorite platforms</p>
            <div className="flex justify-center gap-8 flex-wrap opacity-60">
              <span className="text-2xl">🎵</span>
              <span className="text-green-500 font-bold">Spotify</span>
              <span className="text-pink-500 font-bold">Apple Music</span>
              <span className="text-red-500 font-bold">YouTube</span>
              <span className="text-orange-500 font-bold">SoundCloud</span>
              <span className="text-purple-500 font-bold">Instagram</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Artists Choose <span className="text-orange-500">Boostify</span>
            </h2>
            <p className="text-gray-400">See how we compare to generic link-in-bio tools</p>
          </div>

          <div className="max-w-3xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 text-orange-500 font-bold">Boostify</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">Linktree</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">Carrd</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, index) => (
                  <tr key={index} className="border-b border-gray-800/50">
                    <td className="py-4 px-4 text-white">{row.feature}</td>
                    <td className="text-center py-4 px-4">
                      {row.boostify === true ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : row.boostify === "premium" ? (
                        <span className="text-xs text-orange-500 font-medium">Premium</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row.linktree === true ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : row.linktree === "paid" ? (
                        <span className="text-xs text-yellow-500 font-medium">$5/mo</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row.carrd === true ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : row.carrd === "paid" ? (
                        <span className="text-xs text-yellow-500 font-medium">$9/mo</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-orange-500/5">
                  <td className="py-4 px-4 font-bold text-white">Price</td>
                  <td className="text-center py-4 px-4 font-bold text-green-500">FREE</td>
                  <td className="text-center py-4 px-4 text-gray-400">$5/mo</td>
                  <td className="text-center py-4 px-4 text-gray-400">$9/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked <span className="text-orange-500">Questions</span>
            </h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {FAQ_ITEMS.map((faq, index) => (
              <Card
                key={index}
                className="bg-gray-900/50 border-gray-800 overflow-hidden cursor-pointer"
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
              >
                <div className="p-5 flex items-center justify-between">
                  <h3 className="font-medium text-white">{faq.question}</h3>
                  {expandedFAQ === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                {expandedFAQ === index && (
                  <div className="px-5 pb-5 text-gray-400 text-sm border-t border-gray-800 pt-4">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent" />
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Zap className="h-16 w-16 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to <span className="text-orange-500">Stand Out</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Your professional artist page is waiting. Join 5,000+ artists already growing on Boostify.
            </p>
            
            <Button
              onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl"
            >
              🚀 Create My Free Page Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <p className="mt-6 text-gray-500 text-sm">
              No credit card required • Setup in 60 seconds • Free forever
            </p>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div className="py-8 text-center border-t border-gray-800">
        <p className="text-gray-500 text-sm">
          © 2026 Boostify Music • Built for independent artists
        </p>
      </div>
    </div>
  );
}
