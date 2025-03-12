import React, { useState, useEffect } from 'react';

/**
 * Interfaz para cada agente editor
 */
interface EditorAgent {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  style: string;
  rating: number;
  available: boolean;
}

/**
 * Datos de agentes de ejemplo
 */
const EDITOR_AGENTS: EditorAgent[] = [
  {
    id: "agent-001",
    name: "Sofia Ramirez",
    specialty: "Edición Dinámica Urbana",
    experience: "12 años en postproducción para videos musicales urbanos",
    style: "Transiciones fluidas con efectos visuales modernos",
    rating: 4.8,
    available: true
  },
  {
    id: "agent-002",
    name: "Marcus Chen",
    specialty: "Montaje Experimental",
    experience: "15 años en cine independiente y videos experimentales",
    style: "Composiciones visuales complejas con capas múltiples",
    rating: 4.9,
    available: true
  },
  {
    id: "agent-003",
    name: "Isabella Moretti",
    specialty: "Edición Pop Contemporánea",
    experience: "10 años en videoclips para artistas pop internacionales",
    style: "Colores vibrantes y transiciones elegantes tipo fashion",
    rating: 4.7,
    available: true
  },
  {
    id: "agent-004",
    name: "Alejandro Vega",
    specialty: "Edición Musical Sincronizada",
    experience: "14 años en sincronización audio-visual para conciertos",
    style: "Precisión milimétrica en sincronización con beats y ritmos",
    rating: 4.9,
    available: true
  }
];

interface StandaloneEditorAgentsProps {
  onAgentSelect?: (agent: EditorAgent) => void;
}

/**
 * Componente independiente para Editor Agents
 * No depende de alias de importación @/ para maximizar la compatibilidad
 */
const StandaloneEditorAgents: React.FC<StandaloneEditorAgentsProps> = ({ onAgentSelect }) => {
  const [selectedAgent, setSelectedAgent] = useState<EditorAgent | null>(null);
  const [agents, setAgents] = useState<EditorAgent[]>(EDITOR_AGENTS);

  const handleSelectAgent = (agent: EditorAgent) => {
    setSelectedAgent(prev => prev?.id === agent.id ? null : agent);
    if (onAgentSelect) {
      onAgentSelect(agent);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 bg-background rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">Editor Agents</h2>
        <p className="text-muted-foreground">
          Editores profesionales de video con IA avanzada para tus proyectos musicales
        </p>
      </div>

      {selectedAgent && (
        <div className="mb-4 p-3 bg-primary/10 border-l-4 border-primary rounded">
          <span className="font-semibold">Agente seleccionado:</span> {selectedAgent.name}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className={`border rounded-lg p-4 transition-all hover:shadow-md ${
              selectedAgent?.id === agent.id 
                ? 'border-2 border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{agent.name}</h3>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {agent.rating} ★
              </span>
            </div>
            <p className="text-primary font-medium text-sm mb-2">{agent.specialty}</p>
            <div className="mb-4">
              <p className="text-sm mb-1">
                <span className="font-semibold">Experiencia:</span> {agent.experience}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Estilo:</span> {agent.style}
              </p>
            </div>
            <div className="flex mt-auto pt-2">
              <button
                onClick={() => handleSelectAgent(agent)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedAgent?.id === agent.id
                    ? 'bg-primary/90 text-primary-foreground'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {selectedAgent?.id === agent.id ? 'Agente Seleccionado' : 'Seleccionar Agente'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Sobre los Agentes Editores:</h3>
        <p className="text-sm text-muted-foreground">
          Los Agentes Editores utilizan técnicas avanzadas de inteligencia artificial para asistir en el proceso de edición profesional. 
          Cada agente ha sido entrenado con miles de horas de contenido de alta calidad y especializado en diferentes estilos visuales y 
          técnicas de edición.
        </p>
      </div>
    </div>
  );
};

export default StandaloneEditorAgents;