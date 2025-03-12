import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useToast } from '../../hooks/use-toast';
import { 
  Bot, 
  Star, 
  Award, 
  Loader2, 
  Scissors, 
  Wand2, 
  Video, 
  Sparkles
} from 'lucide-react';

// Interfaces
export interface EditorAgent {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  style: string;
  capability: string;
  rating: number;
  imageUrl?: string;
  aiModel: string;
}

// Imágenes para los agentes (URLs públicas seguras)
const agentImages = [
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1531251445707-1f000e1e87d0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
];

// Datos de los agentes editores
const editorAgentsData: EditorAgent[] = [
  {
    id: "agent-1",
    name: "Sofia Ramirez",
    specialty: "Edición Dinámica Urbana",
    experience: "Especialista en cortes rápidos y sincronización con ritmos urbanos",
    style: "Transiciones fluidas con efectos visuales modernos",
    capability: "Ajuste automático de clips al ritmo del beat",
    rating: 4.8,
    imageUrl: agentImages[0],
    aiModel: "Video-Pro GPT 4.5"
  },
  {
    id: "agent-2",
    name: "Marcus Chen",
    specialty: "Montaje Experimental",
    experience: "Experto en ediciones no lineales y narrativas abstractas",
    style: "Composiciones visuales complejas con capas múltiples",
    capability: "Generación de transiciones personalizadas basadas en el estilo visual",
    rating: 4.9,
    imageUrl: agentImages[1],
    aiModel: "EditMaster AI 3.0"
  },
  {
    id: "agent-3",
    name: "Isabella Moretti",
    specialty: "Edición Pop Contemporánea",
    experience: "Especialista en ediciones brillantes y de alto impacto visual",
    style: "Colores vibrantes y transiciones elegantes tipo fashion",
    capability: "Sincronización perfecta de efectos visuales con música pop",
    rating: 4.7,
    imageUrl: agentImages[2],
    aiModel: "StyleSync Pro"
  },
  {
    id: "agent-4",
    name: "David O'Connor",
    specialty: "Montaje Rock & Metal",
    experience: "Experto en ediciones energéticas y de alta intensidad",
    style: "Cortes rápidos y transiciones agresivas con efectos de distorsión",
    capability: "Detección automática de momentos de alta intensidad en la música",
    rating: 4.6,
    imageUrl: agentImages[3],
    aiModel: "RockEdit AI"
  },
  {
    id: "agent-5",
    name: "Nina Patel",
    specialty: "Edición Electrónica",
    experience: "Pionera en sincronización visual con música electrónica",
    style: "Efectos digitales futuristas con sincronización milimétrica al beat",
    capability: "Análisis avanzado de frecuencias para sincronización visual",
    rating: 4.8,
    imageUrl: agentImages[4],
    aiModel: "BeatSync GPT"
  },
  {
    id: "agent-6",
    name: "James Wilson",
    specialty: "Edición Emotiva R&B",
    experience: "Especialista en narrativas visuales emotivas y fluidas",
    style: "Transiciones suaves con gradientes de color atmosféricos",
    capability: "Análisis de armonías para crear paletas de color coherentes",
    rating: 4.7,
    imageUrl: agentImages[5],
    aiModel: "SoulEdit Pro"
  }
];

export function EditorAgentsList() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<EditorAgent | null>(null);
  const [workflowStep, setWorkflowStep] = useState(0);

  // Función para seleccionar un agente
  const handleAgentSelect = (agent: EditorAgent) => {
    setSelectedAgent(agent);
    
    toast({
      title: "Agente seleccionado",
      description: `Has seleccionado a ${agent.name} como tu agente editor de IA`,
    });
    
    // Iniciar el flujo de trabajo
    setWorkflowStep(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Agentes Editores IA</h2>
              <p className="text-sm text-muted-foreground">
                Expertos virtuales en edición de videos musicales
              </p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-medium text-orange-500">IA Avanzada</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Agentes equipados con IA especializada en edición musical</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {editorAgentsData.map((agent) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border hover:bg-orange-500/5 transition-colors"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="h-32 w-32 rounded-lg overflow-hidden bg-orange-500/10 flex-shrink-0">
                  {agent.imageUrl ? (
                    <img
                      src={agent.imageUrl}
                      alt={`${agent.name} - ${agent.specialty}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(agent.name);
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Bot className="h-8 w-8 text-orange-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold truncate">{agent.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                      <span className="text-sm font-medium">{agent.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-orange-500">
                    {agent.specialty}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {agent.experience}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Estilo:</span> {agent.style}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Modelo:</span> {agent.aiModel}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Capacidad: {agent.capability}</span>
                  </div>
                  <Button
                    className="mt-4 w-full transition-all duration-200"
                    onClick={() => handleAgentSelect(agent)}
                  >
                    Seleccionar Agente
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {selectedAgent && workflowStep > 0 && (
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Wand2 className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Configuración del Agente {selectedAgent.name}</h2>
              <p className="text-sm text-muted-foreground">
                Personaliza cómo {selectedAgent.name} editará tu video
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg flex items-start gap-4">
              {selectedAgent.imageUrl && (
                <img
                  src={selectedAgent.imageUrl}
                  alt={selectedAgent.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold">{selectedAgent.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedAgent.specialty}</p>
                <p className="text-sm mt-1">{selectedAgent.capability}</p>
              </div>
            </div>

            {/* Aquí se pueden agregar más pasos del flujo de trabajo según sea necesario */}
            <div className="space-y-2">
              <Label>Intensidad de edición</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar intensidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subtle">Sutil</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="extreme">Extrema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sincronización con el ritmo</Label>
              <Select defaultValue="auto">
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de sincronización" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automática (Detección IA)</SelectItem>
                  <SelectItem value="beats">Beats principales</SelectItem>
                  <SelectItem value="sections">Secciones musicales</SelectItem>
                  <SelectItem value="minimal">Mínima</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estilo visual</Label>
              <Select defaultValue={selectedAgent.specialty.toLowerCase().replace(/ /g, "-")}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estilo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urban-dynamic">Urbano Dinámico</SelectItem>
                  <SelectItem value="experimental">Experimental</SelectItem>
                  <SelectItem value="contemporary-pop">Pop Contemporáneo</SelectItem>
                  <SelectItem value="rock-metal">Rock & Metal</SelectItem>
                  <SelectItem value="electronic">Electrónico</SelectItem>
                  <SelectItem value="emotional-rb">R&B Emotivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full mt-4">
              Iniciar Edición Automática
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default EditorAgentsList;