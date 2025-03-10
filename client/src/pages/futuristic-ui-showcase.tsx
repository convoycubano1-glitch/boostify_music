import React, { useState } from 'react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { PremiumButton } from '@/components/ui/premium-button';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';
import { motion } from 'framer-motion';
import { Play, Pause, Music, Wand2, Zap, Sparkles, Film } from 'lucide-react';

export default function FuturisticUIShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);
  
  return (
    <div className="space-y-16">
      {/* Sección de botones premium */}
      <section>
        <h3 className="text-2xl font-bold mb-6">Botones Premium</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatedCard variant="premium" padding="lg" hover="glow">
            <h4 className="font-medium mb-4">Variantes Premium</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <PremiumButton variant="premium">Premium</PremiumButton>
                <PremiumButton variant="premium" glow>Con Glow</PremiumButton>
              </div>
              <div className="flex gap-3">
                <PremiumButton variant="outline">Outline</PremiumButton>
                <PremiumButton variant="subtle">Subtle</PremiumButton>
              </div>
              <div className="flex gap-3">
                <PremiumButton variant="action">Action</PremiumButton>
                <PremiumButton variant="default">Default</PremiumButton>
              </div>
            </div>
          </AnimatedCard>
          
          <AnimatedCard variant="glass" padding="lg" hover="raise">
            <h4 className="font-medium mb-4">Botones con Iconos</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <PremiumButton variant="premium">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Premium
                </PremiumButton>
                <PremiumButton variant="outline">
                  <Film className="mr-2 h-4 w-4" />
                  Videos
                </PremiumButton>
              </div>
              <div className="flex gap-3">
                <PremiumButton variant="subtle">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generar
                </PremiumButton>
                <PremiumButton variant="action">
                  <Zap className="mr-2 h-4 w-4" />
                  Potenciar
                </PremiumButton>
              </div>
            </div>
          </AnimatedCard>
          
          <AnimatedCard variant="default" padding="lg" hover="subtle">
            <h4 className="font-medium mb-4">Tamaños</h4>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 items-center">
                <PremiumButton variant="premium" size="sm">Pequeño</PremiumButton>
                <PremiumButton variant="premium">Default</PremiumButton>
                <PremiumButton variant="premium" size="lg">Grande</PremiumButton>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <PremiumButton variant="outline" size="sm">Pequeño</PremiumButton>
                <PremiumButton variant="outline">Default</PremiumButton>
                <PremiumButton variant="outline" size="lg">Grande</PremiumButton>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </section>
      
      {/* Sección de tarjetas animadas */}
      <section>
        <h3 className="text-2xl font-bold mb-6">Tarjetas Animadas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatedCard variant="premium" padding="lg" hover="glow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Tarjeta Premium</h3>
              <p className="text-gray-400">
                Diseñada con gradientes premium y efectos de iluminación para un aspecto lujoso.
              </p>
              <PremiumButton variant="premium" className="w-full">Explorar</PremiumButton>
            </div>
          </AnimatedCard>
          
          <AnimatedCard variant="glow" padding="lg" hover="scale">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Film className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Tarjeta con Glow</h3>
              <p className="text-gray-400">
                Incluye efectos de brillo que se intensifican al pasar el cursor.
              </p>
              <PremiumButton variant="outline" className="w-full">Explorar</PremiumButton>
            </div>
          </AnimatedCard>
          
          <AnimatedCard variant="glass" padding="lg" hover="raise">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Tarjeta de Cristal</h3>
              <p className="text-gray-400">
                Efecto de cristal con elevación al pasar el cursor para un aspecto moderno.
              </p>
              <PremiumButton variant="subtle" className="w-full">Explorar</PremiumButton>
            </div>
          </AnimatedCard>
        </div>
      </section>
      
      {/* Audio Visualizer */}
      <section>
        <h3 className="text-2xl font-bold mb-6">Visualizador de Audio</h3>
        <AnimatedCard variant="premium" padding="lg" className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-full flex justify-center">
              <AudioVisualizer
                playing={isPlaying}
                color="rgba(249, 115, 22, 0.8)"
                height={60}
                barCount={25}
                className="w-full max-w-md"
              />
            </div>
            
            <div className="flex gap-3">
              <PremiumButton 
                variant="premium" 
                glow
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Reproducir
                  </>
                )}
              </PremiumButton>
              
              <PremiumButton 
                variant="outline"
                onClick={() => setIsPlaying(false)}
              >
                Reiniciar
              </PremiumButton>
            </div>
            
            <p className="text-gray-400 text-center max-w-lg">
              El visualizador de audio responde al estado de reproducción, simulando la respuesta 
              a los beats musicales con una animación orgánica.
            </p>
          </div>
        </AnimatedCard>
      </section>
      
      {/* Efectos de animación */}
      <section>
        <h3 className="text-2xl font-bold mb-6">Efectos de Animación</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <AnimatedCard variant="premium" padding="lg" hover="glow">
            <h4 className="font-medium mb-4">Entradas Animadas</h4>
            <div className="h-48 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-center overflow-hidden">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  delay: 0.1
                }}
                className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center"
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
            </div>
          </AnimatedCard>
          
          <AnimatedCard variant="glass" padding="lg" hover="scale">
            <h4 className="font-medium mb-4">Efectos de Partículas</h4>
            <div className="h-48 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-center relative overflow-hidden">
              {/* Partículas simuladas */}
              <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-orange-500 rounded-full"
                    initial={{ 
                      x: Math.random() * 100 - 50 + "%", 
                      y: Math.random() * 100 - 50 + "%",
                      opacity: 0
                    }}
                    animate={{ 
                      x: [
                        Math.random() * 100 - 50 + "%", 
                        Math.random() * 100 - 50 + "%",
                        Math.random() * 100 - 50 + "%"
                      ],
                      y: [
                        Math.random() * 100 - 50 + "%", 
                        Math.random() * 100 - 50 + "%",
                        Math.random() * 100 - 50 + "%"
                      ],
                      opacity: [0, 0.8, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 5 + Math.random() * 5,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
              
              <motion.div
                animate={{ 
                  boxShadow: ["0px 0px 5px rgba(249, 115, 22, 0.5)", "0px 0px 20px rgba(249, 115, 22, 0.8)", "0px 0px 5px rgba(249, 115, 22, 0.5)"]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                }}
                className="w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-600 rounded-full flex items-center justify-center z-10"
              >
                <Zap className="h-8 w-8 text-white" />
              </motion.div>
            </div>
          </AnimatedCard>
        </div>
      </section>
    </div>
  );
}