import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { AnimatedCard } from '@/components/ui/animated-card';
import { PremiumButton } from '@/components/ui/premium-button';
import FuturisticUIShowcase from './futuristic-ui-showcase';
import { Play, Music, Sparkles, Film, Zap, ChevronRight } from 'lucide-react';

export default function FuturisticUI() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero section con gradiente y partículas */}
      <section className="relative overflow-hidden">
        {/* Gradiente de fondo con glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-black"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full filter blur-[100px]"></div>
          <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-purple-600/10 rounded-full filter blur-[100px]"></div>
        </div>
        
        {/* Contenido del hero */}
        <div className="relative container mx-auto px-4 pt-20 pb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-white to-orange-300 bg-clip-text text-transparent">
                Crea Music Videos Impresionantes
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-zinc-400 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              La plataforma más avanzada para generar videos musicales profesionales con IA
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <PremiumButton glow size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Comenzar ahora
              </PremiumButton>
              <PremiumButton variant="outline" size="lg">
                <Play className="mr-2 h-5 w-5" />
                Ver ejemplos
              </PremiumButton>
            </motion.div>
            
            {/* Imagen/Video de muestra */}
            <motion.div 
              className="relative rounded-xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Play className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent"></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Sección de características */}
      <section className="py-20 bg-gradient-to-b from-black to-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Características Premium</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Herramientas de vanguardia para creadores de música que buscan llevar su contenido al siguiente nivel
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedCard variant="premium" padding="lg" hover="glow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Sincronización Perfecta</h3>
                <p className="text-zinc-400">
                  La inteligencia artificial sincroniza automáticamente el video con cada beat y elemento de tu pista.
                </p>
                <div className="pt-4">
                  <PremiumButton variant="subtle" className="w-full">
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Explorar
                  </PremiumButton>
                </div>
              </div>
            </AnimatedCard>
            
            <AnimatedCard variant="glow" padding="lg" hover="scale">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Film className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">LipSync con IA</h3>
                <p className="text-zinc-400">
                  Tecnología avanzada que sincroniza los labios de los personajes con tu letra de forma realista.
                </p>
                <div className="pt-4">
                  <PremiumButton variant="subtle" className="w-full">
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Explorar
                  </PremiumButton>
                </div>
              </div>
            </AnimatedCard>
            
            <AnimatedCard variant="glass" padding="lg" hover="raise">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Renders en Alta Definición</h3>
                <p className="text-zinc-400">
                  Exporta tus videos en calidad 4K con efectos cinematográficos profesionales.
                </p>
                <div className="pt-4">
                  <PremiumButton variant="subtle" className="w-full">
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Explorar
                  </PremiumButton>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </section>
      
      {/* Separador con gradiente */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-900/30 to-transparent"></div>
      
      {/* Showcase de la UI */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Interfaz Futurista</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Explora nuestra interfaz de usuario premium diseñada para una experiencia visual inmersiva
            </p>
            <div className="mt-6">
              <Link href="/futuristic-ui-showcase">
                <PremiumButton variant="premium" glow className="mt-4">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Ver Showcase Completo
                </PremiumButton>
              </Link>
            </div>
          </div>
          
          <FuturisticUIShowcase />
        </div>
      </section>
      
      {/* Footer con gradiente */}
      <footer className="py-16 bg-gradient-to-t from-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-orange-300 inline-block text-transparent bg-clip-text">
                  Boostify Music Creator
                </h3>
              </div>
              <p className="text-zinc-500 max-w-md">
                La plataforma definitiva para creadores de música que desean amplificar su presencia visual.
              </p>
            </div>
            
            <div className="flex space-x-8">
              <div>
                <h4 className="text-white font-semibold mb-3">Producto</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-zinc-400 hover:text-orange-400 transition-colors">Características</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-orange-400 transition-colors">Precios</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-orange-400 transition-colors">Tutoriales</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-3">Recursos</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-zinc-400 hover:text-orange-400 transition-colors">Documentación</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-orange-400 transition-colors">Blog</a></li>
                  <li><a href="#" className="text-zinc-400 hover:text-orange-400 transition-colors">Ayuda</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="h-px w-full bg-zinc-800 my-8"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-zinc-500 text-sm mb-4 md:mb-0">
              © 2025 Boostify Music. Todos los derechos reservados.
            </p>
            
            <div className="flex space-x-8">
              <a href="#" className="text-zinc-500 text-sm hover:text-white transition-colors">Términos</a>
              <a href="#" className="text-zinc-500 text-sm hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="text-zinc-500 text-sm hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}