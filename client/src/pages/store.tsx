import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { SiInstagram, SiFacebook, SiTelegram } from "react-icons/si";
import {
  Download,
  Zap,
  Shield,
  Bot,
  Users,
  Settings,
  MessageCircle,
  Activity,
  ChevronRight,
  CheckCircle2
} from "lucide-react";

const products = [
  {
    id: 1,
    name: "InstagramPro Bot",
    description: "Bot avanzado de automatización para crecimiento orgánico en Instagram",
    price: 49.99,
    platform: "instagram",
    features: [
      "Seguimiento/Dejar de seguir automático",
      "Gestión de comentarios",
      "Programación de posts",
      "Análisis de engagement",
      "Filtros de audiencia personalizados"
    ],
    icon: SiInstagram,
    popular: true
  },
  {
    id: 2,
    name: "Facebook Growth Engine",
    description: "Automatización completa para páginas y grupos de Facebook",
    price: 59.99,
    platform: "facebook",
    features: [
      "Gestión de páginas múltiples",
      "Automatización de grupos",
      "Respuestas automáticas",
      "Programación de contenido",
      "Análisis de rendimiento"
    ],
    icon: SiFacebook
  },
  {
    id: 3,
    name: "TelegramMaster Bot",
    description: "Bot multiusos para gestión y crecimiento en Telegram",
    price: 39.99,
    platform: "telegram",
    features: [
      "Gestión de canales",
      "Respuestas automáticas",
      "Análisis de miembros",
      "Filtro de spam",
      "Programación de mensajes"
    ],
    icon: SiTelegram
  },
  {
    id: 4,
    name: "Instagram Engagement Pro",
    description: "Bot especializado en maximizar el engagement de Instagram",
    price: 44.99,
    platform: "instagram",
    features: [
      "Gestión de comentarios AI",
      "Like automático inteligente",
      "Análisis de hashtags",
      "Reportes detallados",
      "Engagement personalizado"
    ],
    icon: SiInstagram
  },
  {
    id: 5,
    name: "Facebook Ads Assistant",
    description: "Bot para optimización y gestión de anuncios en Facebook",
    price: 69.99,
    platform: "facebook",
    features: [
      "Optimización de campañas",
      "Análisis de audiencia",
      "A/B testing automático",
      "Reportes de ROI",
      "Ajuste de presupuesto"
    ],
    icon: SiFacebook
  },
  {
    id: 6,
    name: "Telegram Business Bot",
    description: "Bot avanzado para negocios en Telegram",
    price: 49.99,
    platform: "telegram",
    features: [
      "CRM integrado",
      "Chatbot AI",
      "Automatización de ventas",
      "Análisis de conversiones",
      "Integración con pagos"
    ],
    icon: SiTelegram
  },
  {
    id: 7,
    name: "Instagram Story Pro",
    description: "Bot especializado en automatización de Stories",
    price: 34.99,
    platform: "instagram",
    features: [
      "Programación de stories",
      "Análisis de visualizaciones",
      "Respuestas automáticas",
      "Highlights automáticos",
      "Estadísticas avanzadas"
    ],
    icon: SiInstagram
  },
  {
    id: 8,
    name: "Social Media Suite",
    description: "Suite completa de bots para todas las plataformas",
    price: 99.99,
    platform: "all",
    features: [
      "Gestión multiplataforma",
      "Panel unificado",
      "Automatización cruzada",
      "Análisis integrado",
      "Soporte prioritario"
    ],
    icon: Bot,
    premium: true
  }
];

export default function StorePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Automation{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                  Store
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Potencia tu presencia en redes sociales con nuestros bots de automatización. Optimiza tu tiempo y maximiza tus resultados.
              </p>
            </motion.div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="relative p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-orange-500/5 border-orange-500/20 hover:border-orange-500/40">
                  {product.popular && (
                    <Badge className="absolute top-4 right-4 bg-orange-500">Popular</Badge>
                  )}
                  {product.premium && (
                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-purple-500">Premium</Badge>
                  )}
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                      <product.icon className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    {product.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-orange-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">${product.price}</span>
                        <span className="text-sm text-muted-foreground">/mes</span>
                      </div>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
                        {product.platform === 'all' ? 'Todas las plataformas' : 
                         product.platform.charAt(0).toUpperCase() + product.platform.slice(1)}
                      </Badge>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Comprar ahora
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Features Section */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold mb-12">
              Por qué elegir nuestros{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                Bots
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Zap, title: "Alto Rendimiento", description: "Optimizados para máxima eficiencia" },
                { icon: Shield, title: "100% Seguros", description: "Cumplimos con todas las normativas" },
                { icon: Users, title: "Soporte 24/7", description: "Equipo técnico siempre disponible" },
                { icon: Activity, title: "Actualizaciones", description: "Mejoras continuas garantizadas" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-6 rounded-xl bg-orange-500/5 border border-orange-500/20"
                >
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                      <feature.icon className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
