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
  const { toast } = useToast();
  const [activeAgents, setActiveAgents] = useState<Agent[]>(agents);

  const activateAgent = async (agentId: string) => {
    setActiveAgents(prev =>
      prev.map(agent =>
        agent.id === agentId
          ? { ...agent, status: "working" }
          : agent
      )
    );

    // Simular trabajo del agente
    toast({
      title: "Agente Activado",
      description: `El agente ${agents.find(a => a.id === agentId)?.name} está trabajando...`,
    });

    // Aquí iría la lógica real de cada agente
    setTimeout(() => {
      setActiveAgents(prev =>
        prev.map(agent =>
          agent.id === agentId
            ? { ...agent, status: "completed" }
            : agent
        )
      );
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
            Orquestador de Agentes IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Conjunto de agentes especializados para potenciar tu música
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeAgents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 h-full relative overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className={`absolute inset-0 ${agent.color}/5`} />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${agent.color}/10`}>
                      <agent.icon className={`h-6 w-6 ${agent.color} text-white`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      className={`w-full ${agent.color} hover:${agent.color}/90`}
                      onClick={() => activateAgent(agent.id)}
                      disabled={agent.status === "working"}
                    >
                      {agent.status === "working" ? (
                        <>
                          <Brain className="mr-2 h-4 w-4 animate-pulse" />
                          Trabajando...
                        </>
                      ) : agent.status === "completed" ? (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Completado
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Activar Agente
                        </>
                      )}
                    </Button>
                  </div>

                  {agent.status === "working" && (
                    <div className="mt-4">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${agent.color}`}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Panel de Control y Monitoreo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Panel de Control</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Aquí irán los controles y monitoreo de los agentes */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Agentes Activos</h3>
                <div className="space-y-2">
                  {activeAgents
                    .filter(agent => agent.status === "working")
                    .map(agent => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <agent.icon className={`h-4 w-4 ${agent.color}`} />
                          <span>{agent.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Procesando...
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tareas Completadas</h3>
                <div className="space-y-2">
                  {activeAgents
                    .filter(agent => agent.status === "completed")
                    .map(agent => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <agent.icon className={`h-4 w-4 ${agent.color}`} />
                          <span>{agent.name}</span>
                        </div>
                        <Sparkles className="h-4 w-4 text-green-500" />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
