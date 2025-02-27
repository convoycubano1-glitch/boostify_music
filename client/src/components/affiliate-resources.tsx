import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Download,
  FileDown,
  FileText,
  Search,
  Tag,
  Clock,
  BookOpen,
  FileImage,
  Play,
  Video,
  File,
  Briefcase,
  Link2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  LucideIcon,
  Info,
  ArrowRight,
  Clipboard,
  Eye,
  Check,
} from "lucide-react";

export function AffiliateResources() {
  const { user } = useAuth() || {};
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceType, setResourceType] = useState("all");
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Simulación de recursos
  const resources = [
    {
      id: "res1",
      title: "Guía para principiantes: Primeros pasos como afiliado",
      type: "guide",
      description: "Aprende los conceptos básicos del marketing de afiliados y cómo empezar con Boostify.",
      fileUrl: "/resources/guia-principiantes-afiliados.pdf",
      thumbnailUrl: "/assets/resource-guides.jpg",
      tags: ["principiantes", "guía", "conceptos básicos"],
      updatedAt: new Date(2024, 11, 15),
    },
    {
      id: "res2",
      title: "Pack de banners promocionales - Cursos",
      type: "graphic",
      description: "Banners optimizados para promocionar nuestros cursos en diferentes plataformas.",
      fileUrl: "/resources/banners-cursos.zip",
      thumbnailUrl: "/assets/resource-banners.jpg",
      tags: ["banners", "marketing", "cursos"],
      updatedAt: new Date(2025, 0, 5),
    },
    {
      id: "res3",
      title: "Plantillas para emails promocionales",
      type: "template",
      description: "Plantillas de email marketing listas para personalizar y enviar a tu lista de suscriptores.",
      fileUrl: "/resources/plantillas-email.zip",
      thumbnailUrl: "/assets/resource-emails.jpg",
      tags: ["email", "plantillas", "marketing"],
      updatedAt: new Date(2025, 0, 10),
    },
    {
      id: "res4",
      title: "Webinar: Estrategias avanzadas para afiliados musicales",
      type: "video",
      description: "Aprende técnicas avanzadas para promocionar productos musicales como afiliado.",
      fileUrl: "/resources/webinar-estrategias-avanzadas.mp4",
      thumbnailUrl: "/assets/resource-webinar.jpg",
      tags: ["webinar", "avanzado", "estrategias"],
      updatedAt: new Date(2025, 0, 20),
    },
    {
      id: "res5",
      title: "Plantillas para reseñas en blogs",
      type: "template",
      description: "Estructura para escribir reseñas persuasivas de nuestros productos en tu blog.",
      fileUrl: "/resources/plantillas-blog.zip",
      thumbnailUrl: "/assets/resource-blogs.jpg",
      tags: ["blog", "reseñas", "plantillas"],
      updatedAt: new Date(2025, 1, 1),
    },
    {
      id: "res6",
      title: "Lista de hashtags efectivos para músicos",
      type: "guide",
      description: "Hashtags seleccionados para maximizar el alcance de tus publicaciones sobre productos musicales.",
      fileUrl: "/resources/hashtags-musica.pdf",
      thumbnailUrl: "/assets/resource-hashtags.jpg",
      tags: ["hashtags", "redes sociales", "alcance"],
      updatedAt: new Date(2025, 1, 10),
    },
    {
      id: "res7",
      title: "Calendario editorial para promociones",
      type: "tool",
      description: "Plantilla de calendario para planificar tus publicaciones promocionales durante todo el año.",
      fileUrl: "/resources/calendario-editorial.xlsx",
      thumbnailUrl: "/assets/resource-calendar.jpg",
      tags: ["planificación", "calendario", "estrategia"],
      updatedAt: new Date(2025, 1, 15),
    },
    {
      id: "res8",
      title: "Guía de SEO para afiliados musicales",
      type: "guide",
      description: "Optimiza tu contenido para aparecer en los resultados de búsqueda relacionados con productos musicales.",
      fileUrl: "/resources/guia-seo-musica.pdf",
      thumbnailUrl: "/assets/resource-seo.jpg",
      tags: ["SEO", "optimización", "búsquedas"],
      updatedAt: new Date(2025, 1, 20),
    },
  ];

  // FAQs comunes sobre el programa de afiliados
  const faqs = [
    {
      question: "¿Cuándo se realizan los pagos a los afiliados?",
      answer: "Los pagos se procesan el día 15 de cada mes para todas las comisiones acumuladas que superen los 100€. El dinero suele estar disponible en tu cuenta en un plazo de 2-3 días hábiles tras el procesamiento.",
    },
    {
      question: "¿Cuál es la duración de las cookies de afiliado?",
      answer: "Nuestras cookies de afiliado tienen una duración de 30 días. Esto significa que si un usuario hace clic en tu enlace de afiliado, cualquier compra que realice en los siguientes 30 días te generará una comisión.",
    },
    {
      question: "¿Cómo se calculan las comisiones?",
      answer: "Las comisiones se calculan como un porcentaje del precio de venta de los productos. Los porcentajes varían según el tipo de producto: 25% para cursos, 20% para plugins, 30% para servicios de distribución, 15% para mentorías y 40% para paquetes de samples.",
    },
    {
      question: "¿Puedo promocionar productos específicos?",
      answer: "Sí, puedes elegir qué productos promocionar. Te recomendamos centrarte en los que más se alineen con tu audiencia para maximizar la tasa de conversión.",
    },
    {
      question: "¿Hay alguna restricción sobre dónde puedo promocionar los enlaces?",
      answer: "Puedes promocionar tus enlaces en tus redes sociales, blog, email, YouTube y casi cualquier plataforma digital. Sin embargo, no está permitido el spam, el uso de publicidad engañosa o la promoción en sitios con contenido inapropiado.",
    },
    {
      question: "¿Qué ocurre si un cliente solicita un reembolso?",
      answer: "Si un cliente solicita un reembolso dentro del período de garantía, la comisión asociada a esa venta será deducida de tus ganancias pendientes.",
    },
    {
      question: "¿Puedo usar los materiales promocionales proporcionados?",
      answer: "Sí, todos los recursos gráficos y plantillas de esta sección están disponibles para que los utilices en tus promociones. Puedes modificarlos para adaptarlos a tu estilo, siempre que no alteres la representación del producto.",
    },
    {
      question: "¿Cómo puedo aumentar mis conversiones?",
      answer: "Las mejores estrategias incluyen: crear contenido genuino y de valor sobre los productos, dirigirte a una audiencia relevante, utilizar varios canales de promoción, crear tutoriales o reseñas detalladas, y aprovechar los recursos promocionales que proporcionamos en esta sección.",
    },
  ];

  // Textos para la guía de mejores prácticas
  const bestPracticesGuide = {
    intro: "Maximiza tus ganancias como afiliado de Boostify Music siguiendo estas estrategias probadas.",
    sections: [
      {
        title: "1. Conoce a fondo los productos",
        content: "Antes de promocionar cualquier producto, tómate el tiempo para conocerlo a fondo. Familiarízate con sus características, beneficios y casos de uso. Si es posible, utiliza el producto tú mismo para poder compartir tu experiencia personal. La autenticidad genera confianza, y la confianza conduce a conversiones.",
      },
      {
        title: "2. Identifica a tu audiencia objetivo",
        content: "Concentra tus esfuerzos en la audiencia adecuada. Para productos musicales, esto podría incluir productores principiantes, músicos profesionales, estudios de grabación, o educadores musicales. Adapta tu mensaje y canales de promoción según la audiencia específica de cada producto.",
      },
      {
        title: "3. Crea contenido de valor",
        content: "El contenido valioso es la clave del marketing de afiliados exitoso. Considera crear tutoriales, reseñas detalladas, comparativas, artículos informativos o videos demostrativos. Muestra cómo el producto resuelve problemas reales o mejora el trabajo de los músicos.",
      },
      {
        title: "4. Diversifica tus canales de promoción",
        content: "No te limites a un solo canal. Utiliza una combinación de blog, YouTube, redes sociales, email marketing, y otros canales relevantes para tu audiencia. Cada plataforma tiene sus propias fortalezas y puede alcanzar diferentes segmentos de tu audiencia.",
      },
      {
        title: "5. Sé transparente sobre tu rol como afiliado",
        content: "La transparencia genera confianza. Siempre divulga claramente que utilizas enlaces de afiliado. Esto no solo es un requisito legal en muchos países, sino que también establece una relación honesta con tu audiencia.",
      },
      {
        title: "6. Utiliza correctamente el seguimiento",
        content: "Aprovecha los parámetros UTM en tus enlaces para realizar un seguimiento detallado de tus campañas. Esto te permitirá identificar qué estrategias y canales funcionan mejor, permitiéndote optimizar continuamente tus esfuerzos.",
      },
      {
        title: "7. Planifica alrededor de temporadas y ofertas",
        content: "Intensifica tus promociones durante períodos de ofertas especiales como Black Friday, Cyber Monday, o promociones exclusivas de Boostify. Prepara tu contenido y estrategia con antelación para maximizar estas oportunidades.",
      },
      {
        title: "8. Mantén contacto regular con tu audiencia",
        content: "Construye una comunidad o lista de email a la que puedas notificar regularmente sobre contenido nuevo, actualizaciones de productos o ofertas especiales. Una audiencia comprometida tiene más probabilidades de convertir.",
      },
    ],
    conclusion: "Recuerda que el marketing de afiliados es una estrategia a largo plazo. Construir confianza con tu audiencia y posicionarte como una fuente de recomendaciones valiosas requiere tiempo y consistencia, pero los resultados compensarán tu esfuerzo. ¡Estamos aquí para apoyarte en tu camino hacia el éxito como afiliado de Boostify Music!"
  };

  // Filtrar recursos por búsqueda y tipo
  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = resourceType === "all" || resource.type === resourceType;
    
    return matchesSearch && matchesType;
  });

  // Obtener el icono según el tipo de recurso
  const getResourceIcon = (type: string): LucideIcon => {
    switch (type) {
      case "guide":
        return BookOpen;
      case "graphic":
        return FileImage;
      case "template":
        return FileText;
      case "video":
        return Video;
      case "tool":
        return Briefcase;
      default:
        return File;
    }
  };

  // Formatear fecha
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Copiar al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    
    toast({
      title: "Texto copiado",
      description: "El texto se ha copiado al portapapeles.",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="resources">Recursos promocionales</TabsTrigger>
          <TabsTrigger value="faq">Preguntas frecuentes</TabsTrigger>
          <TabsTrigger value="guide">Guía de mejores prácticas</TabsTrigger>
        </TabsList>
        
        {/* Pestaña: Recursos */}
        <TabsContent value="resources" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recursos..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={resourceType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setResourceType("all")}
              >
                Todos
              </Button>
              <Button
                variant={resourceType === "guide" ? "default" : "outline"}
                size="sm"
                onClick={() => setResourceType("guide")}
              >
                Guías
              </Button>
              <Button
                variant={resourceType === "graphic" ? "default" : "outline"}
                size="sm"
                onClick={() => setResourceType("graphic")}
              >
                Gráficos
              </Button>
              <Button
                variant={resourceType === "template" ? "default" : "outline"}
                size="sm"
                onClick={() => setResourceType("template")}
              >
                Plantillas
              </Button>
              <Button
                variant={resourceType === "video" ? "default" : "outline"}
                size="sm"
                onClick={() => setResourceType("video")}
              >
                Videos
              </Button>
              <Button
                variant={resourceType === "tool" ? "default" : "outline"}
                size="sm"
                onClick={() => setResourceType("tool")}
              >
                Herramientas
              </Button>
            </div>
          </div>

          {filteredResources.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <Search className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No se encontraron recursos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Prueba ajustando tu búsqueda o seleccionando otra categoría
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setResourceType("all");
                }}
              >
                Ver todos los recursos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => {
                const ResourceIcon = getResourceIcon(resource.type);
                
                return (
                  <Card key={resource.id} className="overflow-hidden flex flex-col">
                    <div className="relative h-40 bg-muted">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                      <div className="absolute bottom-3 left-3 right-3 z-20">
                        <Badge className="capitalize">
                          {resource.type === "guide" ? "Guía" :
                           resource.type === "graphic" ? "Gráfico" :
                           resource.type === "template" ? "Plantilla" :
                           resource.type === "video" ? "Video" :
                           resource.type === "tool" ? "Herramienta" :
                           resource.type}
                        </Badge>
                        <h3 className="text-sm font-medium text-white mt-1 line-clamp-2">
                          {resource.title}
                        </h3>
                      </div>
                      <div className="h-full w-full flex items-center justify-center bg-muted">
                        <ResourceIcon className="h-16 w-16 text-muted-foreground/40" />
                      </div>
                    </div>
                    <CardContent className="flex-1 py-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {resource.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t py-3 px-4 flex justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        Actualizado: {formatDate(resource.updatedAt)}
                      </div>
                      <div className="flex gap-2">
                        {resource.type === "guide" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedGuide(resource)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        ) : null}
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Descargar
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        {/* Pestaña: Preguntas frecuentes */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preguntas frecuentes sobre el programa de afiliados</CardTitle>
              <CardDescription>
                Encuentra respuestas a las preguntas más comunes sobre nuestro programa de afiliados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-base font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
            <CardFooter className="border-t p-4 flex justify-between">
              <p className="text-sm text-muted-foreground">
                ¿No encuentras lo que buscas? Contacta con nuestro equipo de soporte.
              </p>
              <Button variant="outline">Contactar soporte</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Pestaña: Guía de mejores prácticas */}
        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guía de mejores prácticas para afiliados</CardTitle>
              <CardDescription>
                Estrategias probadas para maximizar tus ganancias como afiliado de Boostify Music
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">{bestPracticesGuide.intro}</p>
              
              <div className="space-y-6">
                {bestPracticesGuide.sections.map((section, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    <p className="text-muted-foreground">{section.content}</p>
                  </div>
                ))}
              </div>
              
              <div className="bg-muted/30 rounded-md p-4 border">
                <h3 className="text-lg font-semibold mb-2">Conclusión</h3>
                <p className="text-muted-foreground">{bestPracticesGuide.conclusion}</p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Crear contenido para copiar
                    const content = `
GUÍA DE MEJORES PRÁCTICAS PARA AFILIADOS DE BOOSTIFY MUSIC

${bestPracticesGuide.intro}

${bestPracticesGuide.sections.map(section => `${section.title}\n${section.content}`).join('\n\n')}

CONCLUSIÓN
${bestPracticesGuide.conclusion}
                    `;
                    
                    copyToClipboard(content.trim());
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-4 w-4 mr-2" />
                      Copiar guía
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para ver guía completa */}
      {selectedGuide && (
        <AlertDialog open={!!selectedGuide} onOpenChange={() => setSelectedGuide(null)}>
          <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>{selectedGuide.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedGuide.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              {selectedGuide.id === "res1" ? (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Guía para principiantes: Primeros pasos como afiliado</h2>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">1. ¿Qué es el marketing de afiliados?</h3>
                    <p>El marketing de afiliados es un modelo de negocio en el que promocionas productos o servicios de otras empresas y recibes una comisión por cada venta generada a través de tus enlaces únicos.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">2. Cómo funciona el programa de afiliados de Boostify</h3>
                    <p>Como afiliado de Boostify, recibirás enlaces personalizados para nuestros productos musicales. Cuando alguien compra a través de tu enlace, ganas una comisión que varía entre el 15% y el 40% dependiendo del producto.</p>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Cursos de producción musical: 25% de comisión</li>
                      <li>Plugins y software: 20% de comisión</li>
                      <li>Servicios de distribución: 30% de comisión</li>
                      <li>Mentorías y coaching: 15% de comisión</li>
                      <li>Paquetes de samples y recursos: 40% de comisión</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">3. Primeros pasos para empezar</h3>
                    <ol className="list-decimal pl-6 space-y-3">
                      <li>
                        <p className="font-medium">Conoce los productos</p>
                        <p className="text-muted-foreground">Familiarízate con nuestra gama de productos para poder recomendar los más adecuados a tu audiencia.</p>
                      </li>
                      <li>
                        <p className="font-medium">Genera tus enlaces de afiliado</p>
                        <p className="text-muted-foreground">En la sección "Enlaces" de tu panel de afiliado, puedes crear enlaces personalizados para cada producto.</p>
                      </li>
                      <li>
                        <p className="font-medium">Elige tus canales de promoción</p>
                        <p className="text-muted-foreground">Decide dónde promocionarás: blog, redes sociales, email, YouTube, etc. Elige los canales donde tu audiencia está más activa.</p>
                      </li>
                      <li>
                        <p className="font-medium">Crea contenido valioso</p>
                        <p className="text-muted-foreground">En lugar de simplemente compartir enlaces, crea contenido útil que muestre cómo los productos pueden resolver problemas o mejorar habilidades.</p>
                      </li>
                      <li>
                        <p className="font-medium">Haz seguimiento de tu rendimiento</p>
                        <p className="text-muted-foreground">Utiliza el panel de afiliado para monitorizar tus clics, conversiones y ganancias, y optimiza tu estrategia.</p>
                      </li>
                    </ol>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">4. Estrategias efectivas para promoción</h3>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li><span className="font-medium">Reseñas detalladas:</span> Crea reseñas honestas y completas de los productos.</li>
                      <li><span className="font-medium">Tutoriales:</span> Muestra cómo utilizar los productos en situaciones reales.</li>
                      <li><span className="font-medium">Comparativas:</span> Compara diferentes opciones para ayudar en la decisión de compra.</li>
                      <li><span className="font-medium">Casos prácticos:</span> Presenta ejemplos de cómo los productos han ayudado a músicos reales.</li>
                      <li><span className="font-medium">Ofertas exclusivas:</span> Aprovecha los descuentos y promociones especiales.</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">5. Aspectos legales y mejores prácticas</h3>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li><span className="font-medium">Divulgación de afiliados:</span> Siempre divulga tu relación de afiliado. Esto es un requisito legal en muchos países.</li>
                      <li><span className="font-medium">No hagas promesas exageradas:</span> Sé honesto sobre los beneficios y limitaciones de los productos.</li>
                      <li><span className="font-medium">Cumple con las normativas:</span> Familiarízate con las leyes de marketing y privacidad aplicables en tu región.</li>
                      <li><span className="font-medium">Protege la marca:</span> No utilices tácticas agresivas o engañosas que puedan dañar la reputación de Boostify.</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-md border">
                    <p className="font-medium mb-2">Nota importante:</p>
                    <p className="text-muted-foreground">El éxito como afiliado viene de construir confianza con tu audiencia y proporcionar valor genuino. Prioriza siempre las necesidades de tu audiencia sobre las comisiones inmediatas. Una estrategia basada en la confianza generará mejores resultados a largo plazo.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-60 border rounded-md bg-muted/20">
                  <div className="text-center">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">Vista previa no disponible</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Descarga el recurso para ver su contenido completo
                    </p>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <AlertDialogFooter className="border-t pt-4">
              <AlertDialogCancel>Cerrar</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}