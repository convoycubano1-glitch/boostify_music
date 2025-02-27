import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Send,
  Loader2,
  RefreshCcw,
  XCircle,
  User2,
  Calendar,
  Info,
  ExternalLink,
} from "lucide-react";

// Esquema de validación del formulario de soporte
const supportFormSchema = z.object({
  subject: z.string().min(5, {
    message: "El asunto debe tener al menos 5 caracteres.",
  }),
  category: z.enum(["technical", "payments", "account", "links", "other"], {
    required_error: "Por favor selecciona una categoría.",
  }),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Por favor selecciona una prioridad.",
  }),
  message: z.string().min(20, {
    message: "El mensaje debe tener al menos 20 caracteres.",
  }),
  attachments: z.any().optional(),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

export function AffiliateSupport() {
  const { user } = useAuth() || {};
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("new");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario para enviar tickets de soporte
  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      subject: "",
      category: "technical",
      priority: "medium",
      message: "",
    },
  });

  // Mutación para enviar un ticket de soporte
  const submitTicketMutation = useMutation({
    mutationFn: async (data: SupportFormValues) => {
      if (!user?.uid) throw new Error("Usuario no autenticado");
      
      const ticketData = {
        userId: user.uid,
        userEmail: user.email,
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        message: data.message,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        assignedTo: null,
        responses: [],
      };
      
      const docRef = await addDoc(collection(db, "support_tickets"), ticketData);
      return { id: docRef.id, ...ticketData };
    },
    onSuccess: () => {
      toast({
        title: "Ticket enviado",
        description: "Tu ticket de soporte ha sido enviado exitosamente.",
      });
      form.reset();
      setActiveTab("history");
      fetchTickets();
    },
    onError: (error) => {
      console.error("Error al enviar ticket:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el ticket. Inténtalo de nuevo.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Función para enviar un ticket de soporte
  const onSubmit = (values: SupportFormValues) => {
    setIsSubmitting(true);
    submitTicketMutation.mutate(values);
  };

  // Histórico de tickets (simulado)
  const [tickets, setTickets] = useState([
    {
      id: "ticket1",
      subject: "Problema con enlaces de afiliado",
      category: "links",
      priority: "high",
      status: "open",
      message: "Mis enlaces de afiliado no están registrando correctamente las conversiones...",
      createdAt: new Date(2025, 1, 20),
      responses: [
        {
          id: "resp1",
          userId: "support1",
          userName: "Soporte Boostify",
          message: "Hemos verificado tu cuenta y encontramos que las cookies de seguimiento estaban desactivadas en tu sitio web. Por favor, asegúrate de que las cookies de terceros están permitidas.",
          createdAt: new Date(2025, 1, 21),
          isAgent: true,
        }
      ],
    },
    {
      id: "ticket2",
      subject: "Consulta sobre próximo pago",
      category: "payments",
      priority: "medium",
      status: "closed",
      message: "No he recibido mi pago del mes pasado. ¿Cuándo está programado?",
      createdAt: new Date(2025, 1, 10),
      responses: [
        {
          id: "resp2",
          userId: "support2",
          userName: "Departamento de pagos",
          message: "Hemos verificado tu cuenta y encontramos que el pago fue procesado el día 15, pero tu banco puede tardar hasta 3 días hábiles en reflejarlo. Por favor, verifica con tu entidad bancaria.",
          createdAt: new Date(2025, 1, 11),
          isAgent: true,
        },
        {
          id: "resp3",
          userId: "user1",
          userName: "Tú",
          message: "Gracias por la información. He contactado con mi banco y me han confirmado que el pago ya está en proceso.",
          createdAt: new Date(2025, 1, 12),
          isAgent: false,
        },
        {
          id: "resp4",
          userId: "support2",
          userName: "Departamento de pagos",
          message: "Perfecto, nos alegra que se haya resuelto. No dudes en contactarnos si necesitas algo más.",
          createdAt: new Date(2025, 1, 12),
          isAgent: true,
        }
      ],
    },
  ]);

  // Fetch de tickets (simulado)
  const fetchTickets = async () => {
    // En una implementación real, esto traería datos de Firestore
    // Simulación para la demo
    setTickets([...tickets]);
  };

  // Datos de contacto directo
  const contactInfo = {
    email: "afiliados@boostify.com",
    phone: "+34 900 123 456",
    hours: "Lunes a Viernes, 9:00 - 18:00 (CET)",
    responseTime: "24-48 horas (días laborables)",
  };

  // Preguntas rápidas y respuestas
  const quickAnswers = [
    {
      question: "¿No recibes tus comisiones?",
      answer: "Verifica que has alcanzado el umbral mínimo de 100€ para realizar el pago. Los pagos se procesan el día 15 de cada mes para todas las comisiones acumuladas que superen este umbral.",
    },
    {
      question: "¿Problemas con los enlaces?",
      answer: "Asegúrate de que estás utilizando los enlaces generados desde tu panel de afiliado. Si los enlaces no registran clics, verifica que no tengas bloqueadores de cookies activos en tu navegador o sitio web.",
    },
    {
      question: "¿Necesitas cambiar tu método de pago?",
      answer: "Puedes actualizar tu método de pago en la sección de Ajustes de tu perfil de afiliado. Los cambios realizados antes del día 10 de cada mes se aplicarán al próximo ciclo de pagos.",
    },
  ];

  // Formatear fecha
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Obtener estilo según prioridad
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "outline";
      default:
        return "default";
    }
  };

  // Obtener icono según categoría
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "technical":
        return <AlertCircle className="h-4 w-4" />;
      case "payments":
        return <XCircle className="h-4 w-4" />;
      case "account":
        return <User2 className="h-4 w-4" />;
      case "links":
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <FileQuestion className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new">Nuevo ticket</TabsTrigger>
          <TabsTrigger value="history">Historial de tickets</TabsTrigger>
          <TabsTrigger value="contact">Contacto directo</TabsTrigger>
        </TabsList>
        
        {/* Pestaña: Nuevo ticket */}
        <TabsContent value="new" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Nuevo ticket de soporte</CardTitle>
                <CardDescription>
                  Completa el formulario para enviar una consulta a nuestro equipo de soporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asunto</FormLabel>
                          <FormControl>
                            <Input placeholder="Describe brevemente tu consulta" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <SelectItem value="technical">Soporte técnico</SelectItem>
                                <SelectItem value="payments">Pagos y comisiones</SelectItem>
                                <SelectItem value="account">Cuenta de afiliado</SelectItem>
                                <SelectItem value="links">Enlaces y seguimiento</SelectItem>
                                <SelectItem value="other">Otra consulta</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridad</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona la prioridad" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Baja - Consulta general</SelectItem>
                                <SelectItem value="medium">Media - Requiere atención</SelectItem>
                                <SelectItem value="high">Alta - Problema urgente</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensaje</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe tu consulta con detalle para que podamos ayudarte mejor"
                              className="min-h-32"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Por favor incluye toda la información relevante, como enlaces, fechas o capturas de pantalla.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="attachments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adjuntos (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="file" 
                              multiple
                              className="cursor-pointer"
                              onChange={(e) => field.onChange(e.target.files)}
                            />
                          </FormControl>
                          <FormDescription>
                            Puedes adjuntar hasta 3 archivos (máx. 5MB cada uno).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" /> 
                          Enviar ticket
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Respuestas rápidas</CardTitle>
                  <CardDescription>
                    Soluciones a problemas comunes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quickAnswers.map((qa, index) => (
                    <div key={index} className="space-y-2">
                      <h3 className="text-sm font-medium">{qa.question}</h3>
                      <p className="text-xs text-muted-foreground">{qa.answer}</p>
                      {index < quickAnswers.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tiempo de respuesta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-sm px-2 py-1">
                      <Clock className="h-3 w-3 mr-1" />
                      24-48h
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Tiempo de respuesta típico
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Los tickets de prioridad alta se responden generalmente en menos de 24 horas.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Pestaña: Historial de tickets */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de tickets</CardTitle>
                  <CardDescription>
                    Consulta y gestiona tus tickets anteriores
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchTickets}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-10 border rounded-lg bg-muted/20">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No hay tickets</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    No has enviado ningún ticket de soporte aún
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("new")}
                  >
                    Crear nuevo ticket
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="border shadow-none overflow-hidden">
                      <CardHeader className="p-4 pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base font-medium">
                              {ticket.subject}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              ID: {ticket.id} • {formatDate(ticket.createdAt)}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                              {ticket.priority === "high" ? "Alta" :
                              ticket.priority === "medium" ? "Media" : "Baja"}
                            </Badge>
                            <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                              {ticket.status === "open" ? "Abierto" : "Cerrado"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pt-0 pb-3">
                        <div className="space-y-4">
                          <div className="border rounded-md p-3 bg-muted/20">
                            <div className="flex gap-2 text-sm">
                              <User2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="flex items-center">
                                  <p className="font-medium">Tú</p>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {formatDate(ticket.createdAt)}
                                  </span>
                                </div>
                                <p className="text-muted-foreground text-sm mt-1">
                                  {ticket.message}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {ticket.responses.map((response) => (
                            <div 
                              key={response.id} 
                              className={`border rounded-md p-3 ${
                                response.isAgent ? "bg-primary/5" : "bg-muted/20"
                              }`}
                            >
                              <div className="flex gap-2 text-sm">
                                {response.isAgent ? (
                                  <LifeBuoy className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                ) : (
                                  <User2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <div className="flex items-center">
                                    <p className={`font-medium ${response.isAgent ? "text-primary" : ""}`}>
                                      {response.userName}
                                    </p>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {formatDate(response.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground text-sm mt-1">
                                    {response.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="border-t p-4 flex justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="gap-1 text-xs font-normal">
                            {getCategoryIcon(ticket.category)}
                            {ticket.category === "technical" ? "Soporte técnico" :
                             ticket.category === "payments" ? "Pagos y comisiones" :
                             ticket.category === "account" ? "Cuenta de afiliado" :
                             ticket.category === "links" ? "Enlaces y seguimiento" : "Otra consulta"}
                          </Badge>
                        </div>
                        {ticket.status === "open" && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setActiveTab("new")}
                            >
                              Responder
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                            >
                              Cerrar ticket
                            </Button>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pestaña: Contacto directo */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contacto directo</CardTitle>
                <CardDescription>
                  Contáctanos directamente a través de estos canales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Email</h3>
                    <p className="text-sm text-muted-foreground">{contactInfo.email}</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-primary"
                      asChild
                    >
                      <a href={`mailto:${contactInfo.email}`}>Enviar email</a>
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Teléfono</h3>
                    <p className="text-sm text-muted-foreground">{contactInfo.phone}</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-primary"
                      asChild
                    >
                      <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}>Llamar ahora</a>
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Horario de atención</h3>
                    <p className="text-sm text-muted-foreground">{contactInfo.hours}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tiempo de respuesta: {contactInfo.responseTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Reunión con tu gestor de afiliados</CardTitle>
                <CardDescription>
                  Solicita una llamada personal con nuestro equipo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border p-4 bg-muted/20">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Los afiliados que generan más de 500€ en comisiones mensuales 
                      tienen acceso a un gestor personal que les ayuda a optimizar 
                      sus estrategias y maximizar sus ganancias.
                    </p>
                  </div>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Solicitar reunión
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Completa el formulario para solicitar una llamada con nuestro 
                    equipo de gestión de afiliados.
                  </p>
                  <Button className="w-full">
                    Programar reunión
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  También puedes escribirnos directamente a <span className="font-medium">partners@boostify.com</span> 
                  para cualquier consulta sobre asociaciones estratégicas.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}