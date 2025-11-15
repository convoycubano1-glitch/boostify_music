import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Package, ShoppingCart, Store, AlertCircle, CheckCircle } from "lucide-react";
import { SiPrintful } from "react-icons/si";
import { PrintfulCatalog } from "./printful-catalog";
import { PrintfulOrders } from "./printful-orders";
import { PrintfulSyncProducts } from "./printful-sync-products";
import { Skeleton } from "../ui/skeleton";

interface PrintfulStoreInfo {
  id: number;
  type: string;
  name: string;
  website: string;
  currency: string;
  created: number;
}

export function PrintfulDashboard() {
  const [activeTab, setActiveTab] = useState("catalog");

  const { data: storeData, isLoading: loadingStore, error } = useQuery({
    queryKey: ['/api/printful/store'],
  });

  const storeInfo: PrintfulStoreInfo | null = storeData?.data || null;
  const isConnected = !error && storeInfo !== null;

  return (
    <div className="space-y-6">
      {/* Header con estado de conexión */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
              <SiPrintful className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Printful Integration</h2>
              {loadingStore ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : isConnected && storeInfo ? (
                <>
                  <p className="text-muted-foreground mb-2">
                    Conectado a: <span className="font-medium">{storeInfo.name}</span>
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Tipo: {storeInfo.type}</span>
                    <span>•</span>
                    <span>Moneda: {storeInfo.currency}</span>
                    {storeInfo.website && (
                      <>
                        <span>•</span>
                        <span>Website: {storeInfo.website}</span>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Error al conectar con Printful</span>
                </div>
              )}
            </div>
          </div>
          {!loadingStore && (
            <Badge
              variant={isConnected ? "default" : "destructive"}
              className="px-4 py-2"
            >
              {isConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Conectado
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Desconectado
                </>
              )}
            </Badge>
          )}
        </div>
      </Card>

      {/* Tabs para diferentes secciones */}
      {isConnected && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="catalog" data-testid="tab-catalog">
              <Store className="h-4 w-4 mr-2" />
              Catálogo
            </TabsTrigger>
            <TabsTrigger value="sync" data-testid="tab-sync">
              <Package className="h-4 w-4 mr-2" />
              Mis Productos
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Órdenes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-6">
            <PrintfulCatalog />
          </TabsContent>

          <TabsContent value="sync" className="mt-6">
            <PrintfulSyncProducts />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <PrintfulOrders />
          </TabsContent>
        </Tabs>
      )}

      {/* Mensaje de error si no está conectado */}
      {!loadingStore && !isConnected && (
        <Card className="p-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-xl font-semibold mb-2">No se pudo conectar con Printful</h3>
          <p className="text-muted-foreground mb-4">
            Verifica que tu token de API esté configurado correctamente.
          </p>
          <p className="text-sm text-muted-foreground">
            Error: {error?.message || 'Conexión fallida'}
          </p>
        </Card>
      )}
    </div>
  );
}
