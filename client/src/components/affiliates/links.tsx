import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ProgressCircular } from "../ui/progress-circular";
import { useToast } from "../../hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Copy, 
  ExternalLink, 
  FileText, 
  InfoIcon, 
  Link, 
  LinkIcon, 
  Loader2, 
  PlusCircle, 
  RefreshCcw, 
  Share, 
  ShoppingBag, 
  Trash2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";

// Esquema de validación para la creación de enlaces de afiliado
const createLinkSchema = z.object({
  productName: z
    .string()
    .min(3, { message: "El nombre del producto debe tener al menos 3 caracteres" }),
  productUrl: z
    .string()
    .url({ message: "Debe ser una URL válida" }),
  utmSource: z
    .string()
    .optional(),
  utmMedium: z
    .string()
    .optional(),
  utmCampaign: z
    .string()
    .optional(),
});

type AffiliateLink = {
  id: string;
  productName: string;
  productUrl: string;
  affiliateUrl: string;
  createdAt: string | Date;
  clicks: number;
  conversions: number;
  revenue: number;
  status: "active" | "pending" | "inactive";
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
};

export function AffiliateLinks() {
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [urlCopied, setUrlCopied] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para el enlace seleccionado (para mostrar detalles)
  const [selectedLink, setSelectedLink] = useState<AffiliateLink | null>(null);
  
  // Obtener productos disponibles para afiliados
  const { 
    data: products,
    isLoading: isLoadingProducts,
    isError: productsError,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ["affiliate", "products"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/affiliate/products");
        return response.data;
      } catch (error) {
        console.error("Error fetching affiliate products:", error);
        throw error;
      }
    },
  });
  
  // Obtener enlaces de afiliado existentes
  const { 
    data: links,
    isLoading: isLoadingLinks,
    isError: linksError,
    refetch: refetchLinks
  } = useQuery({
    queryKey: ["affiliate", "links"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/affiliate/links");
        return response.data;
      } catch (error) {
        console.error("Error fetching affiliate links:", error);
        throw error;
      }
    },
  });
  
  // Formulario para crear nuevos enlaces
  const form = useForm<z.infer<typeof createLinkSchema>>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: {
      productName: "",
      productUrl: "",
      utmSource: "affiliate",
      utmMedium: "social",
      utmCampaign: "",
    },
  });
  
  // Mostrar producto predefinido si se selecciona
  const handleProductSelect = (productId: string) => {
    if (!products || !products.products) return;
    
    const selectedProduct = products.products.find((p: any) => p.id === productId);
    if (selectedProduct) {
      form.setValue("productName", selectedProduct.name);
      form.setValue("productUrl", selectedProduct.url);
    }
  };
  
  // Mutación para crear un nuevo enlace de afiliado
  const createLinkMutation = useMutation({
    mutationFn: async (linkData: z.infer<typeof createLinkSchema>) => {
      const response = await axios.post("/api/affiliate/links", linkData);
      return response.data;
    },
    onSuccess: () => {
      // Refrescar la lista de enlaces
      queryClient.invalidateQueries({ queryKey: ["affiliate", "links"] });
      // Resetear el formulario
      form.reset();
      // Cerrar el diálogo
      setIsDialogOpen(false);
      // Mostrar notificación de éxito
      toast({
        title: "Enlace creado",
        description: "Tu enlace de afiliado ha sido creado correctamente",
      });
    },
    onError: (error: any) => {
      console.error("Error creating affiliate link:", error);
      toast({
        title: "Error al crear enlace",
        description: error.response?.data?.message || "Hubo un problema al crear el enlace",
        variant: "destructive",
      });
    },
  });
  
  // Mutación para eliminar un enlace
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await axios.delete(`/api/affiliate/links/${linkId}`);
      return response.data;
    },
    onSuccess: () => {
      // Refrescar la lista de enlaces
      queryClient.invalidateQueries({ queryKey: ["affiliate", "links"] });
      toast({
        title: "Enlace eliminado",
        description: "El enlace ha sido eliminado correctamente",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting affiliate link:", error);
      toast({
        title: "Error al eliminar enlace",
        description: error.response?.data?.message || "Hubo un problema al eliminar el enlace",
        variant: "destructive",
      });
    },
  });
  
  // Manejar envío del formulario
  const onSubmit = (values: z.infer<typeof createLinkSchema>) => {
    createLinkMutation.mutate(values);
  };
  
  // Copiar enlace al portapapeles
  const copyToClipboard = (url: string, linkId: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setUrlCopied(linkId);
      setTimeout(() => setUrlCopied(null), 2000);
      
      toast({
        title: "Enlace copiado",
        description: "El enlace ha sido copiado al portapapeles",
      });
    });
  };
  
  // Abrir enlace en nueva pestaña
  const openUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };
  
  // Filtrar enlaces según pestaña seleccionada
  const filteredLinks = () => {
    if (!links || !links.links) return [];
    
    if (selectedTab === "all") return links.links;
    return links.links.filter((link: AffiliateLink) => link.status === selectedTab);
  };
  
  // Si está cargando, mostrar indicador de carga
  if (isLoadingLinks) {
    return (
      <div className="w-full py-12 flex justify-center">
        <ProgressCircular />
      </div>
    );
  }
  
  // Si hay un error, mostrar mensaje de error
  if (linksError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No pudimos cargar tus enlaces de afiliado. Por favor, intenta de nuevo más tarde.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Si no hay enlaces, mostrar estado vacío
  const hasLinks = links && links.links && links.links.length > 0;
  
  return (
    <div className="space-y-6">
      {/* Tarjeta principal con acciones y lista de enlaces */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <CardTitle>Enlaces de afiliado</CardTitle>
            <CardDescription>
              Gestiona tus enlaces personalizados para compartir
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Crear nuevo enlace
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear enlace de afiliado</DialogTitle>
                <DialogDescription>
                  Crea un enlace personalizado para promocionar productos y ganar comisiones.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Productos predefinidos disponibles */}
                  {products && products.products && products.products.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="predefined">Productos disponibles</Label>
                      <Select onValueChange={handleProductSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Selecciona un producto predefinido o crea uno personalizado
                      </p>
                    </div>
                  )}
                  
                  {/* Nombre del producto */}
                  <FormField
                    control={form.control}
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del producto</FormLabel>
                        <FormControl>
                          <Input placeholder="Curso básico de música" {...field} />
                        </FormControl>
                        <FormDescription>
                          Nombre descriptivo para identificar este enlace
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* URL del producto */}
                  <FormField
                    control={form.control}
                    name="productUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL del producto</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://ejemplo.com/producto" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enlace directo al producto que quieres promocionar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Parámetros UTM avanzados */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium">Parámetros UTM (Opcional)</h4>
                      <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="utmSource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuente</FormLabel>
                            <FormControl>
                              <Input placeholder="affiliate" {...field} />
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
                            <FormLabel>Medio</FormLabel>
                            <FormControl>
                              <Input placeholder="social" {...field} />
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
                            <FormLabel>Campaña</FormLabel>
                            <FormControl>
                              <Input placeholder="summer_promo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createLinkMutation.isPending}
                    >
                      {createLinkMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>Crear enlace</>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          {/* Tabs para filtrar enlaces */}
          <Tabs
            defaultValue="all"
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="mb-6"
          >
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="inactive">Inactivos</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Tabla de enlaces */}
          {hasLinks ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del producto</TableHead>
                    <TableHead className="hidden md:table-cell">Enlace</TableHead>
                    <TableHead className="hidden lg:table-cell">Clics</TableHead>
                    <TableHead className="hidden lg:table-cell">Conversiones</TableHead>
                    <TableHead className="hidden md:table-cell">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks().map((link: AffiliateLink) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          <span>{link.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs">
                        <div className="truncate text-xs text-muted-foreground">
                          {link.affiliateUrl}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {link.clicks}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {link.conversions}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize",
                            link.status === "active" && "border-green-500 text-green-500",
                            link.status === "pending" && "border-yellow-500 text-yellow-500",
                            link.status === "inactive" && "border-slate-500 text-slate-500"
                          )}
                        >
                          {link.status === "active" && "Activo"}
                          {link.status === "pending" && "Pendiente"}
                          {link.status === "inactive" && "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(link.affiliateUrl, link.id)}
                          >
                            {urlCopied === link.id ? (
                              <div className="text-xs font-medium">Copiado</div>
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openUrl(link.affiliateUrl)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedLink(link)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("¿Estás seguro de que quieres eliminar este enlace?")) {
                                deleteLinkMutation.mutate(link.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyLinksState />
          )}
        </CardContent>
      </Card>
      
      {/* Dialog para ver detalles de un enlace */}
      {selectedLink && (
        <Dialog open={!!selectedLink} onOpenChange={() => setSelectedLink(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalles del enlace</DialogTitle>
              <DialogDescription>
                Información detallada y estadísticas del enlace de afiliado
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Producto</h3>
                <p className="text-base font-semibold">{selectedLink.productName}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">URL de destino</h3>
                <div className="flex items-center">
                  <p className="text-sm break-all text-muted-foreground mr-2">{selectedLink.productUrl}</p>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => openUrl(selectedLink.productUrl)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Enlace de afiliado</h3>
                <div className="flex items-center gap-2">
                  <Input 
                    readOnly 
                    value={selectedLink.affiliateUrl} 
                    className="font-mono text-xs"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => copyToClipboard(selectedLink.affiliateUrl, 'detail-view')}
                  >
                    {urlCopied === 'detail-view' ? (
                      <div className="text-xs font-medium">Copiado</div>
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Clics</h3>
                  <p className="text-2xl font-bold">{selectedLink.clicks}</p>
                </div>
                <div className="bg-muted/50 border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Conversiones</h3>
                  <p className="text-2xl font-bold">{selectedLink.conversions}</p>
                </div>
                <div className="bg-muted/50 border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Tasa</h3>
                  <p className="text-2xl font-bold">
                    {selectedLink.clicks > 0 
                      ? `${((selectedLink.conversions / selectedLink.clicks) * 100).toFixed(1)}%` 
                      : '0%'}
                  </p>
                </div>
              </div>
              
              {selectedLink.utmParams && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Parámetros UTM</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Fuente:</span>{" "}
                      <span className="text-muted-foreground">{selectedLink.utmParams.source || "-"}</span>
                    </div>
                    <div>
                      <span className="font-medium">Medio:</span>{" "}
                      <span className="text-muted-foreground">{selectedLink.utmParams.medium || "-"}</span>
                    </div>
                    <div>
                      <span className="font-medium">Campaña:</span>{" "}
                      <span className="text-muted-foreground">{selectedLink.utmParams.campaign || "-"}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    // Intentar compartir con Web Share API si está disponible
                    if (navigator.share) {
                      navigator.share({
                        title: `Enlace afiliado: ${selectedLink.productName}`,
                        text: `Échale un vistazo a ${selectedLink.productName}`,
                        url: selectedLink.affiliateUrl,
                      })
                      .catch(err => {
                        console.error('Error al compartir:', err);
                      });
                    } else {
                      // Fallback a copiar al portapapeles
                      copyToClipboard(selectedLink.affiliateUrl, 'share-button');
                    }
                  }}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Compartir enlace
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Estado vacío cuando no hay enlaces
function EmptyLinksState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
        <LinkIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-2">Sin enlaces de afiliado</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Aún no has creado ningún enlace de afiliado. Crea tu primer enlace para comenzar a ganar comisiones.
      </p>
    </div>
  );
}