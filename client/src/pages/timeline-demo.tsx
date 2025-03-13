import React from 'react';
import { TimelineDemo } from '../components/timeline/TimelineDemo';

export default function TimelineDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Editor de Timeline con Capas Aisladas y Placeholders</h1>
      <p className="mb-6 text-muted-foreground">
        Esta página demuestra la implementación del editor profesional de timeline con capas aisladas para audio
        y sistema de placeholders para contenido generado por IA. Características principales:
      </p>
      
      <ul className="list-disc pl-5 mb-6 space-y-1 text-muted-foreground">
        <li>Capa de audio aislada y bloqueada por defecto para proteger la línea de tiempo base</li>
        <li>Soporte para placeholders con generación de contenido AI</li>
        <li>Restricción de 5 segundos máximo para clips generados por IA</li>
        <li>Sistema de 10 estilos distintos de edición con rangos de duración específicos</li>
        <li>Gestión de capas con visibilidad y bloqueo independientes</li>
      </ul>
      
      <TimelineDemo />
    </div>
  );
}