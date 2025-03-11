import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  FileText,
  Copy,
  Edit2,
  Download,
  AlignLeft,
  Bot
} from 'lucide-react';

interface TranscriptionPanelProps {
  transcription: string | null;
  currentTime: number;
}

export function TranscriptionPanel({
  transcription,
  currentTime
}: TranscriptionPanelProps) {
  // Simular secciones de letra con timestamps
  const simulatedLyricSections = [
    { start: 0, end: 15, text: "Verso 1: " + (transcription || "").substring(0, 50) },
    { start: 15, end: 30, text: "Pre-coro: " + (transcription || "").substring(50, 100) },
    { start: 30, end: 50, text: "Coro: " + (transcription || "").substring(100, 150) },
    { start: 50, end: 65, text: "Verso 2: " + (transcription || "").substring(150, 200) },
    { start: 65, end: 80, text: "Puente: " + (transcription || "").substring(200, 250) },
    { start: 80, end: 100, text: "Coro Final: " + (transcription || "").substring(250, 300) },
  ];
  
  // Determinar la sección actual basada en el tiempo
  const getCurrentSection = () => {
    return simulatedLyricSections.find(
      section => currentTime >= section.start && currentTime < section.end
    ) || simulatedLyricSections[0];
  };
  
  const currentSection = getCurrentSection();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-1.5 text-orange-500" />
          <h3 className="text-sm font-semibold">Letras y Transcripción</h3>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7">
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {transcription ? (
        <>
          {/* Sección actual destacada */}
          <Card className="p-3 bg-orange-50 border-orange-200">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <AlignLeft className="h-4 w-4 mr-1.5 text-orange-500" />
                <span className="text-sm font-medium">Sección Actual</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {currentSection.start}s - {currentSection.end}s
              </span>
            </div>
            <p className="text-sm">
              {currentSection.text}
            </p>
          </Card>
          
          {/* Todas las secciones */}
          <Card className="p-2">
            <ScrollArea className="h-[160px]">
              <div className="space-y-3 p-2">
                {simulatedLyricSections.map((section, index) => (
                  <div 
                    key={`section-${index}`}
                    className={cn(
                      "p-2 rounded",
                      section === currentSection 
                        ? "bg-orange-50 border border-orange-200" 
                        : "hover:bg-muted/50 cursor-pointer"
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium">
                        {section.text.split(':')[0]}:
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {section.start}s - {section.end}s
                      </span>
                    </div>
                    <p className="text-xs">
                      {section.text.split(':').slice(1).join(':')}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
          
          {/* Panel de sugerencias */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Bot className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium mb-1">Sugerencias de IA</div>
                <p className="text-xs">
                  Se detectó un patrón AABA en la estructura. Considere reforzar el coro con 
                  efectos visuales más intensos en los momentos 30s y 80s para resaltar el tema 
                  principal de la canción.
                </p>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">
            No hay transcripción disponible
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Sube un archivo de audio para generar automáticamente la transcripción de la letra.
          </p>
          <Button variant="outline" size="sm" className="mt-4">
            <Bot className="h-4 w-4 mr-1.5" /> Generar transcripción
          </Button>
        </div>
      )}
    </div>
  );
}