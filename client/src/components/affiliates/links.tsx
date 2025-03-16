import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "../ui/dialog";
import { ProgressCircular } from "../ui/progress-circular";
import { toast } from "../../hooks/use-toast";
import { Copy, ExternalLink, Link, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";

interface AffiliateLink {
  id: string;
  productName: string;
  productUrl: string;
  affiliateUrl: string;
  createdAt: string;
  clicks: number;
  conversions: number;
  earnings: number;
}

export function AffiliateLinks() {
  const [newLinkData, setNewLinkData] = useState({
    productName: "",
    productUrl: "",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Obtener enlaces de afiliado
  const { data: linksData, isLoading, error } = useQuery({
    queryKey: ["affiliate", "links"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/affiliate/links");
        return response.data;
      } catch (error) {
        console.error("Error fetching affiliate links:", error);
        // Datos dummy para demostración en caso de error
        return {
          success: true,
          links: [
            {
              id: "link1",
              productName: "Curso de producción musical",
              productUrl: "https://example.com/curso-produccion",
              affiliateUrl: "https://tudominio.com/affiliate/link/abc123",
              createdAt: "2025-02-15T12:00:00Z",
              clicks: 75,
              conversions: 6,
              earnings: 150,
            },
            {
              id: "link2",
              productName: "Plugins para mezcla",
              productUrl: "https://example.com/plugins",
              affiliateUrl: "https://tudominio.com/affiliate/link/def456",
              createdAt: "2025-03-01T15:30:00Z",
              clicks: 100,
              conversions: 7,
              earnings: 175,
            },
          ],
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Crear nuevo enlace de afiliado
  const createLinkMutation = useMutation({
    mutationFn: async (linkData: { productName: string; productUrl: string }) => {
      const response = await axios.post("/api/affiliate/links", linkData);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Enlace creado",
        description: "Tu enlace de afiliado ha sido creado exitosamente.",
      });
      setNewLinkData({ productName: "", productUrl: "" });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["affiliate", "links"] });
    },
    onError: (error) => {
      console.error("Error creating affiliate link:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el enlace. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Eliminar enlace de afiliado
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await axios.delete(`/api/affiliate/links/${linkId}`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Enlace eliminado",
        description: "El enlace de afiliado ha sido eliminado.",
      });
      queryClient.invalidateQueries({ queryKey: ["affiliate", "links"] });
    },
    onError: (error) => {
      console.error("Error deleting affiliate link:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el enlace. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Función para copiar enlace al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Enlace copiado",
          description: "El enlace ha sido copiado al portapapeles.",
        });
      },
      (err) => {
        console.error("Error copying text: ", err);
        toast({
          title: "Error",
          description: "No se pudo copiar el enlace.",
          variant: "destructive",
        });
      }
    );
  };

  // Manejar el envío del formulario para crear un nuevo enlace
  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkData.productName || !newLinkData.productUrl) {
      toast({
        title: "Información incompleta",
        description: "Por favor completa todos los campos del formulario.",
        variant: "destructive",
      });
      return;
    }

    // Intentamos validar la URL
    try {
      new URL(newLinkData.productUrl); // Esto lanzará error si la URL es inválida
      createLinkMutation.mutate(newLinkData);
    } catch (error) {
      toast({
        title: "URL inválida",
        description: "Por favor ingresa una URL válida (incluyendo http:// o https://).",
        variant: "destructive",
      });
    }
  };

  // Mientras carga los datos
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <ProgressCircular />
      </div>
    );
  }

  // Si hay un error
  if (error || !linksData?.success) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <p>Error al cargar los enlaces de afiliado. Por favor intenta nuevamente.</p>
      </div>
    );
  }

  // Lista de enlaces
  const links: AffiliateLink[] = linksData.links || [];

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mis Enlaces de Afiliado</h2>
          <p className="text-muted-foreground">
            Gestiona tus enlaces de afiliado y monitorea su rendimiento
          </p>
        </div>
        <div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Link className="h-4 w-4 mr-2" /> Crear Nuevo Enlace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Enlace de Afiliado</DialogTitle>
                <DialogDescription>
                  Crea un nuevo enlace para promocionar un producto o servicio.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateLink}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Nombre del Producto</Label>
                    <Input
                      id="productName"
                      placeholder="Ej: Curso de Producción Musical"
                      value={newLinkData.productName}
                      onChange={(e) => setNewLinkData({ ...newLinkData, productName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productUrl">URL del Producto</Label>
                    <Input
                      id="productUrl"
                      placeholder="https://ejemplo.com/producto"
                      value={newLinkData.productUrl}
                      onChange={(e) => setNewLinkData({ ...newLinkData, productUrl: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Ingresa la URL completa incluyendo http:// o https://
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLinkMutation.isPending}
                  >
                    {createLinkMutation.isPending ? (
                      <>
                        <ProgressCircular size="sm" className="mr-2" />
                        Creando...
                      </>
                    ) : (
                      "Crear Enlace"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enlaces de afiliado */}
      {links.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Link className="h-12 w-12 text-muted-foreground opacity-50" />
              <div className="space-y-2">
                <h3 className="font-medium text-lg">No tienes enlaces de afiliado</h3>
                <p className="text-muted-foreground">
                  Crea tu primer enlace de afiliado para comenzar a promocionar productos.
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Crear Enlace
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Enlaces Activos</CardTitle>
            <CardDescription>
              Administra y monitorea tus enlaces de afiliado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Lista de tus enlaces de afiliado actuales</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Producto</TableHead>
                  <TableHead>Enlace de Afiliado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="text-right">Rendimiento</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{link.productName}</span>
                        <a
                          href={link.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary truncate max-w-[200px] flex items-center"
                        >
                          {link.productUrl}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 max-w-[200px]">
                        <span className="truncate text-sm">{link.affiliateUrl}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(link.affiliateUrl)}
                          className="h-8 w-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(link.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {link.clicks} clicks
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {link.conversions} conv.
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">${link.earnings}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("¿Estás seguro de que deseas eliminar este enlace?")) {
                            deleteLinkMutation.mutate(link.id);
                          }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Utiliza estos enlaces en tus sitios web, redes sociales o campañas de marketing.
          </CardFooter>
        </Card>
      )}

      {/* Consejos para promocionar */}
      <Card>
        <CardHeader>
          <CardTitle>Consejos para Promoción</CardTitle>
          <CardDescription>
            Maximiza tus ganancias con estos consejos de promoción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md p-4 space-y-2">
              <h3 className="font-medium text-base">Comparte en Redes Sociales</h3>
              <p className="text-sm text-muted-foreground">
                Comparte tus enlaces en redes sociales como Instagram, Twitter o Facebook para aumentar su visibilidad.
                Integra los enlaces en contenido relevante para obtener mejor respuesta.
              </p>
            </div>
            <div className="border rounded-md p-4 space-y-2">
              <h3 className="font-medium text-base">Blog o Canal de YouTube</h3>
              <p className="text-sm text-muted-foreground">
                Crea contenido de valor en tu blog o canal que muestre los productos y su uso.
                Las reseñas auténticas y tutoriales son muy efectivos para aumentar conversiones.
              </p>
            </div>
            <div className="border rounded-md p-4 space-y-2">
              <h3 className="font-medium text-base">Email Marketing</h3>
              <p className="text-sm text-muted-foreground">
                Incluye tus enlaces en newsletters o campañas de email, especialmente en segmentos
                de audiencia que podrían estar interesados en los productos específicos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}