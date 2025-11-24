import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { Header } from "../components/layout/header";
import { apiRequest, queryClient } from "../lib/queryClient";
import { PlanTierGuard } from "../components/youtube-views/plan-tier-guard";
import {
  Rocket,
  Radio,
  Tv,
  Mic,
  Globe,
  Mail,
  Phone,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Pause,
  Play,
  Music,
  Video,
  Users,
  Megaphone,
  Target,
  ArrowRight,
  Loader2,
  Eye,
  MessageSquare,
  Star,
  Sparkles,
  Wand2,
  Image as ImageIcon
} from "lucide-react";
import prHeroImage from "../../../attached_assets/generated_images/PR_Agent_Hero_Image_d3c922a5.png";

interface PRCampaign {
  id: number;
  userId: number;
  title: string;
  artistName: string;
  artistProfileUrl: string;
  contentType: "single" | "album" | "video" | "tour" | "announcement";
  contentTitle: string;
  contentUrl: string;
  targetMediaTypes: string[];
  targetCountries: string[];
  targetGenres: string[];
  pitchMessage: string;
  contactEmail: string;
  contactPhone: string;
  status: "draft" | "active" | "paused" | "completed";
  mediaContacted: number;
  emailsOpened: number;
  mediaReplied: number;
  interviewsBooked: number;
  createdAt: string;
  updatedAt: string;
}

interface WebhookEvent {
  id: number;
  campaignId: number;
  eventType: "email_sent" | "email_opened" | "media_replied" | "interview_booked";
  mediaName: string;
  mediaEmail: string;
  notes: string;
  createdAt: string;
}

const CONTENT_TYPES = [
  { value: "single", label: "Single", icon: Music },
  { value: "album", label: "Álbum", icon: Music },
  { value: "video", label: "Video Musical", icon: Video },
  { value: "tour", label: "Tour/Concierto", icon: Users },
  { value: "announcement", label: "Anuncio", icon: Megaphone }
];

const MEDIA_TYPES = [
  { value: "radio", label: "Radio", icon: Radio },
  { value: "tv", label: "TV", icon: Tv },
  { value: "podcast", label: "Podcast", icon: Mic },
  { value: "blog", label: "Blog", icon: Globe },
  { value: "magazine", label: "Revista", icon: Globe }
];

const COUNTRIES = [
  "USA", "Mexico", "Colombia", "Argentina", "España", "Chile", 
  "Peru", "Ecuador", "Venezuela", "Puerto Rico", "República Dominicana"
];

const GENRES = [
  "Urban", "Latin Pop", "Reggaeton", "Trap", "Salsa", "Bachata",
  "Regional Mexicano", "Cumbia", "Dembow", "Electronic", "Hip Hop"
];

