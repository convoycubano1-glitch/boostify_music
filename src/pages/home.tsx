import React from 'react';
import { Link } from "wouter";
import { Footer } from "../components/layout/footer";

// Página de inicio muy simplificada para la demo
const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-black/80 py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-orange-500">Boostify Music</span>
            </div>
            <nav className="hidden md:flex gap-6">
              <Link href="/features">
                <span className="text-gray-300 hover:text-orange-400">Características</span>
              </Link>
              <Link href="/pricing">
                <span className="text-gray-300 hover:text-orange-400">Precios</span>
              </Link>
              <Link href="/contact">
                <span className="text-gray-300 hover:text-orange-400">Contacto</span>
              </Link>
            </nav>
            <div>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600">
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Impulsa tu música con IA</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Transforma tu carrera musical con herramientas de IA para videos, marketing y producción.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600">
                  Comenzar gratis
                </button>
              </Link>
              <Link href="/demo">
                <button className="bg-gray-800 text-white px-6 py-3 rounded-md hover:bg-gray-700">
                  Ver demo
                </button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Nueva sección en inglés sobre tokenización musical */}
        <section className="py-16 bg-gradient-to-r from-indigo-900 to-purple-900 text-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0 md:pr-8">
                <div className="inline-block px-3 py-1 text-xs font-semibold bg-orange-500/20 text-orange-400 rounded-full mb-4 uppercase tracking-wide">
                  New Feature
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Tokenize Your Music with Web3</h2>
                <p className="text-gray-300 text-lg mb-6">
                  Take control of your music career and monetize your creations like never before. 
                  Our Web3 tokenization platform allows artists to sell directly to fans, earn royalties 
                  automatically, and create new revenue streams.
                </p>
                <ul className="space-y-2 mb-8 text-gray-300">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Direct fan monetization without intermediaries
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Automatic royalties on every resale
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Full ownership and control of your creative work
                  </li>
                </ul>
                <Link href="/tokenizacion">
                  <button className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-md hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg flex items-center">
                    Explore Web3 Tokenization
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                    </svg>
                  </button>
                </Link>
              </div>
              <div className="md:w-1/2 bg-black/30 rounded-lg p-6 border border-purple-500/20">
                <div className="aspect-video rounded-lg overflow-hidden relative bg-gradient-to-br from-purple-900/60 to-indigo-900/60 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Music NFT Platform</h3>
                      <p className="text-gray-300">Connect your wallet and start tokenizing your music in minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Características principales</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-700/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Creador de Videos Musicales</h3>
                <p className="text-gray-300">Genera videos musicales profesionales en minutos usando IA avanzada.</p>
              </div>
              <div className="bg-gray-700/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Generador de Música</h3>
                <p className="text-gray-300">Crea pistas originales y voces sintéticas para tus canciones.</p>
              </div>
              <div className="bg-gray-700/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Marketing Musical</h3>
                <p className="text-gray-300">Estrategias personalizadas y promoción automatizada para tu música.</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Planes de precios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Básico</h3>
                  <p className="text-3xl font-bold mb-4">Gratis</p>
                  <ul className="text-left space-y-2 mb-8">
                    <li>5 videos por mes</li>
                    <li>1 proyecto de música</li>
                    <li>Análisis básico</li>
                  </ul>
                  <Link href="/signup">
                    <button className="block w-full bg-gray-700 text-white py-2 rounded-md hover:bg-gray-600">
                      Empezar
                    </button>
                  </Link>
                </div>
              </div>
              <div className="bg-gray-800 border border-orange-500 rounded-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Pro</h3>
                  <p className="text-3xl font-bold mb-4">$29/mes</p>
                  <ul className="text-left space-y-2 mb-8">
                    <li>50 videos por mes</li>
                    <li>20 proyectos de música</li>
                    <li>Análisis avanzado</li>
                  </ul>
                  <Link href="/signup">
                    <button className="block w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600">
                      Prueba gratuita
                    </button>
                  </Link>
                </div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Business</h3>
                  <p className="text-3xl font-bold mb-4">$79/mes</p>
                  <ul className="text-left space-y-2 mb-8">
                    <li>Videos ilimitados</li>
                    <li>Proyectos ilimitados</li>
                    <li>Estrategia personalizada</li>
                  </ul>
                  <Link href="/contact">
                    <button className="block w-full bg-gray-700 text-white py-2 rounded-md hover:bg-gray-600">
                      Contactar
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;

