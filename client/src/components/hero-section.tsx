import { motion } from "framer-motion";
import { SiSpotify, SiApplemusic, SiYoutube, SiTiktok, SiInstagram } from "react-icons/si";
import { ArrowRight, Sparkles, Bot, Music, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  // Animación para los elementos con fade-in
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  
  // Animación para los elementos con scale-in
  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 15, delay: 0.2 }
    }
  };
  
  // Plataformas soportadas
  const platforms = [
    { icon: <SiSpotify className="h-5 w-5" />, name: "Spotify" },
    { icon: <SiApplemusic className="h-5 w-5" />, name: "Apple Music" },
    { icon: <SiYoutube className="h-5 w-5" />, name: "YouTube" },
    { icon: <SiTiktok className="h-5 w-5" />, name: "TikTok" },
    { icon: <SiInstagram className="h-5 w-5" />, name: "Instagram" }
  ];
  
  return (
    <div className="py-12 md:py-24 lg:py-32 relative overflow-hidden">
      {/* Fondo con gradiente y ruido */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#121212] to-[#303030] opacity-95 z-0" />
      <div 
        className="absolute inset-0 bg-repeat opacity-30 z-0" 
        style={{ 
          backgroundImage: "url('/noise-pattern.png')", 
          backgroundSize: "200px 200px" 
        }} 
      />
      
      {/* Círculos decorativos */}
      <div className="absolute top-20 right-[10%] w-[300px] h-[300px] rounded-full bg-orange-500/10 blur-3xl"></div>
      <div className="absolute bottom-20 left-[5%] w-[250px] h-[250px] rounded-full bg-orange-500/5 blur-3xl"></div>
      
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Columna izquierda - Contenido principal */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tecnología de IA avanzada</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              Crea tu sello discográfico virtual con IA
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg text-gray-300 max-w-xl">
              Lanza artistas virtuales generados por IA, distribuye música original, y genera ingresos desde cero sin experiencia musical previa.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full px-8">
                <span>Comenzar ahora</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="lg" className="border-gray-700 text-white hover:bg-gray-800 rounded-full px-6">
                Ver demostración
              </Button>
            </motion.div>
            
            {/* Plataformas soportadas */}
            <motion.div variants={fadeIn} className="mt-8">
              <p className="text-sm text-gray-400 mb-4">Distribución a todas las plataformas principales:</p>
              <div className="flex flex-wrap gap-6 items-center">
                {platforms.map((platform, index) => (
                  <motion.div 
                    key={platform.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {platform.icon}
                    <span className="text-sm font-medium">{platform.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
          
          {/* Columna derecha - Tarjetas de características */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            className="relative"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FeatureCard 
                icon={<Bot className="h-5 w-5 text-orange-500" />}
                title="Artistas Virtuales con IA"
                description="Crea artistas virtuales con personalidades únicas y estilos definidos."
                delay={0.3}
              />
              
              <FeatureCard 
                icon={<Music className="h-5 w-5 text-orange-500" />}
                title="Generación Musical"
                description="Produce música de alta calidad utilizando motores de IA avanzados."
                delay={0.4}
              />
              
              <FeatureCard 
                icon={<Globe className="h-5 w-5 text-orange-500" />}
                title="Distribución Global"
                description="Publica automáticamente en Spotify, Apple Music y otras plataformas."
                delay={0.5}
              />
              
              <FeatureCard 
                icon={<Sparkles className="h-5 w-5 text-orange-500" />}
                title="Marketing con IA"
                description="Promociona tu música con campañas de marketing generadas por IA."
                delay={0.6}
              />
            </div>
            
            {/* Blobs decorativos */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-orange-500/10 blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-orange-500/5 blur-xl"></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Componente para tarjetas de características
function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay = 0 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-gradient-to-br from-gray-900/70 to-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 rounded-lg bg-gray-800/50">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-100 mb-1">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}