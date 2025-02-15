import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ImageStyleAdvisor } from "@/components/image-advisor/image-style-advisor";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Sparkles, Camera, Palette, Music2, TrendingUp, Image as ImageIcon, Star } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ArtistImageAdvisorPage() {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 md:py-20">
        {/* Hero Section with Video Background */}
        <div className="relative h-[50vh] md:h-[60vh] overflow-hidden rounded-lg mb-8">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src="/assets/hero-video.mp4"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-background/40 to-background" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center"
          >
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
              AI-Powered Image Advisor
            </h1>
            <p className="text-base md:text-xl text-white/90 max-w-2xl mb-6 md:mb-8 leading-relaxed">
              Transform your artist image with cutting-edge AI technology. Get personalized style recommendations and visualize your perfect look.
            </p>
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto"
              onClick={() => setActiveTab("upload")}
            >
              <Camera className="mr-2 h-5 w-5" />
              Start Your Transformation
            </Button>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mb-8 md:mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            <motion.div variants={itemVariants}>
              <Card className="p-4 md:p-6 border-orange-500/20 bg-background/60 backdrop-blur-sm hover:bg-orange-500/5 transition-colors h-full">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Camera className="h-6 w-6 md:h-7 md:w-7 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base md:text-lg">AI Analysis</h3>
                    <p className="text-sm text-muted-foreground">Get instant style feedback</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Our AI analyzes your current style and provides personalized recommendations based on industry trends.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="p-4 md:p-6 border-orange-500/20 bg-background/60 backdrop-blur-sm hover:bg-orange-500/5 transition-colors h-full">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 md:h-7 md:w-7 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base md:text-lg">Style Generation</h3>
                    <p className="text-sm text-muted-foreground">Vision to reality</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  See AI-generated previews of your potential new looks, tailored to your brand and genre.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="p-4 md:p-6 border-orange-500/20 bg-background/60 backdrop-blur-sm hover:bg-orange-500/5 transition-colors h-full">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 md:h-7 md:w-7 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base md:text-lg">Brand Growth</h3>
                    <p className="text-sm text-muted-foreground">Optimize your impact</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Get insights on how your image can help grow your audience and strengthen your brand.
                </p>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Interface */}
        <Card className="p-4 md:p-8 border-orange-500/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b grid w-full grid-cols-2 md:grid-cols-4 gap-2 lg:max-w-[600px] mx-auto p-2">
              <TabsTrigger 
                value="upload" 
                className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-3 md:py-2 data-[state=active]:bg-orange-500"
              >
                <Camera className="h-4 w-4 flex-shrink-0" />
                <span className="text-[10px] md:text-sm">Upload</span>
              </TabsTrigger>
              <TabsTrigger 
                value="style" 
                className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-3 md:py-2 data-[state=active]:bg-orange-500"
              >
                <Music2 className="h-4 w-4 flex-shrink-0" />
                <span className="text-[10px] md:text-sm">Style</span>
              </TabsTrigger>
              <TabsTrigger 
                value="generate" 
                className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-3 md:py-2 data-[state=active]:bg-orange-500"
              >
                <ImageIcon className="h-4 w-4 flex-shrink-0" />
                <span className="text-[10px] md:text-sm">Generate</span>
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-3 md:py-2 data-[state=active]:bg-orange-500"
              >
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                <span className="text-[10px] md:text-sm">Results</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="upload">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <ImageStyleAdvisor />
                </motion.div>
              </TabsContent>

              {/* Other TabsContent components will be implemented later */}
            </div>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}