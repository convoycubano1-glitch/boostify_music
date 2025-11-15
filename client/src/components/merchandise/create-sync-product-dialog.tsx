import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useToast } from "../../hooks/use-toast";
import { queryClient, apiRequest } from "../../lib/queryClient";
import { Loader2, Plus, X, Upload } from "lucide-react";
import { Checkbox } from "../ui/checkbox";

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
}

interface CreateSyncProductDialogProps {
  productId: number;
  productName: string;
  productImage: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSyncProductDialog({
  productId,
  productName,
  productImage,
  open,
  onOpenChange,
}: CreateSyncProductDialogProps) {
  const { toast } = useToast();
  const [syncProductName, setSyncProductName] = useState(productName);
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set());
  const [variantPrices, setVariantPrices] = useState<Record<number, string>>({});
  const [designUrl, setDesignUrl] = useState("");

  const { data: variantsData, isLoading: loadingVariants } = useQuery({
    queryKey: ['/api/printful/catalog/products', productId, 'variants'],
    enabled: open,
  });

  const variants: CatalogVariant[] = variantsData?.data || [];

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/printful/sync/products', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Producto sincronizado",
        description: "El producto se agregó exitosamente a tu tienda Printful",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/printful/sync/products'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error al sincronizar producto",
        description: error.message || "No se pudo crear el producto sincronizado",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSyncProductName(productName);
    setSelectedVariants(new Set());
    setVariantPrices({});
    setDesignUrl("");
  };

  const toggleVariant = (variantId: number) => {
    const newSelected = new Set(selectedVariants);
    if (newSelected.has(variantId)) {
      newSelected.delete(variantId);
      const newPrices = { ...variantPrices };
      delete newPrices[variantId];
      setVariantPrices(newPrices);
    } else {
      newSelected.add(variantId);
      // Establecer precio inicial (precio base + 30% margen sugerido)
      const variant = variants.find(v => v.id === variantId);
      if (variant) {
        const basePrice = parseFloat(variant.price);
        const suggestedPrice = (basePrice * 1.3).toFixed(2);
        setVariantPrices(prev => ({ ...prev, [variantId]: suggestedPrice }));
      }
    }
    setSelectedVariants(newSelected);
  };

  const updateVariantPrice = (variantId: number, price: string) => {
    setVariantPrices(prev => ({ ...prev, [variantId]: price }));
  };

  const handleSubmit = () => {
    if (selectedVariants.size === 0) {
      toast({
        title: "Selecciona variantes",
        description: "Debes seleccionar al menos una variante para sincronizar",
        variant: "destructive",
      });
      return;
    }

    if (!designUrl) {
      toast({
        title: "URL de diseño requerida",
        description: "Debes proporcionar una URL de imagen para el diseño",
        variant: "destructive",
      });
      return;
    }

    const syncVariants = Array.from(selectedVariants).map(variantId => ({
      variant_id: variantId,
      retail_price: variantPrices[variantId] || "0.00",
      files: [
        {
          url: designUrl,
        },
      ],
    }));

    const requestData = {
      sync_product: {
        name: syncProductName,
        thumbnail: productImage,
      },
      sync_variants: syncVariants,
    };

    createProductMutation.mutate(requestData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sincronizar Producto a tu Tienda</DialogTitle>
          <DialogDescription>
            Selecciona las variantes que deseas ofrecer y configura los precios de venta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nombre del producto */}
          <div className="space-y-2">
            <Label htmlFor="product-name">Nombre del Producto</Label>
            <Input
              id="product-name"
              value={syncProductName}
              onChange={(e) => setSyncProductName(e.target.value)}
              placeholder="Nombre personalizado para tu tienda"
              data-testid="input-sync-product-name"
            />
          </div>

          {/* URL del diseño */}
          <div className="space-y-2">
            <Label htmlFor="design-url">URL del Diseño/Imagen</Label>
            <div className="flex gap-2">
              <Input
                id="design-url"
                value={designUrl}
                onChange={(e) => setDesignUrl(e.target.value)}
                placeholder="https://ejemplo.com/mi-diseño.png"
                data-testid="input-design-url"
              />
              <Button variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              La imagen debe ser accesible públicamente. Se imprimirá en el producto.
            </p>
          </div>

          {/* Selección de variantes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Variantes Disponibles</Label>
              <Badge variant="outline">
                {selectedVariants.size} seleccionadas
              </Badge>
            </div>

            {loadingVariants ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                {variants.map((variant) => {
                  const isSelected = selectedVariants.has(variant.id);
                  const basePrice = parseFloat(variant.price);
                  
                  return (
                    <div
                      key={variant.id}
                      className={`flex items-center gap-4 p-3 border rounded-lg transition-colors ${
                        isSelected ? 'border-orange-500 bg-orange-500/5' : 'border-border'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleVariant(variant.id)}
                        disabled={!variant.in_stock}
                        data-testid={`checkbox-variant-${variant.id}`}
                      />
                      
                      <img
                        src={variant.image}
                        alt={variant.name}
                        className="w-12 h-12 object-contain rounded"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{variant.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {variant.color_code && (
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: variant.color_code }}
                            />
                          )}
                          <span className="text-xs text-muted-foreground">{variant.size}</span>
                          <Badge variant={variant.in_stock ? "default" : "secondary"} className="text-xs">
                            {variant.in_stock ? 'Disponible' : 'Agotado'}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <p className="text-xs text-muted-foreground">Costo: ${basePrice}</p>
                        {isSelected && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs">Precio:</span>
                            <Input
                              type="number"
                              step="0.01"
                              min={basePrice}
                              value={variantPrices[variant.id] || ""}
                              onChange={(e) => updateVariantPrice(variant.id, e.target.value)}
                              className="w-20 h-7 text-xs"
                              data-testid={`input-price-${variant.id}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createProductMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createProductMutation.isPending || selectedVariants.size === 0}
            className="bg-orange-500 hover:bg-orange-600"
            data-testid="button-create-sync-product"
          >
            {createProductMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Sincronizar Producto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
