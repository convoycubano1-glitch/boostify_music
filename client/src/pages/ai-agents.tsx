import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import {
  Music2,
  VideoIcon,
  Palette,
  MessageSquare,
  Share2,
  ShoppingBag,
  UserCog,
  Megaphone,
  Brain,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ComposerAgent } from "@/components/ai/composer-agent";
import { VideoDirectorAgent } from "@/components/ai/video-director-agent";
import { MarketingAgent } from "@/components/ai/marketing-agent";
import { SocialMediaAgent } from "@/components/ai/social-media-agent";
import { MerchandiseAgent } from "@/components/ai/merchandise-agent";
import { ManagerAgent } from "@/components/ai/manager-agent";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  status: "idle" | "working" | "completed" | "error";
}

const agents: Agent[] = [
  {
    id: "composer",
    name: "Agente Compositor",
    description: "Genera composiciones musicales y arreglos",
    icon: Music2,
    color: "bg-orange-500",
    status: "idle",
  },
  {
    id: "music-creator",
    name: "Agente Creador de Música",
    description: "Produce y masteriza pistas musicales",
    icon: Sparkles,
    color: "bg-purple-500",
    status: "idle",
  },
  {
    id: "video-director",
    name: "Agente Director de Video",
    description: "Crea y dirige videos musicales con IA",
    icon: VideoIcon,
    color: "bg-blue-500",
    status: "idle",
  },
  {
    id: "marketing",
    name: "Agente de Marketing",
    description: "Desarrolla estrategias de marketing musical",
    icon: Megaphone,
    color: "bg-green-500",
    status: "idle",
  },
  {
    id: "social-media",
    name: "Agente de Social Media",
    description: "Gestiona y optimiza presencia en redes sociales",
    icon: Share2,
    color: "bg-pink-500",
    status: "idle",
  },
  {
    id: "image-creator",
    name: "Agente Creador de Imagen",
    description: "Genera artwork y contenido visual",
    icon: Palette,
    color: "bg-yellow-500",
    status: "idle",
  },
  {
    id: "manager",
    name: "Agente Manager",
    description: "Coordina y optimiza la gestión artística",
    icon: UserCog,
    color: "bg-red-500",
    status: "idle",
  },
  {
    id: "merchandise",
    name: "Agente Merchandise",
    description: "Diseña y gestiona productos merchandising",
    icon: ShoppingBag,
    color: "bg-indigo-500",
    status: "idle",
  },
];

export default function AIAgentsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
            Orquestador de Agentes IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Conjunto de agentes especializados para potenciar tu música
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComposerAgent />
          <VideoDirectorAgent />
          <MarketingAgent />
          <SocialMediaAgent />
          <MerchandiseAgent />
          <ManagerAgent />
        </div>
      </main>
    </div>
  );
}