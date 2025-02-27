import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Componentes UI
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clipboard,
  ClipboardCheck,
  Download,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Share2,
  FileText,
  Image,
  Sparkles,
  Wand2,
  Loader2,
  BookOpen,
  FileImage,
  MessageSquare,
  Hash,
  Copy,
  PlusCircle,
  Star,
  ArrowRight,
  Trash2,
} from "lucide-react";

// Esquema para validar formulario de generación de contenido
const contentFormSchema = z.object({
  productId: z.string({
    required_error: "Por favor selecciona un producto",
  }),
  contentType: z.enum(["post", "email", "banner", "review", "video_script"], {
    required_error: "Por favor selecciona un tipo de contenido",
  }),
  platform: z.string().optional(),
  tone: z.string().default("professional"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  keyPoints: z.string().optional(),
  targetAudience: z.string().optional(),
  includeEmojis: z.boolean().default(false),
  includeCTA: z.boolean().default(true),
  creative: z.number().min(0).max(100).default(50),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

interface AffiliateContentGeneratorProps {
  affiliateData: any;
}

export function AffiliateContentGenerator({ affiliateData }: AffiliateContentGeneratorProps) {
  const { user } = useAuth() || {};
  const { toast } = useToast();
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentHistory, setContentHistory] = useState<any[]>([]);
  const [copiedContent, setCopiedContent] = useState(false);
  const [activeTab, setActiveTab] = useState("generator");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Formulario para generar contenido
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      productId: "",
      contentType: "post",
      platform: "instagram",
      tone: "professional",
      length: "medium",
      keyPoints: "",
      targetAudience: "",
      includeEmojis: true,
      includeCTA: true,
      creative: 50,
    },
  });

  // Consultar productos disponibles para afiliar
  const { data: products = [] } = useQuery({
    queryKey: ["affiliate-products"],
    queryFn: async () => {
      // En una implementación real, esta información vendría de la base de datos
      return [
        {
          id: "prod1",
          name: "Curso de Producción Musical",
          description: "Aprende a producir música profesional desde cero",
          price: 199.99,
          commissionRate: 25,
          imageUrl: "/assets/course-thumbnail.jpg",
          category: "course",
        },
        {
          id: "prod2",
          name: "Plugin de Masterización Avanzada",
          description: "El mejor plugin para masterizar tus producciones",
          price: 149.99,
          commissionRate: 20,
          imageUrl: "/assets/plugin-thumbnail.jpg",
          category: "plugin",
        },
        {
          id: "prod3",
          name: "Paquete de Distribución Musical",
          description: "Distribuye tu música en todas las plataformas",
          price: 99.99,
          commissionRate: 30,
          imageUrl: "/assets/distribution-thumbnail.jpg",
          category: "service",
        },
        {
          id: "prod4",
          name: "Mentoría Personalizada",
          description: "Sesiones 1-a-1 con productores profesionales",
          price: 299.99,
          commissionRate: 15,
          imageUrl: "/assets/mentorship-thumbnail.jpg",
          category: "service",
        },
        {
          id: "prod5",
          name: "Bundle de Samples Exclusivos",
          description: "1000+ samples de alta calidad para tus producciones",
          price: 49.99,
          commissionRate: 40,
          imageUrl: "/assets/samples-thumbnail.jpg",
          category: "sample",
        },
      ];
    },
  });

  // Cargar historia de contenido generado
  const { data: savedContent = [], refetch: refetchSavedContent } = useQuery({
    queryKey: ["affiliate-content", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        const contentRef = collection(db, "affiliate_content");
        const q = query(contentRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
      } catch (error) {
        console.error("Error fetching saved content:", error);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  // Plantillas predefinidas
  const contentTemplates = [
    {
      id: "template1",
      name: "Promoción Flash",
      description: "Ideal para ofertas por tiempo limitado",
      type: "post",
      platform: "instagram",
      template: "🔥 ¡OFERTA FLASH! 🔥\n\n¿Quieres mejorar tus habilidades musicales? Tenemos una oferta especial por tiempo limitado en [PRODUCTO].\n\nConsigue un [DESCUENTO]% de descuento usando mi código: [CODIGO]\n\n⏰ Solo por 48 horas ⏰\n\n#música #producciónmusical #oferta #limitada",
      imageUrl: "/assets/template-flash.jpg",
    },
    {
      id: "template2",
      name: "Testimonial",
      description: "Comparte tu experiencia con el producto",
      type: "post",
      platform: "facebook",
      template: "Mi experiencia con [PRODUCTO] ha sido increíble. Después de [TIEMPO] utilizándolo, puedo decir que mi [BENEFICIO PRINCIPAL] ha mejorado enormemente.\n\nLo que más me gusta es [CARACTERÍSTICA], porque [RAZÓN].\n\nSi quieres probarlo tú mismo, puedes conseguirlo con un [DESCUENTO]% de descuento usando mi enlace: [ENLACE]\n\n¿Alguien más lo ha probado? ¡Comparte tu experiencia en los comentarios!",
      imageUrl: "/assets/template-testimonial.jpg",
    },
    {
      id: "template3",
      name: "Tutorial Rápido",
      description: "Demuestra un uso básico del producto",
      type: "video_script",
      platform: "youtube",
      template: "## GUIÓN PARA TUTORIAL RÁPIDO\n\nINTRO (0:00-0:15)\n¡Hola a todos! En este video voy a mostraros cómo [BENEFICIO PRINCIPAL] utilizando [PRODUCTO].\n\nPRESENTACIÓN DEL PRODUCTO (0:15-0:45)\nEste es [PRODUCTO], una herramienta que os ayudará a [BENEFICIO]. Lo que lo hace especial es [CARACTERÍSTICA ÚNICA].\n\nTUTORIAL PASO A PASO (0:45-2:00)\n1. Primero, [PASO 1]\n2. Después, [PASO 2]\n3. Finalmente, [PASO 3]\n\nRESULTADOS (2:00-2:30)\nComo podéis ver, el resultado es [DESCRIPCIÓN DEL RESULTADO].\n\nOFERTA ESPECIAL (2:30-3:00)\nSi queréis conseguir [PRODUCTO], podéis usar mi código [CÓDIGO] para obtener un [DESCUENTO]% de descuento. El enlace está en la descripción.\n\nCIERRE (3:00-3:15)\nGracias por ver este tutorial. Si os ha gustado, no olvidéis darle like y suscribiros para más contenido como este.",
      imageUrl: "/assets/template-tutorial.jpg",
    },
    {
      id: "template4",
      name: "Email Promocional",
      description: "Para enviar a tu lista de suscriptores",
      type: "email",
      platform: "email",
      template: "Asunto: [OFERTA ESPECIAL] para mejorar tu producción musical\n\nHola [NOMBRE],\n\nEspero que estés bien. Hoy quiero compartir contigo una herramienta que ha transformado mi forma de [ACTIVIDAD RELACIONADA].\n\n[PRODUCTO] es un [TIPO DE PRODUCTO] que te permite [BENEFICIO PRINCIPAL]. Desde que empecé a usarlo, he notado una gran mejora en [RESULTADO].\n\nLo mejor es que ahora mismo puedes conseguirlo con un [DESCUENTO]% de descuento usando mi código de afiliado: [CÓDIGO].\n\n👉 [ENLACE]\n\nEsta oferta solo estará disponible hasta el [FECHA], así que no esperes demasiado.\n\nSi tienes alguna pregunta sobre el producto, responde a este email y estaré encantado de ayudarte.\n\nUn saludo,\n[TU NOMBRE]",
      imageUrl: "/assets/template-email.jpg",
    },
    {
      id: "template5",
      name: "Comparativa",
      description: "Compara el producto con alternativas",
      type: "post",
      platform: "blog",
      template: "# [PRODUCTO] vs. La Competencia: ¿Cuál es mejor para [ACTIVIDAD]?\n\nSi estás buscando un [TIPO DE PRODUCTO] para [ACTIVIDAD], probablemente te hayas encontrado con varias opciones. En este artículo, voy a comparar [PRODUCTO] con sus principales competidores.\n\n## Características principales\n\n### [PRODUCTO]\n- [CARACTERÍSTICA 1]\n- [CARACTERÍSTICA 2]\n- [CARACTERÍSTICA 3]\n- Precio: [PRECIO]\n\n### Competidor 1: [NOMBRE]\n- [CARACTERÍSTICA 1]\n- [CARACTERÍSTICA 2]\n- [CARACTERÍSTICA 3]\n- Precio: [PRECIO]\n\n### Competidor 2: [NOMBRE]\n- [CARACTERÍSTICA 1]\n- [CARACTERÍSTICA 2]\n- [CARACTERÍSTICA 3]\n- Precio: [PRECIO]\n\n## Conclusión\n\nAunque cada opción tiene sus ventajas, [PRODUCTO] destaca en [VENTAJA PRINCIPAL]. Si valoras [BENEFICIO], entonces [PRODUCTO] es tu mejor opción.\n\nActualmente puedes conseguir [PRODUCTO] con un [DESCUENTO]% de descuento usando mi enlace: [ENLACE]",
      imageUrl: "/assets/template-comparison.jpg",
    },
  ];

  // Mutación para generar contenido con IA
  const generateContentMutation = useMutation({
    mutationFn: async (data: ContentFormValues) => {
      // En una implementación real, esta llamada iría a una API que utiliza OpenAI o similar
      // Por ahora, simulamos una respuesta para demostración
      
      const selectedProduct = products.find(p => p.id === data.productId);
      if (!selectedProduct) throw new Error("Producto no encontrado");
      
      // Construir el prompt para la API de OpenAI/Claude
      const prompt = `
        Genera contenido promocional para el siguiente producto musical:
        
        Producto: ${selectedProduct.name}
        Descripción: ${selectedProduct.description}
        Precio: $${selectedProduct.price}
        
        Tipo de contenido: ${data.contentType}
        Plataforma: ${data.platform || 'general'}
        Tono: ${data.tone}
        Longitud: ${data.length}
        Puntos clave a incluir: ${data.keyPoints || 'No especificado'}
        Audiencia objetivo: ${data.targetAudience || 'Músicos y productores'}
        Incluir emojis: ${data.includeEmojis ? 'Sí' : 'No'}
        Incluir llamada a la acción: ${data.includeCTA ? 'Sí' : 'No'}
        Nivel de creatividad: ${data.creative}%
        
        El contenido debe incluir mi código de afiliado: ${affiliateData?.referralCode || 'AFILIADO10'}
        
        Genera un ${data.contentType} atractivo y persuasivo que destaque las características 
        del producto y motive a la audiencia a realizar una compra utilizando mi enlace de afiliado.
      `;
      
      // Simular llamada a la API (en producción, esto sería una llamada real)
      return await apiRequest({
        url: "/api/affiliates/generate-content",
        method: "POST",
        data: {
          prompt,
          model: "claude-3-haiku-20240307", // o "gpt-4" dependiendo de la implementación
          userId: user?.uid,
          productId: data.productId,
          contentType: data.contentType,
        },
      })
      .catch(error => {
        console.error("Error calling generation API:", error);
        
        // Respuesta fallback para demo
        return {
          content: generateFallbackContent(selectedProduct, data),
        };
      });
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      toast({
        title: "Contenido generado",
        description: "El contenido se ha generado exitosamente.",
      });
      
      // Guardar en Firestore
      saveGeneratedContent(data.content, form.getValues());
    },
    onError: (error) => {
      console.error("Error al generar contenido:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el contenido. Inténtalo de nuevo.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });
  
  // Función para generar contenido de fallback (cuando la API falla o para demo)
  const generateFallbackContent = (product: any, formData: ContentFormValues) => {
    let content = "";
    const referralCode = affiliateData?.referralCode || "AFILIADO10";
    
    switch (formData.contentType) {
      case "post":
        if (formData.platform === "instagram") {
          content = `🎵 ¡ATENCIÓN MÚSICOS Y PRODUCTORES! 🎵

¿Buscas llevar tu música al siguiente nivel? ${product.name} es la solución que necesitas.

✅ ${product.description}
✅ Ideal para ${formData.targetAudience || "todos los niveles"}
✅ Precio especial: $${product.price}

🔥 OFERTA EXCLUSIVA: Usa mi código "${referralCode}" y obtén un 10% de DESCUENTO.

👉 Link en bio para más información
👉 Oferta por tiempo limitado

#música #producciónmusical #ofertas #tutorial #músicos`;
        } else if (formData.platform === "facebook") {
          content = `¡Gran noticia para los amantes de la música! 🎵

He descubierto una herramienta increíble que ha transformado mi forma de producir música: ${product.name}.

¿Qué hace que ${product.name} sea especial?
• ${product.description}
• Perfecto para ${formData.targetAudience || "músicos de todos los niveles"}
• Interfaz intuitiva y resultados profesionales

Desde que empecé a usarlo, he notado una gran mejora en mis producciones. La calidad del sonido es excepcional y el flujo de trabajo es mucho más eficiente.

Si quieres probarlo tú mismo, puedes conseguirlo ahora con un descuento exclusivo usando mi código de afiliado: ${referralCode}

👉 [ENLACE DE AFILIADO]

¿Alguien más lo ha probado? ¡Comparte tu experiencia en los comentarios!`;
        } else {
          content = `# Transforma tu música con ${product.name}

Si eres un músico o productor que busca mejorar la calidad de tus producciones, tengo una recomendación que podría cambiar tu juego: **${product.name}**.

## ¿Por qué me encanta ${product.name}?

${product.description}. He estado usándolo durante las últimas semanas y la diferencia en mis producciones es notable.

### Características destacadas:
- Calidad profesional
- Fácil de usar
- Resultados inmediatos
- Excelente relación calidad-precio

A $${product.price}, es una inversión que vale la pena para cualquier músico serio.

**OFERTA ESPECIAL:** Usa mi código "${referralCode}" para obtener un 10% de descuento.

[Consíguelo aquí →](enlace-afiliado)

¿Has probado ${product.name}? Me encantaría saber tu opinión en los comentarios.`;
        }
        break;
        
      case "email":
        content = `Asunto: Descubre el secreto para mejorar tu producción musical

Hola [Nombre],

Espero que este email te encuentre bien y que tus proyectos musicales estén avanzando.

Quería compartir contigo una herramienta que ha transformado completamente mi proceso de producción: ${product.name}.

${product.description}. Desde que empecé a usarlo, he notado una mejora significativa en la calidad de mis producciones, y el tiempo que ahorro es invaluable.

Estas son algunas de las razones por las que me encanta:

• Resultados profesionales sin complicaciones
• Interfaz intuitiva, perfecta incluso si eres principiante
• Soporte técnico excepcional
• Actualizaciones regulares con nuevas funcionalidades

Normalmente cuesta $${product.price}, pero como lector de mi newsletter, puedes conseguirlo con un 10% de descuento usando mi código: ${referralCode}

👉 [ENLACE DE AFILIADO]

Esta oferta es por tiempo limitado, así que no esperes demasiado si estás interesado.

Si tienes alguna pregunta sobre ${product.name} o cómo lo utilizo en mi flujo de trabajo, no dudes en responder a este email. Estaré encantado de ayudarte.

¡Feliz producción!

[Tu nombre]

P.D.: Si ya usas ${product.name}, me encantaría saber tu opinión. ¡Responde a este email y cuéntame tu experiencia!`;
        break;
        
      case "video_script":
        content = `# GUIÓN: Cómo ${product.name} revolucionó mi producción musical

## INTRO (0:00-0:30)
¡Hola a todos! En el video de hoy voy a hablaros de una herramienta que ha cambiado completamente mi forma de producir música: ${product.name}.

## PROBLEMA (0:30-1:00)
Antes de descubrir este producto, me enfrentaba constantemente a [PROBLEMA COMÚN]. Estaba frustrado, perdía tiempo y mis producciones no sonaban como yo quería.

## PRESENTACIÓN DEL PRODUCTO (1:00-1:30)
Aquí es donde entra ${product.name}. Este ${product.category === 'plugin' ? 'plugin' : product.category === 'course' ? 'curso' : 'servicio'} te permite ${product.description}.

## DEMOSTRACIÓN (1:30-3:00)
Vamos a ver cómo funciona en la práctica. [MOSTRAR DEMOSTRACIÓN DEL PRODUCTO]

## RESULTADOS Y BENEFICIOS (3:00-4:00)
Desde que empecé a usar ${product.name}, he notado estos cambios en mis producciones:
- Mejor calidad de sonido
- Flujo de trabajo más eficiente
- Más creatividad
- Ahorro de tiempo

## TESTIMONIOS (4:00-4:30)
No soy el único que ha experimentado estos beneficios. Escuchad lo que dicen otros usuarios:
[INCLUIR 2-3 TESTIMONIOS CORTOS]

## OFERTA (4:30-5:00)
Si queréis probarlo vosotros mismos, tengo una oferta especial para los seguidores de este canal. Usando mi código "${referralCode}", obtendréis un 10% de descuento.

El enlace está en la descripción, pero esta oferta es por tiempo limitado, así que no esperéis demasiado.

## CIERRE (5:00-5:30)
¿Habéis probado ${product.name} o herramientas similares? Dejadme saber en los comentarios. Y como siempre, si os ha gustado el video, no olvidéis darle like y suscribiros para más contenido como este.

¡Hasta la próxima!`;
        break;
        
      case "banner":
        content = `[DISEÑO DE BANNER PARA ${formData.platform?.toUpperCase() || 'REDES SOCIALES'}]

ELEMENTOS PRINCIPALES:

- IMAGEN DE FONDO: Productor musical o DJ en estudio con ${product.name} visible
- TEXTO PRINCIPAL: "${product.name} - ${product.description}"
- SUBTEXTO: "Eleva tu producción musical al siguiente nivel"
- TEXTO CTA: "OBTÉN UN 10% DE DESCUENTO CON EL CÓDIGO: ${referralCode}"
- BOTÓN: "COMPRAR AHORA" con enlace de afiliado
- PALETA DE COLORES: Azul oscuro, naranja vibrante y blanco
- LOGO: Logo de ${product.name} en la esquina inferior derecha
- TU MARCA: Tu logo/nombre en la esquina inferior izquierda

DIMENSIONES RECOMENDADAS:
- Instagram Feed: 1080 x 1080 px
- Facebook: 1200 x 628 px
- Twitter: 1600 x 900 px
- Banner web: 970 x 250 px

NOTAS DE DISEÑO:
- Usar tipografía moderna y legible
- Mantener contraste entre texto y fondo
- Incluir una imagen del producto en uso
- Destacar el precio con tachado del precio original: "$${product.price}" y luego el precio con descuento
- Añadir un pequeño indicador de "Tiempo limitado" para generar urgencia`;
        break;
        
      case "review":
        content = `# Reseña: ${product.name} - ¿Vale la pena?

## Introducción

Hoy quiero compartir mi experiencia con ${product.name}, un ${product.category === 'plugin' ? 'plugin' : product.category === 'course' ? 'curso' : 'servicio'} que he estado utilizando durante las últimas semanas. Para quienes no lo conozcan, ${product.description}.

## Primeras impresiones

Al abrir ${product.name} por primera vez, me sorprendió su interfaz limpia y organizada. No se siente abrumador como otras herramientas similares, lo que es un gran punto a favor para principiantes.

## Características destacadas

- **Característica 1**: Excelente calidad de [característica relevante]
- **Característica 2**: Flujo de trabajo intuitivo que ahorra tiempo
- **Característica 3**: Actualizaciones regulares con nuevas funcionalidades
- **Característica 4**: Soporte técnico excepcional

## Pros y contras

### Pros:
- Fácil de usar, incluso para principiantes
- Resultados profesionales
- Excelente relación calidad-precio
- Comunidad activa de usuarios

### Contras:
- Requiere cierta curva de aprendizaje al principio
- Algunas funciones avanzadas podrían estar mejor documentadas

## Resultados reales

Desde que empecé a usar ${product.name}, he notado una mejora significativa en [resultado relevante]. Mis [proyectos/canciones/producciones] suenan más profesionales y el tiempo que antes perdía en [problema común] ahora lo puedo dedicar a ser más creativo.

## Comparación con alternativas

He probado otras soluciones como [Competidor 1] y [Competidor 2], pero ${product.name} se destaca por su [ventaja principal].

## Conclusión

A $${product.price}, ${product.name} ofrece un valor excepcional. Si eres un [audiencia objetivo] que busca mejorar [beneficio principal], lo recomiendo encarecidamente.

**Puntuación final: 4.5/5 estrellas**

## Oferta especial

Si quieres probarlo tú mismo, puedes conseguir un 10% de descuento usando mi código de afiliado: **${referralCode}**

[Comprar ${product.name} con descuento →](enlace-afiliado)

*Nota: Este artículo contiene enlaces de afiliado, lo que significa que puedo recibir una comisión si realizas una compra a través de ellos, sin costo adicional para ti.*`;
        break;
    }
    
    return content;
  };

  // Guardar contenido generado en Firestore
  const saveGeneratedContent = async (content: string, formData: ContentFormValues) => {
    if (!user?.uid) return;
    
    try {
      const selectedProduct = products.find(p => p.id === formData.productId);
      
      await addDoc(collection(db, "affiliate_content"), {
        userId: user.uid,
        content,
        productId: formData.productId,
        productName: selectedProduct?.name,
        contentType: formData.contentType,
        platform: formData.platform,
        createdAt: serverTimestamp(),
      });
      
      refetchSavedContent();
    } catch (error) {
      console.error("Error saving generated content:", error);
    }
  };

  // Funciones de utilidad
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContent(true);
    
    toast({
      title: "Contenido copiado",
      description: "El contenido se ha copiado al portapapeles.",
    });
    
    setTimeout(() => {
      setCopiedContent(false);
    }, 2000);
  };

  const downloadAsText = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Contenido descargado",
      description: `Se ha descargado el archivo "${filename}".`,
    });
  };

  const handleApplyTemplate = (template: any) => {
    setSelectedTemplate(template);
    
    // Limpiar campos relacionados con el template
    form.setValue("contentType", template.type as any);
    form.setValue("platform", template.platform);
    
    // Mostrar el contenido del template
    setGeneratedContent(template.template);
  };

  const onSubmit = (values: ContentFormValues) => {
    setIsGenerating(true);
    generateContentMutation.mutate(values);
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "post":
        return <MessageSquare className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "banner":
        return <FileImage className="h-4 w-4" />;
      case "review":
        return <Star className="h-4 w-4" />;
      case "video_script":
        return <FileText className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getFormattedDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const deleteSavedContent = async (contentId: string) => {
    // Esta funcionalidad requeriría implementación real con Firestore
    toast({
      title: "Contenido eliminado",
      description: "El contenido ha sido eliminado de tu biblioteca.",
    });
    
    // Actualizar la UI sin hacer la llamada real a la DB (en producción, esto sería una mutación real)
    setContentHistory(contentHistory.filter(item => item.id !== contentId));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generator">Generador de contenido</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="saved">Mi contenido</TabsTrigger>
        </TabsList>
        
        {/* Pestaña: Generador de contenido */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generador de contenido IA</CardTitle>
                  <CardDescription>
                    Crea contenido promocional personalizado para tus enlaces de afiliado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Producto</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un producto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
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
                                <SelectItem value="post">Post para redes sociales</SelectItem>
                                <SelectItem value="email">Email promocional</SelectItem>
                                <SelectItem value="banner">Banner publicitario</SelectItem>
                                <SelectItem value="review">Reseña del producto</SelectItem>
                                <SelectItem value="video_script">Guión para video</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {form.watch("contentType") === "post" && (
                        <FormField
                          control={form.control}
                          name="platform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plataforma</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona plataforma" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="instagram">Instagram</SelectItem>
                                  <SelectItem value="facebook">Facebook</SelectItem>
                                  <SelectItem value="twitter">Twitter</SelectItem>
                                  <SelectItem value="blog">Blog</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={form.control}
                        name="tone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tono</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona tono" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="professional">Profesional</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="exciting">Emocionante</SelectItem>
                                <SelectItem value="informative">Informativo</SelectItem>
                                <SelectItem value="persuasive">Persuasivo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitud</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona longitud" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="short">Corto</SelectItem>
                                <SelectItem value="medium">Medio</SelectItem>
                                <SelectItem value="long">Largo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="keyPoints"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Puntos clave a incluir (opcional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Características o beneficios a destacar"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Separa los puntos con comas o líneas nuevas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="targetAudience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Audiencia objetivo (opcional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ej: Productores principiantes"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="includeEmojis"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Incluir emojis</FormLabel>
                              <FormDescription>
                                Añadir emojis relevantes al contenido
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="includeCTA"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Incluir llamada a la acción</FormLabel>
                              <FormDescription>
                                Añadir CTA con enlace de afiliado
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="creative"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nivel de creatividad: {field.value}%</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={5}
                                defaultValue={[field.value]}
                                onValueChange={(values) => field.onChange(values[0])}
                              />
                            </FormControl>
                            <FormDescription>
                              Mayor creatividad = contenido más original pero menos predecible
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={isGenerating}>
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            Generando...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" /> 
                            Generar contenido
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    El contenido generado se guardará automáticamente en tu biblioteca.
                  </p>
                </CardFooter>
              </Card>
              
              {selectedTemplate && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Plantilla seleccionada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge>{selectedTemplate.type}</Badge>
                        <Badge variant="outline">{selectedTemplate.platform}</Badge>
                      </div>
                      <p className="text-sm font-medium">{selectedTemplate.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedTemplate(null)}
                    >
                      Descartar plantilla
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
            
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Contenido generado</span>
                    {generatedContent && (
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => copyToClipboard(generatedContent)}
                        >
                          {copiedContent ? (
                            <ClipboardCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clipboard className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => downloadAsText(
                            generatedContent, 
                            `contenido-afiliado-${new Date().toISOString().substring(0, 10)}.txt`
                          )}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Personaliza el contenido según tus necesidades antes de utilizarlo
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[500px] md:h-[600px] lg:h-[700px]">
                  {generatedContent ? (
                    <Textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      className="h-full resize-none font-mono text-sm"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center border-2 border-dashed rounded-md">
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        <Sparkles className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          Listo para generar contenido
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-md">
                          Completa el formulario y haz clic en "Generar contenido" 
                          para crear promociones personalizadas para tus enlaces de afiliado
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <Badge variant="outline">Posts para redes</Badge>
                          <Badge variant="outline">Emails promocionales</Badge>
                          <Badge variant="outline">Guiones para videos</Badge>
                          <Badge variant="outline">Reseñas de productos</Badge>
                          <Badge variant="outline">Banners</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t p-4 gap-2">
                  <p className="text-xs text-muted-foreground flex-1">
                    Sustituye [VALORES] con tu información específica antes de publicar
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setGeneratedContent("")}
                      disabled={!generatedContent}
                    >
                      Limpiar
                    </Button>
                    <Button 
                      size="sm"
                      disabled={!generatedContent}
                      onClick={() => {
                        saveGeneratedContent(generatedContent, form.getValues());
                        toast({
                          title: "Contenido guardado",
                          description: "Se ha guardado en tu biblioteca de contenido",
                        });
                      }}
                    >
                      Guardar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Pestaña: Plantillas */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getContentTypeIcon(template.type)}
                    {template.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    {getPlatformIcon(template.platform)}
                    {template.platform.charAt(0).toUpperCase() + template.platform.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm">{template.description}</p>
                </CardContent>
                <CardFooter className="border-t pt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleApplyTemplate(template)}
                  >
                    Usar plantilla
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Pestaña: Mi contenido */}
        <TabsContent value="saved" className="space-y-6">
          {savedContent.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No hay contenido guardado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Genera y guarda contenido para verlo aquí
              </p>
              <Button 
                variant="outline"
                onClick={() => setActiveTab("generator")}
                className="mx-auto"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Crear contenido
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedContent.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {getContentTypeIcon(item.contentType)}
                          {item.productName || "Contenido guardado"}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          {getPlatformIcon(item.platform || "default")}
                          {item.platform && item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                          <span className="ml-2 text-xs">
                            {getFormattedDate(item.createdAt)}
                          </span>
                        </CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteSavedContent(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="max-h-32 overflow-hidden text-sm text-muted-foreground border rounded-md p-3 bg-muted/10">
                      <p className="whitespace-pre-line line-clamp-4">{item.content}</p>
                      {item.content.length > 320 && (
                        <div className="text-center mt-2">
                          <span className="text-xs text-muted-foreground">...</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(item.content)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        // Cargar el contenido en el editor
                        setGeneratedContent(item.content);
                        setActiveTab("generator");
                        
                        toast({
                          title: "Contenido cargado",
                          description: "El contenido se ha cargado en el editor",
                        });
                      }}
                    >
                      Editar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}