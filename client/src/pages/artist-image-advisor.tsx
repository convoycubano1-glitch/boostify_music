import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ImageStyleAdvisor } from "@/components/image-advisor/image-style-advisor";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Sparkles, Camera, Palette, Music2, TrendingUp, Image as ImageIcon, Star, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 mb-12"
        >
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
            AI-Powered Image Advisor
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your artist image with cutting-edge AI technology. Get personalized style recommendations and visualize your perfect look.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12"
        >
          <motion.div variants={itemVariants}>
            <Card className="p-6 border-orange-500/20 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant style feedback and personalized recommendations
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-6 border-orange-500/20 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Style Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Transform your vision into reality with AI-powered suggestions
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-6 border-orange-500/20 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Brand Growth</h3>
                  <p className="text-sm text-muted-foreground">
                    Optimize your image impact and grow your audience
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Interface */}
        <Card className="border-orange-500/20 bg-black/40 backdrop-blur-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="sticky top-0 z-30 bg-black/60 backdrop-blur-sm border-b border-orange-500/20 px-4 py-2">
              <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 max-w-2xl mx-auto">
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden md:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="style" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                >
                  <Music2 className="h-4 w-4" />
                  <span className="hidden md:inline">Style</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="generate" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden md:inline">Generate</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="results" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                >
                  <Star className="h-4 w-4" />
                  <span className="hidden md:inline">Results</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 md:p-8">
              <TabsContent value="upload" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <ImageStyleAdvisor />
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}