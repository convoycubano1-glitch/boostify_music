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
      <main className="flex-1">
        <HeroSection />
        <ContentSection activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
    </div>
  );
}

const HeroSection = () => (
  <div className="relative w-full min-h-[60vh] md:h-[90vh] overflow-hidden">
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
    <div className="relative z-10 container mx-auto h-full flex flex-col justify-center items-center px-4 pt-16 md:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-sm rounded-lg p-4 md:p-6 w-full md:max-w-2xl text-center"
      >
        <motion.h1
          className="text-3xl md:text-6xl font-bold text-orange-400 mb-3 md:mb-6"
          style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8)' }}
        >
          Bring Your Music to Life
        </motion.h1>
        <motion.p
          transition={{ delay: 0.2 }}
          className="text-base md:text-xl text-white/90 mb-4 md:mb-8"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          Transform your music into stunning visuals with AI-powered technology or collaborate with professional directors
        </motion.p>
      </motion.div>
      <Features />
    </div>
  </div>
);

const Features = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mt-8 md:mt-16 w-full px-4 md:px-0">
    {featuresData.map((feature, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 + index * 0.1 }}
        className="bg-black/70 backdrop-blur-sm rounded-lg p-3 md:p-6 border border-white/20 hover:border-orange-500/50 transition-colors"
      >
        <feature.icon className="h-5 w-5 md:h-8 md:w-8 text-orange-500 mb-2 md:mb-4" />
        <h3 className="text-sm md:text-lg font-semibold text-white mb-1 md:mb-2">{feature.title}</h3>
        <p className="text-xs md:text-base text-white/90">{feature.description}</p>
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
  activeTab: 'directors' | 'ai';
  setActiveTab: (tab: 'directors' | 'ai') => void;
}

const ContentSection = ({ activeTab, setActiveTab }: ContentSectionProps) => (
  <div className="container mx-auto px-4 py-12 md:py-32">
    <div className="flex flex-col items-center mb-8 md:mb-20">
      <h2 className="text-xl md:text-3xl font-bold text-center mb-3 md:mb-6">Choose Your Creation Path</h2>
      <p className="text-sm md:text-base text-muted-foreground text-center max-w-2xl mb-6 md:mb-10 px-4">
        Whether you prefer working with professional directors or leveraging AI technology,
        we provide the tools you need to create stunning music videos
      </p>
      <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
        <Button
          variant={activeTab === 'directors' ? 'default' : 'outline'}
          onClick={() => setActiveTab('directors')}
          className="gap-2 w-full sm:w-auto"
          size="lg"
        >
          <Users className="h-4 w-4" />
          Work with Directors
        </Button>
        <Button
          variant={activeTab === 'ai' ? 'default' : 'outline'}
          onClick={() => setActiveTab('ai')}
          className="gap-2 w-full sm:w-auto"
          size="lg"
        >
          <Bot className="h-4 w-4" />
          AI Video Creation
        </Button>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="lg:col-span-2 order-2 lg:order-1">
        {activeTab === 'directors' ? <DirectorsList /> : <MusicVideoAI />}
      </div>
      <div className="order-1 lg:order-2">
        <DirectorSignup />
      </div>
    </div>
  </div>
);