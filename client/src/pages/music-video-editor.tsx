import React from 'react';
import { Header } from '../components/layout/header';
import { TimelineEditor } from '../components/music-video/timeline-editor';

/**
 * Página de acceso directo al editor profesional de música
 * Esta página no requiere autenticación para permitir pruebas y desarrollo
 */
export default function MusicVideoEditor() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <TimelineEditor />
      </main>
    </div>
  );
}