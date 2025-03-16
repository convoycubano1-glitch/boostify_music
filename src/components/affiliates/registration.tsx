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
  // Campos adicionales
  promotionChannels: z.array(z.string()).min(1, { message: "Please select at least one promotion channel" }),
  experience: z.enum(["beginner", "intermediate", "advanced"], {
    required_error: "Please select your experience level"
  }),
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
      promotionChannels: [],
      experience: "beginner",
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

  const promotionChannels = [
    { id: "social_media", label: "Redes Sociales" },
    { id: "blog", label: "Blog o Sitio Web" },
    { id: "email", label: "Email Marketing" },
    { id: "youtube", label: "Canal de YouTube" },
    { id: "podcast", label: "Podcast" },
    { id: "direct", label: "Marketing Directo" },
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

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your experience level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner (0-1 year)</SelectItem>
                          <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                          <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Your level of experience in affiliate marketing
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
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="socialMedia.instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Instagram username" {...field} />
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
                        <FormLabel>Twitter (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Twitter username" {...field} />
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
                        <FormLabel>YouTube (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your YouTube channel URL" {...field} />
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
                        <FormLabel>TikTok (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your TikTok username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Marketing Information</h3>
                
                <FormField
                  control={form.control}
                  name="categories"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>Product Categories of Interest</FormLabel>
                        <FormDescription>
                          Select the product categories you're interested in promoting
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
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
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {category.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="promotionChannels"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel>Promotion Channels</FormLabel>
                        <FormDescription>
                          Select the channels you plan to use for promotion
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {promotionChannels.map((channel) => (
                          <FormField
                            key={channel.id}
                            control={form.control}
                            name="promotionChannels"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={channel.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(channel.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, channel.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== channel.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {channel.label}
                                  </FormLabel>
                                </FormItem>
                              );
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
                <h3 className="text-lg font-medium">Payment Information</h3>
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Preferred Payment Method</FormLabel>
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
                              Bank Transfer
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="crypto" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Cryptocurrency
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
                      <FormLabel>Payment Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email for payment purposes" {...field} />
                      </FormControl>
                      <FormDescription>
                        We'll use this email address for payment notifications and transactions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Terms and Agreements</h3>
                
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
                          I have read and agree to the{" "}
                          <a href="#" className="text-primary underline">
                            Terms and Conditions
                          </a>
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
                          I agree to the{" "}
                          <a href="#" className="text-primary underline">
                            Data Processing Agreement
                          </a>
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}