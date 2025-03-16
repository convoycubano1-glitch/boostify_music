import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, Mail, MessageSquare, Phone, HelpCircle, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Esquema de validación para el formulario de contacto
const contactFormSchema = z.object({
  subject: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres" }).max(100),
  category: z.string({ required_error: "Selecciona una categoría" }),
  message: z.string().min(20, { message: "El mensaje debe tener al menos 20 caracteres" }).max(1000),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export function AffiliateSupport() {
  const { user } = useAuth() || {};
  const [activeTab, setActiveTab] = useState("contact");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Inicializar useForm con el esquema de validación
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      subject: "",
      category: "",
      message: "",
    },
  });

  // Manejar el envío del formulario
  const onSubmit = async (data: ContactFormValues) => {
    if (!user?.uid) {
      setSubmitError("Debes iniciar sesión para enviar un mensaje");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Crear el documento de ticket en Firestore
      await addDoc(collection(db, "affiliateTickets"), {
        userId: user.uid,
        email: user.email,
        name: user.displayName || "",
        subject: data.subject,
        category: data.category,
        message: data.message,
        status: "open", // open, in_progress, resolved, closed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubmitSuccess(true);
      form.reset();
      
      // Restablecer después de un tiempo
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Error al enviar ticket:", err);
      setSubmitError("Ha ocurrido un error al enviar tu mensaje. Por favor, intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preguntas frecuentes
  const faqs = [
    {
      question: "¿Cómo funciona el programa de afiliados?",
      answer: "El programa de afiliados de Boostify te permite ganar comisiones por cada venta que generes a través de tus enlaces únicos. Recibirás un porcentaje de cada compra completada, con tasas que varían según el producto y tu nivel de afiliado."
    },
    {
      question: "¿Cuándo se procesan los pagos?",
      answer: "Los pagos se procesan mensualmente, siempre que hayas alcanzado el umbral mínimo de $50. Los pagos se realizan entre el día 1 y 5 de cada mes por las ganancias del mes anterior."
    },
    {
      question: "¿Qué métodos de pago están disponibles?",
      answer: "Actualmente ofrecemos pagos vía PayPal, transferencia bancaria y criptomonedas (Bitcoin, Ethereum). Puedes seleccionar tu método preferido en la configuración de tu cuenta de afiliado."
    },
    {
      question: "¿Cómo se rastrean las ventas y comisiones?",
      answer: "Utilizamos cookies con una duración de 30 días para rastrear las visitas y conversiones generadas por tus enlaces. Esto significa que recibirás comisión por cualquier compra realizada dentro de los 30 días posteriores a que un usuario haga clic en tu enlace."
    },
    {
      question: "¿Puedo promocionar los productos en redes sociales?",
      answer: "¡Absolutamente! Te animamos a promocionar nuestros productos en todas tus redes sociales, blog, YouTube, emails y cualquier otro canal digital. Sin embargo, no está permitido el spam ni la publicidad engañosa."
    },
    {
      question: "¿Hay restricciones sobre dónde puedo promocionar los productos?",
      answer: "No puedes promocionar productos a través de sistemas de spam, publicidad engañosa, sitios con contenido ilegal o inapropiado, ni puedes usar el nombre de Boostify en campañas de búsqueda pagada (SEM) sin autorización previa."
    },
    {
      question: "¿Puedo solicitar un aumento en mi tasa de comisión?",
      answer: "Los afiliados que demuestren un rendimiento consistente son elegibles para tasas de comisión mejoradas. Cuando alcances ciertos umbrales de ventas, serás promovido automáticamente a niveles superiores con mejores comisiones."
    },
    {
      question: "¿Cómo puedo obtener soporte si tengo problemas?",
      answer: "Puedes contactarnos a través del formulario en esta página o enviando un email a affiliates@boostify.com. Nuestro tiempo de respuesta habitual es de 24-48 horas en días laborables."
    },
  ];

  // Recursos de contacto
  const contactResources = [
    {
      title: "Correo electrónico",
      description: "Envíanos un correo con tus preguntas",
      contact: "affiliates@boostify.com",
      icon: <Mail className="h-6 w-6" />,
    },
    {
      title: "Chat en vivo",
      description: "Habla con nuestro equipo en tiempo real",
      contact: "Disponible de Lun-Vie: 9:00-17:00 CET",
      icon: <MessageSquare className="h-6 w-6" />,
    },
    {
      title: "Teléfono",
      description: "Línea de atención exclusiva para afiliados",
      contact: "+1 (555) 123-4567",
      icon: <Phone className="h-6 w-6" />,
    },
    {
      title: "Centro de ayuda",
      description: "Explora nuestra base de conocimientos",
      contact: "help.boostify.com/affiliates",
      icon: <HelpCircle className="h-6 w-6" />,
    },
  ];

  // Información sobre el acuerdo de afiliados
  const agreementInfo = [
    {
      title: "Términos y condiciones",
      description: "Lee nuestros términos completos del programa de afiliados",
      link: "/terms/affiliates",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Política de cookies",
      description: "Información sobre el uso de cookies para el seguimiento",
      link: "/privacy/cookies",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Guía de buenas prácticas",
      description: "Aprende las mejores prácticas para promocionar nuestros productos",
      link: "/resources/best-practices",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Centro de Soporte para Afiliados</CardTitle>
        <CardDescription>
          Obtén ayuda, encuentra respuestas y resuelve dudas sobre el programa de afiliados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Contacto</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Preguntas Frecuentes</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4" />
              <span className="hidden sm:inline">Recursos</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="contact" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {submitSuccess ? (
                  <Alert className="bg-primary/20 border-primary">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertTitle>Mensaje enviado</AlertTitle>
                    <AlertDescription>
                      Tu mensaje ha sido enviado correctamente. Te responderemos lo antes posible.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asunto</FormLabel>
                            <FormControl>
                              <Input placeholder="Escribe el asunto de tu consulta" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="payments">Pagos y comisiones</SelectItem>
                                <SelectItem value="technical">Problemas técnicos</SelectItem>
                                <SelectItem value="account">Cuenta de afiliado</SelectItem>
                                <SelectItem value="products">Información de productos</SelectItem>
                                <SelectItem value="other">Otros</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mensaje</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe tu consulta en detalle" 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {submitError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          "Enviar mensaje"
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información de contacto</h3>
                {contactResources.map((resource, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      {resource.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{resource.title}</h4>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                      <p className="text-sm font-medium mt-1">{resource.contact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="faq" className="space-y-4 mt-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            <div className="p-4 border rounded-lg mt-6 bg-muted/30">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                ¿No encuentras la respuesta que buscas?
              </h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Si no has encontrado la respuesta a tu pregunta, no dudes en contactar con nuestro equipo de soporte.
              </p>
              <Button onClick={() => setActiveTab("contact")} variant="outline" className="w-full">
                Contactar con soporte
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="resources" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Acuerdos y políticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agreementInfo.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <a href={item.link} className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1">
                          Ver documento
                          <ChevronRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Recursos de marketing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Guía de inicio rápido</h4>
                      <p className="text-sm text-muted-foreground">Aprende los fundamentos del marketing de afiliados</p>
                      <a href="/resources/quickstart" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1">
                        Descargar guía
                        <ChevronRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Materiales promocionales</h4>
                      <p className="text-sm text-muted-foreground">Banners, imágenes y textos para tus campañas</p>
                      <a href="/resources/marketing-materials" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1">
                        Ver materiales
                        <ChevronRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">Seminarios web y tutoriales</h4>
                      <p className="text-sm text-muted-foreground">Aprende técnicas avanzadas de promoción</p>
                      <a href="/resources/webinars" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1">
                        Ver tutoriales
                        <ChevronRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Centro de recursos para afiliados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex flex-col items-start">
                    <span>Recursos para principiantes</span>
                    <span className="text-xs text-muted-foreground">Guías paso a paso</span>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                  <LifeBuoy className="h-5 w-5 text-primary" />
                  <div className="flex flex-col items-start">
                    <span>Academia de afiliados</span>
                    <span className="text-xs text-muted-foreground">Cursos y certificaciones</span>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start gap-2 h-auto py-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div className="flex flex-col items-start">
                    <span>Comunidad de afiliados</span>
                    <span className="text-xs text-muted-foreground">Foro y discusiones</span>
                  </div>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}