// Componente para secciones con fondo oscuro
const DarkSection = ({ 
  children, 
  className = "",
  id = "",
  style = {}
}: { 
  children: React.ReactNode, 
  className?: string,
  id?: string,
  style?: React.CSSProperties
}) => (
  <section 
    id={id}
    className={`w-full bg-black py-24 text-white ${className}`}
    style={style}
  >
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      {children}
    </div>
  </section>
);

// Componente para secciones con fondo claro
const LightSection = ({ 
  children, 
  className = "",
  id = ""
}: { 
  children: React.ReactNode, 
  className?: string,
  id?: string
}) => (
  <section 
    id={id}
    className={`w-full bg-gradient-to-b from-gray-50 to-white py-24 text-gray-900 ${className}`}
  >
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      {children}
    </div>
  </section>
);

// Componente para secciones con fondo de marca
const BrandSection = ({ 
  children, 
  className = "",
  id = ""
}: { 
  children: React.ReactNode, 
  className?: string,
  id?: string
}) => (
  <section 
    id={id}
    className={`w-full bg-gradient-to-r from-orange-600 to-orange-400 py-24 text-white ${className}`}
  >
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      {children}
    </div>
  </section>
);

// Navegación principal con transparencia
const MainNav = () => {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { user, signInWithGoogle, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión correctamente",
      });
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      toast({
        title: "Error de autenticación",
        description: "No se pudo iniciar sesión con Google",
        variant: "destructive",
      });
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center mr-2">
                  <Music2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Boostify</span>
              </div>
            </Link>
            <nav className="ml-8 hidden md:flex space-x-6">
              <Link href="/features">
                <span className={`text-sm font-medium hover:text-orange-400 transition-colors ${
                  location === '/features' ? 'text-orange-400' : 'text-white/80'
                }`}>
                  Características
                </span>
              </Link>
              <Link href="/pricing">
                <span className={`text-sm font-medium hover:text-orange-400 transition-colors ${
                  location === '/pricing' ? 'text-orange-400' : 'text-white/80'
                }`}>
                  Precios
                </span>
              </Link>
              <Link href="/ecosystem">
                <span className={`text-sm font-medium hover:text-orange-400 transition-colors ${
                  location === '/ecosystem' ? 'text-orange-400' : 'text-white/80'
                }`}>
                  Ecosistema
                </span>
              </Link>
              <Link href="/contact">
                <span className={`text-sm font-medium hover:text-orange-400 transition-colors ${
                  location === '/contact' ? 'text-orange-400' : 'text-white/80'
                }`}>
                  Contacto
                </span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <div id="google_translate_element"></div>
            </div>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  className="bg-transparent border-white/20 text-white hover:bg-white/10"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Panel de control
                </Button>
                <button
                  onClick={signOut}
                  className="text-sm font-medium text-white/80 hover:text-orange-400 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSignIn}
                  className="flex items-center bg-white text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <SiGoogle className="mr-2" />
                  Iniciar con Google
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Sección Hero
const HeroSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center pt-16 bg-[url('/src/images/hero-bg-overlay.jpg')] bg-cover bg-center before:content-[''] before:absolute before:inset-0 before:bg-black/70 before:z-0">
      <div className="absolute inset-0 z-0">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover opacity-40"
          loop 
          muted
          playsInline
          poster="/src/images/hero-bg-overlay.jpg"
        >
          <source src="/src/images/videos/promo_video_background.mp4" type="video/mp4" />
        </video>
      </div>
      
      <div className="container mx-auto relative z-10 px-4 md:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <Badge variant="outline" className="text-orange-400 border-orange-400 px-4 py-1">
              TECNOLOGÍA AI + MARKETING MUSICAL
            </Badge>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-orange-200 tracking-tight leading-tight mb-6"
          >
            Impulsa tu música<br />con inteligencia artificial
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-300 max-w-3xl mb-10"
          >
            Transforma tu carrera musical con herramientas de IA que generan videos musicales profesionales,
            crean estrategias de marketing personalizadas y te conectan con la industria musical.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-8"
              >
                Comienza gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Pausar video
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Ver en acción
                </>
              )}
            </Button>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-12 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
          <img 
            src="/src/images/dashboard-preview.png" 
            alt="Boostify Music Dashboard" 
            className="w-full rounded-lg shadow-2xl border border-white/10"
          />
        </motion.div>
      </div>
    </div>
  );
};

