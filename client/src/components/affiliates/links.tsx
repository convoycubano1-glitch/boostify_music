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
  AlertCircle,
  Copy,
  ExternalLink,
  Eye,
  Link as LinkIcon,
  Link2,
  MousePointerClick,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Separator } from "../ui/separator";
import { ProgressCircular } from "../ui/progress-circular";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../../hooks/use-toast";

// Schema de validación para crear un nuevo enlace
const newLinkSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  customSlug: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

type NewLinkFormValues = z.infer<typeof newLinkSchema>;

/**
 * Componente que muestra y gestiona los enlaces de afiliado
 */
export function AffiliateLinks() {
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewLinkDialog, setShowNewLinkDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Formulario para crear nuevo enlace
  const form = useForm<NewLinkFormValues>({
    resolver: zodResolver(newLinkSchema),
    defaultValues: {
      productId: "",
      customSlug: "",
      utmSource: "affiliate",
      utmMedium: "referral",
      utmCampaign: "",
    },
  });
  
  // Consultar enlaces de afiliado
  const {
    data: linksData,
    isLoading: linksLoading,
    isError: linksError,
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
  
  // Consultar productos disponibles para afiliados
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
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
  
  // Mutación para crear un nuevo enlace
  const createLinkMutation = useMutation({
    mutationFn: async (linkData: NewLinkFormValues) => {
      const response = await axios.post("/api/affiliate/links", linkData);
      return response.data;
    },
    onSuccess: () => {
      // Cerrar el diálogo y limpiar el formulario
      setShowNewLinkDialog(false);
      form.reset();
      
      // Actualizar la lista de enlaces
      queryClient.invalidateQueries({ queryKey: ["affiliate", "links"] });
      
      // Mostrar notificación de éxito
      toast({
        title: "Enlace creado",
        description: "Tu enlace de afiliado ha sido creado con éxito",
      });
    },
    onError: (error: any) => {
      // Mostrar notificación de error
      toast({
        variant: "destructive",
        title: "Error al crear el enlace",
        description: error.response?.data?.message || "Ha ocurrido un error",
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
      // Actualizar la lista de enlaces
      queryClient.invalidateQueries({ queryKey: ["affiliate", "links"] });
      
      // Mostrar notificación de éxito
      toast({
        title: "Enlace eliminado",
        description: "El enlace ha sido eliminado con éxito",
      });
    },
    onError: (error: any) => {
      // Mostrar notificación de error
      toast({
        variant: "destructive",
        title: "Error al eliminar el enlace",
        description: error.response?.data?.message || "Ha ocurrido un error",
      });
    },
  });
  
  // Manejar envío del formulario de nuevo enlace
  const onSubmit = (data: NewLinkFormValues) => {
    createLinkMutation.mutate(data);
  };
  
  // Filtrar enlaces por categoría y término de búsqueda
  const filteredLinks = linksData
    ? linksData.filter((link: any) => {
        const matchesCategory = 
          filterCategory === "all" || 
          link.category === filterCategory;
        
        const matchesSearch =
          searchTerm === "" ||
          link.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          link.productUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (link.customSlug && link.customSlug.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesCategory && matchesSearch;
      })
    : [];
  
  // Extraer categorías únicas de productos
  const categories = productsData
    ? Array.from(new Set(productsData.map((product: any) => product.category)))
    : [];
  
  // Estados de carga
  const isLoading = linksLoading || productsLoading;
  const isError = linksError || productsError;
  
  // Si hay un error, mostrar mensaje de error
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No pudimos cargar la información de enlaces. Por favor, intenta de nuevo más tarde.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Si está cargando, mostrar indicador de carga
  if (isLoading) {
    return <LinksSkeleton />;
  }
  
  // Función para copiar un enlace al portapapeles
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Enlace copiado",
      description: "El enlace ha sido copiado al portapapeles",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar enlaces..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select
            value={filterCategory}
            onValueChange={(value) => setFilterCategory(value)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showNewLinkDialog} onOpenChange={setShowNewLinkDialog}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              Crear enlace
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Crear nuevo enlace de afiliado</DialogTitle>
              <DialogDescription>
                Elige un producto para promocionar y personaliza tu enlace.
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un producto para promocionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productsData && productsData.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Este producto será promocionado a través de tu enlace de afiliado.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customSlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug personalizado (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="mi-enlace-personalizado"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Personaliza la URL de tu enlace para hacerla más fácil de recordar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="bg-muted/40 p-3 rounded-md space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <LinkIcon className="h-3.5 w-3.5" />
                    Parámetros UTM (opcional)
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="utmSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Fuente</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="affiliate"
                              {...field}
                              className="h-8 text-xs"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="utmMedium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Medio</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="referral"
                              {...field}
                              className="h-8 text-xs"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="utmCampaign"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Campaña</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="spring2025"
                              {...field}
                              className="h-8 text-xs"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Los parámetros UTM ayudan a rastrear la efectividad de tus campañas.
                  </p>
                </div>
                
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewLinkDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createLinkMutation.isPending}
                  >
                    {createLinkMutation.isPending ? (
                      <>
                        <ProgressCircular 
                          size="xs" 
                          className="mr-2"
                        />
                        Creando...
                      </>
                    ) : (
                      'Crear enlace'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border">
        {filteredLinks.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Producto</TableHead>
                <TableHead>Enlace</TableHead>
                <TableHead className="text-right">Estadísticas</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLinks.map((link: any) => (
                <TableRow key={link.id}>
                  <TableCell className="py-3">
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[260px]">
                        {link.productName}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1 h-5 capitalize"
                        >
                          {link.category}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-1 h-5"
                        >
                          {link.commission}%
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <LinkIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-[260px]">
                          {link.trackingUrl}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => copyToClipboard(link.trackingUrl)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {link.customSlug && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs h-5 px-1">
                            Personalizado
                          </Badge>
                          <span className="text-xs">{link.customSlug}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right py-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-end gap-1.5">
                        <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">
                          {link.clicks || 0} clics
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">
                          {link.conversions || 0} ventas
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right py-3">
                    <div className="flex items-center justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open(link.trackingUrl, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver enlace</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                if (confirm("¿Estás seguro de que deseas eliminar este enlace?")) {
                                  deleteLinkMutation.mutate(link.id);
                                }
                              }}
                              disabled={deleteLinkMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eliminar enlace</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 rounded-full bg-muted/30 p-3">
              <Link2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-base font-medium">No hay enlaces</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchTerm || filterCategory !== "all"
                ? "No hay enlaces que coincidan con tu búsqueda o filtro."
                : "Aún no has creado ningún enlace de afiliado."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("all");
                setShowNewLinkDialog(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Crear tu primer enlace
            </Button>
          </div>
        )}
      </div>
      
      <div className="bg-muted/30 rounded-lg p-4 border">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <ExternalLink className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Consejos para compartir tus enlaces</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Comparte tus enlaces en tus redes sociales, sitios web o blogs. Recuerda que las 
              personas tienen más probabilidades de hacer clic en enlaces acompañados de una 
              recomendación personal y honesta.
            </p>
            <div className="mt-2">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                Ver guía completa de afiliados
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar un esqueleto durante la carga
function LinksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="h-10 bg-muted animate-pulse rounded-md w-full"></div>
          </div>
          <div className="h-10 bg-muted animate-pulse rounded-md w-full sm:w-40"></div>
        </div>
        <div className="h-10 bg-muted animate-pulse rounded-md w-full sm:w-36"></div>
      </div>
      
      <div className="rounded-md border">
        <div className="p-2">
          <div className="flex flex-col gap-4">
            <div className="h-10 bg-muted animate-pulse rounded-md w-full"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex justify-between items-center py-3">
                  <div className="w-1/4 h-12 bg-muted animate-pulse rounded-md"></div>
                  <div className="w-1/3 h-12 bg-muted animate-pulse rounded-md"></div>
                  <div className="w-1/6 h-12 bg-muted animate-pulse rounded-md"></div>
                  <div className="w-[80px] h-12 bg-muted animate-pulse rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}