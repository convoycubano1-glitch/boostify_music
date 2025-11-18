import { useState } from "react";
import { Header } from "../components/layout/header";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Video, Users, Star, Wand2, Bot, CloudCog, Edit, Sparkles, ArrowRight } from "lucide-react";
import { DirectorsList } from "../components/music-video/directors-list";
import { MusicVideoAI } from "../components/music-video/music-video-ai";
import { MotionDNASection } from "../components/music-video/motion-dna-section";
import { motion } from "framer-motion";
import { Link } from "wouter";
import type { DirectorProfile } from "../data/directors";

export default function MusicVideoCreator() {
  const [activeTab, setActiveTab] = useState<'directors' | 'ai' | 'editor'>('directors');
  const [selectedDirector, setSelectedDirector] = useState<DirectorProfile | null>(null);

  const handleDirectorSelected = (director: DirectorProfile) => {
    setSelectedDirector(director);
    setActiveTab('ai');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col">
        <HeroSection />
        <ContentSection 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          selectedDirector={selectedDirector}
          onDirectorSelected={handleDirectorSelected}
        />
        <MotionDNASection />
      </main>
    </div>
  );
}

const HeroSection = () => (
  <div className="relative w-full min-h-[50vh] sm:min-h-[60vh] md:h-[70vh] overflow-hidden">
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover opacity-90"
    >
      <source src="/background-video.mp4" type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-background" />
    <div className="relative z-10 container mx-auto h-full flex flex-col justify-center items-center px-4 py-8 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-sm rounded-lg p-4 sm:p-6 w-full max-w-[95%] sm:max-w-md md:max-w-2xl text-center"
      >
        <motion.h1
          className="text-xl sm:text-3xl md:text-5xl font-bold text-orange-400 mb-2 sm:mb-4"
          style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8)' }}
        >
          Bring Your Music to Life
        </motion.h1>
        <motion.p
          transition={{ delay: 0.2 }}
          className="text-xs sm:text-base md:text-lg text-white/90 mb-4 sm:mb-6"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          Transform your music into stunning visuals with AI-powered technology or collaborate with professional directors
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Link href="/motion-dna">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-7 shadow-2xl shadow-orange-600/50 hover:shadow-orange-600/70 transition-all group"
              data-testid="button-motion-dna"
            >
              <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
              Discover MotionDNA - Launching Q2 2026
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-xs sm:text-sm text-white/70 mt-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            Revolutionary AI motion model trained on 700+ professional music videos
          </p>
        </motion.div>
      </motion.div>
      <Features />
    </div>
  </div>
);

const Features = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-8 w-full max-w-[95%] sm:max-w-[90%] mx-auto">
    {featuresData.map((feature, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 + index * 0.1 }}
        className="bg-black/70 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20 hover:border-orange-500/50 transition-colors"
      >
        <div className="flex flex-col items-center text-center">
          <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 mb-2 sm:mb-3" />
          <h3 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">{feature.title}</h3>
          <p className="text-xs sm:text-sm text-white/90">{feature.description}</p>
        </div>
      </motion.div>
    ))}
  </div>
);

const featuresData = [
  {
    icon: Star,
    title: "Professional Directors",
    description: "Connect with experienced music video directors who understand your vision",
  },
  {
    icon: Wand2,
    title: "AI-Powered Creation",
    description: "Generate unique video concepts and storyboards using cutting-edge AI technology",
  },
  {
    icon: CloudCog,
    title: "Seamless Workflow",
    description: "From concept to final cut, manage your entire music video production process",
  },
];

interface ContentSectionProps {
  activeTab: 'directors' | 'ai' | 'editor';
  setActiveTab: (tab: 'directors' | 'ai' | 'editor') => void;
  selectedDirector: DirectorProfile | null;
  onDirectorSelected: (director: DirectorProfile) => void;
}

const ContentSection = ({ activeTab, setActiveTab, selectedDirector, onDirectorSelected }: ContentSectionProps) => (
  <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 flex-1">
    <div className="flex flex-col items-center mb-4 sm:mb-8 text-center">
      <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4">Choose Your Creation Path</h2>
      <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mb-4 sm:mb-6 px-2 sm:px-4">
        Whether you prefer working with professional directors or leveraging AI technology,
        we provide the tools you need to create stunning music videos
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 w-full sm:w-auto">
        <Button
          variant={activeTab === 'directors' ? 'default' : 'outline'}
          onClick={() => setActiveTab('directors')}
          className="w-full sm:w-auto min-h-[40px] sm:min-h-[44px] text-sm sm:text-base py-1 px-3 sm:py-2 sm:px-4"
          size="default"
        >
          <Users className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="whitespace-nowrap">Work with Directors</span>
        </Button>
        <Button
          variant={activeTab === 'ai' ? 'default' : 'outline'}
          onClick={() => setActiveTab('ai')}
          className="w-full sm:w-auto min-h-[40px] sm:min-h-[44px] text-sm sm:text-base py-1 px-3 sm:py-2 sm:px-4"
          size="default"
        >
          <Bot className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="whitespace-nowrap">AI Video Creation</span>
        </Button>
        <Link href="/professional-editor">
          <Button
            variant={activeTab === 'editor' ? 'default' : 'outline'}
            className="w-full sm:w-auto min-h-[40px] sm:min-h-[44px] text-sm sm:text-base py-1 px-3 sm:py-2 sm:px-4"
            size="default"
          >
            <Video className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="whitespace-nowrap">Gallery</span>
          </Button>
        </Link>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-[1200px] mx-auto">
      {/* Main content area - Only showing content for active tab */}
      <div className="w-full">
        {activeTab === 'directors' ? (
          <DirectorsList onDirectorSelected={onDirectorSelected} />
        ) : (
          <MusicVideoAI preSelectedDirector={selectedDirector} />
        )}
      </div>
    </div>
  </div>
);