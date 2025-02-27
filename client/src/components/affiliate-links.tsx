import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, deleteDoc, DocumentData } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Copy,
  ExternalLink,
  Link as LinkIcon,
  BarChart3,
  Trash2,
  Settings,
  Edit,
  PlusCircle,
  Share2,
  Clipboard,
  ClipboardCheck,
} from "lucide-react";

// Esquema para validación del formulario de creación de enlaces
const linkFormSchema = z.object({
  productId: z.string({
    required_error: "Por favor selecciona un producto",
  }),
  customName: z.string().optional(),
  utmSource: z.string().default("affiliate"),
  utmMedium: z.string().default("referral"),
  utmCampaign: z.string().optional(),
});

type LinkFormValues = z.infer<typeof linkFormSchema>;

interface AffiliateLinksProps {
  affiliateData: any;
}

export function AffiliateLinks({ affiliateData }: AffiliateLinksProps) {
  const { user } = useAuth() || {};
  const { toast } = useToast();
  const [selectedLink, setSelectedLink] = useState<DocumentData | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Formulario para crear/editar enlaces
  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      productId: "",
      customName: "",
      utmSource: "affiliate",
      utmMedium: "referral",
      utmCampaign: "",
    },
  });

  // Consulta de productos disponibles para afiliar
  const { data: products = [] } = useQuery({
    queryKey: ["affiliate-products"],
    queryFn: async () => {
      // Simulando una consulta a los productos disponibles
      // En producción, esto vendría del backend
      return [
        {
          id: "prod1",
          name: "Curso de Producción Musical",
          price: 199.99,
          commissionRate: 25,
          baseUrl: "/education?product=music-production-course",
          category: "course",
        },
        {
          id: "prod2",
          name: "Plugin de Masterización Avanzada",
          price: 149.99,
          commissionRate: 20,
          baseUrl: "/store?product=mastering-plugin",
          category: "plugin",
        },
        {
          id: "prod3",
          name: "Paquete de Distribución Musical",
          price: 99.99,
          commissionRate: 30,
          baseUrl: "/store?product=music-distribution",
          category: "service",
        },
        {
          id: "prod4",
          name: "Mentoría Personalizada",
          price: 299.99,
          commissionRate: 15,
          baseUrl: "/store?product=mentorship",
          category: "service",
        },
        {
          id: "prod5",
          name: "Bundle de Samples Exclusivos",
          price: 49.99,
          commissionRate: 40,
          baseUrl: "/store?product=samples-bundle",
          category: "sample",
        },
      ];
    },
  });

  // Consulta de enlaces del afiliado
  const { 
    data: affiliateLinks = [], 
    isLoading: isLoadingLinks,
    refetch: refetchLinks
  } = useQuery({
    queryKey: ["affiliate-links", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        const linksRef = collection(db, "affiliate_links");
        const q = query(linksRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
      } catch (error) {
        console.error("Error fetching affiliate links:", error);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  // Filtrar enlaces según la pestaña activa
  const filteredLinks = activeTab === "all" 
    ? affiliateLinks 
    : affiliateLinks.filter(link => {
        const product = products.find(p => p.id === link.productId);
        return product?.category === activeTab;
      });

  // Generar URL de afiliado
  const generateAffiliateUrl = (baseUrl: string, referralCode: string, utmParams: Record<string, string>) => {
    const siteUrl = window.location.origin;
    let url = `${siteUrl}${baseUrl}`;
    
    // Añadir código de afiliado
    url += (url.includes('?') ? '&' : '?') + `ref=${referralCode}`;
    
    // Añadir parámetros UTM
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) {
        url += `&${key}=${encodeURIComponent(value)}`;
      }
    });
    
    return url;
  };

  // Crear un nuevo enlace de afiliado
  const createLinkMutation = useMutation({
    mutationFn: async (data: LinkFormValues) => {
      if (!user?.uid) throw new Error("Usuario no autenticado");
      
      const product = products.find(p => p.id === data.productId);
      if (!product) throw new Error("Producto no encontrado");
      
      const utmParams = {
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign || `${product.name.toLowerCase().replace(/\s+/g, '-')}-campaign`,
      };
      
      const linkUrl = generateAffiliateUrl(
        product.baseUrl, 
        affiliateData.referralCode,
        utmParams
      );
      
      const linkData = {
        userId: user.uid,
        productId: data.productId,
        name: data.customName || product.name,
        url: linkUrl,
        commissionRate: product.commissionRate,
        clicks: 0,
        conversions: 0,
        earnings: 0,
        utmParams,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      };
      
      const docRef = await addDoc(collection(db, "affiliate_links"), linkData);
      return { id: docRef.id, ...linkData };
    },
    onSuccess: () => {
      toast({
        title: "Enlace creado",
        description: "Tu enlace de afiliado ha sido creado exitosamente.",
      });
      form.reset();
      setShowLinkDialog(false);
      refetchLinks();
    },
    onError: (error) => {
      console.error("Error al crear enlace:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el enlace. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Actualizar un enlace existente
  const updateLinkMutation = useMutation({
    mutationFn: async (data: { linkId: string; updates: Partial<any> }) => {
      const { linkId, updates } = data;
      const linkRef = doc(db, "affiliate_links", linkId);
      
      await updateDoc(linkRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      return { id: linkId, ...updates };
    },
    onSuccess: () => {
      toast({
        title: "Enlace actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
      setShowEditDialog(false);
      refetchLinks();
    },
    onError: (error) => {
      console.error("Error al actualizar enlace:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el enlace. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Eliminar un enlace
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const linkRef = doc(db, "affiliate_links", linkId);
      await deleteDoc(linkRef);
      return linkId;
    },
    onSuccess: () => {
      toast({
        title: "Enlace eliminado",
        description: "El enlace ha sido eliminado correctamente.",
      });
      refetchLinks();
    },
    onError: (error) => {
      console.error("Error al eliminar enlace:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el enlace. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: LinkFormValues) => {
    createLinkMutation.mutate(values);
  };

  const handleEditLink = (link: DocumentData) => {
    setSelectedLink(link);
    const product = products.find(p => p.id === link.productId);
    
    form.reset({
      productId: link.productId,
      customName: link.name !== product?.name ? link.name : "",
      utmSource: link.utmParams?.utm_source || "affiliate",
      utmMedium: link.utmParams?.utm_medium || "referral",
      utmCampaign: link.utmParams?.utm_campaign || "",
    });
    
    setShowEditDialog(true);
  };

  const handleUpdateLink = () => {
    if (!selectedLink) return;
    
    const formValues = form.getValues();
    const product = products.find(p => p.id === formValues.productId);
    
    if (!product) {
      toast({
        title: "Error",
        description: "Producto no encontrado",
        variant: "destructive",
      });
      return;
    }
    
    const utmParams = {
      utm_source: formValues.utmSource,
      utm_medium: formValues.utmMedium,
      utm_campaign: formValues.utmCampaign || `${product.name.toLowerCase().replace(/\s+/g, '-')}-campaign`,
    };
    
    const linkUrl = generateAffiliateUrl(
      product.baseUrl, 
      affiliateData.referralCode,
      utmParams
    );
    
    updateLinkMutation.mutate({
      linkId: selectedLink.id,
      updates: {
        productId: formValues.productId,
        name: formValues.customName || product.name,
        url: linkUrl,
        utmParams,
      }
    });
  };

  const handleDeleteLink = (linkId: string) => {
    deleteLinkMutation.mutate(linkId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    
    toast({
      title: "Enlace copiado",
      description: "El enlace se ha copiado al portapapeles.",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Obtener estadísticas acumuladas
  const totalClicks = affiliateLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);
  const totalConversions = affiliateLinks.reduce((sum, link) => sum + (link.conversions || 0), 0);
  const totalEarnings = affiliateLinks.reduce((sum, link) => sum + (link.earnings || 0), 0);
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enlaces de afiliado</h2>
          <p className="text-sm text-muted-foreground">
            Crea y gestiona tus enlaces de afiliado para promocionar nuestros productos
          </p>
        </div>
        
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Crear nuevo enlace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear enlace de afiliado</DialogTitle>
              <DialogDescription>
                Selecciona un producto y personaliza tu enlace de afiliado
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Producto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un producto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.commissionRate}% comisión
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre personalizado (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Oferta Black Friday" {...field} />
                      </FormControl>
                      <FormDescription>
                        Un nombre descriptivo para identificar este enlace
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-3">
                  <div className="text-sm font-medium">Parámetros de seguimiento (opcionales)</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="utmSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuente (UTM Source)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="utmMedium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medio (UTM Medium)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="utmCampaign"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaña (UTM Campaign)</FormLabel>
                          <FormControl>
                            <Input placeholder="Opcional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </form>
            </Form>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={createLinkMutation.isPending}
              >
                {createLinkMutation.isPending ? "Creando..." : "Crear enlace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo para editar enlaces */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar enlace de afiliado</DialogTitle>
              <DialogDescription>
                Modifica los detalles de tu enlace de afiliado
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Producto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un producto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.commissionRate}% comisión
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre personalizado (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Oferta Black Friday" {...field} />
                      </FormControl>
                      <FormDescription>
                        Un nombre descriptivo para identificar este enlace
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-3">
                  <div className="text-sm font-medium">Parámetros de seguimiento</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="utmSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuente (UTM Source)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="utmMedium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medio (UTM Medium)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="utmCampaign"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaña (UTM Campaign)</FormLabel>
                          <FormControl>
                            <Input placeholder="Opcional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </Form>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateLink}
                disabled={updateLinkMutation.isPending}
              >
                {updateLinkMutation.isPending ? "Actualizando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enlaces totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliateLinks.length}</div>
            <p className="text-xs text-muted-foreground">
              Enlaces activos de afiliado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clics totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              Visitas generadas por tus enlaces
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              Tasa de conversión: {conversionRate}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ganancias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Comisiones acumuladas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="course">Cursos</TabsTrigger>
          <TabsTrigger value="plugin">Plugins</TabsTrigger>
          <TabsTrigger value="service">Servicios</TabsTrigger>
          <TabsTrigger value="sample">Samples</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="m-0">
          {isLoadingLinks ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <LinkIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No hay enlaces aún</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {activeTab === "all" 
                  ? "Aún no has creado ningún enlace de afiliado" 
                  : `No tienes enlaces para productos en la categoría "${activeTab}"`}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowLinkDialog(true)}
                className="mx-auto"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Crear enlace
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLinks.map((link) => {
                const product = products.find(p => p.id === link.productId);
                return (
                  <Card key={link.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-medium">
                            {link.name}
                          </CardTitle>
                          <Badge variant="outline" className="ml-2">
                            {product?.commissionRate || link.commissionRate}% comisión
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditLink(link)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar enlace?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El enlace será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteLink(link.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <div className="relative">
                        <Input 
                          value={link.url} 
                          readOnly 
                          className="pr-20 text-xs bg-muted/20"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => copyToClipboard(link.url)}
                        >
                          {copied ? (
                            <ClipboardCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clipboard className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">{link.clicks || 0}</div>
                          <p className="text-xs text-muted-foreground">Clics</p>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{link.conversions || 0}</div>
                          <p className="text-xs text-muted-foreground">Conversiones</p>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">${(link.earnings || 0).toFixed(2)}</div>
                          <p className="text-xs text-muted-foreground">Ganancias</p>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0 pb-3 flex justify-between">
                      <div className="text-xs text-muted-foreground">
                        Creado: {new Date(link.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Abrir
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          <Share2 className="h-3 w-3 mr-1" />
                          Compartir
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Estadísticas
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}