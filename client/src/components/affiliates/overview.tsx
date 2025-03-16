import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Download,
  HelpCircle,
  Link,
  MousePointerClick,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ProgressCircular } from "../ui/progress-circular";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

/**
 * Componente que muestra una visión general del programa de afiliados
 * incluyendo estadísticas, ganancias, y conversiones recientes.
 */
export function AffiliateOverview() {
  const [timeframe, setTimeframe] = useState("30d");
  const [statsTab, setStatsTab] = useState("general");

  // Obtener estadísticas del afiliado
  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["affiliate", "stats", timeframe],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/affiliate/stats?period=${timeframe}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching affiliate stats:", error);
        throw error;
      }
    },
  });

  // Obtener ganancias del afiliado
  const {
    data: earningsData,
    isLoading: earningsLoading,
    isError: earningsError,
  } = useQuery({
    queryKey: ["affiliate", "earnings"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/affiliate/earnings");
        return response.data;
      } catch (error) {
        console.error("Error fetching affiliate earnings:", error);
        throw error;
      }
    },
  });

  // Estado de carga para cualquiera de las consultas
  const isLoading = statsLoading || earningsLoading;
  
  // Si hay un error, mostrar mensaje de error
  if (statsError || earningsError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error al cargar los datos</AlertTitle>
        <AlertDescription>
          No pudimos cargar la información de afiliado. Por favor, intenta de nuevo más tarde.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Si está cargando, mostrar esqueleto
  if (isLoading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Sección de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clics Totales"
          value={statsData?.totalClicks || 0}
          description={`${timeframe === "30d" ? "Últimos 30 días" : timeframe === "7d" ? "Últimos 7 días" : "Todo el tiempo"}`}
          icon={MousePointerClick}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-100 dark:bg-blue-900/20"
          change={statsData?.clicksChange}
        />
        
        <StatCard
          title="Conversiones"
          value={statsData?.totalConversions || 0}
          description={`Tasa de conversión: ${statsData?.conversionRate || 0}%`}
          icon={ShoppingCart}
          iconColor="text-green-500"
          iconBgColor="bg-green-100 dark:bg-green-900/20"
          change={statsData?.conversionsChange}
        />
        
        <StatCard
          title="Ingresos Generados"
          value={formatCurrency(statsData?.totalRevenue || 0)}
          description="Valor total de ventas generadas"
          icon={BarChart3}
          iconColor="text-indigo-500"
          iconBgColor="bg-indigo-100 dark:bg-indigo-900/20"
          change={statsData?.revenueChange}
          isCurrency
        />
        
        <StatCard
          title="Ganancias"
          value={formatCurrency(statsData?.totalEarnings || 0)}
          description="Comisiones acumuladas"
          icon={CircleDollarSign}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-100 dark:bg-purple-900/20"
          change={statsData?.earningsChange}
          isCurrency
        />
      </div>
      
      {/* Sección de ganancias e historial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="col-span-1 lg:col-span-5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Ganancias</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-80">
                    <p>
                      Las comisiones se procesan el día 15 del mes siguiente al mes de la venta.
                      Las ventas tienen un período de espera de 30 días para permitir reembolsos.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>Resumen de tus ganancias y pagos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disponible para cobro</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(earningsData?.available || 0)}</h3>
                </div>
                
                <Button
                  size="sm"
                  disabled={!earningsData?.available || earningsData.available < 50}
                >
                  Solicitar pago
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pendiente</p>
                  <p className="font-medium">{formatCurrency(earningsData?.pending || 0)}</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Se libera en 30 días</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pagado (total)</p>
                  <p className="font-medium">{formatCurrency(earningsData?.paid || 0)}</p>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">De {earningsData?.paidCount || 0} pagos</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Próximo pago</p>
                  <p className="font-medium">{earningsData?.nextPaymentDate || "N/A"}</p>
                  <div className="flex items-center gap-1">
                    <CircleDollarSign className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {earningsData?.available >= 50
                        ? "Elegible para cobro"
                        : earningsData?.available > 0
                        ? `Necesitas €${50 - earningsData.available} más`
                        : "Sin fondos"}
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Historial de pagos</h4>
                
                {earningsData?.payments?.length > 0 ? (
                  <div className="space-y-2">
                    {earningsData.payments.slice(0, 2).map((payment: any) => (
                      <div key={payment.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">{payment.date}</p>
                        </div>
                        <Badge
                          variant={
                            payment.status === "completed"
                              ? "success"
                              : payment.status === "processing"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {payment.status === "completed"
                            ? "Completado"
                            : payment.status === "processing"
                            ? "Procesando"
                            : payment.status === "pending"
                            ? "Pendiente"
                            : payment.status}
                        </Badge>
                      </div>
                    ))}
                    
                    {earningsData.payments.length > 2 && (
                      <div className="text-center">
                        <Button variant="link" size="sm" className="text-xs">
                          Ver todo el historial
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-4 text-sm text-muted-foreground">
                    No hay pagos registrados todavía
                  </div>
                )}
              </div>

              {/* Sección de información sobre métodos de pago */}
              <div className="bg-muted/30 p-3 rounded-md">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <CircleDollarSign className="h-4 w-4" />
                  Métodos de pago
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Métodos de pago disponibles: PayPal, transferencia bancaria o crédito en cuenta.
                </p>
                <div className="mt-2">
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                    Configurar método de pago
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-7">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Estadísticas</CardTitle>
              <Select
                value={timeframe}
                onValueChange={(value) => setTimeframe(value)}
              >
                <SelectTrigger className="w-36 h-8">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>Desempeño de tus enlaces de afiliado</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={statsTab} onValueChange={setStatsTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="products">Por Producto</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="mt-4 space-y-4">
                {statsData?.clicksByDay?.length > 0 ? (
                  <div className="space-y-6">
                    <div className="h-[200px] w-full bg-muted/30 rounded-md flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Gráfica de rendimiento</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Últimas conversiones</h4>
                      
                      {statsData?.recentConversions?.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead className="text-right">Comisión</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {statsData.recentConversions.map((conversion: any) => (
                              <TableRow key={conversion.id}>
                                <TableCell className="text-xs">
                                  {conversion.date}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate text-xs">
                                  {conversion.productName}
                                </TableCell>
                                <TableCell className="text-right text-xs">
                                  {formatCurrency(conversion.amount)}
                                </TableCell>
                                <TableCell className="text-right text-xs">
                                  {formatCurrency(conversion.commission)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center p-4 text-sm text-muted-foreground">
                          No hay conversiones registradas en este período
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <Download className="h-3.5 w-3.5" />
                            Exportar datos
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Exportar datos de afiliados</DialogTitle>
                            <DialogDescription>
                              Selecciona el formato y el período para exportar tus datos de afiliados.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Formato</h4>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="gap-1">
                                  <Download className="h-4 w-4" />
                                  CSV
                                </Button>
                                <Button variant="outline" size="sm" className="gap-1">
                                  <Download className="h-4 w-4" />
                                  Excel
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Período</h4>
                              <Select defaultValue="30d">
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un período" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                                  <SelectItem value="all">Todo el tiempo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" className="w-full sm:w-auto">
                              Descargar informe
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="mb-3 rounded-full bg-muted/30 p-3">
                      <Link className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mb-1 text-base font-medium">Sin datos aún</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Aún no hay estadísticas disponibles para este período.
                    </p>
                    <Button variant="outline" size="sm" className="gap-1" asChild>
                      <a href="/affiliates?tab=links">
                        Crear enlaces
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="products" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Rendimiento por producto</h4>
                  
                  {statsData?.productStats?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Clics</TableHead>
                          <TableHead className="text-right">Conversiones</TableHead>
                          <TableHead className="text-right">Tasa</TableHead>
                          <TableHead className="text-right">Comisiones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statsData.productStats.map((product: any) => (
                          <TableRow key={product.id}>
                            <TableCell className="max-w-[200px] truncate text-xs">
                              {product.name}
                            </TableCell>
                            <TableCell className="text-right text-xs">{product.clicks}</TableCell>
                            <TableCell className="text-right text-xs">{product.conversions}</TableCell>
                            <TableCell className="text-right text-xs">{product.conversionRate}%</TableCell>
                            <TableCell className="text-right text-xs">
                              {formatCurrency(product.earnings)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-4 text-sm text-muted-foreground">
                      No hay datos de productos para este período
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button variant="link" size="sm" asChild>
                    <a href="/affiliates?tab=links">Ver todos los productos</a>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Formatea un valor numérico como moneda
function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

// Componente para mostrar una tarjeta de estadística
interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBgColor: string;
  change?: number;
  isCurrency?: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  iconBgColor,
  change,
  isCurrency = false,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
          
          <div className={`${iconBgColor} p-2 rounded-md`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{description}</p>
          
          {typeof change === "number" && (
            <div
              className={`text-xs font-medium ${
                change >= 0 ? "text-green-600" : "text-red-600"
              } flex items-center gap-0.5`}
            >
              {change >= 0 ? "+" : ""}
              {isCurrency
                ? formatCurrency(change)
                : `${change.toFixed(1)}%`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para mostrar un esqueleto durante la carga
function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                  <div className="h-7 w-16 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="h-9 w-9 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-10 bg-muted rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="col-span-1 lg:col-span-5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-40 bg-muted rounded animate-pulse mt-1"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                  <div className="h-7 w-24 bg-muted rounded animate-pulse mt-2"></div>
                </div>
                <div className="h-8 w-28 bg-muted rounded animate-pulse"></div>
              </div>
              
              <div className="h-px w-full bg-muted"></div>
              
              <div className="flex justify-between">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                    <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
              
              <div className="h-px w-full bg-muted"></div>
              
              <div className="flex justify-center">
                <ProgressCircular />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-7">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-48 bg-muted rounded animate-pulse mt-1"></div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mt-8 mb-8">
              <ProgressCircular size="lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}