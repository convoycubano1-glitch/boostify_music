import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Music2, Wand2, Video, Building2, ArrowRight, Shield, Banknote } from "lucide-react";
import { motion } from "framer-motion";
import { MusicAIGenerator } from "@/components/music/music-ai-generator";
import { AudioMastering } from "@/components/music/audio-mastering";
import { MusicVideoAI } from "@/components/music-video/music-video-ai";
import { Link } from "wouter";

export default function RecordLabelServices() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <div className="relative w-full min-h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-orange-600 opacity-90" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-shadow-lg">
              Revive Classic Music
            </h1>
            <p className="text-xl text-white/90 mb-8 text-shadow-sm font-medium">
              Transform dormant catalogs into modern hits with AI-powered remixes and video content
            </p>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
              Start Licensing Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Royalty Importance Section */}
      <div className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Banknote className="h-12 w-12 text-orange-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
              The Power of Perpetual Royalties
            </h2>
            <div className="prose prose-lg mx-auto dark:prose-invert">
              <p className="text-muted-foreground/90 leading-relaxed">
                In today's digital age, classic music represents an untapped goldmine of potential revenue. 
                Many timeless tracks have stopped generating royalties simply because they haven't been 
                adapted for modern audiences and platforms.
              </p>
              <p className="text-muted-foreground/90 leading-relaxed">
                By reviving these classics through AI-powered remixes, modern mastering, and compelling 
                video content, we can:
              </p>
              <ul className="text-left list-disc pl-6 space-y-2 mb-6 text-muted-foreground/90">
                <li>Introduce iconic music to new generations</li>
                <li>Create additional revenue streams from existing catalogs</li>
                <li>Preserve musical heritage while making it relevant for today's market</li>
                <li>Enable continuous monetization across multiple platforms</li>
                <li>Generate new licensing and sync opportunities</li>
              </ul>
              <p className="text-muted-foreground/90 leading-relaxed">
                Our platform provides the tools and technology needed to transform your dormant catalog 
                into an active revenue-generating asset, ensuring your music continues to earn and 
                resonate with audiences for years to come.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
            Comprehensive Revival Tools
          </h2>
          <p className="text-muted-foreground">
            Everything you need to bring classic music into the modern era
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <Music2 className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Music Generation</h3>
            <p className="text-muted-foreground mb-4">
              Create modern remixes and variations while preserving the original essence
            </p>
            <div className="h-[300px] overflow-hidden rounded-lg mb-4">
              <MusicAIGenerator />
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <Wand2 className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Professional Mastering</h3>
            <p className="text-muted-foreground mb-4">
              State-of-the-art AI mastering for perfect sound quality
            </p>
            <div className="h-[300px] overflow-hidden rounded-lg mb-4">
              <AudioMastering />
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <Video className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Video Generation</h3>
            <p className="text-muted-foreground mb-4">
              Create compelling music videos for classic tracks
            </p>
            <div className="h-[300px] overflow-hidden rounded-lg mb-4">
              <MusicVideoAI />
            </div>
            <Link href="/music-video-creator">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                Open Full Video Creator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Record Label Registration */}
      <div className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Building2 className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
                Record Label Registration
              </h2>
              <p className="text-muted-foreground">
                Get access to our suite of AI-powered music revival tools
              </p>
            </div>

            <Card className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        companyName: e.target.value
                      }))}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contactName: e.target.value
                      }))}
                      required
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Company Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        website: e.target.value
                    }))}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Additional Information</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        message: e.target.value
                    }))}
                    placeholder="Tell us about your catalog and what you're looking to achieve"
                    className="min-h-[100px] bg-background"
                  />
                </div>

                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                  Submit Registration
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Your information is secure and will never be shared</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}