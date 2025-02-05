import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, Users, Upload, PlayCircle, Loader2, Star, Wand2, Bot, CloudCog } from "lucide-react";
import { DirectorsList } from "@/components/music-video/directors-list";
import { DirectorSignup } from "@/components/music-video/director-signup";
import { MusicVideoAI } from "@/components/music-video/music-video-ai";
import { motion } from "framer-motion";

export default function MusicVideoCreator() {
  const [activeTab, setActiveTab] = useState<'directors' | 'ai'>('directors');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="relative w-full h-[300px] md:h-[500px] overflow-hidden mt-16 md:mt-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-background" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300 mb-4 md:mb-6 text-center md:text-left"
          >
            Bring Your Music to Life
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 max-w-2xl mb-6 md:mb-8 text-center md:text-left drop-shadow-lg"
          >
            Transform your music into stunning visuals with AI-powered technology or collaborate with professional directors
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/20"
            >
              <Star className="h-6 w-6 md:h-8 md:w-8 text-orange-500 mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-semibold text-white mb-2">Professional Directors</h3>
              <p className="text-sm md:text-base text-white/80">
                Connect with experienced music video directors who understand your vision
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/20"
            >
              <Wand2 className="h-6 w-6 md:h-8 md:w-8 text-orange-500 mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-semibold text-white mb-2">AI-Powered Creation</h3>
              <p className="text-sm md:text-base text-white/80">
                Generate unique video concepts and storyboards using cutting-edge AI technology
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/20"
            >
              <CloudCog className="h-6 w-6 md:h-8 md:w-8 text-orange-500 mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-semibold text-white mb-2">Seamless Workflow</h3>
              <p className="text-sm md:text-base text-white/80">
                From concept to final cut, manage your entire music video production process
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 md:mb-4">
              Choose Your Creation Path
            </h2>
            <p className="text-sm md:text-base text-muted-foreground text-center max-w-2xl mb-6 md:mb-8">
              Whether you prefer working with professional directors or leveraging AI technology,
              we provide the tools you need to create stunning music videos
            </p>
            <div className="flex flex-col md:flex-row justify-center space-y-3 md:space-y-0 md:space-x-4">
              <Button
                variant={activeTab === 'directors' ? 'default' : 'outline'}
                onClick={() => setActiveTab('directors')}
                className="gap-2 w-full md:w-auto"
                size="lg"
              >
                <Users className="h-5 w-5" />
                Work with Directors
              </Button>
              <Button
                variant={activeTab === 'ai' ? 'default' : 'outline'}
                onClick={() => setActiveTab('ai')}
                className="gap-2 w-full md:w-auto"
                size="lg"
              >
                <Bot className="h-5 w-5" />
                AI Video Creation
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {activeTab === 'directors' ? (
                <DirectorsList />
              ) : (
                <MusicVideoAI />
              )}
            </div>
            <div>
              <DirectorSignup />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}