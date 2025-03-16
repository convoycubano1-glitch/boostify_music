import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, CheckCircle2, Loader2, Copy, Link, BarChart, Trash2, PlusCircle, ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";

interface AffiliateLinksProps {
  affiliateData: {
    id: string;
    level?: string;
    name?: string;
    links?: any[];
  } | null;
}

// Validation schema for creating a new link
const newLinkFormSchema = z.object({
  productId: z.string({ required_error: "Selecciona un producto" }),
  campaign: z.string().min(3, { message: "La campaña debe tener al menos 3 caracteres" }).max(50, { message: "La campaña no puede exceder los 50 caracteres" }).optional().or(z.literal("")),
  utmSource: z.string().optional().or(z.literal("")),
  utmMedium: z.string().optional().or(z.literal("")),
  utmCampaign: z.string().optional().or(z.literal("")),
});

type NewLinkFormValues = z.infer<typeof newLinkFormSchema>;

// Tipo para un enlace de afiliado
interface AffiliateLink {
  id: string;
  affiliateId: string;
  productId: string;
  url: string;
  campaign?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  clicks: number;
  conversions: number;
  earnings: number;
  createdAt: any;
}

// Tipo para un producto disponible para afiliados
interface AffiliateProduct {
  id: string;
  name: string;
  description?: string;
  url?: string;
  commissionRate: number;
  category?: string;
  imageUrl?: string;
}

