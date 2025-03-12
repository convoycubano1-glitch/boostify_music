import React from 'react';
import { Bot, Star, Wand2, Scissors } from 'lucide-react';

// Esta es una versión ultra-simplificada sin dependencias externas

const editorAgents = [
  {
    id: 'agent-1',
    name: 'Sofia Ramirez',
    specialty: 'Edición Dinámica Urbana',
    experience: 'Especialista en cortes rápidos y sincronización con ritmos urbanos',
    style: 'Transiciones fluidas con efectos visuales modernos',
    capability: 'Ajuste automático de clips al ritmo del beat',
    rating: 4.8,
    aiModel: 'Video-Pro GPT 4.5'
  },
  {
    id: 'agent-2',
    name: 'Marcus Chen',
    specialty: 'Montaje Experimental',
    experience: 'Experto en ediciones no lineales y narrativas abstractas',
    style: 'Composiciones visuales complejas con capas múltiples',
    capability: 'Generación de transiciones personalizadas basadas en el estilo visual',
    rating: 4.9,
    aiModel: 'EditMaster AI 3.0'
  },
  {
    id: 'agent-3',
    name: 'Isabella Moretti',
    specialty: 'Edición Pop Contemporánea',
    experience: 'Especialista en ediciones brillantes y de alto impacto visual',
    style: 'Colores vibrantes y transiciones elegantes tipo fashion',
    capability: 'Sincronización perfecta de efectos visuales con música pop',
    rating: 4.7,
    aiModel: 'StyleSync Pro'
  }
];

export function SimpleEditorAgents() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-orange-500" />
        </div>
        <h2 className="text-xl font-semibold">Agentes Editores IA</h2>
      </div>
      
      <div className="grid gap-4">
        {editorAgents.map((agent) => (
          <div key={agent.id} className="p-4 border rounded-lg hover:bg-orange-500/5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{agent.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{agent.rating}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-orange-500">
                  {agent.specialty}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {agent.experience}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Estilo:</span> {agent.style}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <Scissors className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500">Capacidad: {agent.capability}</span>
                </div>
                <button
                  className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-md w-full hover:bg-orange-600 transition-colors"
                  onClick={() => alert(`Has seleccionado a ${agent.name} como tu agente editor`)}
                >
                  Seleccionar Agente
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SimpleEditorAgents;