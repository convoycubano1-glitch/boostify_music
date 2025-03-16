/**
 * Componente CompositionEditor
 * Editor para configurar aspectos compositivos de la escena
 */
import React, { useState } from 'react';
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { PlusCircle } from 'lucide-react';
import { Textarea } from "../../ui/textarea";

interface CompositionEditorProps {
  composition: string;
  onUpdate: (composition: string) => void;
}

// Sugerencias preestablecidas de composición
const COMPOSITION_SUGGESTIONS = [
  "Iluminación dramática con sombras duras y alto contraste",
  "Luz suave y difusa con tonos pastel",
  "Composición simétrica con punto focal central",
  "Regla de tercios con sujeto principal desplazado",
  "Luz de fondo que crea silueta",
  "Esquema de color cálido con tonos dorados y ámbar",
  "Esquema de color frío con tonos azules y cyan",
  "Profundidad de campo reducida con fondo desenfocado",
];

export function CompositionEditor({ composition, onUpdate }: CompositionEditorProps) {
  const [isEditing, setIsEditing] = useState(Boolean(composition));

  const handleAddComposition = (suggestion: string) => {
    if (!composition) {
      onUpdate(suggestion);
    } else {
      onUpdate(`${composition}, ${suggestion.toLowerCase()}`);
    }
    setIsEditing(true);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Composition</Label>

      {isEditing ? (
        <Textarea
          value={composition}
          onChange={(e) => onUpdate(e.target.value)}
          className="resize-none"
          rows={3}
          placeholder="Describe la composición visual de la escena..."
        />
      ) : (
        <div className="grid grid-cols-1 gap-2">
          <p className="text-xs text-muted-foreground">Seleccione elementos de composición para añadir</p>
          <div className="flex flex-wrap gap-1">
            {COMPOSITION_SUGGESTIONS.slice(0, 4).map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleAddComposition(suggestion)}
              >
                <PlusCircle className="h-3 w-3 mr-1" />
                {suggestion.length > 20 
                  ? suggestion.substring(0, 18) + "..." 
                  : suggestion}
              </Button>
            ))}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="w-full justify-center mt-1"
          >
            Editar composición manualmente
          </Button>
        </div>
      )}

      {/* Muestra sugerencias adicionales cuando está en modo edición */}
      {isEditing && (
        <div className="mt-2">
          <Label className="text-xs text-muted-foreground">Sugerencias de composición:</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {COMPOSITION_SUGGESTIONS.slice(4).map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleAddComposition(suggestion)}
              >
                <PlusCircle className="h-3 w-3 mr-1" />
                {suggestion.length > 20
                  ? suggestion.substring(0, 18) + "..."
                  : suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}