import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, Copy, CheckCircle2, RotateCcw, Loader2, Save, Trash2, Download, Share2, SquarePen, Facebook, Instagram, Twitter, Youtube, ArrowRight, Wand2, Mail, Globe, FileText, Video, Link, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AffiliateContentGeneratorProps {
  affiliateData: {
    id: string;
    level?: string;
    name?: string;
    savedContent?: any[];
  } | null;
}

// Esquema de validación para el formulario de generación de contenido
const contentFormSchema = z.object({
  productId: z.string({ required_error: "Selecciona un producto" }),
  contentType: z.string({ required_error: "Selecciona un tipo de contenido" }),
  platform: z.string({ required_error: "Selecciona una plataforma" }),
  tone: z.string().optional(),
  additionalInfo: z.string().max(300, { message: "La información adicional no puede exceder los 300 caracteres" }).optional(),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

// Esquema para guardar contenido generado
const saveContentSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres" }).max(100),
  tags: z.string().optional(),
});

type SaveContentValues = z.infer<typeof saveContentSchema>;

// Definición de tipos para productos y contenido
interface AffiliateProduct {
  id: string;
  name: string;
  description?: string;
  url?: string;
  commissionRate: number;
  category?: string;
  imageUrl?: string;
}

interface AffiliateContent {
  id: string;
  userId: string;
  content: string;
  title: string;
  tags: string[];
  productId: string;
  productName: string;
  contentType: string;
  platform: string;
  createdAt: any; // Este tipo debería ser Timestamp de Firestore, pero para simplificar
}

