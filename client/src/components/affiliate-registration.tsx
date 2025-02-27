import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Gift, Users, DollarSign, Shield } from "lucide-react";

// Esquema de validación para el formulario
const affiliateFormSchema = z.object({
  fullName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  email: z.string().email({ message: "Por favor introduce un email válido" }),
  phone: z.string().optional(),
  website: z.string().url({ message: "Por favor introduce una URL válida" }).optional().or(z.literal("")),
  socialMedia: z.string().optional(),
  paymentMethod: z.enum(["paypal", "bank_transfer", "stripe"], { 
    required_error: "Por favor selecciona un método de pago" 
  }),
  paymentDetails: z.string().min(5, { message: "Por favor introduce los detalles de pago" }),
  taxId: z.string().optional(),
  promotionPlan: z.string().min(20, { 
    message: "Por favor describe cómo planeas promocionar nuestros productos (mínimo 20 caracteres)" 
  }),
  termsAndConditions: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los términos y condiciones" }),
  }),
  privacyPolicy: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la política de privacidad" }),
  }),
});

type AffiliateFormValues = z.infer<typeof affiliateFormSchema>;

export function AffiliateRegistration() {
  const { user } = useAuth() || {};
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valores por defecto del formulario
  const defaultValues: Partial<AffiliateFormValues> = {
    email: user?.email || "",
    fullName: "",
    website: "",
    socialMedia: "",
    paymentMethod: "paypal",
    paymentDetails: "",
    taxId: "",
    promotionPlan: "",
    termsAndConditions: false,
    privacyPolicy: false,
  };

  const form = useForm<AffiliateFormValues>({
    resolver: zodResolver(affiliateFormSchema),
    defaultValues,
  });

  // Mutación para enviar los datos al servidor
  const registerAffiliateMutation = useMutation({
    mutationFn: async (data: AffiliateFormValues) => {
      if (!user?.uid) throw new Error("Usuario no autenticado");

      // 1. Guardar en Firestore
      const affiliateRef = doc(db, "affiliates", user.uid);
      await setDoc(affiliateRef, {
        ...data,
        userId: user.uid,
        status: "pending", // pending, approved, rejected
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          totalClicks: 0,
          conversions: 0,
          earnings: 0,
          pendingPayment: 0,
        },
        level: "Básico",
        referralCode: `${user.uid.substring(0, 6)}${Math.floor(Math.random() * 1000)}`,
      });

      // 2. Enviar email de notificación (opcional) mediante SendGrid
      return await apiRequest({
        url: "/api/affiliates/register",
        method: "POST",
        data: {
          fullName: data.fullName,
          email: data.email,
          userId: user.uid,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de afiliado ha sido recibida. Te notificaremos cuando sea revisada.",
      });
      
      // Refrescar la página después de un registro exitoso
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error) => {
      console.error("Error al registrar afiliado:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al enviar tu solicitud. Por favor intenta nuevamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Función para manejar el envío del formulario
  const onSubmit = async (data: AffiliateFormValues) => {
    setIsSubmitting(true);
    registerAffiliateMutation.mutate(data);
  };

  // Ventajas de ser afiliado
  const benefits = [
    {
      icon: <DollarSign className="h-5 w-5" />,
      title: "Altas comisiones",
      description: "Gana hasta un 30% por cada venta generada a través de tus enlaces",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Analytics detallados",
      description: "Accede a estadísticas en tiempo real para optimizar tus campañas",
    },
    {
      icon: <Gift className="h-5 w-5" />,
      title: "Recursos exclusivos",
      description: "Obtén material promocional personalizado y contenido exclusivo",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Soporte dedicado",
      description: "Cuenta con asistencia especializada para maximizar tus ganancias",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Únete a nuestro programa de afiliados</h2>
          <p className="text-muted-foreground mt-2">
            Gana comisiones atractivas promocionando nuestros productos y ayudando a músicos a hacer crecer sus carreras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit, index) => (
            <Card key={index} className="bg-muted/20">
              <CardContent className="p-4 flex items-start space-x-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-medium">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-primary" /> Proceso de aprobación
            </CardTitle>
            <CardDescription>
              ¿Cómo funciona nuestro proceso de revisión?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">1. Completar solicitud</h4>
              <p className="text-sm text-muted-foreground">
                Llena el formulario con tus datos y plan de promoción
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium">2. Revisión</h4>
              <p className="text-sm text-muted-foreground">
                Nuestro equipo evaluará tu solicitud en 24-48 horas
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium">3. Aprobación</h4>
              <p className="text-sm text-muted-foreground">
                Al ser aprobado, tendrás acceso inmediato a tu dashboard de afiliado
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium">4. ¡Comienza a ganar!</h4>
              <p className="text-sm text-muted-foreground">
                Genera enlaces, promociona productos y recibe comisiones
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de inscripción</CardTitle>
          <CardDescription>
            Completa el siguiente formulario para solicitar tu cuenta de afiliado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduce tu nombre completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+34 000 000 000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio web (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://tusitio.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialMedia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redes sociales (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="@tuusuario" {...field} />
                        </FormControl>
                        <FormDescription>
                          Tus perfiles de Instagram, YouTube, TikTok, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de pago preferido</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un método de pago" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="bank_transfer">Transferencia bancaria</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detalles de pago</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Correo de PayPal o datos bancarios" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Esta información se utilizará para enviarte los pagos de comisiones.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID fiscal (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="NIF/CIF/VAT" {...field} />
                      </FormControl>
                      <FormDescription>
                        Para emisión de facturas, si es necesario.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="promotionPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Cómo planeas promocionar nuestros productos?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe tus canales de promoción, audiencia, estrategias..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Cuéntanos sobre tu audiencia y cómo planeas promover nuestros productos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="termsAndConditions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Acepto los <a href="/terms" className="text-primary underline">términos y condiciones</a> del programa de afiliados
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="privacyPolicy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Acepto la <a href="/privacy" className="text-primary underline">política de privacidad</a>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando solicitud..." : "Enviar solicitud"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t px-6 py-4">
          <p className="text-xs text-muted-foreground text-center">
            Al enviar este formulario, tu solicitud será revisada por nuestro equipo. 
            Te contactaremos en un plazo de 24-48 horas con el resultado.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}