import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Sparkles, Video, ArrowRight, Brain, Database, Cpu, Activity, Network, CheckCircle2, Zap, TrendingUp, Play, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function MotionDNAPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    city: '',
    role: '',
    message: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Application Submitted!",
      description: "We'll contact you soon with more information about Boostify MotionDNA.",
    });

    setFormData({
      name: '',
      email: '',
      city: '',
      role: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <a className="text-2xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Boostify
            </a>
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/music-video-creator">
              <a className="text-gray-400 hover:text-white transition-colors">
                Music Videos
              </a>
            </Link>
            <Button
              size="sm"
              className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
              onClick={() => document.getElementById('beta-form')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-nav-beta"
            >
              Join Beta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-600 to-pink-600 text-white font-bold text-sm mb-8 shadow-lg shadow-orange-600/50"
            >
              <Sparkles className="h-5 w-5 animate-pulse" />
              Launching Q2 2026
            </motion.div>

            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black mb-8 bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-clip-text text-transparent leading-tight">
              Boostify MotionDNA
            </h1>

            <p className="text-2xl sm:text-3xl md:text-4xl text-gray-300 mb-6 font-light">
              The Motion Model Trained on <span className="text-orange-500 font-bold">+700 Real Music Videos</span>
            </p>

            <p className="text-lg sm:text-xl text-gray-400 max-w-4xl mx-auto mb-12">
              Transform any song into a professional video with real artist movements, natural choreography, 
              and stage energy… without filming a single take. The future of music video creation is here.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white text-lg px-8 py-7 shadow-lg shadow-orange-600/50"
                onClick={() => document.getElementById('beta-form')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-hero-beta"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Join Early Access
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-900 text-lg px-8 py-7"
                data-testid="button-hero-learn"
              >
                <Play className="h-5 w-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative max-w-5xl mx-auto"
            >
              <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-orange-600/20">
                <img 
                  src="/attached_assets/motion-dna/hero-launch.png" 
                  alt="MotionDNA Hero" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-800 bg-gradient-to-b from-gray-950 to-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { icon: Database, value: "700+", label: "Music Videos Trained", color: "orange" },
              { icon: Brain, value: "AI", label: "Powered Technology", color: "pink" },
              { icon: Activity, value: "Real", label: "Artist Movements", color: "orange" },
              { icon: Cpu, value: "Q2 2026", label: "Launch Date", color: "pink" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className={`h-12 w-12 mx-auto mb-4 ${stat.color === 'orange' ? 'text-orange-500' : 'text-pink-500'}`} />
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Core Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Powered by AI Motion Technology
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our neural network analyzes thousands of professional music videos to understand 
              how real artists move, perform, and connect with their music.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="relative rounded-2xl overflow-hidden border border-gray-800 hover:border-orange-600/50 transition-all">
                <img 
                  src="/attached_assets/motion-dna/neural-network-core.png" 
                  alt="Neural Network Core" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform">
                  <h3 className="text-2xl font-bold text-white mb-2">Neural Network Core</h3>
                  <p className="text-gray-300">Advanced AI brain that processes and learns movement patterns</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="relative rounded-2xl overflow-hidden border border-gray-800 hover:border-pink-600/50 transition-all">
                <img 
                  src="/attached_assets/motion-dna/motion-capture-hologram.png" 
                  alt="Motion Capture Hologram" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform">
                  <h3 className="text-2xl font-bold text-white mb-2">3D Motion Capture</h3>
                  <p className="text-gray-300">Holographic analysis of body movements and dance dynamics</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Movement Analysis Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Intelligent Movement Analysis
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              MotionDNA doesn't just copy movements—it understands rhythm, emotion, and performance style.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 p-0 overflow-hidden hover:border-orange-600/50 transition-all">
                <img 
                  src="/attached_assets/motion-dna/motion-trails.png" 
                  alt="Motion Trails" 
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                    <Activity className="h-6 w-6 text-orange-500" />
                    Motion Trail Analysis
                  </h3>
                  <p className="text-gray-400">
                    Captures the flow and energy of movements over time, creating natural and expressive choreography.
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 p-0 overflow-hidden hover:border-pink-600/50 transition-all">
                <img 
                  src="/attached_assets/motion-dna/body-movement-analysis.png" 
                  alt="Body Movement Analysis" 
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                    <Network className="h-6 w-6 text-pink-500" />
                    Pose Estimation
                  </h3>
                  <p className="text-gray-400">
                    Advanced body tracking maps every joint and limb position for realistic human-like movement.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Training & Dataset Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Trained on Real Music Videos
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Unlike generic AI models, MotionDNA was trained exclusively on professional music videos, 
              capturing the authentic movements and performance styles of real artists.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 p-0 overflow-hidden h-full">
                <img 
                  src="/attached_assets/motion-dna/training-lab.png" 
                  alt="AI Training Lab" 
                  className="w-full h-56 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3">AI Training Pipeline</h3>
                  <p className="text-gray-400">
                    Massive datasets processed through state-of-the-art neural networks to learn movement intelligence.
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 p-0 overflow-hidden h-full">
                <img 
                  src="/attached_assets/motion-dna/dataset-visualization.png" 
                  alt="Dataset Visualization" 
                  className="w-full h-56 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3">700+ Video Dataset</h3>
                  <p className="text-gray-400">
                    Thousands of frames from professional music videos form the foundation of our motion model.
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 p-0 overflow-hidden h-full">
                <img 
                  src="/attached_assets/motion-dna/700-videos-collage.png" 
                  alt="Video Collage" 
                  className="w-full h-56 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3">Diverse Movement Styles</h3>
                  <p className="text-gray-400">
                    From hip-hop to pop, reggaeton to rock—our model understands every genre's unique performance style.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-black">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Advanced System Architecture
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              A powerful backend engine processes your music and generates realistic choreography in real-time.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src="/attached_assets/motion-dna/architecture-diagram.png" 
                alt="Architecture Diagram" 
                className="w-full h-auto rounded-2xl border border-gray-800"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src="/attached_assets/motion-dna/ai-engine.png" 
                alt="AI Engine" 
                className="w-full h-auto rounded-2xl border border-gray-800"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Output Examples Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Generate Professional Choreography
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Watch MotionDNA transform static images into dynamic performances with natural movement and stage presence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 p-0 overflow-hidden">
                <img 
                  src="/attached_assets/motion-dna/choreography-output.png" 
                  alt="Choreography Output" 
                  className="w-full h-80 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-3">AI-Generated Movement</h3>
                  <p className="text-gray-400">
                    Natural choreography with motion trails showing the flow of performance energy.
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 p-0 overflow-hidden">
                <img 
                  src="/attached_assets/motion-dna/virtual-avatar.png" 
                  alt="Virtual Avatar" 
                  className="w-full h-80 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-3">Virtual Performance</h3>
                  <p className="text-gray-400">
                    Full-body avatars performing with UI controls for customization and adjustments.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              How MotionDNA Works
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              From your song to a professional music video in 5 simple steps
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              {
                step: "01",
                title: "Upload Your Audio",
                description: "Upload your song and let our AI analyze the rhythm, tempo, and musical structure.",
                icon: Zap
              },
              {
                step: "02",
                title: "Choose Movement Style",
                description: "Select from various performance styles: energetic dance, chill vibes, stage performance, or let AI decide.",
                icon: Activity
              },
              {
                step: "03",
                title: "AI Processes & Generates",
                description: "MotionDNA analyzes your music and creates natural choreography matching the song's energy.",
                icon: Brain
              },
              {
                step: "04",
                title: "Customize & Refine",
                description: "Adjust camera angles, movement intensity, and visual effects to match your vision.",
                icon: TrendingUp
              },
              {
                step: "05",
                title: "Export & Share",
                description: "Download your professional music video ready for YouTube, Instagram, TikTok, and more.",
                icon: CheckCircle2
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 p-8 hover:border-orange-600/50 transition-all">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-pink-600 flex items-center justify-center text-2xl font-black">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <item.icon className="h-6 w-6 text-orange-500" />
                        <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                      </div>
                      <p className="text-gray-400 text-lg">{item.description}</p>
                    </div>
                    <ChevronRight className="h-6 w-6 text-gray-600 flex-shrink-0 mt-2" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Visuals Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden"
            >
              <img 
                src="/attached_assets/motion-dna/holographic-dancer-crystal.png" 
                alt="Holographic Dancer" 
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative rounded-2xl overflow-hidden"
            >
              <img 
                src="/attached_assets/motion-dna/glass-orb-motion.png" 
                alt="Glass Orb Motion" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Beta Access Form */}
      <section id="beta-form" className="py-20 bg-gradient-to-b from-gray-950 to-black scroll-mt-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600/20 border border-orange-600/50 text-orange-500 font-semibold text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              Launching Q2 2026
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Join the First Generation of MotionDNA Artists
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              We're opening a <span className="font-semibold text-white">closed beta</span> for a limited group of artists, 
              producers, directors, managers and labels who want to use this revolutionary technology before anyone else.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-black to-gray-950 border-orange-600/50 p-8 max-w-2xl mx-auto shadow-2xl shadow-orange-600/20">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-200 text-base">Name / Artist Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name or artist name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-black/50 border-gray-700 focus:border-orange-600 text-white text-base py-6"
                    data-testid="input-name"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-200 text-base">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-black/50 border-gray-700 focus:border-orange-600 text-white text-base py-6"
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="text-gray-200 text-base">Country / City</Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="e.g. Miami, FL – USA"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-black/50 border-gray-700 focus:border-orange-600 text-white text-base py-6"
                    data-testid="input-city"
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-gray-200 text-base">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="bg-black/50 border-gray-700 focus:border-orange-600 text-white text-base py-6" data-testid="select-role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="producer">Producer</SelectItem>
                      <SelectItem value="director">Director / Creative</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="label">Record Label</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message" className="text-gray-200 text-base">Tell us about your project (optional)</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="Share your vision or the type of videos you want to create with MotionDNA..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-black/50 border-gray-700 focus:border-orange-600 text-white text-base"
                    data-testid="textarea-message"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white text-lg py-7 shadow-lg shadow-orange-600/50"
                  data-testid="button-submit-beta"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Request Beta Access
                </Button>
                
                <p className="text-sm text-gray-500 text-center pt-2">
                  Limited spots. We'll select projects that best fit Boostify's roadmap.<br />
                  <span className="text-orange-500 font-semibold">Available Q2 2026</span>
                </p>
              </form>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 bg-black">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Boostify MotionDNA is a project by <span className="font-semibold text-gray-400">Boostify Music</span>
          </p>
          <p className="text-sm text-gray-600">
            Created by Neiver Alvarez, CEO Metafeed APPS · Tel: +1 (786) 543 2478 · 
            Ecosystem: <a href="https://www.autoleadsx.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 transition-colors">www.autoleadsx.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
