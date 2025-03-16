import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Validation schema for the form
const affiliateFormSchema = z.object({
  name: z.string().min(2, { message: "Name must have at least 2 characters" }),
  bio: z.string().min(10, { message: "Bio must have at least 10 characters" }).max(500, { message: "Bio cannot exceed 500 characters" }),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  socialMedia: z.object({
    instagram: z.string().optional().or(z.literal("")),
    twitter: z.string().optional().or(z.literal("")),
    youtube: z.string().optional().or(z.literal("")),
    tiktok: z.string().optional().or(z.literal(""))
  }),
  categories: z.array(z.string()).min(1, { message: "Please select at least one category" }),
  paymentMethod: z.enum(["paypal", "bank_transfer", "crypto"], { 
    required_error: "Please select a payment method" 
  }),
  paymentEmail: z.string().email({ message: "Please enter a valid email address" }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
  dataProcessingAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the data processing agreement"
  }),
});

type AffiliateFormValues = z.infer<typeof affiliateFormSchema>;

export function AffiliateRegistration() {
  const { user } = useAuth() || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Inicializar useForm con el esquema de validación
  const form = useForm<AffiliateFormValues>({
    resolver: zodResolver(affiliateFormSchema),
    defaultValues: {
      name: user?.displayName || "",
      bio: "",
      website: "",
      socialMedia: {
        instagram: "",
        twitter: "",
        youtube: "",
        tiktok: ""
      },
      categories: [],
      paymentMethod: "paypal",
      paymentEmail: user?.email || "",
      termsAccepted: false,
      dataProcessingAccepted: false,
    },
  });

  const onSubmit = async (data: AffiliateFormValues) => {
    if (!user?.uid) {
      setError("Debes iniciar sesión para registrarte como afiliado");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // Crear el documento de afiliado en Firestore
      await setDoc(doc(db, "affiliates", user.uid), {
        ...data,
        userId: user.uid,
        email: user.email,
        status: "pending", // pending, approved, rejected
        createdAt: serverTimestamp(),
        stats: {
          totalClicks: 0,
          conversions: 0,
          earnings: 0,
          pendingPayment: 0,
        },
        level: "Básico", // Básico, Plata, Oro, Platino
      });

      setSuccess(true);
      alert("Tu solicitud ha sido enviada correctamente");
      
      // Recargar la página después de un breve retraso para mostrar el panel de afiliado
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("Error al registrar afiliado:", err);
      setError("Ha ocurrido un error al procesar tu solicitud. Por favor, intenta nuevamente.");
      alert("Error al enviar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: "music_production", label: "Producción Musical" },
    { id: "music_distribution", label: "Distribución Musical" },
    { id: "artist_development", label: "Desarrollo Artístico" },
    { id: "music_marketing", label: "Marketing Musical" },
    { id: "plugins_software", label: "Plugins y Software" },
    { id: "merchandise", label: "Mercancía" },
    { id: "courses", label: "Cursos y Educación" },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Affiliate Application</CardTitle>
        <CardDescription>
          Complete this form to join the Boostify affiliate program.
          We'll review your application and notify you when it's approved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <Alert className="bg-primary/20 border-primary">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertTitle>Application Submitted!</AlertTitle>
            <AlertDescription>
              Your application has been received and will be reviewed by our team.
              We'll notify you by email when it's approved.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your first and last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biography</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about yourself, your experience, and why you want to be a Boostify affiliate" 
                          className="min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        This information will help us understand your profile as an affiliate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Online Presence</h3>
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website or blog (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourwebsite.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="socialMedia.instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="@username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="socialMedia.twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="@username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="socialMedia.youtube"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canal de YouTube (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="URL del canal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="socialMedia.tiktok"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TikTok (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="@username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Categorías de interés</h3>
                <FormField
                  control={form.control}
                  name="categories"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Selecciona las categorías que te interesa promocionar</FormLabel>
                        <FormDescription>
                          Esto nos ayudará a recomendarte los productos más relevantes
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <FormField
                            key={category.id}
                            control={form.control}
                            name="categories"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={category.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(category.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, category.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== category.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {category.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Información de pago</h3>
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Método de pago preferido</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="paypal" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              PayPal
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="bank_transfer" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Transferencia bancaria
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="crypto" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Criptomonedas
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico para pagos</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormDescription>
                        Usaremos este correo para procesar tus pagos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Términos y condiciones</h3>
                
                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">
                          Acepto los <a href="/terms" className="text-primary hover:underline" target="_blank">términos y condiciones</a> del programa de afiliados de Boostify
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dataProcessingAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">
                          Acepto que mis datos sean procesados de acuerdo con la <a href="/privacy" className="text-primary hover:underline" target="_blank">política de privacidad</a> de Boostify
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando solicitud...
                  </>
                ) : (
                  "Enviar solicitud"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}