// Sección de estadísticas
const StatsSection = () => {
  const [animateStats, setAnimateStats] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimateStats(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (statsRef.current) {
      observer.observe(statsRef.current);
    }
    
    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  return (
    <div className="relative z-10 -mt-20 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div 
          ref={statsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8"
        >
          <StatCard 
            title="Artistas activos"
            value={animateStats ? 12500 : 0}
            icon={UserCircle2}
            iconColor="text-blue-500"
            gradientFrom="from-blue-500"
            gradientTo="to-blue-700"
            delay={0}
            suffix="+"
          />
          <StatCard 
            title="Videos generados"
            value={animateStats ? 45000 : 0}
            icon={Video}
            iconColor="text-purple-500"
            gradientFrom="from-purple-500"
            gradientTo="to-purple-700"
            delay={0.1}
            suffix="+"
          />
          <StatCard 
            title="Streams generados"
            value={animateStats ? 2 : 0}
            icon={TrendingUp}
            iconColor="text-green-500"
            gradientFrom="from-green-500"
            gradientTo="to-green-700"
            delay={0.2}
            suffix="M+"
          />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
  delay: number;
  suffix?: string;
}

const StatCard = ({ title, value, icon: Icon, iconColor, gradientFrom, gradientTo, delay, suffix = "" }: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (value > 0) {
      const duration = 2000; // ms
      const increment = Math.ceil(value / (duration / 16)); // 60fps
      
      let start = 0;
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(start);
        }
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <h3 className="text-4xl font-bold text-white mb-2">
        {displayValue.toLocaleString()}{suffix}
      </h3>
      <p className="text-gray-400">{title}</p>
    </motion.div>
  );
};

// Sección de Características
const FeaturesSection = () => {
  const controls = useAnimation();
  const featuresRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start("visible");
        }
      },
      { threshold: 0.1 }
    );
    
    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }
    
    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, [controls]);

  return (
    <DarkSection>
      <div className="text-center mb-16">
        <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 mb-4">
          CARACTERÍSTICAS
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Todo lo que necesitas para <span className="text-orange-400">triunfar</span></h2>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Un conjunto completo de herramientas diseñadas para artistas independientes
          que quieren llevar su carrera musical al siguiente nivel.
        </p>
      </div>

      <motion.div 
        ref={featuresRef}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <FeatureCard 
          title="Creador de Videos Musicales" 
          description="Genera videos musicales profesionales en minutos usando IA. Selecciona estilos, efectos y edita con nuestra línea de tiempo."
          icon={PlaySquare}
          color="blue"
          link="/music-video-creator"
        />
        <FeatureCard 
          title="Generador de Música" 
          description="Crea pistas originales con IA, produce voces sintéticas y genera letras en múltiples géneros musicales."
          icon={Music2}
          color="purple"
          link="/music-generator"
        />
        <FeatureCard 
          title="Marketing Musical" 
          description="Estrategias de promoción personalizadas, automatización de redes sociales y análisis de audiencia detallado."
          icon={TrendingUp}
          color="orange"
          link="/promotion"
        />
        <FeatureCard 
          title="Conexiones en la Industria" 
          description="Accede a una base de datos de contactos relevantes en la industria musical y métricas para hacer seguimiento."
          icon={Users2}
          color="green"
          link="/contacts"
        />
        <FeatureCard 
          title="Promoción en YouTube" 
          description="Herramientas específicas para optimizar tus videos, aumentar suscriptores y maximizar las visualizaciones."
          icon={Youtube}
          color="red"
          link="/youtube-views"
        />
        <FeatureCard 
          title="Distribución Global" 
          description="Publica tu música en todas las plataformas importantes y recibe tus regalías sin intermediarios."
          icon={Globe}
          color="teal"
          link="/distribution"
        />
      </motion.div>
    </DarkSection>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  link: string;
}

