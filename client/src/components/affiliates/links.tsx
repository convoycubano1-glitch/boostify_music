import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Link, LinkIcon, Plus, Copy, ExternalLink, Trash2, BarChart3, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";

interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  url: string;
  imageUrl: string;
  commissionRate: number;
  type: string;
  category: string;
}

interface AffiliateLink {
  id: string;
  productId: string;
  campaign: string;
  url: string;
  clicks: number;
  conversions: number;
  earnings: number;
  product: {
    id: string;
    name: string;
    url: string;
    imageUrl: string;
    commissionRate: number;
  };
  createdAt: Date;
  utmParams: {
    source: string;
    medium: string;
    campaign: string;
  };
}

export function AffiliateLinks() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [campaign, setCampaign] = useState("");
  const [utmSource, setUtmSource] = useState("boostify_affiliate");
  const [utmMedium, setUtmMedium] = useState("affiliate");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [tab, setTab] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch affiliate products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery<{success: boolean, data: AffiliateProduct[]}>({
    queryKey: ["affiliate", "products"],
    queryFn: async () => {
      const response = await axios.get('/api/affiliate/products');
      return response.data;
    }
  });

  // Fetch affiliate links
  const { data: linksData, isLoading: isLoadingLinks, error: linksError } = useQuery<{success: boolean, data: AffiliateLink[]}>({
    queryKey: ["affiliate", "links"],
    queryFn: async () => {
      const response = await axios.get('/api/affiliate/links');
      return response.data;
    }
  });

  // Create new affiliate link
  const createLinkMutation = useMutation({
    mutationFn: async (linkData: any) => {
      const response = await axios.post('/api/affiliate/links', linkData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate", "links"] });
      setIsCreateDialogOpen(false);
      setCampaign("");
      setSelectedProduct("");
      setUtmCampaign("");
      toast({
        title: "Enlace creado",
        description: "Tu enlace de afiliado ha sido creado correctamente",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Hubo un error al crear el enlace",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Delete affiliate link
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await axios.delete(`/api/affiliate/links/${linkId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate", "links"] });
      toast({
        title: "Enlace eliminado",
        description: "El enlace ha sido eliminado correctamente",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Hubo un error al eliminar el enlace",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Copy link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Enlace copiado",
      description: "El enlace ha sido copiado al portapapeles",
      duration: 3000,
    });
  };

  // Handle form submission
  const handleCreateLink = () => {
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Debes seleccionar un producto",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    createLinkMutation.mutate({
      productId: selectedProduct,
      campaign: campaign,
      utmSource: utmSource,
      utmMedium: utmMedium,
      utmCampaign: utmCampaign || campaign,
    });
  };

  // Handle link deletion with confirmation
  const handleDeleteLink = (linkId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este enlace?")) {
      deleteLinkMutation.mutate(linkId);
    }
  };

  // Filter links based on selected tab
  const filteredLinks = linksData?.data ? 
    tab === "all" ? linksData.data :
    tab === "active" ? linksData.data.filter(link => link.clicks > 0) :
    tab === "converting" ? linksData.data.filter(link => link.conversions > 0) :
    linksData.data
  : [];

  if (linksError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {(linksError as Error).message || "Error al cargar enlaces de afiliado"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enlaces de Afiliado</h2>
          <p className="text-muted-foreground">
            Crea y gestiona tus enlaces de afiliado para promocionar productos
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Crear enlace</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear nuevo enlace de afiliado</DialogTitle>
              <DialogDescription>
                Selecciona un producto y personaliza tu enlace de afiliado para promocionarlo
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Producto</Label>
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingProducts && (
                      <div className="p-2">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    )}
                    {productsData?.data && productsData.data.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campaña (opcional)</Label>
                <Input
                  id="campaign"
                  placeholder="Nombre de tu campaña"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Un identificador para agrupar enlaces de la misma campaña
                </p>
              </div>

              <div className="space-y-2">
                <Label>Parámetros UTM personalizados (opcional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="utmSource" className="text-xs">UTM Source</Label>
                    <Input
                      id="utmSource"
                      placeholder="boostify_affiliate"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="utmMedium" className="text-xs">UTM Medium</Label>
                    <Input
                      id="utmMedium"
                      placeholder="affiliate"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="utmCampaign" className="text-xs">UTM Campaign</Label>
                  <Input
                    id="utmCampaign"
                    placeholder={campaign || "partner"}
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateLink} disabled={createLinkMutation.isPending}>
                {createLinkMutation.isPending ? "Creando..." : "Crear enlace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for filtering links */}
      <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Todos los enlaces</TabsTrigger>
          <TabsTrigger value="active">Enlaces activos</TabsTrigger>
          <TabsTrigger value="converting">Con conversiones</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {renderLinksList(filteredLinks, isLoadingLinks, handleDeleteLink, copyToClipboard)}
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          {renderLinksList(filteredLinks, isLoadingLinks, handleDeleteLink, copyToClipboard)}
        </TabsContent>
        <TabsContent value="converting" className="mt-4">
          {renderLinksList(filteredLinks, isLoadingLinks, handleDeleteLink, copyToClipboard)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to render the links list
function renderLinksList(
  links: AffiliateLink[],
  isLoading: boolean,
  handleDelete: (id: string) => void,
  copyToClipboard: (url: string) => void
) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-primary/10">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <Card className="border-primary/10">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Link className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-medium text-lg">No hay enlaces</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Aún no tienes enlaces de afiliado en esta categoría. Crea tu primer enlace para comenzar a promocionar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {links.map((link) => (
        <Card key={link.id} className="border-primary/10">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      {link.product.name}
                      {link.campaign && (
                        <Badge variant="outline" className="ml-2">
                          {link.campaign}
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Creado el {new Date(link.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="flex items-center gap-1"
                  >
                    {link.product.commissionRate}%
                  </Badge>
                </div>

                <div className="bg-muted/30 p-3 rounded-md flex items-center gap-2 group relative">
                  <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-sm flex-1">
                    {link.url}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(link.url)}
                      title="Copiar enlace"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => window.open(link.url, '_blank')}
                      title="Abrir enlace"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center md:border-l md:pl-4 md:border-primary/10">
                <div className="text-center">
                  <div className="text-2xl font-bold">{link.clicks}</div>
                  <div className="text-xs text-muted-foreground">Clics</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{link.conversions}</div>
                  <div className="text-xs text-muted-foreground">Conversiones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${link.earnings.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Ganancias</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs flex items-center gap-1"
                onClick={() => window.open(`#/stats?link=${link.id}`, '_blank')}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Estadísticas</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs text-destructive flex items-center gap-1 hover:bg-destructive/10"
                onClick={() => handleDelete(link.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}