import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  User,
  Shield,
  Palette,
  Globe,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettingsStore, themeOptions, densityOptions, languageOptions } from "@/store/settings-store";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Estado global de configuraciones
  const settings = useSettingsStore();
  
  // Schemas de validación
  const profileSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
    email: z.string().email("Email inválido").optional(),
    language: z.enum(languageOptions)
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
  
  // Manejadores para guardar cada formulario
  const handleProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    settings.updateProfile(values);
    toast({
      title: "Perfil actualizado",
      description: "Tu información de perfil ha sido actualizada."
    });
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

      <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
        <TabsList className="w-full h-auto flex flex-wrap justify-start md:justify-start gap-1 md:gap-2 p-1">
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
                
                <FormField
                  control={securityForm.control}
                  name="twoFactorEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                      <div className="space-y-0.5">
                        <FormLabel>Two-Factor Authentication</FormLabel>
                        <FormDescription className="text-xs md:text-sm">
                          Enable two-factor authentication for enhanced security
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={settings.security.twoFactorEnabled} 
                          onCheckedChange={(value) => settings.updateSecurity({ twoFactorEnabled: value })}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
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