const colorMap: Record<string, { bg: string, text: string, border: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
};

const FeatureCard = ({ title, description, icon: Icon, color, link }: FeatureCardProps) => {
  const colorStyle = colorMap[color] || colorMap.blue;
  
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
    >
      <div className={`p-3 rounded-lg inline-block mb-4 ${colorStyle.bg} ${colorStyle.border}`}>
        <Icon className={`h-6 w-6 ${colorStyle.text}`} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      <Link href={link}>
        <span className={`inline-flex items-center ${colorStyle.text} hover:underline cursor-pointer`}>
          Explorar <ChevronRight className="ml-1 h-4 w-4" />
        </span>
      </Link>
    </motion.div>
  );
};

// Sección Cómo Funciona
const HowItWorksSection = () => {
  return (
    <LightSection>
      <div className="text-center mb-16">
        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 mb-4">
          PROCESO SIMPLE
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">Cómo funciona <span className="text-orange-500">Boostify</span></h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Un proceso intuitivo diseñado para impulsar tu carrera musical en tres simples pasos
        </p>
      </div>

      <div className="relative">
        {/* Línea de conexión */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-1 h-[calc(100%-120px)] bg-orange-100 hidden md:block"></div>
        
        <div className="grid grid-cols-1 gap-16 relative z-10">
          <StepCard 
            number={1} 
            title="Crea contenido increíble"
            description="Utiliza nuestras herramientas de IA para producir videos musicales, pistas originales y contenido visual de alta calidad que destaque en las plataformas digitales."
            imageSrc="/src/images/step1-content-creation.jpg"
            flipped={false}
          />
          
          <StepCard 
            number={2} 
            title="Implementa tu estrategia"
            description="Nuestra IA analiza tu estilo y audiencia para crear una estrategia de marketing personalizada. Programa publicaciones, conecta con influencers y maximiza tu alcance."
            imageSrc="/src/images/step2-strategy.jpg"
            flipped={true}
          />
          
          <StepCard 
            number={3} 
            title="Analiza y optimiza"
            description="Monitorea en tiempo real el rendimiento de tus campañas a través de nuestro panel analítico. Recibe recomendaciones personalizadas para mejorar constantemente."
            imageSrc="/src/images/step3-analytics.jpg"
            flipped={false}
          />
        </div>
      </div>
    </LightSection>
  );
};

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  imageSrc: string;
  flipped: boolean;
}