export function AffiliateContentGenerator({ affiliateData }: AffiliateContentGeneratorProps) {
  const { user } = useAuth() || {};
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("generate");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentContentType, setCurrentContentType] = useState<string | null>(null);
  const [currentPlatform, setCurrentPlatform] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Inicializar useForm con el esquema de validación
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      productId: "",
      contentType: "",
      platform: "",
      tone: "friendly",
      additionalInfo: "",
    },
  });

  // Formulario para guardar contenido
  const saveForm = useForm<SaveContentValues>({
    resolver: zodResolver(saveContentSchema),
    defaultValues: {
      title: "",
      tags: "",
    },
  });

  // Consulta para obtener los productos disponibles para afiliados
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["affiliate-products"],
    queryFn: async () => {
      const productsRef = collection(db, "affiliateProducts");
      const querySnapshot = await getDocs(productsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AffiliateProduct[];
    },
  });

  // Consulta para obtener el historial de contenido generado
  const { data: contentHistory, isLoading: isLoadingContentHistory } = useQuery({
    queryKey: ["affiliate-content-history", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      const contentRef = collection(db, "affiliateContent");
      const q = query(
        contentRef, 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })) as AffiliateContent[];
    },
    enabled: !!user?.uid && activeTab === "history",
  });

  // Mutación para guardar contenido generado
  const saveContentMutation = useMutation({
    mutationFn: async (data: SaveContentValues) => {
      if (!user?.uid || !generatedContent || !currentContentType || !currentPlatform) {
        throw new Error("Faltan datos necesarios");
      }
      
      const productId = form.getValues("productId");
      const selectedProduct = products?.find(p => p.id === productId);
      
      const contentData = {
        userId: user.uid,
        content: generatedContent,
        title: data.title,
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [],
        productId,
        productName: selectedProduct?.name || "",
        contentType: currentContentType,
        platform: currentPlatform,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, "affiliateContent"), contentData);
      return { id: docRef.id, ...contentData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-content-history", user?.uid] });
      setShowSaveDialog(false);
      setIsSaving(false);
      saveForm.reset();
      alert("Contenido guardado correctamente");
    },
    onError: (error) => {
      console.error("Error al guardar contenido:", error);
      setIsSaving(false);
      alert("Error al guardar el contenido");
    },
  });

  // Tipos de contenido disponibles
  const contentTypes = [
    { value: "post", label: "Publicación", description: "Texto ideal para compartir en redes sociales" },
    { value: "caption", label: "Descripción", description: "Texto corto para acompañar imágenes" },
    { value: "email", label: "Email", description: "Formato para campañas de email marketing" },
    { value: "article", label: "Artículo", description: "Contenido detallado para blogs o sitios web" },
    { value: "video_script", label: "Guión de video", description: "Script para producir contenido en video" },
  ];

  // Plataformas disponibles
  const platforms = [
    { value: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" /> },
    { value: "facebook", label: "Facebook", icon: <Facebook className="h-4 w-4" /> },
    { value: "twitter", label: "Twitter", icon: <Twitter className="h-4 w-4" /> },
    { value: "youtube", label: "YouTube", icon: <Youtube className="h-4 w-4" /> },
    { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
    { value: "blog", label: "Blog", icon: <Globe className="h-4 w-4" /> },
  ];

  // Tonos disponibles para el contenido
  const tones = [
    { value: "friendly", label: "Amigable" },
    { value: "professional", label: "Profesional" },
    { value: "enthusiastic", label: "Entusiasta" },
    { value: "informative", label: "Informativo" },
    { value: "persuasive", label: "Persuasivo" },
  ];

  // Función para generar contenido usando OpenAI
  const generateContent = async () => {
    const isValid = await form.trigger();
    
    if (!isValid) {
      return;
    }
    
    const values = form.getValues();
    setCurrentContentType(values.contentType);
    setCurrentPlatform(values.platform);
    setIsGenerating(true);
    setGeneratedContent(null);
    setGenerationError(null);

    const selectedProduct = products?.find(p => p.id === values.productId);
    
    if (!selectedProduct) {
      setGenerationError("No se pudo encontrar el producto seleccionado");
      setIsGenerating(false);
      return;
    }

    try {
      // Crear prompt para OpenAI
      const contentTypeLabel = contentTypes.find(ct => ct.value === values.contentType)?.label || values.contentType;
      const platformLabel = platforms.find(p => p.value === values.platform)?.label || values.platform;
      const toneLabel = tones.find(t => t.value === values.tone)?.label || "neutral";
      
      // Simplemente simulamos una respuesta para fines de demostración
      // En una implementación real, aquí se haría la llamada a la API
      setTimeout(() => {
        const simulatedResponse = getSimulatedResponse(
          selectedProduct, 
          values.contentType, 
          values.platform, 
          toneLabel, 
          values.additionalInfo || ""
        );
        
        setGeneratedContent(simulatedResponse);
        setIsGenerating(false);
      }, 2000);
    } catch (error: any) {
      console.error("Error generando contenido:", error);
      setGenerationError(`Error al generar contenido: ${error.message || "Error desconocido"}`);
      setIsGenerating(false);
    }
  };

  // Función para simular respuestas generadas (para demostración)
  const getSimulatedResponse = (
    product: AffiliateProduct, 
    contentType: string, 
    platform: string, 
    tone: string,
    additionalInfo: string
  ): string => {
    const responses: {[key: string]: {[key: string]: string}} = {
      post: {
        instagram: `🎵 ¡Transforma tu sonido con ${product.name}! 🎵\n\nDescubre por qué los profesionales eligen este increíble producto para elevar sus mezclas al siguiente nivel.\n\n✨ Calidad profesional\n✨ Flujo de trabajo intuitivo\n✨ Resultados inmediatos\n\n¡Haz clic en el enlace de mi bio para conseguir un 10% de descuento! #MusicProduction #AudioPro #AffiliatePick`,
        facebook: `¿Buscando mejorar tu producción musical? ${product.name} es exactamente lo que necesitas para lograr ese sonido profesional que siempre has deseado.\n\nHe estado utilizándolo en mis últimos proyectos y la diferencia es notable. La facilidad de uso combinada con los resultados de calidad hacen que este producto sea indispensable para cualquier productor serio.\n\nEcha un vistazo por ti mismo: [ENLACE DE AFILIADO]`,
        twitter: `Acabo de descubrir ${product.name} y es un cambio total en mi flujo de trabajo musical. Más rápido, más preciso y resultados increíbles. ¡No te lo pierdas! [ENLACE DE AFILIADO] #MusicProduction`,
        youtube: `En el video de hoy les muestro cómo ${product.name} ha revolucionado mi proceso de producción musical. Veremos paso a paso cómo utilizarlo para conseguir ese sonido profesional que todos buscamos en nuestras producciones. ¡No olvides usar mi enlace en la descripción para obtener un descuento especial!`,
        email: `Asunto: Descubre cómo ${product.name} está cambiando la industria musical\n\nHola [NOMBRE],\n\nEspero que estés bien. Quería compartir contigo un descubrimiento que ha cambiado por completo mi enfoque a la producción musical: ${product.name}.\n\nEste increíble producto ofrece:\n• Calidad de audio excepcional\n• Interfaz intuitiva\n• Resultados profesionales inmediatos\n\nEstoy seguro de que te encantará tanto como a mí. Si estás interesado, puedes conseguirlo con un descuento especial usando mi enlace:\n\n[ENLACE DE AFILIADO]\n\n¡Feliz producción musical!\n\n[TU NOMBRE]`,
        blog: `# Cómo ${product.name} Revolucionó Mi Flujo de Trabajo Musical\n\nEn el competitivo mundo de la producción musical, encontrar herramientas que realmente marquen la diferencia puede ser un desafío. Después de años probando diferentes soluciones, finalmente he encontrado algo que ha transformado completamente mi proceso creativo: **${product.name}**.\n\n## ¿Qué hace que ${product.name} sea especial?\n\nA diferencia de otras herramientas del mercado, ${product.name} combina una interfaz intuitiva con resultados de calidad profesional. Ya sea que estés comenzando en la producción musical o seas un veterano de la industria, este producto se adapta perfectamente a tus necesidades.\n\n[Continuar leyendo y descubrir más...]`,
      },
      caption: {
        instagram: `Elevando mi juego musical con ${product.name} 🎵 #MusicProduction #AffiliatePick [ENLACE EN BIO]`,
        facebook: `Acabo de descubrir esta joya para productores musicales. ${product.name} ha cambiado mi forma de trabajar. ¡Revisa el enlace para más información!`,
        twitter: `${product.name}: la herramienta que todo músico necesita en 2025. Compruébalo tú mismo 👉 [ENLACE] #MusicTech`,
        youtube: `Cómo ${product.name} transformó mis producciones musicales de amateur a profesional en solo semanas. Tutorial completo y enlaces en la descripción ⬇️`,
        email: `${product.name}: La solución definitiva para productores musicales que buscan calidad profesional sin complicaciones.`,
        blog: `Descubre por qué ${product.name} se está convirtiendo rápidamente en el estándar de la industria para músicos y productores de todo el mundo.`,
      },
      email: {
        email: `Asunto: Transforma tu música con ${product.name} - Oferta especial\n\nHola [NOMBRE],\n\nEspero que este email te encuentre bien. Como seguidor de mis recomendaciones musicales, quería compartir contigo un descubrimiento que ha revolucionado mi proceso creativo.\n\n${product.name} no es solo otra herramienta más; es un cambio de paradigma para cualquiera que se tome en serio la producción musical. Con funciones como [CARACTERÍSTICAS DESTACADAS], te permite [BENEFICIOS PRINCIPALES] sin la curva de aprendizaje empinada de otros productos similares.\n\nComo lector valorado, te ofrezco un descuento exclusivo del 15% si realizas tu compra a través de este enlace:\n\n[ENLACE DE AFILIADO]\n\nEsta oferta es por tiempo limitado, así que no pierdas la oportunidad de elevar tu música al siguiente nivel.\n\n¿Dudas o preguntas? Simplemente responde a este email y estaré encantado de ayudarte.\n\nMusicalmente,\n[TU NOMBRE]`,
      },
      article: {
        blog: `# Por qué ${product.name} Está Revolucionando la Industria Musical\n\nEn el dinámico mundo de la producción musical, las herramientas evolucionan constantemente. Sin embargo, pocas logran crear un impacto tan significativo como ${product.name}. Después de semanas de uso intensivo, estoy convencido de que este producto representa un avance fundamental para cualquier persona seria sobre la creación musical.\n\n## La revolución silenciosa\n\nLa mayoría de las innovaciones en tecnología musical suelen ser incrementales: una interfaz ligeramente mejorada aquí, un algoritmo más eficiente allá. Sin embargo, ${product.name} rompe este patrón al reimaginar completamente cómo interactuamos con [ASPECTO RELEVANTE DE LA PRODUCCIÓN MUSICAL].\n\nLo que realmente distingue a ${product.name} es su enfoque en [CARACTERÍSTICA PRINCIPAL]. A diferencia de soluciones competidoras que complican innecesariamente el flujo de trabajo, este producto prioriza la experiencia del usuario sin comprometer la calidad del resultado final.\n\n## Características que marcan la diferencia\n\n- **Interfaz intuitiva**: Incluso los principiantes pueden comenzar a producir resultados profesionales desde el primer día.\n- **Calidad de audio excepcional**: Los algoritmos patentados garantizan una fidelidad sonora sin precedentes.\n- **Flujo de trabajo optimizado**: Reduce drásticamente el tiempo necesario para [TAREA COMÚN].\n- **Compatibilidad universal**: Se integra perfectamente con todas las plataformas populares de producción musical.\n\n## Testimonios de profesionales\n\nNo soy el único impresionado con este producto. [NOMBRE], productor ganador de premios Grammy, afirma: "Después de incorporar ${product.name} a mi estudio, no puedo imaginar volver a mi flujo de trabajo anterior. Ha reducido mi tiempo de producción a la mitad mientras mejora la calidad final".\n\n## Vale la pena la inversión\n\nCon un precio de [PRECIO], ${product.name} representa una inversión significativa para algunos. Sin embargo, cuando consideras el tiempo que ahorrarás y la mejora en la calidad de tus producciones, el retorno de la inversión es incuestionable.\n\n## Conclusión\n\nRara vez recomiendo productos con tanto entusiasmo, pero ${product.name} ha demostrado ser una excepción notable. Si estás buscando elevar tu producción musical al siguiente nivel, no busques más.\n\n[ENLACE DE AFILIADO - Obtén un 10% de descuento usando este enlace exclusivo]\n\n¿Has probado ${product.name}? Me encantaría conocer tu experiencia en los comentarios.`,
      },
      video_script: {
        youtube: `¡Hola a todos y bienvenidos a un nuevo video! Hoy vamos a hablar de algo que ha revolucionado completamente mi proceso de producción musical: ${product.name}.\n\n[INTRODUCCIÓN - 30 segundos]\nSi llevas tiempo siguiendo este canal, sabes que siempre estoy buscando herramientas que mejoren nuestra música sin complicar el flujo de trabajo. Y créeme cuando te digo que ${product.name} es exactamente eso.\n\n[TRANSICIÓN A LA DEMOSTRACIÓN]\nVamos a ver exactamente cómo funciona. Primero, abriré mi último proyecto y te mostraré cómo era antes de utilizar ${product.name}...\n\n[DEMOSTRACIÓN DEL ANTES Y DESPUÉS - 3 minutos]\nComo pueden escuchar, la diferencia es notable. Lo que antes me tomaba horas, ahora puedo lograrlo en minutos, y con resultados mucho más profesionales.\n\n[EXPLICACIÓN DE CARACTERÍSTICAS - 4 minutos]\nLas principales funciones que me han impresionado son:\n1. La interfaz intuitiva que no requiere semanas de aprendizaje\n2. La calidad del sonido procesado, que mantiene toda la dinámica original\n3. La capacidad de integrarse perfectamente con mi DAW preferido\n\n[COMPARACIÓN CON ALTERNATIVAS - 2 minutos]\nAhora, sé que hay otras opciones en el mercado, como [COMPETIDORES], pero después de probar casi todas, puedo decirles con confianza que ${product.name} ofrece la mejor relación calidad-precio.\n\n[CONCLUSIÓN Y LLAMADA A LA ACCIÓN - 1 minuto]\nSi esto te ha parecido útil y estás considerando mejorar tu setup, he dejado un enlace en la descripción donde puedes conseguir ${product.name} con un 10% de descuento. Es un enlace de afiliado, lo que significa que el canal recibe una pequeña comisión si decides comprar, sin costo adicional para ti.\n\n¡No olvides suscribirte para más contenido sobre producción musical y déjame un comentario si tienes alguna pregunta sobre ${product.name}!\n\n¡Hasta el próximo video!`,
      }
    };

    // Si hay una respuesta específica para esta combinación, usarla
    if (responses[contentType] && responses[contentType][platform]) {
      return responses[contentType][platform];
    }
    
    // Si no, usar una respuesta genérica
    return `Contenido promocional para ${product.name}.\n\nEste es un fantástico producto que revolucionará tu experiencia musical. Con características innovadoras y un diseño intuitivo, ${product.name} es la elección perfecta para músicos y productores de todos los niveles.\n\n¡No pierdas la oportunidad de probarlo hoy mismo! Usa mi enlace de afiliado para obtener un descuento especial.`;
  };

  // Copiar al portapapeles
  const copyToClipboard = () => {
    if (!generatedContent) return;
    
    navigator.clipboard.writeText(generatedContent)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Error al copiar:', err);
      });
  };

  // Regenerar contenido
  const regenerateContent = () => {
    generateContent();
  };

  // Mostrar diálogo para guardar contenido
  const handleSaveClick = () => {
    if (!generatedContent) return;
    
    // Generar un título predeterminado basado en el tipo de contenido y la plataforma
    const contentTypeLabel = contentTypes.find(ct => ct.value === currentContentType)?.label || "";
    const platformLabel = platforms.find(p => p.value === currentPlatform)?.label || "";
    const defaultTitle = `${contentTypeLabel} para ${platformLabel} - ${new Date().toLocaleDateString()}`;
    
    saveForm.reset({
      title: defaultTitle,
      tags: `${currentContentType}, ${currentPlatform}`
    });
    
    setShowSaveDialog(true);
  };

  // Manejar envío del formulario para guardar
  const handleSaveSubmit = (data: SaveContentValues) => {
    setIsSaving(true);
    saveContentMutation.mutate(data);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generador de Contenido para Afiliados</CardTitle>
        <CardDescription>
          Crea contenido promocional optimizado para diferentes plataformas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generar Contenido</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(generateContent)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Producto a promocionar</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un producto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingProducts ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : products?.length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                No hay productos disponibles
                              </div>
                            ) : (
                              products?.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} ({product.commissionRate}%)
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de contenido</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contentTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex flex-col">
                                  <span>{type.label}</span>
                                  <span className="text-xs text-muted-foreground">{type.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plataforma</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una plataforma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {platforms.map(platform => (
                              <SelectItem key={platform.value} value={platform.value}>
                                <div className="flex items-center">
                                  {platform.icon}
                                  <span className="ml-2">{platform.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tono del contenido</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tono" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tones.map(tone => (
                              <SelectItem key={tone.value} value={tone.value}>
                                {tone.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Información adicional (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Añade detalles específicos, puntos clave a destacar, o características del producto que quieras enfatizar" 
                          className="resize-none min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Máximo 300 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" size="lg" className="w-full gap-2" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generar Contenido
                    </>
                  )}
                </Button>
              </form>
            </Form>
            
            {generationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{generationError}</AlertDescription>
              </Alert>
            )}
            
            {generatedContent && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Contenido Generado</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={regenerateContent} className="gap-1">
                      <RotateCcw className="h-4 w-4" />
                      Regenerar
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1">
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSaveClick} className="gap-1">
                      <Save className="h-4 w-4" />
                      Guardar
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 whitespace-pre-wrap">
                  {generatedContent}
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="capitalize">
                      {currentContentType}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {currentPlatform}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generado el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 mt-4">
            {isLoadingContentHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !contentHistory || contentHistory.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">No hay contenido guardado</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Genera y guarda contenido para tus campañas de afiliados para acceder a tu historial aquí.
                </p>
                <Button onClick={() => setActiveTab("generate")} className="gap-1">
                  <SquarePen className="h-4 w-4" />
                  Crear Contenido
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Contenido Guardado</h3>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {contentTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {contentHistory.map(content => (
                    <Card key={content.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{content.title}</CardTitle>
                            <CardDescription>
                              {content.productName} - {new Date(content.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="capitalize">
                              {content.contentType}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {content.platform}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-md p-3 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                          {content.content}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between border-t p-3">
                        <div className="flex flex-wrap gap-1">
                          {content.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Diálogo para guardar contenido */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guardar Contenido</DialogTitle>
              <DialogDescription>
                Guarda este contenido para usarlo más tarde. Añade un título y etiquetas para organizarlo.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...saveForm}>
              <form onSubmit={saveForm.handleSubmit(handleSaveSubmit)} className="space-y-4">
                <FormField
                  control={saveForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Publicación Instagram - Curso de Producción" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={saveForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiquetas (separadas por comas)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: instagram, post, música" {...field} />
                      </FormControl>
                      <FormDescription>
                        Las etiquetas te ayudarán a encontrar y filtrar tu contenido después
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Contenido"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}