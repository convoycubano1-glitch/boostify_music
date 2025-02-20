import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Music, Users, Mic2, Award, Target, TrendingUp } from "lucide-react";

interface Milestone {
  id: number;
  title: string;
  description: string;
  progress: number;
  category: string;
  icon: React.ReactNode;
  completed: boolean;
  nextStep?: string;
}

interface ArtistProgressTrackerProps {
  artistId: string;
}

export function ArtistProgressTracker({ artistId }: ArtistProgressTrackerProps) {
  // Mock data - In real app, this would come from an API
  const [milestones] = useState<Milestone[]>([
    {
      id: 1,
      title: "Establecimiento de Marca",
      description: "Crear y definir tu identidad musical única",
      progress: 80,
      category: "Branding",
      icon: <Star className="w-6 h-6 text-orange-500" />,
      completed: true,
      nextStep: "¡Completa tu perfil al 100%!"
    },
    {
      id: 2,
      title: "Alcance en Redes Sociales",
      description: "Construir presencia en plataformas sociales",
      progress: 60,
      category: "Marketing",
      icon: <Users className="w-6 h-6 text-orange-500" />,
      completed: false,
      nextStep: "Alcanza 1000 seguidores en Instagram"
    },
    {
      id: 3,
      title: "Producción Musical",
      description: "Lanzamiento de tracks y álbumes",
      progress: 40,
      category: "Música",
      icon: <Music className="w-6 h-6 text-orange-500" />,
      completed: false,
      nextStep: "Lanza tu próximo single"
    },
    {
      id: 4,
      title: "Actuaciones en Vivo",
      description: "Experiencia en presentaciones",
      progress: 75,
      category: "Performances",
      icon: <Mic2 className="w-6 h-6 text-orange-500" />,
      completed: false,
      nextStep: "Agenda tu próximo show"
    }
  ]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <Card className="p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-orange-500" />
              Progreso Artístico
            </h2>
            <p className="text-muted-foreground">
              Seguimiento de tu desarrollo musical
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
              Nivel Actual: Emergente
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-500">
              4 Logros Desbloqueados
            </Badge>
          </div>
        </div>

        <div className="grid gap-6">
          {milestones.map((milestone) => (
            <motion.div
              key={milestone.id}
              variants={itemVariants}
              className="relative"
            >
              <Card className={`p-4 ${
                milestone.completed ? 'bg-orange-500/5 border-orange-500/20' : ''
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    milestone.completed ? 'bg-orange-500/10' : 'bg-muted'
                  }`}>
                    {milestone.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{milestone.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {milestone.description}
                        </p>
                      </div>
                      <Badge
                        variant={milestone.completed ? "default" : "outline"}
                        className={milestone.completed ? "bg-orange-500" : ""}
                      >
                        {milestone.progress}%
                      </Badge>
                    </div>
                    <Progress
                      value={milestone.progress}
                      className="h-2 mb-2"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-muted-foreground">
                        Próximo paso: {milestone.nextStep}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orange-500 hover:text-orange-600"
                      >
                        <Target className="w-4 h-4 mr-1" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-orange-500/5 rounded-lg border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="font-medium">Progreso General:</span>
              <span className="text-orange-500 font-bold">63%</span>
            </div>
            <Button variant="outline" className="border-orange-500/50 text-orange-500">
              <Award className="w-4 h-4 mr-2" />
              Ver Todos los Logros
            </Button>
          </div>
        </div>
      </motion.div>
    </Card>
  );
}