export default function PRPage() {
  const { toast } = useToast();
  const { user, userSubscription } = useAuth();
  const [activeView, setActiveView] = useState<"list" | "wizard" | "campaign">("list");
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    artistName: user?.artistName || "",
    artistProfileUrl: user?.slug ? `${window.location.origin}/artist/${user.slug}` : "",
    contentType: "single" as const,
    contentTitle: "",
    contentUrl: "",
    targetMediaTypes: [] as string[],
    targetCountries: [] as string[],
    targetGenres: [] as string[],
    pitchMessage: "",
    contactEmail: user?.email || "",
    contactPhone: ""
  });

  const { data: campaignsData, isLoading } = useQuery<{ success: boolean; campaigns: PRCampaign[] }>({
    queryKey: ['/api/pr/campaigns'],
    enabled: !!user
  });

  const { data: campaignDetails, isLoading: isLoadingDetails } = useQuery<{
    success: boolean;
    campaign: PRCampaign;
    events: WebhookEvent[];
  }>({
    queryKey: ['/api/pr/campaigns', selectedCampaign],
    enabled: !!selectedCampaign
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/pr/campaigns', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Campaña creada!",
        description: "Tu campaña PR ha sido creada exitosamente."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pr/campaigns'] });
      setActiveView("list");
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la campaña. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  });

  const activateCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      return apiRequest(`/api/pr/campaigns/${campaignId}/activate`, {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "¡Campaña activada!",
        description: `Se contactarán ${data.mediaCount || 0} medios automáticamente.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pr/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pr/campaigns', selectedCampaign] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo activar la campaña.",
        variant: "destructive"
      });
    }
  });

  const pauseCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      return apiRequest(`/api/pr/campaigns/${campaignId}/pause`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Campaña pausada",
        description: "La campaña ha sido pausada exitosamente."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pr/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pr/campaigns', selectedCampaign] });
    }
  });

  const generatePitchMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/pr-ai/generate-pitch', {
        method: 'POST',
        body: JSON.stringify({
          artistName: formData.artistName,
          contentType: formData.contentType,
          contentTitle: formData.contentTitle,
          genre: formData.targetGenres[0] || 'urban',
          biography: user?.biography || ''
        })
      });
    },
    onSuccess: (data: any) => {
      if (data.pitch) {
        setFormData({ ...formData, pitchMessage: data.pitch });
        toast({
          title: "¡Pitch generado!",
          description: "El mensaje ha sido generado con IA."
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo generar el pitch. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  });

  const improvePitchMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/pr-ai/improve-text', {
        method: 'POST',
        body: JSON.stringify({
          text: formData.pitchMessage,
          context: 'comunicación con medios musicales'
        })
      });
    },
    onSuccess: (data: any) => {
      if (data.improvedText) {
        setFormData({ ...formData, pitchMessage: data.improvedText });
        toast({
          title: "¡Texto mejorado!",
          description: "El mensaje ha sido optimizado con IA."
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo mejorar el texto.",
        variant: "destructive"
      });
    }
  });

  const suggestTitleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/pr-ai/suggest-campaign-title', {
        method: 'POST',
        body: JSON.stringify({
          artistName: formData.artistName,
          contentType: formData.contentType,
          contentTitle: formData.contentTitle
        })
      });
    },
    onSuccess: (data: any) => {
      if (data.suggestions && data.suggestions.length > 0) {
        setFormData({ ...formData, title: data.suggestions[0] });
        toast({
          title: "¡Título sugerido!",
          description: "Puedes editarlo si lo deseas."
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo generar título.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      artistName: user?.artistName || "",
      artistProfileUrl: user?.slug ? `${window.location.origin}/artist/${user.slug}` : "",
      contentType: "single",
      contentTitle: "",
      contentUrl: "",
      targetMediaTypes: [],
      targetCountries: [],
      targetGenres: [],
      pitchMessage: "",
      contactEmail: user?.email || "",
      contactPhone: ""
    });
    setWizardStep(1);
  };

  const handleWizardNext = () => {
    if (wizardStep < 5) {
      setWizardStep(wizardStep + 1);
    } else {
      createCampaignMutation.mutate(formData);
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    } else {
      setActiveView("list");
      resetForm();
    }
  };

  const toggleArrayValue = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(v => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Borrador", variant: "secondary" as const, icon: Clock },
      active: { label: "Activa", variant: "default" as const, icon: Play },
      paused: { label: "Pausada", variant: "outline" as const, icon: Pause },
      completed: { label: "Completada", variant: "default" as const, icon: CheckCircle }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1" data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getEventIcon = (eventType: string) => {
    const icons = {
      email_sent: Mail,
      email_opened: Eye,
      media_replied: MessageSquare,
      interview_booked: Star
    };
    return icons[eventType as keyof typeof icons] || Mail;
  };

  const getEventLabel = (eventType: string) => {
    const labels = {
      email_sent: "Email enviado",
      email_opened: "Email abierto",
      media_replied: "Medio respondió",
      interview_booked: "Entrevista agendada"
    };
    return labels[eventType as keyof typeof labels] || eventType;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Autenticación requerida</CardTitle>
              <CardDescription>
                Debes iniciar sesión para acceder al Agente PR
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PlanTierGuard 
      requiredPlan="premium" 
      userSubscription={userSubscription} 
      featureName="PR Management Tools"
    >
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
        {activeView === "list" && (
          <>
            <div 
              className="relative rounded-xl overflow-hidden mb-8 h-64 bg-cover bg-center"
              style={{ backgroundImage: `url(${prHeroImage})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 flex items-center">
                <div className="px-8 text-white max-w-2xl">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-hero-title">
                    Agente PR Automático
                  </h1>
                  <p className="text-xl mb-6 text-white/90" data-testid="text-hero-description">
                    Llega a radios, podcasts, TV y medios en minutos. Sin complicaciones.
                  </p>
                  <Button 
                    size="lg" 
                    className="gap-2 bg-primary hover:bg-primary/90"
                    onClick={() => setActiveView("wizard")}
                    data-testid="button-new-campaign"
                  >
                    <Rocket className="w-5 h-5" />
                    Nueva Campaña PR
                  </Button>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Mis Campañas</h2>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : campaignsData?.campaigns && campaignsData.campaigns.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {campaignsData.campaigns.map((campaign) => (
                    <Card 
                      key={campaign.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedCampaign(campaign.id);
                        setActiveView("campaign");
                      }}
                      data-testid={`card-campaign-${campaign.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg" data-testid={`text-campaign-title-${campaign.id}`}>
                            {campaign.title}
                          </CardTitle>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <CardDescription data-testid={`text-campaign-content-${campaign.id}`}>
                          {campaign.contentTitle}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Enviados</div>
                            <div className="text-2xl font-bold" data-testid={`text-contacted-${campaign.id}`}>
                              {campaign.mediaContacted}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Abiertos</div>
                            <div className="text-2xl font-bold" data-testid={`text-opened-${campaign.id}`}>
                              {campaign.emailsOpened}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Respuestas</div>
                            <div className="text-2xl font-bold" data-testid={`text-replied-${campaign.id}`}>
                              {campaign.mediaReplied}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Entrevistas</div>
                            <div className="text-2xl font-bold text-primary" data-testid={`text-booked-${campaign.id}`}>
                              {campaign.interviewsBooked}
                            </div>
                          </div>
                        </div>
                        {campaign.status === "active" && campaign.mediaContacted > 0 && (
                          <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Tasa de apertura</span>
                              <span>{Math.round((campaign.emailsOpened / campaign.mediaContacted) * 100)}%</span>
                            </div>
                            <Progress 
                              value={(campaign.emailsOpened / campaign.mediaContacted) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Megaphone className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No tienes campañas todavía</h3>
                    <p className="text-muted-foreground mb-6 text-center">
                      Crea tu primera campaña PR y comienza a llegar a medios en minutos
                    </p>
                    <Button 
                      onClick={() => setActiveView("wizard")}
                      className="gap-2"
                      data-testid="button-create-first-campaign"
                    >
                      <Rocket className="w-4 h-4" />
                      Crear Primera Campaña
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {activeView === "wizard" && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Nueva Campaña PR</CardTitle>
              <CardDescription>
                Paso {wizardStep} de 5: {
                  wizardStep === 1 ? "Información Básica" :
                  wizardStep === 2 ? "Contenido a Promocionar" :
                  wizardStep === 3 ? "Target de Medios" :
                  wizardStep === 4 ? "Mensaje y Contacto" :
                  "Revisar y Lanzar"
                }
              </CardDescription>
              <Progress value={(wizardStep / 5) * 100} className="mt-4" />
            </CardHeader>
            <CardContent className="space-y-6">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="title" data-testid="label-campaign-title">Nombre de la Campaña</Label>
                      {formData.artistName && formData.contentTitle && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => suggestTitleMutation.mutate()}
                          disabled={suggestTitleMutation.isPending}
                          className="gap-2"
                          data-testid="button-suggest-title-ai"
                        >
                          {suggestTitleMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          Generar con IA
                        </Button>
                      )}
                    </div>
                    <Input
                      id="title"
                      placeholder="Ej: Lanzamiento Single Noviembre 2025"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      data-testid="input-campaign-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="artistName" data-testid="label-artist-name">Nombre del Artista</Label>
                    <Input
                      id="artistName"
                      placeholder="Nombre artístico"
                      value={formData.artistName}
                      onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                      data-testid="input-artist-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="artistProfileUrl" data-testid="label-profile-url">
                      Link del Perfil {user?.slug && <span className="text-green-600">✓ Auto-cargado</span>}
                    </Label>
                    <Input
                      id="artistProfileUrl"
                      placeholder="https://boostify.app/artist/tu-nombre"
                      value={formData.artistProfileUrl}
                      onChange={(e) => setFormData({ ...formData, artistProfileUrl: e.target.value })}
                      data-testid="input-profile-url"
                      className={user?.slug ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {user?.slug 
                        ? "✓ Tu perfil de artista se ha cargado automáticamente. Puedes editarlo si lo deseas."
                        : "Si no lo tienes, generaremos uno automáticamente"
                      }
                    </p>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label data-testid="label-content-type">¿Qué estás promocionando?</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {CONTENT_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, contentType: type.value as any })}
                            className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                              formData.contentType === type.value
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`button-content-type-${type.value}`}
                          >
                            <Icon className="w-6 h-6" />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contentTitle" data-testid="label-content-title">Título del Contenido</Label>
                    <Input
                      id="contentTitle"
                      placeholder="Ej: El Silencio Grita"
                      value={formData.contentTitle}
                      onChange={(e) => setFormData({ ...formData, contentTitle: e.target.value })}
                      data-testid="input-content-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contentUrl" data-testid="label-content-url">Link al Contenido</Label>
                    <Input
                      id="contentUrl"
                      placeholder="https://open.spotify.com/track/..."
                      value={formData.contentUrl}
                      onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                      data-testid="input-content-url"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Spotify, YouTube, Apple Music, etc.
                    </p>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block" data-testid="label-media-types">Tipos de Medios</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {MEDIA_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = formData.targetMediaTypes.includes(type.value);
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => toggleArrayValue(
                              formData.targetMediaTypes,
                              type.value,
                              (arr) => setFormData({ ...formData, targetMediaTypes: arr })
                            )}
                            className={`p-3 border rounded-lg flex items-center gap-2 transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`button-media-type-${type.value}`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-3 block" data-testid="label-countries">Países</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {COUNTRIES.map((country) => {
                        const isSelected = formData.targetCountries.includes(country);
                        return (
                          <button
                            key={country}
                            type="button"
                            onClick={() => toggleArrayValue(
                              formData.targetCountries,
                              country,
                              (arr) => setFormData({ ...formData, targetCountries: arr })
                            )}
                            className={`p-2 border rounded text-sm transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 font-medium"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`button-country-${country}`}
                          >
                            {country}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-3 block" data-testid="label-genres">Géneros Musicales</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {GENRES.map((genre) => {
                        const isSelected = formData.targetGenres.includes(genre);
                        return (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => toggleArrayValue(
                              formData.targetGenres,
                              genre,
                              (arr) => setFormData({ ...formData, targetGenres: arr })
                            )}
                            className={`p-2 border rounded text-sm transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 font-medium"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`button-genre-${genre}`}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="pitchMessage" data-testid="label-pitch-message">
                        Mensaje para Medios (2-3 frases)
                      </Label>
                      <div className="flex gap-2">
                        {formData.pitchMessage && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => improvePitchMutation.mutate()}
                            disabled={improvePitchMutation.isPending}
                            className="gap-2"
                            data-testid="button-improve-pitch-ai"
                          >
                            {improvePitchMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3" />
                            )}
                            Mejorar con IA
                          </Button>
                        )}
                        {formData.artistName && formData.contentTitle && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generatePitchMutation.mutate()}
                            disabled={generatePitchMutation.isPending}
                            className="gap-2"
                            data-testid="button-generate-pitch-ai"
                          >
                            {generatePitchMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            Generar con IA
                          </Button>
                        )}
                      </div>
                    </div>
                    <Textarea
                      id="pitchMessage"
                      placeholder="Ej: Redwine lanza su nuevo single 'El Silencio Grita', una fusión única de cine y música latina. Disponible ahora en todas las plataformas."
                      value={formData.pitchMessage}
                      onChange={(e) => setFormData({ ...formData, pitchMessage: e.target.value })}
                      rows={4}
                      data-testid="input-pitch-message"
                    />
                    {!formData.pitchMessage && formData.artistName && formData.contentTitle && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Tip: Usa "Generar con IA" para crear un mensaje profesional automáticamente
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="contactEmail" data-testid="label-contact-email">Email de Contacto</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      data-testid="input-contact-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone" data-testid="label-contact-phone">
                      Teléfono/WhatsApp (Opcional)
                    </Label>
                    <Input
                      id="contactPhone"
                      placeholder="+1 786 000 0000"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      data-testid="input-contact-phone"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-6">
                  <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Resumen de la Campaña</h3>
                    <div className="grid gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nombre:</span>
                        <div className="font-medium" data-testid="text-review-title">{formData.title}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Artista:</span>
                        <div className="font-medium" data-testid="text-review-artist">{formData.artistName}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contenido:</span>
                        <div className="font-medium" data-testid="text-review-content">
                          {formData.contentTitle} ({formData.contentType})
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tipos de Medios:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.targetMediaTypes.map((type) => (
                            <Badge key={type} variant="secondary" data-testid={`badge-review-media-${type}`}>
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Países:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.targetCountries.map((country) => (
                            <Badge key={country} variant="outline" data-testid={`badge-review-country-${country}`}>
                              {country}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Géneros:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.targetGenres.map((genre) => (
                            <Badge key={genre} variant="outline" data-testid={`badge-review-genre-${genre}`}>
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mensaje:</span>
                        <div className="font-medium mt-1 text-xs bg-background p-3 rounded" data-testid="text-review-message">
                          {formData.pitchMessage}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      ¿Qué sucederá después?
                    </h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                        <span>Filtraremos medios que coincidan con tu target</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                        <span>Enviaremos emails personalizados automáticamente</span>
                              </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                        <span>Recibirás notificaciones cuando respondan</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 text-primary" />
                        <span>Podrás ver estadísticas en tiempo real</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleWizardBack}
                  className="gap-2"
                  data-testid="button-wizard-back"
                >
                  {wizardStep === 1 ? "Cancelar" : "Atrás"}
                </Button>
                <Button
                  type="button"
                  onClick={handleWizardNext}
                  className="gap-2 flex-1"
                  disabled={
                    (wizardStep === 1 && (!formData.title || !formData.artistName)) ||
                    (wizardStep === 2 && (!formData.contentTitle || !formData.contentUrl)) ||
                    (wizardStep === 3 && (formData.targetMediaTypes.length === 0 || formData.targetCountries.length === 0)) ||
                    (wizardStep === 4 && (!formData.pitchMessage || !formData.contactEmail)) ||
                    createCampaignMutation.isPending
                  }
                  data-testid="button-wizard-next"
                >
                  {createCampaignMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando...
                    </>
                  ) : wizardStep === 5 ? (
                    <>
                      <Rocket className="w-4 h-4" />
                      Crear Campaña
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeView === "campaign" && selectedCampaign && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveView("list");
                  setSelectedCampaign(null);
                }}
                data-testid="button-back-to-list"
              >
                ← Volver
              </Button>
            </div>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : campaignDetails?.campaign ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-2" data-testid="text-campaign-detail-title">
                          {campaignDetails.campaign.title}
                        </CardTitle>
                        <CardDescription data-testid="text-campaign-detail-content">
                          {campaignDetails.campaign.contentTitle} • {campaignDetails.campaign.contentType}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(campaignDetails.campaign.status)}
                        {campaignDetails.campaign.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => activateCampaignMutation.mutate(campaignDetails.campaign.id)}
                            disabled={activateCampaignMutation.isPending}
                            className="gap-2"
                            data-testid="button-activate-campaign"
                          >
                            {activateCampaignMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            Activar
                          </Button>
                        )}
                        {campaignDetails.campaign.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseCampaignMutation.mutate(campaignDetails.campaign.id)}
                            disabled={pauseCampaignMutation.isPending}
                            className="gap-2"
                            data-testid="button-pause-campaign"
                          >
                            {pauseCampaignMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Pause className="w-4 h-4" />
                            )}
                            Pausar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <div className="text-muted-foreground text-sm mb-1">Medios Contactados</div>
                        <div className="text-3xl font-bold" data-testid="text-detail-contacted">
                          {campaignDetails.campaign.mediaContacted}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm mb-1">Emails Abiertos</div>
                        <div className="text-3xl font-bold text-blue-600" data-testid="text-detail-opened">
                          {campaignDetails.campaign.emailsOpened}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm mb-1">Respuestas</div>
                        <div className="text-3xl font-bold text-green-600" data-testid="text-detail-replied">
                          {campaignDetails.campaign.mediaReplied}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm mb-1">Entrevistas Agendadas</div>
                        <div className="text-3xl font-bold text-primary" data-testid="text-detail-booked">
                          {campaignDetails.campaign.interviewsBooked}
                        </div>
                      </div>
                    </div>

                    {campaignDetails.campaign.mediaContacted > 0 && (
                      <div className="mt-6 space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Tasa de Apertura</span>
                            <span className="font-medium">
                              {Math.round((campaignDetails.campaign.emailsOpened / campaignDetails.campaign.mediaContacted) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(campaignDetails.campaign.emailsOpened / campaignDetails.campaign.mediaContacted) * 100}
                            className="h-2"
                          />
                        </div>
                        {campaignDetails.campaign.emailsOpened > 0 && (
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Tasa de Conversión (Respuestas)</span>
                              <span className="font-medium">
                                {Math.round((campaignDetails.campaign.mediaReplied / campaignDetails.campaign.emailsOpened) * 100)}%
                              </span>
                            </div>
                            <Progress 
                              value={(campaignDetails.campaign.mediaReplied / campaignDetails.campaign.emailsOpened) * 100}
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {campaignDetails.events && campaignDetails.events.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Actividad Reciente</CardTitle>
                      <CardDescription>Últimas interacciones con medios</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {campaignDetails.events.map((event) => {
                          const Icon = getEventIcon(event.eventType);
                          return (
                            <div 
                              key={event.id} 
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                              data-testid={`event-${event.id}`}
                            >
                              <div className="p-2 rounded-full bg-background">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium" data-testid={`text-event-media-${event.id}`}>
                                  {event.mediaName}
                                </div>
                                <div className="text-sm text-muted-foreground" data-testid={`text-event-type-${event.id}`}>
                                  {getEventLabel(event.eventType)}
                                </div>
                                {event.notes && (
                                  <div className="text-sm mt-1" data-testid={`text-event-notes-${event.id}`}>
                                    {event.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(event.createdAt).toLocaleDateString('es-ES', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
      </div>
    </PlanTierGuard>
  );
}
