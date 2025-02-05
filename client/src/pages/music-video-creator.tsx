import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, Users, Upload, PlayCircle, Loader2 } from "lucide-react";
import { DirectorsList } from "@/components/music-video/directors-list";
import { DirectorSignup } from "@/components/music-video/director-signup";
import { MusicVideoAI } from "@/components/music-video/music-video-ai";
import { motion } from "framer-motion";

export default function MusicVideoCreator() {
  const [activeTab, setActiveTab] = useState<'directors' | 'ai'>('directors');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="relative w-full h-[300px] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/assets/video-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Music Video Creation Hub
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">
            Connect with professional directors or create AI-powered music videos instantly
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center mb-8 space-x-4">
            <Button
              variant={activeTab === 'directors' ? 'default' : 'outline'}
              onClick={() => setActiveTab('directors')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Work with Directors
            </Button>
            <Button
              variant={activeTab === 'ai' ? 'default' : 'outline'}
              onClick={() => setActiveTab('ai')}
              className="gap-2"
            >
              <Video className="h-4 w-4" />
              AI Video Creation
            </Button>
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