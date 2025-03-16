import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AffiliateOverview } from "../components/affiliates/overview";
import { AffiliateLinks } from "../components/affiliates/links";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InfoIcon, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { Badge } from "../components/ui/badge";
import { ProgressCircular } from "../components/ui/progress-circular";

// Esquema para el formulario de registro como afiliado
const affiliateRegistrationSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Debe ser un correo electrónico válido" }),
  website: z.string().url({ message: "Debe ser una URL válida" }).optional().or(z.literal("")),
  socialMediaUrls: z.string().optional(),
  paymentMethod: z.string().min(1, { message: "Selecciona un método de pago" }),
  paymentDetails: z.string().min(1, { message: "Los detalles de pago son requeridos" }),
  comments: z.string().optional(),
});

export default function AffiliatePage() {
  const [currentTab, setCurrentTab] = useState("overview");
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();
  
  // Obtener información del afiliado
  const { 
    data: affiliateInfo,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["affiliate", "me"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/affiliate/me");
        return response.data;
      } catch (error: any) {
        // Si el error es 404, significa que el usuario no está registrado como afiliado
        if (error.response && error.response.status === 404) {
          return { isAffiliate: false };
        }
        console.error("Error fetching affiliate info:", error);
        throw error;
      }
    },
  });
  
  // Formulario para el registro de afiliado
  const form = useForm<z.infer<typeof affiliateRegistrationSchema>>({
    resolver: zodResolver(affiliateRegistrationSchema),
    defaultValues: {
      name: "",
      email: "",
      website: "",
      socialMediaUrls: "",
      paymentMethod: "",
      paymentDetails: "",
      comments: "",
    },
  });
  
  // Mutación para el registro de afiliado
  const registerAffiliateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof affiliateRegistrationSchema>) => {
      const response = await axios.post("/api/affiliate/register", data);
      return response.data;
    },
    onSuccess: () => {
      // Cerrar el diálogo
      setIsRegistering(false);
      // Refrescar la información del afiliado
      refetch();
      // Mostrar notificación de éxito
      toast({
        title: "Registro completado",
        description: "Tu solicitud de afiliado ha sido procesada correctamente.",
      });
    },
    onError: (error: any) => {
      console.error("Error registering affiliate:", error);
      toast({
        title: "Error en el registro",
        description: error.response?.data?.message || "Hubo un problema al procesar tu solicitud",
        variant: "destructive",
      });
    },
  });
  
  // Manejar envío del formulario
  const onSubmit = (values: z.infer<typeof affiliateRegistrationSchema>) => {
    registerAffiliateMutation.mutate(values);
  };
  
  // Si está cargando, mostrar indicador de carga
  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="flex justify-center">
          <ProgressCircular size="lg" />
        </div>
      </div>
    );
  }
  
  // Si hay un error, mostrar mensaje de error
  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive" className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No pudimos cargar la información de afiliado. Por favor, intenta de nuevo más tarde.
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }
  
  // Si el usuario no es afiliado, mostrar página de registro
  if (!affiliateInfo.isAffiliate) {
    return (
      <div className="container mx-auto py-6 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Programa de Afiliados</h1>
          <p className="text-muted-foreground">
            Gana dinero promocionando nuestros productos y servicios a tu audiencia
          </p>
        </div>
        
        <AffiliateFeatures />
        
        <div className="mt-8 text-center">
          <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
            <DialogTrigger asChild>
              <Button size="lg">Unirse al programa de afiliados</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Aplicar como afiliado</DialogTitle>
                <DialogDescription>
                  Complete el formulario para unirse a nuestro programa de afiliados y comenzar a ganar comisiones.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu nombre" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo electrónico</FormLabel>
                          <FormControl>
                            <Input placeholder="tu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Sitio web */}
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio web (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://tusitio.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          El sitio web donde promocionarás nuestros productos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Redes sociales */}
                  <FormField
                    control={form.control}
                    name="socialMediaUrls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redes sociales (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Instagram: @usuario
Twitter: @usuario
YouTube: https://youtube.com/c/canal"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enumera tus perfiles de redes sociales donde promocionarás
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Método de pago */}
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de pago</FormLabel>
                          <FormControl>
                            <Input placeholder="PayPal, transferencia bancaria, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Detalles de pago */}
                    <FormField
                      control={form.control}
                      name="paymentDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detalles de pago</FormLabel>
                          <FormControl>
                            <Input placeholder="Correo PayPal o datos bancarios" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Comentarios adicionales */}
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comentarios adicionales (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Cuéntanos más sobre tu experiencia como afiliado o cómo planeas promocionar nuestros productos" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsRegistering(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={registerAffiliateMutation.isPending}
                    >
                      {registerAffiliateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar solicitud"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Preguntas frecuentes</h2>
          <AffiliateFAQs />
        </div>
      </div>
    );
  }
  
  // Si el usuario es afiliado pero está pendiente de aprobación
  if (affiliateInfo.status === "pending") {
    return (
      <div className="container mx-auto py-6 max-w-3xl">
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Solicitud en revisión</AlertTitle>
          <AlertDescription>
            Tu solicitud para unirte al programa de afiliados está siendo revisada. Te notificaremos por correo electrónico cuando sea aprobada.
          </AlertDescription>
        </Alert>
        
        <div className="bg-muted/50 rounded-lg p-6 border">
          <h2 className="text-xl font-bold mb-4">Detalles de tu solicitud</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{affiliateInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correo electrónico</p>
                <p className="font-medium">{affiliateInfo.email}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sitio web</p>
              <p className="font-medium">{affiliateInfo.website || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge variant="outline" className="mt-1 bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                Pendiente de aprobación
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Panel principal para afiliados aprobados
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Panel de Afiliados</h1>
          <p className="text-muted-foreground">
            Gestiona tus enlaces y visualiza tus estadísticas como afiliado
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
            {affiliateInfo.level || "Nivel Básico"}
          </Badge>
          <Badge variant="outline">
            ID: {affiliateInfo.id.substring(0, 8)}
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="links">Enlaces</TabsTrigger>
          <TabsTrigger value="payouts">Pagos</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <AffiliateOverview />
        </TabsContent>
        
        <TabsContent value="links">
          <AffiliateLinks />
        </TabsContent>
        
        <TabsContent value="payouts">
          <div className="text-center py-12 text-muted-foreground">
            <p>El historial de pagos estará disponible próximamente.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="text-center py-12 text-muted-foreground">
            <p>La configuración de cuenta estará disponible próximamente.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para mostrar las características del programa de afiliados
function AffiliateFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-muted/30 p-6 rounded-lg border">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 8l-8 8" />
            <path d="M8 8l8 8" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Comisiones atractivas</h3>
        <p className="text-muted-foreground">
          Gana hasta un 30% de comisión por cada venta realizada a través de tus enlaces de afiliado.
        </p>
      </div>
      
      <div className="bg-muted/30 p-6 rounded-lg border">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Pagos mensuales</h3>
        <p className="text-muted-foreground">
          Recibe tus ganancias mediante PayPal, transferencia bancaria u otros métodos de pago populares.
        </p>
      </div>
      
      <div className="bg-muted/30 p-6 rounded-lg border">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Herramientas avanzadas</h3>
        <p className="text-muted-foreground">
          Accede a un panel con estadísticas detalladas, enlaces personalizados y materiales promocionales.
        </p>
      </div>
    </div>
  );
}

// Componente para mostrar preguntas frecuentes
function AffiliateFAQs() {
  return (
    <div className="space-y-4">
      <div className="bg-muted/30 p-4 rounded-lg">
        <h3 className="font-medium mb-2">¿Cuáles son los requisitos para ser afiliado?</h3>
        <p className="text-sm text-muted-foreground">
          Puedes ser afiliado si tienes un sitio web, blog o presencia en redes sociales relacionados con música, producción, educación o áreas afines. Valoramos la calidad sobre la cantidad.
        </p>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-lg">
        <h3 className="font-medium mb-2">¿Cuánto puedo ganar como afiliado?</h3>
        <p className="text-sm text-muted-foreground">
          Las comisiones van del 15% al 30% dependiendo del producto y tu nivel como afiliado. Por ejemplo, un curso de $100 puede generarte entre $15 y $30 por cada venta.
        </p>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-lg">
        <h3 className="font-medium mb-2">¿Cuándo y cómo recibo mis pagos?</h3>
        <p className="text-sm text-muted-foreground">
          Procesamos pagos mensualmente, siempre que hayas alcanzado un mínimo de $50 en comisiones. Puedes elegir entre PayPal, transferencia bancaria u otros métodos disponibles.
        </p>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-lg">
        <h3 className="font-medium mb-2">¿Qué productos puedo promocionar?</h3>
        <p className="text-sm text-muted-foreground">
          Puedes promocionar todos nuestros productos: cursos, servicios de producción, membresías, plugins, y más. Tendrás acceso a materiales promocionales para cada uno de ellos.
        </p>
      </div>
    </div>
  );
}