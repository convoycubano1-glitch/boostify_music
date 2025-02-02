import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiGoogle } from "react-icons/si";
import { Music2, Users2, TrendingUp, FileText, Star, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import backgroundVideo from "../images/videos/Standard_Mode_Generated_Video.mp4";

/* =============================
   VARIANTES PARA ANIMACIONES
============================= */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

/* =============================
   COMPONENTE PRINCIPAL: HOME PAGE
   (Todo en un solo componente sin separar secciones)
============================= */
export default function HomePage() {
  const { signInWithGoogle } = useFirebaseAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Success",
        description: "Successfully logged in. Redirecting to dashboard..."
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive"
      });
    }
  };

  const features = [
    {
      icon: <Music2 className="h-6 w-6" />,
      title: "Spotify Integration",
      description:
        "Connect your Spotify account to manage playlists and track performance metrics"
    },
    {
      icon: <Users2 className="h-6 w-6" />,
      title: "PR Management",
      description:
        "Manage your public relations and grow your audience effectively"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Analytics Dashboard",
      description:
        "Track your growth with comprehensive analytics and insights"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Contract Management",
      description: "Handle your contracts and legal documents in one place"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Independent Artist",
      content:
        "This platform has revolutionized how I manage my music career. The analytics are incredibly detailed!",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Music Producer",
      content:
        "The Spotify integration is seamless. I've seen a 200% increase in my monthly listeners.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Band Manager",
      content:
        "Managing multiple artists has never been easier. The contract management system is a game-changer.",
      rating: 5
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 text-white">

      {/* HERO SECTION */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          src={backgroundVideo}
        />
        {/* Overlays para oscurecer y degradar el fondo */}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-background/40 to-background" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200%] h-[500px] bg-orange-500/20 rounded-full blur-[100px] rotate-12 opacity-50" />

        <div className="container relative mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8 max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 leading-tight">
              Boostify Music
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              The ultimate platform for artists to manage their marketing and grow their audience.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center items-center mt-8"
            >
              <Button
                size="lg"
                onClick={handleGoogleLogin}
                className="relative overflow-hidden group bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 hover:from-orange-600 hover:via-red-600 hover:to-orange-600 text-white shadow-xl transition-all duration-300 transform hover:scale-105"
                aria-label="Login with Google"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <SiGoogle className="w-5 h-5 mr-2" />
                Login with Google
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {user && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="fixed top-4 right-4 z-50"
          >
            <Link href="/dashboard" aria-label="Dashboard">
              <Button
                variant="outline"
                size="icon"
                className="bg-background/20 backdrop-blur-lg border-orange-500/20 hover:bg-orange-500/10"
              >
                <Home className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        )}
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive tools to boost your music career and reach new audiences
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-orange-500/20 rounded-lg blur-xl group-hover:bg-orange-500/30 transition-all duration-300" />
                <Card className="p-6 bg-background/50 backdrop-blur-sm border-orange-500/10 relative h-full">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                    <div className="text-orange-500">{feature.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-24 bg-gradient-to-b from-orange-500/5 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                Success Stories
              </h2>
              <p className="text-muted-foreground text-lg">
                See what our clients are saying about us
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-orange-500/10 rounded-lg blur-xl group-hover:bg-orange-500/20 transition-all duration-300" />
                  <Card className="p-6 bg-background/50 backdrop-blur-sm border-orange-500/10 relative">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-orange-500 text-orange-500" />
                      ))}
                    </div>
                    <p className="mb-4 text-muted-foreground">{testimonial.content}</p>
                    <div className="border-t border-orange-500/10 pt-4">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SPOTIFY SECTION */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-background to-background" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 text-orange-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8"
                >
                  <path d="M3 18V6h1.5l1.5 7 1.5-7H9v12h-1.5l-1.5-7-1.5 7H3zm6 0V6h1.5l1.5 7 1.5-7H15v12h-1.5l-1.5-7-1.5 7H9zM16 12h5l-1.5 3.5L20 18h-5l1.5-3.5L16 12z"></path>
                </svg>
                <span className="text-lg font-medium">Spotify Integration</span>
              </div>
              <h2 className="text-4xl font-bold">Connect With Your Audience</h2>
              <p className="text-lg text-muted-foreground">
                Seamlessly integrate with Spotify to manage your playlists, track performance metrics, and grow your listener base.
              </p>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                aria-label="Connect Spotify"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M3 18V6h1.5l1.5 7 1.5-7H9v12h-1.5l-1.5-7-1.5 7H3zm6 0V6h1.5l1.5 7 1.5-7H15v12h-1.5l-1.5-7-1.5 7H9zM16 12h5l-1.5 3.5L20 18h-5l1.5-3.5L16 12z"></path>
                </svg>
                Connect Spotify
              </Button>
            </div>
            <div className="flex-1 relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg blur opacity-75" />
              <div className="relative bg-background rounded-lg p-8">
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
          </motion.div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-24 container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground text-lg">
              Flexible plans for every stage of your career
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-orange-500/10 rounded-lg blur-xl group-hover:bg-orange-500/20 transition-all duration-300" />
                <Card
                  className={`p-6 relative ${
                    plan.popular
                      ? "border-orange-500 bg-orange-500/5"
                      : "bg-background/50 backdrop-blur-sm border-orange-500/10"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-orange-500 text-white text-sm rounded-full px-3 py-1">
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
                        <svg className="h-4 w-4 text-orange-500" viewBox="0 0 24 24">
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.popular ? "bg-orange-500 hover:bg-orange-600 text-white" : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    aria-label="Get Started"
                  >
                    Get Started
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
