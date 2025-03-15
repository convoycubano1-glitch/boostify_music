import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  Music2, 
  Wallet, 
  TrendingUp, 
  Shield, 
  DollarSign, 
  Globe, 
  User, 
  Users, 
  Share2 
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Footer } from "../components/layout/footer";
// No necesitamos importar MainNav ya que la navegación es manejada por el layout principal

// Variantes de animación
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// UI components specific to tokenization
const TokenizationHero = () => {
  return (
    <div className="relative overflow-hidden bg-black pt-20 pb-24 text-white">
      <div className="absolute inset-0 z-0 opacity-30">
        <video 
          className="h-full w-full object-cover" 
          autoPlay 
          muted 
          loop 
          playsInline
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-1 text-sm">
              WEB3 TECHNOLOGY
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-orange-500 leading-tight mb-6">
              Tokenización Musical con Web3
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto"
          >
            Revoluciona la forma en que monetizas tu música. Convierte tus canciones en activos digitales y conecta directamente con tus fans.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              Comenzar ahora
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-orange-500/30 bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
            >
              Descubrir beneficios
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Sección de beneficios
const BenefitsSection = () => {
  const benefits = [
    {
      icon: <DollarSign className="h-10 w-10 text-orange-500" />,
      title: "Ingresos directos",
      description: "Recibe pagos directamente de tus fans sin intermediarios que reduzcan tus ganancias."
    },
    {
      icon: <User className="h-10 w-10 text-orange-500" />,
      title: "Propiedad verificable",
      description: "Asegura tus derechos de autor con tecnología blockchain inmutable y transparente."
    },
    {
      icon: <Users className="h-10 w-10 text-orange-500" />,
      title: "Comunidad de fans",
      description: "Construye una comunidad de seguidores comprometidos que invierten directamente en tu éxito."
    },
    {
      icon: <Share2 className="h-10 w-10 text-orange-500" />,
      title: "Regalías automáticas",
      description: "Configura regalías perpetuas que te pagan automáticamente en cada reventa."
    },
    {
      icon: <Shield className="h-10 w-10 text-orange-500" />,
      title: "Protección de derechos",
      description: "Protege tu trabajo creativo con prueba inmutable de propiedad en la blockchain."
    },
    {
      icon: <Globe className="h-10 w-10 text-orange-500" />,
      title: "Alcance global",
      description: "Llega a fans y coleccionistas de todo el mundo sin restricciones geográficas."
    }
  ];

  return (
    <section id="benefits" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-orange-100 text-orange-800 border-orange-200 px-3 py-1">
            BENEFICIOS
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Por qué tokenizar tu música con <span className="text-orange-500">Boostify</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            La tokenización musical ofrece ventajas revolucionarias para artistas independientes y establecidos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="rounded-full bg-orange-50 w-16 h-16 flex items-center justify-center mb-6">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Sección de cómo funciona
const HowItWorksSection = () => {
  const steps = [
    {
      number: 1,
      title: "Conecta tu wallet",
      description: "Conecta tu billetera digital para iniciar el proceso de tokenización de tu música de forma segura.",
      icon: <Wallet className="h-10 w-10 text-orange-500" />
    },
    {
      number: 2,
      title: "Sube tu música",
      description: "Carga tus archivos de audio, añade metadatos y configura las regalías que recibirás en cada transacción.",
      icon: <Music2 className="h-10 w-10 text-orange-500" />
    },
    {
      number: 3,
      title: "Crea tu token",
      description: "Define la oferta, precio y exclusividad de tu token musical. Puedes crear múltiples niveles de acceso.",
      icon: <DollarSign className="h-10 w-10 text-orange-500" />
    },
    {
      number: 4,
      title: "Promociona y vende",
      description: "Comparte con tu audiencia y comienza a vender tus tokens musicales directamente a tus fans.",
      icon: <TrendingUp className="h-10 w-10 text-orange-500" />
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-orange-100 text-orange-800 border-orange-200 px-3 py-1">
            PROCESO SIMPLE
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Cómo funciona la <span className="text-orange-500">tokenización</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un proceso intuitivo diseñado para ayudarte a tokenizar tu música sin complicaciones.
          </p>
        </div>

        <div className="flex flex-col space-y-16 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`flex flex-col md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''} items-center gap-6 md:gap-12`}
            >
              <div className="md:w-1/2">
                <div className="relative">
                  <div className="absolute -left-4 -top-4 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {step.number}
                  </div>
                  <div className="bg-orange-50 rounded-xl p-10 flex items-center justify-center h-64">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                      {step.icon}
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 text-lg">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Sección de preguntas frecuentes
const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "¿Qué es la tokenización musical en Web3?",
      answer: "La tokenización musical en Web3 es el proceso de convertir tus derechos musicales en tokens digitales únicos (NFTs) en la blockchain. Esto permite a los artistas vender directamente a sus fans, establecer regalías automáticas y crear nuevos modelos de ingresos sin depender de intermediarios tradicionales."
    },
    {
      question: "¿Cómo se benefician los artistas con la tokenización?",
      answer: "Los artistas reciben ingresos directos sin intermediarios, obtienen regalías automáticas en cada reventa, mantienen el control total sobre sus derechos, pueden monetizar su música de formas innovadoras y construyen relaciones más directas con sus fans al convertirlos en inversionistas de su carrera."
    },
    {
      question: "¿Qué tipos de tokens musicales puedo crear?",
      answer: "Puedes crear tokens de acceso exclusivo a tu música, tokens de propiedad parcial que otorguen regalías, tokens de experiencias VIP como conciertos privados, tokens de membresía para contenido exclusivo y tokens coleccionables limitados que pueden aumentar de valor."
    },
    {
      question: "¿Necesito conocimientos técnicos para tokenizar mi música?",
      answer: "No. Boostify simplifica todo el proceso técnico para que puedas enfocarte en tu creatividad. Nuestra plataforma intuitiva maneja toda la complejidad de la blockchain, permitiéndote tokenizar tu música sin necesidad de conocimientos técnicos especializados."
    },
    {
      question: "¿Cómo garantiza Boostify la seguridad de mis activos musicales?",
      answer: "Utilizamos tecnología blockchain de última generación con contratos inteligentes auditados, almacenamiento descentralizado para tus archivos musicales, sistemas de verificación de identidad para proteger derechos de autor, y múltiples capas de seguridad para proteger tanto a artistas como a compradores."
    },
    {
      question: "¿Qué blockchain utiliza Boostify para la tokenización?",
      answer: "Boostify opera en múltiples blockchains, incluyendo Ethereum, Polygon, Solana y Binance Smart Chain, permitiéndote elegir la que mejor se adapte a tus necesidades en términos de costos de transacción, velocidad y accesibilidad para tu audiencia específica."
    }
  ];

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/20 px-3 py-1">
            PREGUNTAS FRECUENTES
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Todo lo que necesitas saber
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Respuestas a las preguntas más comunes sobre la tokenización musical con Boostify.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="mb-4"
            >
              <button
                className={`w-full text-left p-6 rounded-lg ${
                  activeIndex === index ? 'bg-gray-800' : 'bg-gray-800/50'
                } hover:bg-gray-800 transition-colors duration-200`}
                onClick={() => toggleFAQ(index)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{faq.question}</h3>
                  <span className="text-orange-500 text-xl">
                    {activeIndex === index ? '−' : '+'}
                  </span>
                </div>
                {activeIndex === index && (
                  <p className="mt-4 text-gray-400">
                    {faq.answer}
                  </p>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Sección de llamada a la acción
const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Revoluciona tu carrera musical con la tokenización
          </h2>
          <p className="text-xl mb-10 text-white/90">
            Únete a la revolución de la industria musical. Tokeniza tu música, conecta directamente con tus fans y maximiza tus ingresos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100"
            >
              Comienza a tokenizar
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Contáctanos
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Componente principal de la página
const TokenizationPage = () => {
  return (
    <div>
      <main>
        <TokenizationHero />
        <BenefitsSection />
        <HowItWorksSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default TokenizationPage;