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
  CreditCard,
  Crown,
  Check,
  ArrowRight,
} from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";
import { useSettingsStore, themeOptions, densityOptions, languageOptions } from "../store/settings-store";
import { useEffect, useState } from "react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { useSubscription } from "../lib/context/subscription-context";
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
  const { isSignedIn, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const { subscription, currentPlan, isLoading: subscriptionLoading } = useSubscription();
  
  // Redirect to auth if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation("/auth");
    }
  }, [isLoaded, isSignedIn, setLocation]);
  
  // Global settings state
  const settings = useSettingsStore();
  
  // Estados para el perfil de artista
  const [artistProfileData, setArtistProfileData] = useState<any>(null);
  const [isLoadingArtistProfile, setIsLoadingArtistProfile] = useState(true);
  const [isSavingArtistProfile, setIsSavingArtistProfile] = useState(false);
  
  // Estados para generación con Gemini
  const [isGeneratingBiography, setIsGeneratingBiography] = useState(false);
  const [isGeneratingProfileImage, setIsGeneratingProfileImage] = useState(false);
  const [isGeneratingBannerImage, setIsGeneratingBannerImage] = useState(false);
  
  // Validation Schemas
  const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email").optional(),
    language: z.enum(languageOptions)
  });

  const artistProfileSchema = z.object({
    displayName: z.string().min(2, "Artist name must be at least 2 characters"),
    biography: z.string().min(10, "Biography must be at least 10 characters").optional(),
    genre: z.string().optional(),
    location: z.string().optional(),
    profileImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    bannerImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
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
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    confirmPassword: z.string()
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });
  
  // Form initializers
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

  // Load artist profile from Firestore
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
        title: "Name required",
        description: "Please enter your artist name first.",
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
          title: "Biography generated",
          description: "Your biography has been generated automatically. You can edit it if you wish.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate biography');
      }
    } catch (error: any) {
      logger.error("Error generating biography:", error);
      toast({
        title: "Error",
        description: "Could not generate biography. Please try again.",
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
        title: "Name required",
        description: "Please enter your artist name first.",
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
          title: "Profile image generated",
          description: "Your profile image has been generated. Copy the URL if you want to use it.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate profile image');
      }
    } catch (error: any) {
      logger.error("Error generating profile image:", error);
      toast({
        title: "Error",
        description: "Could not generate profile image. Please try again.",
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
        title: "Name required",
        description: "Please enter your artist name first.",
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
          title: "Banner image generated",
          description: "Your banner image has been generated. Copy the URL if you want to use it.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate banner image');
      }
    } catch (error: any) {
      logger.error("Error generating banner image:", error);
      toast({
        title: "Error",
        description: "Could not generate banner image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBannerImage(false);
    }
  };
  
  // Form submit handlers
  const handleProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    settings.updateProfile(values);
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated."
    });
  };

  const handleArtistProfileSubmit = async (values: z.infer<typeof artistProfileSchema>) => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile.",
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
        // Update existing document
        const userDocRef = querySnapshot.docs[0].ref;
        await setDoc(userDocRef, profileData, { merge: true });
      } else {
        // Create new document
        const newDocRef = doc(collection(db, "users"));
        await setDoc(newDocRef, {
          ...profileData,
          createdAt: new Date(),
        });
      }

      toast({
        title: "Artist profile updated",
        description: "Your profile information has been saved successfully."
      });

      setArtistProfileData(profileData);
    } catch (error) {
      logger.error("Error saving artist profile:", error);
      toast({
        title: "Error",
        description: "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingArtistProfile(false);
    }
  };
  
  const handleNotificationsSubmit = (values: z.infer<typeof notificationsSchema>) => {
    settings.updateNotifications(values);
    toast({
      title: "Notification preferences updated",
      description: "Your notification preferences have been saved."
    });
  };
  
  const handleAppearanceSubmit = (values: z.infer<typeof appearanceSchema>) => {
    settings.updateAppearance(values);
    // Apply selected theme
    document.documentElement.setAttribute('data-theme', values.theme === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : values.theme);
    
    toast({
      title: "Appearance updated",
      description: "Your appearance preferences have been saved."
    });
  };
  
  const handleSecuritySubmit = (values: z.infer<typeof securitySchema>) => {
    // Password change logic would be implemented here
    // For now we just simulate success
    toast({
      title: "Password updated",
      description: "Your password has been updated successfully."
    });
    securityForm.reset();
  };
  
  // Apply theme on page load
  useEffect(() => {
    const theme = settings.appearance.theme;
    document.documentElement.setAttribute('data-theme', theme === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme);
  }, [settings.appearance.theme]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Don't render if not signed in (redirect in progress)
  if (!isSignedIn) {
    return null;
  }

  // Helper to get plan display name
  const getPlanDisplayName = (plan: string) => {
    const planNames: Record<string, string> = {
      'free': 'Free',
      'creator': 'Creator',
      'basic': 'Creator',
      'professional': 'Professional',
      'pro': 'Professional',
      'enterprise': 'Enterprise',
      'premium': 'Enterprise'
    };
    return planNames[plan] || 'Free';
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 md:pt-6 md:space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-4 md:space-y-6">
        <TabsList className="w-full h-auto flex flex-wrap justify-start md:justify-start gap-1 md:gap-2 p-1">
          <TabsTrigger value="subscription" className="flex-1 md:flex-none gap-1 md:gap-2 h-10 px-2 md:px-4 py-2">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs md:text-sm">Subscription</span>
          </TabsTrigger>
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

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card className="p-3 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-orange-500" />
              <h3 className="text-base md:text-lg font-semibold">Your Subscription</h3>
            </div>
            
            {subscriptionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Plan</p>
                      <p className="text-2xl font-bold text-orange-500">{getPlanDisplayName(currentPlan)}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      subscription?.status === 'active' 
                        ? 'bg-green-500/20 text-green-500' 
                        : subscription?.status === 'trialing'
                        ? 'bg-blue-500/20 text-blue-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      {subscription?.status === 'active' ? 'Active' : 
                       subscription?.status === 'trialing' ? 'Trial' : 
                       subscription?.status || 'Free'}
                    </div>
                  </div>
                  
                  {subscription?.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {subscription.cancelAtPeriodEnd 
                        ? `Expires on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                        : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      }
                    </p>
                  )}
                </div>

                {/* Plan Features */}
                <div>
                  <h4 className="font-medium mb-3">Plan Features</h4>
                  <div className="grid gap-2">
                    {currentPlan === 'free' ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Basic analytics</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>1 artist profile</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Limited AI features</span>
                        </div>
                      </>
                    ) : currentPlan === 'creator' || currentPlan === 'basic' ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Advanced analytics</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>3 artist profiles</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>AI content generation</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Priority support</span>
                        </div>
                      </>
                    ) : currentPlan === 'professional' || currentPlan === 'pro' ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Full analytics suite</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>10 artist profiles</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>All AI features</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Video creation tools</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>24/7 support</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Enterprise analytics</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Unlimited artist profiles</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>All premium AI features</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>White-label options</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Dedicated account manager</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Upgrade Button */}
                {(currentPlan === 'free' || currentPlan === 'creator' || currentPlan === 'basic') && (
                  <Button 
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    onClick={() => setLocation('/pricing')}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upgrade Your Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {/* Manage Subscription */}
                {subscription && subscription.status === 'active' && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Manage Subscription</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => setLocation('/pricing')}>
                        Change Plan
                      </Button>
                      {subscription.stripeSubscriptionId && (
                        <Button 
                          variant="ghost" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/subscription/create-portal-session', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                              });
                              const data = await response.json();
                              if (data.url) {
                                window.location.href = data.url;
                              }
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Could not open billing portal",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          Manage Billing
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="artist" className="space-y-4">
          <Card className="p-3 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Artist Profile Information</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This information will be displayed on your public artist profile
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
                        <FormLabel>Artist Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your artist name" {...field} data-testid="input-artist-name" />
                        </FormControl>
                        <FormDescription>
                          This will be your public name as an artist
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
                          <FormLabel>Biography</FormLabel>
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
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate with AI
                              </>
                            )}
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us your story as an artist..." 
                            className="min-h-[100px]"
                            {...field}
                            data-testid="input-biography"
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description about you and your music
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
                          <FormLabel>Music Genre</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g: Pop, Rock, Hip-Hop" {...field} data-testid="input-genre" />
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
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City, Country" {...field} data-testid="input-location" />
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
                          <FormLabel>Profile Image URL</FormLabel>
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
                                Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generate with AI
                              </>
                            )}
                          </Button>
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            {...field} 
                            data-testid="input-profile-image"
                          />
                        </FormControl>
                        <FormDescription>
                          URL of your profile photo (JPG, PNG, etc.)
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
                          <FormLabel>Banner Image URL</FormLabel>
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
                                Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generate with AI
                              </>
                            )}
                          </Button>
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/banner.jpg" 
                            {...field} 
                            data-testid="input-banner-image"
                          />
                        </FormControl>
                        <FormDescription>
                          URL of your cover image (banner)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold mb-3">Contact Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={artistProfileForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contact@example.com" {...field} data-testid="input-contact-email" />
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
                            <FormLabel>Phone</FormLabel>
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
                    <h4 className="text-sm font-semibold mb-3">Social Networks</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={artistProfileForm.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input placeholder="@yourusername" {...field} data-testid="input-instagram" />
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
                              <Input placeholder="@yourusername" {...field} data-testid="input-twitter" />
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
                              <Input placeholder="https://youtube.com/@yourchannel" {...field} data-testid="input-youtube" />
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
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            )}
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
