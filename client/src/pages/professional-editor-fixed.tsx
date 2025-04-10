import React from 'react';
import { Button } from '../components/ui/button';

// Componente extremadamente simplificado para el editor profesional sin provider
const ProfessionalEditor: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen p-8 bg-black text-white items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Editor Profesional</h1>
      <p className="text-xl mb-8">Esta página está en desarrollo</p>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Button className="w-full">Nuevo Proyecto</Button>
        <Button className="w-full" variant="outline">Abrir Proyecto Existente</Button>
      </div>
    </div>
  );
};

export default ProfessionalEditor;