import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AffiliateOverview } from "../components/affiliates/overview";
import { AffiliateLinks } from "../components/affiliates/links";
import { useAuth } from "../hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { CheckCircle2, AlertCircle, DollarSign, BarChart3, Users, Link2, Settings, ChevronRight } from "lucide-react";

export default function AffiliatePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth() || {};
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    website: "",
    socialMedia: {
      instagram: "",
      twitter: "",
      youtube: "",
      tiktok: ""
    },
    promotionChannels: [] as string[],
    categories: [] as string[],
    experience: "beginner",
    paymentMethod: "paypal",
    taxId: "",
    termsAccepted: false
  });

  // Check if the user is an affiliate
  const { data: affiliateData, isLoading, error } = useQuery<{success: boolean, data: any}>({
    queryKey: ["affiliate", "me"],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/affiliate/me');
        return response.data;
      } catch (error: any) {
        // If 404, user is not an affiliate yet
        if (error.response?.status === 404) {
          return { success: false, data: null };
        }
        throw error;
      }
    },
    enabled: !!user,
    retry: false
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle social media input changes
  const handleSocialChange = (platform: string, value: string) => {
    setFormData({
      ...formData,
      socialMedia: {
        ...formData.socialMedia,
        [platform]: value
      }
    });
  };

  // Handle checkbox changes for arrays
  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        [field]: [...formData[field as keyof typeof formData] as string[], value]
      });
    } else {
      setFormData({
        ...formData,
        [field]: (formData[field as keyof typeof formData] as string[]).filter(item => item !== value)
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle terms acceptance toggle
  const handleTermsToggle = (checked: boolean) => {
    setFormData({
      ...formData,
      termsAccepted: checked
    });
  };

  // Submit affiliate registration
  const handleSubmitRegistration = async () => {
    try {
      const response = await axios.post('/api/affiliate/register', formData);
      if (response.data.success) {
        // Reset form and close dialog
        setIsRegistrationOpen(false);
        // Refetch affiliate data to update UI
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to ensure server-side changes are processed
        window.location.reload(); // Simple way to refresh the entire page and data
      }
    } catch (error) {
      console.error('Error registering as affiliate:', error);
      alert('Error al registrar como afiliado. Por favor intenta nuevamente.');
    }
  };

  // If still loading
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6 animate-pulse">
        <div className="h-8 bg-primary/10 rounded w-1/3"></div>
        <div className="h-64 bg-primary/5 rounded"></div>
      </div>
    );
  }

  // If error or user is not authenticated
  if (error || !user) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error ? 
              (error as Error).message || "Error al cargar datos de afiliado" :
              "Debes iniciar sesión para acceder al programa de afiliados."
            }
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If user is not an affiliate yet
  if (!affiliateData?.success || !affiliateData?.data) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Programa de Afiliados</h1>
        
        <Card className="border-primary/10 mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Conviértete en Afiliado
            </CardTitle>
            <CardDescription>
              Genera ingresos promocionando nuestros productos y servicios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Nuestro programa de afiliados te permite ganar comisiones por cada venta
              que generes a través de tus enlaces personalizados. Es una excelente manera
              de monetizar tu audiencia mientras ayudas a artistas y creadores.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-primary/5">
                <DollarSign className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-medium">Comisiones Competitivas</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Gana hasta un 30% por cada venta que generes
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-primary/5">
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-medium">Análisis Detallado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Rastrea clics, conversiones y ganancias en tiempo real
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-primary/5">
                <Users className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-medium">Programa de Niveles</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Avanza de nivel y obtén mayores comisiones y beneficios
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">Solicitar registro como afiliado</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Solicitud de Registro como Afiliado</DialogTitle>
                  <DialogDescription>
                    Completa el siguiente formulario para solicitar unirte a nuestro programa de afiliados.
                    Revisaremos tu solicitud y te notificaremos por correo.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input 
                        id="firstName" 
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input 
                        id="lastName" 
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono (opcional)</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio web (opcional)</Label>
                    <Input 
                      id="website" 
                      name="website"
                      placeholder="https://tuwebsite.com"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Redes sociales (opcional)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="instagram" className="text-xs">Instagram</Label>
                        <Input 
                          id="instagram" 
                          placeholder="@usuario"
                          value={formData.socialMedia.instagram}
                          onChange={(e) => handleSocialChange('instagram', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="twitter" className="text-xs">Twitter</Label>
                        <Input 
                          id="twitter" 
                          placeholder="@usuario"
                          value={formData.socialMedia.twitter}
                          onChange={(e) => handleSocialChange('twitter', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="youtube" className="text-xs">YouTube</Label>
                        <Input 
                          id="youtube" 
                          placeholder="URL o nombre del canal"
                          value={formData.socialMedia.youtube}
                          onChange={(e) => handleSocialChange('youtube', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tiktok" className="text-xs">TikTok</Label>
                        <Input 
                          id="tiktok" 
                          placeholder="@usuario"
                          value={formData.socialMedia.tiktok}
                          onChange={(e) => handleSocialChange('tiktok', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>¿Cómo planeas promocionar nuestros productos?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'website', label: 'Sitio web' },
                        { id: 'social_media', label: 'Redes sociales' },
                        { id: 'blog', label: 'Blog' },
                        { id: 'email', label: 'Email marketing' },
                        { id: 'youtube', label: 'YouTube' },
                        { id: 'podcast', label: 'Podcast' }
                      ].map(channel => (
                        <div className="flex items-center space-x-2" key={channel.id}>
                          <input
                            type="checkbox"
                            id={`channel-${channel.id}`}
                            checked={formData.promotionChannels.includes(channel.id)}
                            onChange={(e) => handleCheckboxChange('promotionChannels', channel.id, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor={`channel-${channel.id}`}>{channel.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Categorías de interés</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'music_production', label: 'Producción musical' },
                        { id: 'recording', label: 'Grabación' },
                        { id: 'mixing', label: 'Mezcla' },
                        { id: 'mastering', label: 'Masterización' },
                        { id: 'songwriting', label: 'Composición' },
                        { id: 'music_business', label: 'Industria musical' }
                      ].map(category => (
                        <div className="flex items-center space-x-2" key={category.id}>
                          <input
                            type="checkbox"
                            id={`category-${category.id}`}
                            checked={formData.categories.includes(category.id)}
                            onChange={(e) => handleCheckboxChange('categories', category.id, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor={`category-${category.id}`}>{category.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experiencia como afiliado</Label>
                    <Select 
                      value={formData.experience} 
                      onValueChange={(value) => handleSelectChange('experience', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu nivel de experiencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Principiante (Primera vez)</SelectItem>
                        <SelectItem value="intermediate">Intermedio (1-2 años)</SelectItem>
                        <SelectItem value="advanced">Avanzado (3+ años)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Método de pago preferido</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value) => handleSelectChange('paymentMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="bank_transfer">Transferencia bancaria</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxId">ID Fiscal / RFC (opcional)</Label>
                    <Input 
                      id="taxId" 
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Para empresas o personas que requieran factura
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      checked={formData.termsAccepted} 
                      onCheckedChange={handleTermsToggle} 
                      id="terms"
                    />
                    <Label htmlFor="terms" className="text-sm">
                      Acepto los <a href="#" className="text-primary underline">términos y condiciones</a> del programa de afiliados
                    </Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRegistrationOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmitRegistration}
                    disabled={!formData.termsAccepted || !formData.firstName || !formData.lastName || !formData.email}
                  >
                    Enviar solicitud
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
        
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">Beneficios y Comisiones</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Nivel Básico</CardTitle>
                <CardDescription>Comienza aquí</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">10%</div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Comisión base en todos los productos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Acceso a enlaces de afiliado
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Estadísticas básicas
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded absolute right-4 top-4">Popular</div>
                <CardTitle className="text-lg">Nivel Plata</CardTitle>
                <CardDescription>Para afiliados activos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">15-20%</div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Comisión aumentada en todos los productos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Acceso prioritario a nuevos lanzamientos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Estadísticas detalladas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Materiales promocionales exclusivos
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Nivel Oro</CardTitle>
                <CardDescription>Para afiliados premium</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">25-30%</div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Máxima comisión en todos los productos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Acceso a programa de recompensas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Soporte personalizado
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Oportunidades de co-marketing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Pagos anticipados
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If user is an affiliate
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Panel de Afiliado</h1>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <div className={`
            h-2 w-2 rounded-full 
            ${affiliateData.data.status === 'approved' ? 'bg-green-500' : 'bg-amber-500'}
          `} />
          <span className="text-sm">
            Estado: {affiliateData.data.status === 'approved' ? 'Aprobado' : 'Pendiente de revisión'}
          </span>
        </div>
      </div>

      {affiliateData.data.status === 'pending' && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Solicitud en revisión</AlertTitle>
          <AlertDescription>
            Tu solicitud para unirte al programa de afiliados está siendo revisada. 
            Te notificaremos por correo electrónico cuando sea aprobada.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Enlaces</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Pagos</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Ajustes</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <AffiliateOverview />
        </TabsContent>
        
        <TabsContent value="links">
          <AffiliateLinks />
        </TabsContent>
        
        <TabsContent value="payments">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Historial de Pagos</h2>
                <p className="text-muted-foreground">
                  Consulta tus pagos y facturas
                </p>
              </div>
            </div>
            
            <Card className="border-primary/10">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px]">
                <div className="rounded-full bg-primary/10 p-3">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-lg">No hay pagos registrados</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Aún no tienes pagos registrados. Los pagos se procesan el día 15 de cada mes
                  cuando tu saldo acumulado supera los $50.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
                <p className="text-muted-foreground">
                  Gestiona tus datos y preferencias como afiliado
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="text-lg">Información de Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Nombre:</div>
                    <div>{affiliateData.data.firstName} {affiliateData.data.lastName}</div>
                    
                    <div className="text-muted-foreground">Email:</div>
                    <div>{affiliateData.data.email}</div>
                    
                    <div className="text-muted-foreground">Teléfono:</div>
                    <div>{affiliateData.data.phone || "-"}</div>
                    
                    <div className="text-muted-foreground">Sitio web:</div>
                    <div>{affiliateData.data.website || "-"}</div>
                    
                    <div className="text-muted-foreground">Nivel:</div>
                    <div>{affiliateData.data.level}</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    Editar perfil
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="text-lg">Método de pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Método actual:</div>
                    <div>{affiliateData.data.paymentMethod === "paypal" ? "PayPal" : 
                          affiliateData.data.paymentMethod === "bank_transfer" ? "Transferencia bancaria" : 
                          "Stripe"}</div>
                    
                    <div className="text-muted-foreground">ID Fiscal:</div>
                    <div>{affiliateData.data.taxId || "-"}</div>
                    
                    <div className="text-muted-foreground">Última actualización:</div>
                    <div>{new Date(affiliateData.data.createdAt).toLocaleDateString()}</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    Actualizar método de pago
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Notificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Nuevas conversiones</h4>
                      <p className="text-sm text-muted-foreground">Recibe notificaciones cuando generes una venta</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Pagos procesados</h4>
                      <p className="text-sm text-muted-foreground">Recibe notificaciones cuando se procese un pago</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Nuevos productos disponibles</h4>
                      <p className="text-sm text-muted-foreground">Recibe notificaciones cuando haya nuevos productos para promocionar</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}