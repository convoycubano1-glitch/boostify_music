import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ImageStyleAdvisor } from "@/components/image-advisor/image-style-advisor";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Sparkles, Camera, Palette, Music2, TrendingUp, Image as ImageIcon } from "lucide-react";

export default function ArtistImageAdvisorPage() {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Section with Video Background */}
        <div className="relative h-[50vh] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src="/assets/artist_style_video.mp4"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-background/40 to-background" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative container mx-auto px-4 h-full flex flex-col justify-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Artist Image Advisor
            </h1>
            <p className="text-xl text-white/80 max-w-2xl">
              Transform your artist image with AI-powered style recommendations. Upload your reference photos and let our advanced AI guide you to your perfect look.
            </p>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Steps Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 border-orange-500/20 bg-background/60 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">1. Upload Photos</h3>
                    <p className="text-muted-foreground">Share your current style</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 border-orange-500/20 bg-background/60 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">2. AI Analysis</h3>
                    <p className="text-muted-foreground">Get personalized insights</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 border-orange-500/20 bg-background/60 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Palette className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">3. Style Preview</h3>
                    <p className="text-muted-foreground">Visualize your new look</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Main Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 lg:max-w-[600px] mx-auto">
              <TabsTrigger value="upload" className="gap-2">
                <Camera className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="style" className="gap-2">
                <Music2 className="h-4 w-4" />
                Style
              </TabsTrigger>
              <TabsTrigger value="generate" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <Card className="p-8">
                <ImageStyleAdvisor />
              </Card>
            </TabsContent>

            {/* Add other TabsContent components for style, generate, and results */}
          </Tabs>
        </div>
      </main>
    </div>
  );
}