export function AffiliateLinks({ affiliateData }: AffiliateLinksProps) {
  const { user } = useAuth() || {};
  const queryClient = useQueryClient();
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Inicializar useForm para el formulario de nuevo enlace
  const form = useForm<NewLinkFormValues>({
    resolver: zodResolver(newLinkFormSchema),
    defaultValues: {
      productId: "",
      campaign: "",
      utmSource: "boostify_affiliate",
      utmMedium: "affiliate",
      utmCampaign: "",
    },
  });

  // Query to get products available to affiliates
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["affiliate-products"],
    queryFn: async () => {
      const productsRef = collection(db, "affiliateProducts");
      const querySnapshot = await getDocs(productsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AffiliateProduct[];
    },
  });

  // Query to get the user's affiliate links
  const { data: affiliateLinks, isLoading: isLoadingLinks } = useQuery({
    queryKey: ["affiliate-links", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      const linksRef = collection(db, "affiliateLinks");
      const q = query(linksRef, where("affiliateId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })) as AffiliateLink[];
    },
    enabled: !!user?.uid,
  });

  // Mutation to create a new affiliate link
  const createLinkMutation = useMutation({
    mutationFn: async (data: NewLinkFormValues) => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      // Find selected product information
      const selectedProduct = products?.find(p => p.id === data.productId);
      if (!selectedProduct) throw new Error("Product not found");
      
      // Create link with affiliate parameters
      let baseUrl = selectedProduct.url || `https://boostify.com/products/${selectedProduct.id}`;
      
      // Ensure the base URL has no query parameters
      const hasQueryParams = baseUrl.includes('?');
      const baseUrlWithoutParams = hasQueryParams ? baseUrl.split('?')[0] : baseUrl;
      
      // Construir los parámetros UTM
      const queryParams = new URLSearchParams();
      queryParams.append('ref', user.uid);
      
      if (data.utmSource) queryParams.append('utm_source', data.utmSource);
      if (data.utmMedium) queryParams.append('utm_medium', data.utmMedium);
      if (data.utmCampaign) queryParams.append('utm_campaign', data.utmCampaign);
      if (data.campaign) queryParams.append('campaign', data.campaign);
      
      const fullUrl = `${baseUrlWithoutParams}?${queryParams.toString()}`;
      
      // Guardar el enlace en Firestore
      const linkData = {
        affiliateId: user.uid,
        productId: data.productId,
        url: fullUrl,
        campaign: data.campaign || "",
        utmParams: {
          source: data.utmSource || "",
          medium: data.utmMedium || "",
          campaign: data.utmCampaign || "",
        },
        clicks: 0,
        conversions: 0,
        earnings: 0,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, "affiliateLinks"), linkData);
      return { id: docRef.id, ...linkData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links", user?.uid] });
      alert("Enlace de afiliado creado correctamente");
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error al crear enlace:", error);
      alert("Error al crear el enlace de afiliado");
    },
  });

  // Mutación para eliminar un enlace de afiliado
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await deleteDoc(doc(db, "affiliateLinks", linkId));
      return linkId;
    },
    onSuccess: (linkId) => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-links", user?.uid] });
      alert("Enlace de afiliado eliminado correctamente");
    },
    onError: (error) => {
      console.error("Error al eliminar enlace:", error);
      alert("Error al eliminar el enlace de afiliado");
    },
  });

  // Función para copiar un enlace al portapapeles
  const copyLinkToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        alert("Enlace copiado al portapapeles");
      })
      .catch((error) => {
        console.error("Error al copiar enlace:", error);
        alert("Error al copiar enlace");
      });
  };

  // Función para manejar el envío del formulario
  const onSubmit = (data: NewLinkFormValues) => {
    createLinkMutation.mutate(data);
  };

  // Función para ordenar enlaces
  const sortLinks = (links: AffiliateLink[] | undefined) => {
    if (!links) return [];
    
    return [...links].sort((a, b) => {
      if (sortColumn === "createdAt") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
      
      if (sortColumn === "clicks") {
        return sortDirection === "asc" ? a.clicks - b.clicks : b.clicks - a.clicks;
      }
      
      if (sortColumn === "conversions") {
        return sortDirection === "asc" ? a.conversions - b.conversions : b.conversions - a.conversions;
      }
      
      if (sortColumn === "earnings") {
        return sortDirection === "asc" ? a.earnings - b.earnings : b.earnings - a.earnings;
      }
      
      return 0;
    });
  };

  // Función para cambiar el ordenamiento
  const changeSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Si no hay productos disponibles, mostrar un mensaje
  if (!isLoadingProducts && (!products || products.length === 0)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Enlaces de Afiliado</CardTitle>
          <CardDescription>
            No hay productos disponibles para promocionar como afiliado en este momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sin productos disponibles</AlertTitle>
            <AlertDescription>
              Actualmente no hay productos disponibles para promocionar. Por favor, vuelve más tarde.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Affiliate Links</CardTitle>
            <CardDescription>
              Create and manage your affiliate promotion links
            </CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Link
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingLinks ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !affiliateLinks || affiliateLinks.length === 0 ? (
          <div className="text-center py-8">
            <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No affiliate links yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first affiliate link to start earning commissions.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              Create Your First Link
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => changeSort("clicks")}
                      >
                        Clicks
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => changeSort("conversions")}
                      >
                        Conv.
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => changeSort("earnings")}
                      >
                        Earnings
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortLinks(affiliateLinks).map((link) => {
                    const product = products?.find(p => p.id === link.productId);
                    return (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{product?.name || "Unknown Product"}</span>
                            {link.campaign && (
                              <span className="text-xs text-muted-foreground">
                                Campaign: {link.campaign}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{link.clicks}</TableCell>
                        <TableCell>{link.conversions}</TableCell>
                        <TableCell>
                          {link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : "0.0"}%
                        </TableCell>
                        <TableCell>${link.earnings.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyLinkToClipboard(link.url)}
                              title="Copy link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => copyLinkToClipboard(link.url)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <BarChart className="h-4 w-4 mr-2" />
                                  View Stats
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this link?")) {
                                      deleteLinkMutation.mutate(link.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Link
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Dialog for creating a new link */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Affiliate Link</DialogTitle>
              <DialogDescription>
                Generate a new affiliate link for product promotion. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Product</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product to promote" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingProducts ? (
                            <div className="flex justify-center items-center py-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.commissionRate}% commission)
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a product you want to promote. Commission rates vary by product.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="campaign"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., summer_promo, email_campaign" {...field} />
                      </FormControl>
                      <FormDescription>
                        Add a campaign name to track performance across different marketing efforts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                  <h4 className="font-medium">UTM Parameters (Advanced)</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    These parameters help track your marketing campaigns in analytics tools
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="utmSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UTM Source</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., newsletter" {...field} />
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
                          <FormLabel>UTM Medium</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., email" {...field} />
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
                          <FormLabel>UTM Campaign</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., spring_sale" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLinkMutation.isPending}>
                    {createLinkMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Link"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}