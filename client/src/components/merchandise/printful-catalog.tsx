import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Search, Package, ShoppingCart, Eye, Printer, Plus } from "lucide-react";
import { CreateSyncProductDialog } from "./create-sync-product-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface CatalogProduct {
  id: number;
  type: string;
  type_name: string;
  title: string;
  brand: string;
  image: string;
  variant_count: number;
  currency: string;
  description: string;
}

interface CatalogVariant {
  id: number;
  product_id: number;
  name: string;
  size: string;
  color: string;
  color_code?: string;
  image: string;
  price: string;
  in_stock: boolean;
  availability_status?: string;
}

export function PrintfulCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [productToSync, setProductToSync] = useState<CatalogProduct | null>(null);

  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['/api/printful/catalog/products'],
  });

  const { data: variantsData, isLoading: loadingVariants } = useQuery({
    queryKey: ['/api/printful/catalog/products', selectedProduct?.id, 'variants'],
    enabled: !!selectedProduct,
  });

  const products: CatalogProduct[] = catalogData?.data || [];
  const variants: CatalogVariant[] = variantsData?.data || [];

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos en el catálogo de Printful..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-catalog"
          />
        </div>
        <Badge variant="outline" className="px-4 py-2">
          <Package className="h-4 w-4 mr-2" />
          {filteredProducts.length} productos
        </Badge>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            {searchTerm ? 'No se encontraron productos' : 'Catálogo vacío'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'No hay productos disponibles en el catálogo'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden group hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-square relative overflow-hidden bg-white">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-orange-500 text-white">
                    {product.variant_count} variantes
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-1" data-testid={`text-product-${product.id}`}>
                  {product.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                  {product.brand} - {product.type_name}
                </p>
                <div className="flex gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setProductToSync(product);
                      setSyncDialogOpen(true);
                    }}
                    data-testid={`button-sync-product-${product.id}`}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Sincronizar
                  </Button>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedProduct(product)}
                      data-testid={`button-view-product-${product.id}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">{product.title}</DialogTitle>
                      <DialogDescription>
                        {product.brand} - {product.type_name}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full rounded-lg"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Descripción</h4>
                          <p className="text-sm text-muted-foreground">
                            {product.description || 'Sin descripción disponible'}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Información</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Marca:</span>
                              <span className="font-medium">{product.brand}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tipo:</span>
                              <span className="font-medium">{product.type_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Variantes:</span>
                              <span className="font-medium">{product.variant_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Moneda:</span>
                              <span className="font-medium">{product.currency}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {loadingVariants ? (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-4">Variantes Disponibles</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32 w-full" />
                          ))}
                        </div>
                      </div>
                    ) : variants.length > 0 ? (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-4">Variantes Disponibles ({variants.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                          {variants.map((variant) => (
                            <Card key={variant.id} className="p-3">
                              <img
                                src={variant.image}
                                alt={variant.name}
                                className="w-full aspect-square object-contain mb-2 rounded"
                              />
                              <p className="text-sm font-medium line-clamp-2 mb-1">
                                {variant.name}
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                {variant.color_code && (
                                  <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: variant.color_code }}
                                  />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {variant.size}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-orange-500">
                                  ${variant.price}
                                </span>
                                <Badge variant={variant.in_stock ? "default" : "secondary"} className="text-xs">
                                  {variant.in_stock ? 'Disponible' : 'Agotado'}
                                </Badge>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para sincronizar producto */}
      {productToSync && (
        <CreateSyncProductDialog
          productId={productToSync.id}
          productName={productToSync.title}
          productImage={productToSync.image}
          open={syncDialogOpen}
          onOpenChange={setSyncDialogOpen}
        />
      )}
    </div>
  );
}
