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
      .catch(err => {
        console.error("Error al copiar enlace:", err);
        alert("Error al copiar enlace");
      });
  };

  // Función para manejar la ordenación de la tabla
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Ordenar los enlaces según la columna y dirección seleccionadas
  const sortedLinks = affiliateLinks ? [...affiliateLinks].sort((a, b) => {
    let valueA, valueB;
    
    // Obtener los valores a comparar según la columna
    if (sortColumn === "productId") {
      const productA = products?.find(p => p.id === a.productId);
      const productB = products?.find(p => p.id === b.productId);
      valueA = productA?.name || "";
      valueB = productB?.name || "";
    } else if (sortColumn === "createdAt") {
      valueA = new Date(a.createdAt).getTime();
      valueB = new Date(b.createdAt).getTime();
    } else if (["clicks", "conversions", "earnings"].includes(sortColumn)) {
      valueA = a[sortColumn as keyof AffiliateLink] || 0;
      valueB = b[sortColumn as keyof AffiliateLink] || 0;
    } else {
      valueA = a[sortColumn as keyof AffiliateLink] || "";
      valueB = b[sortColumn as keyof AffiliateLink] || "";
    }
    
    // Comparar según la dirección
    if (sortDirection === "asc") {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  }) : [];

  // Función para manejar la creación de un nuevo enlace
  const onSubmit = (data: NewLinkFormValues) => {
    setIsCreatingLink(true);
    createLinkMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Affiliate Links</h2>
          <p className="text-muted-foreground">
            Generate and manage your affiliate links to promote products
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create new link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create new affiliate link</DialogTitle>
              <DialogDescription>
                Select a product and customize your affiliate link.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedProduct(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Available products</SelectLabel>
                            {isLoadingProducts ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading products...
                              </div>
                            ) : (
                              products?.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - {product.commissionRate}% commission
                                </SelectItem>
                              ))
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="campaign"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your campaign name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Identify this specific campaign (e.g., "Instagram Summer")
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={createLinkMutation.isPending}
                    className="w-full"
                  >
                    {createLinkMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating link...
                      </>
                    ) : (
                      "Create link"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Your affiliate links</CardTitle>
          <CardDescription>
            Manage and track all your promotional links
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLinks ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading links...</span>
            </div>
          ) : affiliateLinks?.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                <Link className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">You don't have any affiliate links</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4 max-w-md mx-auto">
                Create your first link to start promoting products and earning commissions.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Create first link
              </Button>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("productId")}>
                      <div className="flex items-center">
                        Product
                        {sortColumn === "productId" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("campaign")}>
                      <div className="flex items-center">
                        Campaign
                        {sortColumn === "campaign" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort("clicks")}>
                      <div className="flex items-center justify-end">
                        Clicks
                        {sortColumn === "clicks" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort("conversions")}>
                      <div className="flex items-center justify-end">
                        Conversions
                        {sortColumn === "conversions" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort("earnings")}>
                      <div className="flex items-center justify-end">
                        Earnings
                        {sortColumn === "earnings" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLinks.map((link) => {
                    const product = products?.find(p => p.id === link.productId);
                    return (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">
                          {product?.name || "Unknown product"}
                        </TableCell>
                        <TableCell>
                          {link.campaign || "No campaign"}
                        </TableCell>
                        <TableCell className="text-right">
                          {link.clicks || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {link.conversions || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          ${link.earnings?.toFixed(2) || "0.00"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyLinkToClipboard(link.url)}
                              title="Copy link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this link? This action cannot be undone.")) {
                                  deleteLinkMutation.mutate(link.id);
                                }
                              }}
                              title="Delete link"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Products available for promotion</CardTitle>
          <CardDescription>
            Products you can promote as a Boostify affiliate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading products...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products?.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="h-40 bg-muted">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/10 to-primary/20">
                        <BarChart className="h-12 w-12 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge variant="outline" className="ml-auto">
                      {product.commissionRate}% commission
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description || "No description"}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end">
                    <Button 
                      onClick={() => {
                        form.setValue("productId", product.id);
                        setSelectedProduct(product.id);
                        setIsDialogOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Create link
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}