const StepCard = ({ number, title, description, imageSrc, flipped }: StepCardProps) => {
  return (
    <div className={`flex flex-col ${flipped ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-16`}>
      <div className="w-full md:w-1/2">
        <div className="aspect-video rounded-xl overflow-hidden shadow-xl">
          <img 
            src={imageSrc} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      <div className="w-full md:w-1/2 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="bg-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
            {number}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-xl text-gray-600 mb-6">{description}</p>
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          {number === 1 && (
            <>
              <Badge className="bg-blue-100 text-blue-700 px-3 py-1">Videos musicales</Badge>
              <Badge className="bg-purple-100 text-purple-700 px-3 py-1">Generación de música</Badge>
              <Badge className="bg-green-100 text-green-700 px-3 py-1">Diseño de portadas</Badge>
            </>
          )}
          {number === 2 && (
            <>
              <Badge className="bg-orange-100 text-orange-700 px-3 py-1">Estrategia de marketing</Badge>
              <Badge className="bg-red-100 text-red-700 px-3 py-1">Promoción en YouTube</Badge>
              <Badge className="bg-indigo-100 text-indigo-700 px-3 py-1">Automatización social</Badge>
            </>
          )}
          {number === 3 && (
            <>
              <Badge className="bg-teal-100 text-teal-700 px-3 py-1">Analítica avanzada</Badge>
              <Badge className="bg-amber-100 text-amber-700 px-3 py-1">Informes detallados</Badge>
              <Badge className="bg-cyan-100 text-cyan-700 px-3 py-1">Optimización IA</Badge>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Sección de Testimonio destacado
const TestimonialSection = () => {
  return (
    <DarkSection id="testimonials" className="py-32">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="absolute -top-6 -left-6 h-24 w-24 bg-orange-500/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-purple-500/20 rounded-full blur-xl"></div>
          
          <div className="relative bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-orange-400">
                  <img 
                    src="/src/images/testimonial-artist.jpg" 
                    alt="DJ Alex Martini" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white">DJ Alex Martini</h4>
                  <p className="text-gray-400">Artista Electrónico, Barcelona</p>
                </div>
              </div>
              
              <blockquote className="text-xl text-gray-300 italic">
                "Antes gastaba miles de euros en producción de videos y marketing. Con Boostify, he podido crear 15 videos musicales profesionales en un mes y mi canal de YouTube ha crecido de 2,000 a 45,000 suscriptores en solo 3 meses. ¡El retorno de inversión es increíble!"
              </blockquote>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10x</div>
                  <div className="text-sm text-gray-400">ROI</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">+43k</div>
                  <div className="text-sm text-gray-400">Suscriptores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">90%</div>
                  <div className="text-sm text-gray-400">Tiempo ahorrado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 mb-4">
            HISTORIAS DE ÉXITO
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Artistas que han <span className="text-orange-400">transformado</span> su carrera
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Descubre cómo artistas independientes están utilizando Boostify para alcanzar nuevas audiencias, 
            aumentar sus ingresos y acelerar su crecimiento en la industria musical.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Check className="h-6 w-6 text-green-400" />
              <p className="text-gray-300">Generación de contenido 10 veces más rápido</p>
            </div>
            <div className="flex items-center space-x-4">
              <Check className="h-6 w-6 text-green-400" />
              <p className="text-gray-300">Aumento significativo en reproducciones y seguidores</p>
            </div>
            <div className="flex items-center space-x-4">
              <Check className="h-6 w-6 text-green-400" />
              <p className="text-gray-300">Ahorro de hasta 90% en costes de producción</p>
            </div>
          </div>
          
          <div className="mt-10">
            <Link href="/testimonials">
              <Button 
                variant="outline" 
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
              >
                Ver más historias <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DarkSection>
  );
};

// Sección de Tecnología
const TechnologySection = () => {
  return (
    <LightSection id="technology" className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 mb-4">
            TECNOLOGÍA AVANZADA
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Inteligencia artificial <span className="text-orange-500">especializada</span> en música
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Nuestra plataforma integra los avances más recientes en inteligencia artificial
            específicamente diseñados para la industria musical. Tecnología que entiende el ritmo,
            la armonía y las tendencias del mercado.
          </p>
          
          <div className="space-y-6">
            <TechFeature 
              icon={Video} 
              title="Generación de video de última generación" 
              description="Videos de alta definición con movimientos de cámara cinematográficos y efectos visuales avanzados."
            />
            <TechFeature 
              icon={Music2} 
              title="Síntesis musical avanzada" 
              description="Algoritmos que comprenden teoría musical y pueden generar composiciones originales en cualquier género."
            />
            <TechFeature 
              icon={CloudLightning} 
              title="Procesamiento en la nube" 
              description="Toda la potencia computacional necesaria sin requerir hardware especializado en tu dispositivo."
            />
          </div>
          
          <div className="mt-10">
            <Link href="/technology">
              <Button 
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Explorar tecnología <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-orange-400/30 to-purple-500/30 rounded-full blur-3xl"></div>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="relative z-10"
          >
            <img
              src="/src/images/tech-circle-diagram.png"
              alt="Tecnología de Boostify"
              className="max-w-full"
            />
          </motion.div>
        </div>
      </div>
    </LightSection>
  );
};

interface TechFeatureProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const TechFeature = ({ icon: Icon, title, description }: TechFeatureProps) => {
  return (
    <div className="flex space-x-4">
      <div className="flex-shrink-0 mt-1">
        <div className="bg-orange-100 p-3 rounded-lg">
          <Icon className="h-6 w-6 text-orange-600" />
        </div>
      </div>
      <div>
        <h3 className="font-bold text-xl text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

// Sección de Planes de Precios
const PricingSection = () => {
  return (
    <DarkSection id="pricing">
      <div className="text-center mb-16">
        <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 mb-4">
          PLANES ACCESIBLES
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Precios <span className="text-orange-400">transparentes</span>, sin sorpresas
        </h2>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades y comienza a transformar tu carrera musical hoy mismo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <PricingCard 
          title="Básico"
          subtitle="Para artistas emergentes"
          price="Gratis"
          features={[
            "5 videos musicales por mes",
            "1 proyecto de música generada",
            "Estrategia de marketing básica",
            "Análisis de audiencia limitado",
            "Soporte por email",
          ]}
          buttonText="Comenzar gratis"
          buttonLink="/signup"
          variant="basic"
        />
        
        <PricingCard 
          title="Pro"
          subtitle="Para artistas en crecimiento"
          price="$29"
          period="por mes"
          features={[
            "50 videos musicales por mes",
            "20 proyectos de música generada",
            "Estrategia de marketing avanzada",
            "Analítica completa",
            "Base de datos de contactos básica",
            "Soporte prioritario",
          ]}
          buttonText="Prueba gratuita de 7 días"
          buttonLink="/signup?plan=pro"
          variant="pro"
          popular={true}
        />
        
        <PricingCard 
          title="Business"
          subtitle="Para artistas profesionales"
          price="$79"
          period="por mes"
          features={[
            "Videos ilimitados",
            "Proyectos de música ilimitados",
            "Estrategia de marketing personalizada",
            "Acceso a plugins premium",
            "Base de datos de contactos completa",
            "Soporte VIP",
            "Consultoría personalizada",
          ]}
          buttonText="Contactar ventas"
          buttonLink="/contact-sales"
          variant="business"
        />
      </div>
    </DarkSection>
  );
};

interface PricingCardProps {
  title: string;
  subtitle: string;
  price: string;
  period?: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  variant: 'basic' | 'pro' | 'business';
  popular?: boolean;
}

const PricingCard = ({ 
  title, 
  subtitle, 
  price, 
  period, 
  features, 
  buttonText, 
  buttonLink, 
  variant, 
  popular = false 
}: PricingCardProps) => {
  let borderColor = "border-white/10";
  let bgColor = "bg-white/5";
  let buttonVariant: "default" | "outline" | "ghost" = "outline";
  
  if (variant === 'pro') {
    borderColor = "border-orange-500/50";
    bgColor = "bg-gradient-to-b from-orange-900/20 to-orange-700/10";
    buttonVariant = "default";
  } else if (variant === 'business') {
    borderColor = "border-purple-500/50";
    bgColor = "bg-gradient-to-b from-purple-900/20 to-purple-700/10";
  }

  return (
    <Card className={`relative rounded-xl ${borderColor} ${bgColor} shadow-xl overflow-hidden`}>
      {popular && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-sm font-medium py-1 px-3 rounded-bl-lg">
          Más popular
        </div>
      )}
      
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
          <p className="text-gray-400">{subtitle}</p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-end">
            <span className="text-4xl font-bold text-white">{price}</span>
            {period && <span className="text-gray-400 ml-2">{period}</span>}
          </div>
        </div>
        
        <div className="mb-8">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-gray-300">
                <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <Link href={buttonLink}>
          <Button 
            variant={buttonVariant} 
            className={`w-full ${
              buttonVariant === 'default' 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'border-white/20 hover:bg-white/10'
            }`}
          >
            {buttonText}
          </Button>
        </Link>
      </div>
    </Card>
  );
};

// Sección de Llamada a la Acción
const CallToActionSection = () => {
  return (
    <BrandSection id="cta">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Comienza a transformar tu carrera musical hoy mismo
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a miles de artistas que ya están utilizando Boostify para impulsar su carrera musical 
            con tecnología de vanguardia y estrategias de marketing efectivas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-white text-orange-600 hover:bg-white/90"
              >
                Comenzar gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/40 hover:bg-white/10"
              >
                Solicitar demo
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 flex items-center space-x-2 text-white/80">
            <Check className="h-5 w-5" />
            <span>Sin tarjeta de crédito</span>
            <span className="mx-2">•</span>
            <Check className="h-5 w-5" />
            <span>Cancela cuando quieras</span>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-3xl blur-3xl"></div>
          <div className="relative z-10 bg-white/10 border border-white/20 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <div className="text-white/60 mb-1">Artistas activos</div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-gradient-to-r from-white to-orange-300 rounded-full"></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-white/60 text-sm">0</span>
                  <span className="text-white text-sm font-medium">12,500+</span>
                </div>
              </div>
              
              <div>
                <div className="text-white/60 mb-2">Satisfacción</div>
                <div className="w-24 h-24 mx-auto">
                  <CircularProgressbar
                    value={98}
                    text="98%"
                    styles={buildStyles({
                      textSize: '24px',
                      pathColor: '#fff',
                      textColor: '#fff',
                      trailColor: 'rgba(255, 255, 255, 0.2)',
                    })}
                  />
                </div>
              </div>
              
              <div>
                <div className="text-white/60 mb-2">ROI promedio</div>
                <div className="w-24 h-24 mx-auto">
                  <CircularProgressbar
                    value={8.5}
                    maxValue={10}
                    text="8.5x"
                    styles={buildStyles({
                      textSize: '24px',
                      pathColor: '#fff',
                      textColor: '#fff',
                      trailColor: 'rgba(255, 255, 255, 0.2)',
                    })}
                  />
                </div>
              </div>
              
              <div className="col-span-2 bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white/40">
                    <img 
                      src="/src/images/recent-signup.jpg" 
                      alt="Artista reciente" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-white font-medium">Laura S. acaba de unirse</div>
                    <div className="text-white/60 text-sm">Hace 2 minutos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrandSection>
  );
};

// Sección FAQ
const FAQSection = () => {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  
  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };
  
  const faqs = [
    {
      question: "¿Cómo funciona la generación de videos musicales?",
      answer: "Nuestra tecnología utiliza modelos de IA avanzados que procesan tu música y letra para crear videos que coincidan con el ritmo, la energía y el mensaje de tu canción. Simplemente sube tu audio, selecciona un estilo visual y nuestros algoritmos se encargan del resto. También puedes personalizar y editar el resultado a través de nuestro editor de línea de tiempo."
    },
    {
      question: "¿Puedo usar los videos generados comercialmente?",
      answer: "Sí, todos los videos generados con nuestra plataforma te pertenecen y puedes utilizarlos comercialmente sin restricciones. Obtienes la licencia completa para usar el contenido en plataformas como YouTube, redes sociales o cualquier otro canal de distribución."
    },
    {
      question: "¿Qué plataformas de streaming están incluidas en la distribución?",
      answer: "Nuestra distribución incluye todas las principales plataformas como Spotify, Apple Music, YouTube Music, Amazon Music, Tidal, Deezer, y más de 150 plataformas internacionales. Mantenemos una lista actualizada de servicios en nuestra sección de distribución."
    },
    {
      question: "¿Cuánto tiempo toma generar un video musical?",
      answer: "El tiempo de generación depende de la duración y complejidad del video. En promedio, un video de 3 minutos tarda entre 15 y 30 minutos en generarse completamente. Los usuarios del plan Business disfrutan de prioridad en la cola de generación."
    },
    {
      question: "¿Puedo cambiar de plan en cualquier momento?",
      answer: "Sí, puedes actualizar o cambiar tu plan en cualquier momento. Si actualizas a un plan superior, se te cobrará proporcionalmente por el tiempo restante de tu período de facturación. También puedes degradar tu plan, que se hará efectivo al final de tu período de facturación actual."
    },
    {
      question: "¿Qué tipo de soporte ofrecen?",
      answer: "Ofrecemos varios niveles de soporte según tu plan. Los usuarios gratuitos tienen acceso a nuestra base de conocimientos y soporte por email. Los suscriptores Pro cuentan con soporte prioritario por email y chat. Los usuarios Business disfrutan de soporte VIP con tiempos de respuesta garantizados y acceso a consultoría personalizada."
    }
  ];

  return (
    <LightSection id="faq">
      <div className="text-center mb-16">
        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 mb-4">
          PREGUNTAS FRECUENTES
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
          Respuestas a tus <span className="text-orange-500">dudas</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Todo lo que necesitas saber sobre Boostify y cómo puede ayudarte a impulsar tu carrera musical
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                className="flex items-center justify-between w-full p-6 text-left bg-white hover:bg-gray-50 transition-colors"
                onClick={() => toggleQuestion(index)}
              >
                <h3 className="text-xl font-semibold text-gray-900">{faq.question}</h3>
                <div className={`transition-transform duration-200 ${openQuestion === index ? 'rotate-180' : ''}`}>
                  <ChevronRight className="h-6 w-6 transform rotate-90 text-gray-500" />
                </div>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openQuestion === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-6 pt-0 text-gray-600">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">¿No encuentras lo que buscas?</p>
          <Link href="/contact">
            <Button 
              variant="outline" 
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              Contactar con soporte
            </Button>
          </Link>
        </div>
      </div>
    </LightSection>
  );
};

// Sección de Lista de Espera
const WaitlistSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <DarkSection id="waitlist" className="py-32">
      <div className="text-center max-w-3xl mx-auto">
        <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 mb-4">
          ACCESO ANTICIPADO
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Únete a nuestra <span className="text-orange-400">lista de espera</span>
        </h2>
        <p className="text-xl text-gray-300 mb-10">
          Estamos añadiendo nuevas características exclusivas. Regístrate ahora para ser
          de los primeros en probarlas y recibir beneficios especiales.
        </p>
        
        <Button 
          size="lg" 
          className="bg-white text-orange-600 hover:bg-gray-100"
          onClick={() => setIsModalOpen(true)}
        >
          Unirse a la lista de espera <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        
        <p className="mt-6 text-gray-400">
          ¿Ya eres usuario? <Link href="/login">
            <span className="text-orange-400 hover:underline cursor-pointer">
              Inicia sesión
            </span>
          </Link>
        </p>
      </div>
      
      <WaitlistModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </DarkSection>
  );
};

// Componente de la Página de Inicio
const HomePage = () => {
  useEffect(() => {
    document.title = "Boostify Music - Plataforma de Marketing Musical con IA";
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <MainNav />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialSection />
        <TechnologySection />
        <PricingSection />
        <CallToActionSection />
        <FAQSection />
        <WaitlistSection />
      </main>
      <Footer />
    </>
  );
};

export default HomePage;