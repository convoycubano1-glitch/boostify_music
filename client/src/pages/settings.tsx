import { Card } from "../components/ui/card";
import { logger } from "../lib/logger";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Bell,
  User,
  Shield,
  Palette,
  Globe,
  Music,
  Upload,
  Loader2,
  Sparkles,
  Wand2,
  FileText,
} from "lucide-react";
import { EPKGenerator } from "../components/artist-profile/epk-generator";
import { useIsMobile } from "../hooks/use-mobile";
import { useSettingsStore, themeOptions, densityOptions, languageOptions } from "../store/settings-store";
import { useEffect, useState } from "react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { z } from "zod";
import { db } from "../firebase";
import { collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estado global de configuraciones
  const settings = useSettingsStore();
  
  // Estados para el perfil de artista
  const [artistProfileData, setArtistProfileData] = useState<any>(null);
  const [isLoadingArtistProfile, setIsLoadingArtistProfile] = useState(true);
  const [isSavingArtistProfile, setIsSavingArtistProfile] = useState(false);
  
  // Estados para generación con Gemini
  const [isGeneratingBiography, setIsGeneratingBiography] = useState(false);
  const [isGeneratingProfileImage, setIsGeneratingProfileImage] = useState(false);
  const [isGeneratingBannerImage, setIsGeneratingBannerImage] = useState(false);
  
  // Schemas de validación
  const profileSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
    email: z.string().email("Email inválido").optional(),
    language: z.enum(languageOptions)
  });

  const artistProfileSchema = z.object({
    displayName: z.string().min(2, "El nombre artístico debe tener al menos 2 caracteres"),
    biography: z.string().min(10, "La biografía debe tener al menos 10 caracteres").optional(),
    genre: z.string().optional(),
    location: z.string().optional(),
    profileImage: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    bannerImage: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    contactEmail: z.string().email("Email inválido").optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    spotify: z.string().optional(),
  });
  
  const notificationsSchema = z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    newsletter: z.boolean()
  });
  
  const appearanceSchema = z.object({
    theme: z.enum(themeOptions),
    density: z.enum(densityOptions)
  });
  
  const securitySchema = z.object({
    currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "La contraseña debe tener al menos una letra mayúscula, una minúscula y un número"),
    confirmPassword: z.string()
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
  });
  
  // Formularios iniciales
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: settings.profile.name || "",
      email: settings.profile.email || "",
      language: settings.profile.language
    }
  });
  
  const notificationsForm = useForm({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: settings.notifications.emailNotifications,
      pushNotifications: settings.notifications.pushNotifications,
      newsletter: settings.notifications.newsletter
    }
  });
  
  const appearanceForm = useForm({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: settings.appearance.theme,
      density: settings.appearance.density
    }
  });
  
  const securityForm = useForm({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const artistProfileForm = useForm({
    resolver: zodResolver(artistProfileSchema),
    defaultValues: {
      displayName: "",
      biography: "",
      genre: "",
      location: "",
      profileImage: "",
      bannerImage: "",
      contactEmail: "",
      contactPhone: "",
      instagram: "",
      twitter: "",
      youtube: "",
      spotify: "",
    }
  });

  // Cargar perfil de artista desde Firestore
  useEffect(() => {
    const loadArtistProfile = async () => {
      if (!user?.uid) {
        setIsLoadingArtistProfile(false);
        return;
      }

      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setArtistProfileData(userData);
          
          artistProfileForm.reset({
            displayName: userData.displayName || userData.name || "",
            biography: userData.biography || "",
            genre: userData.genre || "",
            location: userData.location || "",
            profileImage: userData.profileImage || userData.photoURL || "",
            bannerImage: userData.bannerImage || "",
            contactEmail: userData.contactEmail || userData.email || "",
            contactPhone: userData.contactPhone || "",
            instagram: userData.instagram || "",
            twitter: userData.twitter || "",
            youtube: userData.youtube || "",
            spotify: userData.spotify || "",
          });
        }
      } catch (error) {
        logger.error("Error loading artist profile:", error);
      } finally {
        setIsLoadingArtistProfile(false);
      }
    };

    loadArtistProfile();
  }, [user?.uid]);
  
  // Funciones de generación con Gemini
  const handleGenerateBiography = async () => {
    const currentName = artistProfileForm.getValues("displayName");
    const currentGenre = artistProfileForm.getValues("genre");
    const currentLocation = artistProfileForm.getValues("location");

    if (!currentName) {
      toast({
        title: "Nombre requerido",
        description: "Debes ingresar tu nombre artístico primero.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBiography(true);

    try {
      const response = await fetch('/api/artist-profile/generate-biography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentName,
          genre: currentGenre,
          location: currentLocation,
        }),
      });

      const data = await response.json();

      if (data.success && data.biography) {
        artistProfileForm.setValue("biography", data.biography, { shouldDirty: true });
        toast({
          title: "Biografía generada",
          description: "Tu biografía ha sido generada automáticamente. Puedes editarla si deseas.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate biography');
      }
    } catch (error: any) {
      logger.error("Error generating biography:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la biografía. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBiography(false);
    }
  };

  const handleGenerateProfileImage = async () => {
    const currentName = artistProfileForm.getValues("displayName");
    const currentGenre = artistProfileForm.getValues("genre");

    if (!currentName) {
      toast({
        title: "Nombre requerido",
        description: "Debes ingresar tu nombre artístico primero.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingProfileImage(true);

    try {
      const response = await fetch('/api/artist-profile/generate-profile-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: currentName,
          genre: currentGenre,
          style: "Professional portrait, studio lighting, artistic aesthetic",
        }),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        artistProfileForm.setValue("profileImage", data.imageUrl, { shouldDirty: true });
        toast({
          title: "Imagen de perfil generada",
          description: "Tu imagen de perfil ha sido generada. Copia la URL si deseas usarla.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate profile image');
      }
    } catch (error: any) {
      logger.error("Error generating profile image:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen de perfil. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProfileImage(false);
    }
  };

  const handleGenerateBannerImage = async () => {
    const currentName = artistProfileForm.getValues("displayName");
    const currentGenre = artistProfileForm.getValues("genre");

    if (!currentName) {
      toast({
        title: "Nombre requerido",
        description: "Debes ingresar tu nombre artístico primero.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBannerImage(true);

    try {
      const response = await fetch('/api/artist-profile/generate-banner-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: currentName,
          genre: currentGenre,
          style: "Wide cinematic banner, professional music artist aesthetic",
          mood: "Creative and energetic atmosphere",
        }),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        artistProfileForm.setValue("bannerImage", data.imageUrl, { shouldDirty: true });
        toast({
          title: "Imagen de banner generada",
          description: "Tu imagen de banner ha sido generada. Copia la URL si deseas usarla.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate banner image');
      }
    } catch (error: any) {
      logger.error("Error generating banner image:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen de banner. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBannerImage(false);
    }
  };
  
  // Manejadores para guardar cada formulario
  const handleProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    settings.updateProfile(values);
    toast({
      title: "Perfil actualizado",
      description: "Tu información de perfil ha sido actualizada."
    });
  };

  const handleArtistProfileSubmit = async (values: z.infer<typeof artistProfileSchema>) => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para actualizar tu perfil.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingArtistProfile(true);

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const profileData = {
        uid: user.uid,
        displayName: values.displayName,
        name: values.displayName,
        biography: values.biography || "",
        genre: values.genre || "",
        location: values.location || "",
        profileImage: values.profileImage || "",
        photoURL: values.profileImage || "",
        bannerImage: values.bannerImage || "",
        contactEmail: values.contactEmail || "",
        contactPhone: values.contactPhone || "",
        instagram: values.instagram || "",
        twitter: values.twitter || "",
        youtube: values.youtube || "",
        spotify: values.spotify || "",
        updatedAt: new Date(),
      };

      if (!querySnapshot.empty) {
        // Actualizar documento existente
        const userDocRef = querySnapshot.docs[0].ref;
        await setDoc(userDocRef, profileData, { merge: true });
      } else {
        // Crear nuevo documento
        const newDocRef = doc(collection(db, "users"));
        await setDoc(newDocRef, {
          ...profileData,
          createdAt: new Date(),
        });
      }

      toast({
        title: "Perfil de artista actualizado",
        description: "Tu información de perfil se ha guardado correctamente."
      });

      setArtistProfileData(profileData);
    } catch (error) {
      logger.error("Error saving artist profile:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu perfil. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSavingArtistProfile(false);
    }
  };
  
  const handleNotificationsSubmit = (values: z.infer<typeof notificationsSchema>) => {
    settings.updateNotifications(values);
    toast({
      title: "Preferencias de notificación actualizadas",
      description: "Tus preferencias de notificación han sido guardadas."
    });
  };
  
  const handleAppearanceSubmit = (values: z.infer<typeof appearanceSchema>) => {
    settings.updateAppearance(values);
    // Aplicar el tema seleccionado
    document.documentElement.setAttribute('data-theme', values.theme === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : values.theme);
    
    toast({
      title: "Apariencia actualizada",
      description: "Tus preferencias de apariencia han sido guardadas."
    });
  };
  
  const handleSecuritySubmit = (values: z.infer<typeof securitySchema>) => {
    // Aquí se implementaría la lógica para cambiar la contraseña
    // Por ahora sólo simulamos el éxito
    toast({
      title: "Contraseña actualizada",
      description: "Tu contraseña ha sido actualizada correctamente."
    });
    securityForm.reset();
  };
  
  // Aplicar el tema al cargar la página
  useEffect(() => {
    const theme = settings.appearance.theme;
    document.documentElement.setAttribute('data-theme', theme === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme);
  }, [settings.appearance.theme]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 md:pt-6 md:space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <Tabs defaultValue="artist" className="space-y-4 md:space-y-6">
        <TabsList className="w-full h-auto flex flex-wrap justify-start md:justify-start gap-1 md:gap-2 p-1">
          <TabsTrigger value="artist" className="flex-1 md:flex-none gap-1 md:gap-2 h-10 px-2 md:px-4 py-2">
            <Music className="h-4 w-4" />
            <span className="text-xs md:text-sm">Artist Profile</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex-1 md:flex-none gap-1 md:gap-2 h-10 px-2 md:px-4 py-2">
            <User className="h-4 w-4" />
            <span className="text-xs md:text-sm">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 md:flex-none gap-1 md:gap-2 h-10 px-2 md:px-4 py-2">
            <Bell className="h-4 w-4" />
            <span className="text-xs md:text-sm">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 md:flex-none gap-1 md:gap-2 h-10 px-2 md:px-4 py-2">
            <Palette className="h-4 w-4" />
            <span className="text-xs md:text-sm">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 md:flex-none gap-1 md:gap-2 h-10 px-2 md:px-4 py-2">
            <Shield className="h-4 w-4" />
            <span className="text-xs md:text-sm">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="artist" className="space-y-4">
          <Card className="p-3 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Artist Profile Information</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Esta información se mostrará en tu perfil público de artista
            </p>
            
            {isLoadingArtistProfile ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : (
              <Form {...artistProfileForm}>
                <form onSubmit={artistProfileForm.handleSubmit(handleArtistProfileSubmit)} className="space-y-4">
                  <FormField
                    control={artistProfileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Artístico *</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre artístico" {...field} data-testid="input-artist-name" />
                        </FormControl>
                        <FormDescription>
                          Este será tu nombre público como artista
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={artistProfileForm.control}
                    name="biography"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-2">
                          <FormLabel>Biografía</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateBiography}
                            disabled={isGeneratingBiography}
                            data-testid="button-generate-biography"
                          >
                            {isGeneratingBiography ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generar con IA
                              </>
                            )}
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea 
                            placeholder="Cuéntanos tu historia como artista..." 
                            className="min-h-[100px]"
                            {...field}
                            data-testid="input-biography"
                          />
                        </FormControl>
                        <FormDescription>
                          Una breve descripción sobre ti y tu música
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={artistProfileForm.control}
                      name="genre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Género Musical</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Pop, Rock, Hip-Hop" {...field} data-testid="input-genre" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={artistProfileForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ubicación</FormLabel>
                          <FormControl>
                            <Input placeholder="Ciudad, País" {...field} data-testid="input-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={artistProfileForm.control}
                    name="profileImage"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-2">
                          <FormLabel>URL de Imagen de Perfil</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateProfileImage}
                            disabled={isGeneratingProfileImage}
                            data-testid="button-generate-profile-image"
                          >
                            {isGeneratingProfileImage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generando...
                              </>
                            ) : (
                              <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generar con IA
                              </>
                            )}
                          </Button>
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="https://ejemplo.com/imagen.jpg" 
                            {...field} 
                            data-testid="input-profile-image"
                          />
                        </FormControl>
                        <FormDescription>
                          URL de tu foto de perfil (JPG, PNG, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={artistProfileForm.control}
                    name="bannerImage"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-2">
                          <FormLabel>URL de Imagen de Banner</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateBannerImage}
                            disabled={isGeneratingBannerImage}
                            data-testid="button-generate-banner-image"
                          >
                            {isGeneratingBannerImage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generando...
                              </>
                            ) : (
                              <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generar con IA
                              </>
                            )}
                          </Button>
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="https://ejemplo.com/banner.jpg" 
                            {...field} 
                            data-testid="input-banner-image"
                          />
                        </FormControl>
                        <FormDescription>
                          URL de tu imagen de portada (banner)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold mb-3">Información de Contacto</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={artistProfileForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de Contacto</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contacto@ejemplo.com" {...field} data-testid="input-contact-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={artistProfileForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 234 567 8900" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold mb-3">Redes Sociales</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={artistProfileForm.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input placeholder="@tuusuario" {...field} data-testid="input-instagram" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={artistProfileForm.control}
                        name="twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter / X</FormLabel>
                            <FormControl>
                              <Input placeholder="@tuusuario" {...field} data-testid="input-twitter" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={artistProfileForm.control}
                        name="youtube"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>YouTube</FormLabel>
                            <FormControl>
                              <Input placeholder="https://youtube.com/@tucanal" {...field} data-testid="input-youtube" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={artistProfileForm.control}
                        name="spotify"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Spotify</FormLabel>
                            <FormControl>
                              <Input placeholder="https://open.spotify.com/artist/..." {...field} data-testid="input-spotify" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={!artistProfileForm.formState.isDirty || isSavingArtistProfile}
                    data-testid="button-save-artist-profile"
                  >
                    {isSavingArtistProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </Card>

          {/* EPK Generator Section */}
          <Card className="p-3 md:p-6 border-primary/20">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-base md:text-lg font-semibold">Electronic Press Kit (EPK)</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Genera un kit de prensa profesional completo con IA. Incluye biografía mejorada, logros, citas inspiradoras y fotos de prensa coherentes con tu estilo musical.
            </p>
            <EPKGenerator />
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-3 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Profile Information</h3>
            
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-3 md:space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full md:w-auto"
                  disabled={!profileForm.formState.isDirty}
                >
                  Save Changes
                </Button>
              </form>
            </Form>
            
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-3 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Notification Preferences</h3>
            
            <Form {...notificationsForm}>
              <form onSubmit={notificationsForm.handleSubmit(handleNotificationsSubmit)} className="space-y-3 md:space-y-4">
                <FormField
                  control={notificationsForm.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                      <div className="space-y-0.5">
                        <FormLabel>Email Notifications</FormLabel>
                        <FormDescription className="text-xs md:text-sm">
                          Receive important updates via email
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
                  control={notificationsForm.control}
                  name="pushNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                      <div className="space-y-0.5">
                        <FormLabel>Push Notifications</FormLabel>
                        <FormDescription className="text-xs md:text-sm">
                          Receive real-time notifications
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
                  control={notificationsForm.control}
                  name="newsletter"
                  render={({ field }) => (
                    <FormItem className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                      <div className="space-y-0.5">
                        <FormLabel>Newsletter</FormLabel>
                        <FormDescription className="text-xs md:text-sm">
                          Receive our monthly newsletter
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
                
                <Button 
                  type="submit" 
                  className="w-full md:w-auto"
                  disabled={!notificationsForm.formState.isDirty}
                >
                  Save Changes
                </Button>
              </form>
            </Form>
            
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="p-3 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Customization</h3>
            
            <Form {...appearanceForm}>
              <form onSubmit={appearanceForm.handleSubmit(handleAppearanceSubmit)} className="space-y-3 md:space-y-4">
                <FormField
                  control={appearanceForm.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={appearanceForm.control}
                  name="density"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Density</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select density" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="comfortable">Comfortable</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full md:w-auto"
                  disabled={!appearanceForm.formState.isDirty}
                >
                  Save Changes
                </Button>
              </form>
            </Form>
            
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-3 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Account Security</h3>
            
            <Form {...securityForm}>
              <form onSubmit={securityForm.handleSubmit(handleSecuritySubmit)} className="space-y-3 md:space-y-4">
                <FormField
                  control={securityForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={securityForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={securityForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Enable two-factor authentication for enhanced security
                    </p>
                  </div>
                  <Switch 
                    checked={settings.security.twoFactorEnabled} 
                    onCheckedChange={(value) => settings.updateSecurity({ twoFactorEnabled: value })}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full md:w-auto"
                  disabled={!securityForm.formState.isDirty}
                >
                  Update Password
                </Button>
              </form>
            </Form>
            
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
