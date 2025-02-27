import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Play, FileText, Image, Video, Zap, BookOpen, Calculator, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function AffiliateResources() {
  // Recursos para afiliados
  const marketingResources = [
    {
      id: "res-1",
      title: "Guía definitiva de marketing para afiliados musicales",
      description: "Aprende estrategias probadas para promocionar productos musicales y maximizar tus conversiones.",
      type: "guide",
      format: "PDF",
      size: "4.2 MB",
      lastUpdated: "25/01/2025",
      thumbnail: "https://placehold.co/400x225",
    },
    {
      id: "res-2",
      title: "Pack de banners para redes sociales",
      description: "Colección de 20 banners optimizados para todas las plataformas sociales con espacio para tu enlace de afiliado.",
      type: "graphics",
      format: "ZIP (PNG/JPG)",
      size: "15.8 MB",
      lastUpdated: "12/02/2025",
      thumbnail: "https://placehold.co/400x225",
    },
    {
      id: "res-3",
      title: "Tutorial: Cómo optimizar la conversión en Instagram",
      description: "Video tutorial paso a paso para crear campañas efectivas en Instagram que generen conversiones.",
      type: "video",
      format: "MP4",
      size: "85.3 MB",
      lastUpdated: "05/02/2025",
      thumbnail: "https://placehold.co/400x225",
    },
    {
      id: "res-4",
      title: "Plantillas de email marketing",
      description: "10 plantillas HTML responsivas para tus campañas de email con bloques personalizables.",
      type: "template",
      format: "HTML/CSS",
      size: "2.1 MB",
      lastUpdated: "18/02/2025",
      thumbnail: "https://placehold.co/400x225",
    },
    {
      id: "res-5",
      title: "Calculadora de ganancias para afiliados",
      description: "Hoja de cálculo para proyectar tus ganancias basadas en tasas de conversión y tráfico.",
      type: "tool",
      format: "XLSX",
      size: "1.3 MB",
      lastUpdated: "01/02/2025",
      thumbnail: "https://placehold.co/400x225",
    },
    {
      id: "res-6",
      title: "Webinar: Estrategias avanzadas para afiliados",
      description: "Sesión grabada con expertos compartiendo técnicas avanzadas para escalar tus ingresos de afiliado.",
      type: "webinar",
      format: "MP4",
      size: "320.5 MB",
      lastUpdated: "10/01/2025",
      thumbnail: "https://placehold.co/400x225",
    },
  ];

  const productResources = [
    {
      id: "prod-res-1",
      title: "Kit de promoción - Curso de Producción Musical",
      description: "Recursos completos para promocionar nuestro curso estrella de producción musical.",
      type: "bundle",
      format: "ZIP (varios)",
      size: "45.2 MB",
      lastUpdated: "15/02/2025",
      thumbnail: "https://placehold.co/400x225",
      productId: "prod1",
    },
    {
      id: "prod-res-2",
      title: "Imágenes promocionales - Plugin de Masterización",
      description: "Pack de imágenes de alta calidad mostrando la interfaz y resultados del plugin.",
      type: "graphics",
      format: "ZIP (PNG)",
      size: "22.4 MB",
      lastUpdated: "20/02/2025",
      thumbnail: "https://placehold.co/400x225",
      productId: "prod2",
    },
    {
      id: "prod-res-3",
      title: "Demo y testimonios - Paquete de Distribución Musical",
      description: "Video testimonial y demostración de nuestra plataforma de distribución musical.",
      type: "video",
      format: "MP4",
      size: "128.7 MB",
      lastUpdated: "08/02/2025",
      thumbnail: "https://placehold.co/400x225",
      productId: "prod3",
    },
    {
      id: "prod-res-4",
      title: "Preguntas frecuentes - Curso de Marketing Musical",
      description: "Documento con respuestas a las preguntas más frecuentes que hacen los potenciales clientes.",
      type: "document",
      format: "PDF",
      size: "1.8 MB",
      lastUpdated: "22/02/2025",
      thumbnail: "https://placehold.co/400x225",
      productId: "prod4",
    },
  ];

  const educationResources = [
    {
      id: "edu-1",
      title: "Curso: Fundamentos del marketing de afiliados",
      description: "Curso completo para dominar los fundamentos del marketing de afiliados en la industria musical.",
      lessons: 12,
      duration: "3 horas",
      level: "Principiante",
      lastUpdated: "05/01/2025",
      thumbnail: "https://placehold.co/400x225",
    },
    {
      id: "edu-2",
      title: "Taller: Copywriting para aumentar conversiones",
      description: "Aprende técnicas de escritura persuasiva específicas para productos musicales y tecnología de audio.",
      lessons: 5,
      duration: "1.5 horas",
      level: "Intermedio",
      lastUpdated: "15/01/2025",
      thumbnail: "https://placehold.co/400x225",
    },
    {
      id: "edu-3",
      title: "Masterclass: SEO para afiliados musicales",
      description: "Optimiza tu contenido para posicionarte en búsquedas relacionadas con producción y equipamiento musical.",
      lessons: 8,
      duration: "2 horas",
      level: "Avanzado",
      lastUpdated: "20/01/2025",
      thumbnail: "https://placehold.co/400x225",
    },
    {
      id: "edu-4",
      title: "Guía: Uso efectivo de redes sociales",
      description: "Estrategias específicas para cada plataforma social que funcionan en el nicho de la música y audio.",
      lessons: 6,
      duration: "1.8 horas",
      level: "Intermedio",
      lastUpdated: "10/02/2025",
      thumbnail: "https://placehold.co/400x225",
    },
  ];

  // Renderizar icono según el tipo de recurso
  const renderResourceIcon = (type: string) => {
    switch (type) {
      case 'guide':
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'graphics':
        return <Image className="h-4 w-4" />;
      case 'video':
      case 'webinar':
        return <Video className="h-4 w-4" />;
      case 'template':
        return <FileText className="h-4 w-4" />;
      case 'tool':
        return <Calculator className="h-4 w-4" />;
      case 'bundle':
        return <Zap className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Preguntas frecuentes
  const faqs = [
    {
      question: "¿Cómo empiezo a promocionar productos como afiliado?",
      answer: "Para comenzar, selecciona los productos que deseas promocionar en el panel de enlaces de afiliado. Crea un enlace único para cada producto y comienza a compartirlo en tus canales. Utiliza los recursos de marketing disponibles para crear contenido atractivo que destaque los beneficios del producto."
    },
    {
      question: "¿Cuándo y cómo recibo mis pagos?",
      answer: "Los pagos se procesan mensualmente, el día 15, siempre que hayas alcanzado el umbral mínimo de $100. Recibirás el pago a través del método que hayas configurado en tu perfil (PayPal, transferencia bancaria o criptomonedas). Puedes ver tu historial de pagos y el próximo pago estimado en la sección de Ganancias."
    },
    {
      question: "¿Cómo puedo aumentar mi tasa de conversión?",
      answer: "Para mejorar tu tasa de conversión, considera estas estrategias: 1) Conoce a fondo los productos que promocionas, 2) Crea contenido genuino que muestre los beneficios reales, 3) Dirige tráfico cualificado a tus enlaces, 4) Utiliza el generador de contenido para crear textos persuasivos, 5) Analiza y optimiza tus campañas regularmente basándote en los datos de rendimiento."
    },
    {
      question: "¿Puedo promocionar los productos en cualquier plataforma?",
      answer: "Sí, puedes promocionar los productos en prácticamente cualquier plataforma online, incluyendo redes sociales, blogs, YouTube, email marketing, etc. Sin embargo, asegúrate de seguir las políticas de cada plataforma respecto a enlaces de afiliados. Algunas plataformas requieren divulgación explícita de relaciones de afiliado, mientras que otras pueden tener restricciones específicas."
    },
    {
      question: "¿Tengo que pagar por los recursos de marketing?",
      answer: "No, todos los recursos de marketing disponibles en esta sección son completamente gratuitos para nuestros afiliados. Puedes descargar y utilizar los materiales promocionales, guías, plantillas y herramientas sin costo adicional. Estos recursos están diseñados para ayudarte a tener éxito y maximizar tus ganancias."
    },
    {
      question: "¿Cómo puedo saber qué productos son los más rentables para promocionar?",
      answer: "En la sección de Ganancias puedes ver estadísticas detalladas sobre el rendimiento de cada producto, incluyendo tasas de conversión, comisiones y ganancias totales. Utiliza estos datos para identificar qué productos generan mejores resultados para tu audiencia específica. También recomendamos probar diferentes productos y analizar su rendimiento durante al menos 30 días."
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Recursos para Afiliados</h2>
        <p className="text-muted-foreground">
          Materiales y herramientas para maximizar tus conversiones
        </p>
      </div>

      <Tabs defaultValue="marketing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="education">Educación</TabsTrigger>
        </TabsList>
        
        <TabsContent value="marketing" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketingResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden flex flex-col">
                <div className="aspect-video relative">
                  <img
                    src={resource.thumbnail}
                    alt={resource.title}
                    className="object-cover w-full h-full"
                  />
                  <Badge
                    className="absolute top-2 right-2"
                    variant="secondary"
                  >
                    {resource.type}
                  </Badge>
                </div>
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs flex items-center">
                      {renderResourceIcon(resource.type)}
                      <span className="ml-1">{resource.format}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">{resource.size}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex-grow">
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    Actualizado: {resource.lastUpdated}
                  </span>
                  <div className="flex gap-2">
                    {resource.type === 'video' || resource.type === 'webinar' ? (
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 aspect-video md:aspect-square relative">
                    <img
                      src={resource.thumbnail}
                      alt={resource.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="md:w-2/3 p-4">
                    <div className="flex flex-col h-full">
                      <div>
                        <h3 className="font-medium text-lg">{resource.title}</h3>
                        <div className="flex items-center gap-2 mt-1 mb-2">
                          <Badge variant="outline" className="text-xs flex items-center">
                            {renderResourceIcon(resource.type)}
                            <span className="ml-1">{resource.format}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">{resource.size}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {resource.description}
                        </p>
                      </div>
                      <div className="mt-auto flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Actualizado: {resource.lastUpdated}
                        </span>
                        <div className="flex gap-2">
                          {resource.type === 'video' ? (
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Descargar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="education" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {educationResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={resource.thumbnail}
                    alt={resource.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <Badge
                      className="mb-2"
                      variant={
                        resource.level === "Principiante" ? "outline" :
                        resource.level === "Intermedio" ? "secondary" : "default"
                      }
                    >
                      {resource.level}
                    </Badge>
                    <h3 className="font-medium text-lg text-white">{resource.title}</h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm">{resource.lessons} lecciones</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm">{resource.duration}</span>
                      </div>
                    </div>
                    <Button>
                      Iniciar curso
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Próximos webinars y eventos</CardTitle>
              <CardDescription>
                No te pierdas estas oportunidades de aprendizaje en vivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">15/03/2025 - 18:00 GMT</Badge>
                      <h3 className="font-medium text-lg">Webinar: Estrategias SEO para afiliados en 2025</h3>
                      <p className="text-muted-foreground text-sm">Aprende las últimas técnicas de SEO para destacar tu contenido de afiliado y atraer tráfico orgánico de calidad.</p>
                    </div>
                    <Button>
                      Reservar plaza
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">22/03/2025 - 17:00 GMT</Badge>
                      <h3 className="font-medium text-lg">Masterclass: Creación de contenido viral para productos musicales</h3>
                      <p className="text-muted-foreground text-sm">Descubre fórmulas probadas para crear contenido que se comparte masivamente y genera conversiones para productos de audio y música.</p>
                    </div>
                    <Button>
                      Reservar plaza
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">05/04/2025 - 16:30 GMT</Badge>
                      <h3 className="font-medium text-lg">Mesa redonda: Tendencias en marketing de afiliados para 2025</h3>
                      <p className="text-muted-foreground text-sm">Panel con expertos del sector discutiendo las nuevas tendencias, herramientas y estrategias que están definiendo el marketing de afiliados este año.</p>
                    </div>
                    <Button>
                      Reservar plaza
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Preguntas frecuentes</CardTitle>
          <CardDescription>
            Respuestas a las dudas más comunes de nuestros afiliados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            ¿No encuentras la respuesta que buscas?
          </p>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-1" />
            Contactar soporte de afiliados
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}