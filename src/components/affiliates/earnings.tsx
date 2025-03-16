import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, LineChart, PieChart, ChevronDown, Download, Calendar, ArrowUpDown, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AffiliateEarningsProps {
  affiliateData: {
    id: string;
    level?: string;
    stats?: {
      totalClicks?: number;
      conversions?: number;
      earnings?: number;
      pendingPayment?: number;
    };
    paymentHistory?: any[];
  } | null;
}

export function AffiliateEarnings({ affiliateData }: AffiliateEarningsProps) {
  const { user } = useAuth() || {};
  // Datos de ejemplo para ganancias
  const earningsOverview = {
    total: affiliateData?.stats?.earnings || 0,
    pending: affiliateData?.stats?.pendingPayment || 0,
    thisMonth: 342.50,
    lastMonth: 287.75,
    monthlyGrowth: 19.02,
  };

  // Datos de ejemplo para historial de pagos
  const paymentHistory = [
    { id: "PAY-2025-02-15", date: "15/02/2025", amount: 287.75, status: "paid", method: "paypal" },
    { id: "PAY-2025-01-15", date: "15/01/2025", amount: 203.25, status: "paid", method: "paypal" },
    { id: "PAY-2024-12-15", date: "15/12/2024", amount: 156.50, status: "paid", method: "paypal" },
    { id: "PAY-2024-11-15", date: "15/11/2024", amount: 122.00, status: "paid", method: "paypal" },
  ];

  // Datos de ejemplo para productos
  const productEarnings = [
    { id: "prod1", name: "Curso de Producción Musical", sales: 12, earnings: 450.00, commission: "25%" },
    { id: "prod2", name: "Plugin de Masterización", sales: 10, earnings: 297.00, commission: "20%" },
    { id: "prod3", name: "Paquete de Distribución Musical", sales: 8, earnings: 396.00, commission: "30%" },
    { id: "prod4", name: "Curso de Marketing Musical", sales: 5, earnings: 187.50, commission: "25%" },
  ];

  // Datos de ejemplo para tendencias
  const monthlyTrends = [
    { month: "Oct", earnings: 122.00 },
    { month: "Nov", earnings: 156.50 },
    { month: "Dic", earnings: 203.25 },
    { month: "Ene", earnings: 287.75 },
    { month: "Feb", earnings: 342.50 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ganancias de Afiliado</h2>
          <p className="text-muted-foreground">
            Monitorea tus ingresos y rendimiento de campañas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select defaultValue="thisMonth">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="thisMonth">Este mes</SelectItem>
                <SelectItem value="lastMonth">Mes pasado</SelectItem>
                <SelectItem value="last3Months">Últimos 3 meses</SelectItem>
                <SelectItem value="thisYear">Este año</SelectItem>
                <SelectItem value="allTime">Todo el tiempo</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ganancias totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsOverview.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Desde que te uniste como afiliado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Este mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsOverview.thisMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+{earningsOverview.monthlyGrowth}%</span> vs. mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendiente de pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsOverview.pending.toFixed(2)}</div>
            <div className="mt-2">
              <Progress value={Math.min((earningsOverview.pending / 100) * 100, 100)} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {earningsOverview.pending >= 100 
                ? "Umbral alcanzado para próximo pago" 
                : `$${(100 - earningsOverview.pending).toFixed(2)} para alcanzar umbral`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.3%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+0.5%</span> vs. mes anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y tablas */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tendencia mensual</CardTitle>
                <CardDescription>
                  Evolución de tus ganancias en los últimos meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <LineChart className="h-8 w-8 text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Gráfico de tendencia mensual (UI placeholder)
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {monthlyTrends.map((item) => (
                    <div key={item.month} className="flex flex-col items-center">
                      <div className="text-sm font-medium">{item.month}</div>
                      <div className="text-muted-foreground text-xs">${item.earnings}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por producto</CardTitle>
                <CardDescription>
                  Ganancias por categoría de producto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center mb-4">
                  <PieChart className="h-8 w-8 text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Gráfico de distribución (UI placeholder)
                  </span>
                </div>
                <div className="space-y-2">
                  {productEarnings.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                        <span className="text-sm">{product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name}</span>
                      </div>
                      <span className="text-sm font-medium">${product.earnings.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de ventas por producto</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Comisión</TableHead>
                    <TableHead className="text-right">Ganancias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productEarnings.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.sales}</TableCell>
                      <TableCell className="text-right">{product.commission}</TableCell>
                      <TableCell className="text-right">${product.earnings.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Rendimiento por producto</CardTitle>
                  <CardDescription>
                    Detalles de ventas y comisiones por producto
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar datos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ordenar por:</span>
                  <Select defaultValue="earnings">
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <SelectValue placeholder="Seleccionar criterio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="earnings">Ganancias: Mayor a menor</SelectItem>
                      <SelectItem value="earnings_asc">Ganancias: Menor a mayor</SelectItem>
                      <SelectItem value="sales">Ventas: Mayor a menor</SelectItem>
                      <SelectItem value="name">Nombre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-6">
                {productEarnings.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <Badge variant="outline" className="mt-1">
                          Comisión: {product.commission}
                        </Badge>
                      </div>
                      <div className="mt-2 md:mt-0 text-2xl font-bold">
                        ${product.earnings.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Ventas</div>
                        <div className="text-xl font-medium">{product.sales}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Comisión promedio</div>
                        <div className="text-xl font-medium">${(product.earnings / product.sales).toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Última venta</div>
                        <div className="text-xl font-medium">15/02/2025</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Rendimiento vs. otros afiliados</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Historial de pagos</CardTitle>
                  <CardDescription>
                    Registro de todos tus pagos recibidos
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>2025</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID de pago</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell className="capitalize">{payment.method}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "paid" ? "outline" : "secondary"}>
                          {payment.status === "paid" ? "Pagado" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${payment.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4">
              <div className="text-sm text-muted-foreground">
                <p>Próximo pago: Marzo 15, 2025</p>
                <p>Monto estimado: ${earningsOverview.pending.toFixed(2)}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Ver calendario de pagos
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}