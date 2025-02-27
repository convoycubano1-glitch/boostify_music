import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  BarChart,
  BarChart3,
  Download,
  FileDown,
  PieChart,
  LineChart,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Info,
  AlertCircle,
} from "lucide-react";

interface AffiliateEarningsProps {
  affiliateData: any;
}

export function AffiliateEarnings({ affiliateData }: AffiliateEarningsProps) {
  const { user } = useAuth() || {};
  const [period, setPeriod] = useState("30days");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState("all");

  // Datos de ejemplo para estadísticas
  const stats = {
    totalEarnings: 1243.87,
    pendingPayment: 432.15,
    lastPayment: {
      amount: 811.72,
      date: "15 de enero, 2025",
    },
    monthlyEarnings: [
      { month: "Ene", amount: 811.72 },
      { month: "Feb", amount: 432.15 },
      { month: "Mar", amount: 0 },
      { month: "Abr", amount: 0 },
      { month: "May", amount: 0 },
      { month: "Jun", amount: 0 },
    ],
    conversionRate: 3.2,
    clicksLastMonth: 2845,
    salesLastMonth: 91,
  };

  // Consulta de transacciones del afiliado (simulada)
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["affiliate-transactions", user?.uid, period],
    queryFn: async () => {
      // En una implementación real, esto vendría de la base de datos
      // Simulación de datos para la demo
      return [
        {
          id: "tr1",
          productId: "prod1",
          productName: "Curso de Producción Musical",
          amount: 49.99,
          commission: 12.50,
          status: "paid",
          customerId: "cust123",
          date: new Date(2025, 0, 15),
        },
        {
          id: "tr2",
          productId: "prod2",
          productName: "Plugin de Masterización Avanzada",
          amount: 149.99,
          commission: 30.00,
          status: "paid",
          customerId: "cust456",
          date: new Date(2025, 0, 18),
        },
        {
          id: "tr3",
          productId: "prod1",
          productName: "Curso de Producción Musical",
          amount: 199.99,
          commission: 50.00,
          status: "paid",
          customerId: "cust789",
          date: new Date(2025, 0, 22),
        },
        {
          id: "tr4",
          productId: "prod3",
          productName: "Paquete de Distribución Musical",
          amount: 99.99,
          commission: 30.00,
          status: "pending",
          customerId: "cust101",
          date: new Date(2025, 1, 5),
        },
        {
          id: "tr5",
          productId: "prod2",
          productName: "Plugin de Masterización Avanzada",
          amount: 149.99,
          commission: 30.00,
          status: "pending",
          customerId: "cust102",
          date: new Date(2025, 1, 8),
        },
        {
          id: "tr6",
          productId: "prod5",
          productName: "Bundle de Samples Exclusivos",
          amount: 49.99,
          commission: 20.00,
          status: "pending",
          customerId: "cust103",
          date: new Date(2025, 1, 10),
        },
        {
          id: "tr7",
          productId: "prod4",
          productName: "Mentoría Personalizada",
          amount: 299.99,
          commission: 45.00,
          status: "pending",
          customerId: "cust104",
          date: new Date(2025, 1, 15),
        },
        {
          id: "tr8",
          productId: "prod1",
          productName: "Curso de Producción Musical",
          amount: 199.99,
          commission: 50.00,
          status: "pending",
          customerId: "cust105",
          date: new Date(2025, 1, 18),
        },
      ];
    },
  });

  // Consulta de pagos del afiliado (simulada)
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["affiliate-payments", user?.uid],
    queryFn: async () => {
      // En una implementación real, esto vendría de la base de datos
      // Simulación de datos para la demo
      return [
        {
          id: "pay1",
          amount: 811.72,
          method: "paypal",
          status: "completed",
          date: new Date(2025, 0, 15),
          reference: "PAY-12345-ABCDE",
        },
      ];
    },
  });

  // Filtrar transacciones según el estado seleccionado
  const filteredTransactions = filterStatus === "all" 
    ? transactions 
    : transactions.filter(tr => tr.status === filterStatus);

  // Formatear fecha
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calcular la suma de comisiones pendientes
  const pendingCommissionsTotal = transactions
    .filter(tr => tr.status === "pending")
    .reduce((sum, tr) => sum + tr.commission, 0);

  // Calcular la suma de comisiones pagadas
  const paidCommissionsTotal = transactions
    .filter(tr => tr.status === "paid")
    .reduce((sum, tr) => sum + tr.commission, 0);

  // Calcular estadísticas por producto
  const productStats = transactions.reduce((acc: any, tr) => {
    if (!acc[tr.productId]) {
      acc[tr.productId] = {
        id: tr.productId,
        name: tr.productName,
        sales: 0,
        commissions: 0,
      };
    }
    
    acc[tr.productId].sales += 1;
    acc[tr.productId].commissions += tr.commission;
    
    return acc;
  }, {});

  // Convertir a array y ordenar por comisiones
  const productStatsArray = Object.values(productStats)
    .sort((a: any, b: any) => b.commissions - a.commissions);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-700/20 border-orange-200 dark:border-orange-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ganancias totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">
              {formatCurrency(stats.totalEarnings)}
            </div>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15.3% desde el mes pasado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pago pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingCommissionsTotal)}</div>
            <div className="mt-2">
              <Progress value={
                pendingCommissionsTotal >= 100 
                  ? 100 
                  : (pendingCommissionsTotal / 100) * 100
              } />
              <p className="text-xs text-muted-foreground mt-1">
                {pendingCommissionsTotal >= 100 
                  ? "Listo para cobrar" 
                  : `${formatCurrency(100 - pendingCommissionsTotal)} para alcanzar el mínimo`}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Último pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.lastPayment.amount)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {stats.lastPayment.date}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de conversión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.salesLastMonth} ventas de {stats.clicksLastMonth} clics
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Rendimiento por mes</CardTitle>
              <CardDescription>
                Visualización de tus ganancias mensuales
              </CardDescription>
            </div>
            <Select defaultValue={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Últimos 30 días</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
                <SelectItem value="6months">Últimos 6 meses</SelectItem>
                <SelectItem value="12months">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="md:px-3 md:pb-3">
            <div className="h-[240px] flex items-center justify-center gap-2">
              <BarChart3 className="h-16 w-16 text-muted-foreground/40" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Gráfico de barras (placeholder)</span>
                <span className="text-xs text-muted-foreground">Ganancias mensuales representadas visualmente</span>
              </div>
            </div>
            
            <div className="grid grid-cols-6 gap-2 mt-2">
              {stats.monthlyEarnings.map((month) => (
                <div key={month.month} className="text-center">
                  <div className="text-xs font-medium">{month.month}</div>
                  <div className="text-sm">{formatCurrency(month.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Transacciones</CardTitle>
                <CardDescription>
                  Historial de tus ventas y comisiones
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select defaultValue={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="paid">Pagados</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex border rounded-md">
                  <Button 
                    variant={viewMode === "grid" ? "default" : "ghost"} 
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-lg font-medium">No hay transacciones</h3>
                <p className="text-sm text-muted-foreground">
                  No se encontraron transacciones con los filtros actuales
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTransactions.map((transaction) => (
                  <Card key={transaction.id} className="border shadow-none">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {transaction.productName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {formatDate(transaction.date)}
                          </CardDescription>
                        </div>
                        <Badge variant={transaction.status === "paid" ? "default" : "outline"}>
                          {transaction.status === "paid" ? "Pagado" : "Pendiente"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Venta:</span>{" "}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-sm font-medium">
                          <span className="text-muted-foreground">Comisión:</span>{" "}
                          {formatCurrency(transaction.commission)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Venta</TableHead>
                      <TableHead className="text-right">Comisión</TableHead>
                      <TableHead className="text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.productName}</TableCell>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(transaction.commission)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={transaction.status === "paid" ? "default" : "outline"}>
                            {transaction.status === "paid" ? "Pagado" : "Pendiente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <div className="text-xs text-muted-foreground">
              Mostrando {filteredTransactions.length} transacciones de {transactions.length} totales
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <FileDown className="h-3.5 w-3.5" />
              Exportar CSV
            </Button>
          </CardFooter>
        </Card>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos populares</CardTitle>
              <CardDescription>
                Tus productos con más ventas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {productStatsArray.slice(0, 5).map((product: any) => (
                <div key={product.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.sales} ventas</div>
                    </div>
                    <div className="font-medium">{formatCurrency(product.commissions)}</div>
                  </div>
                  <Progress value={(product.commissions / (productStatsArray[0] as any).commissions) * 100} />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Próximo pago</CardTitle>
              <CardDescription>
                Detalles de tu próximo cobro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">Cantidad</div>
                  <div className="font-medium">{formatCurrency(pendingCommissionsTotal)}</div>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">Método</div>
                  <div className="font-medium">
                    {affiliateData?.paymentMethod === "paypal" ? "PayPal" : 
                     affiliateData?.paymentMethod === "bank_transfer" ? "Transferencia bancaria" : 
                     "Stripe"}
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">Fecha estimada</div>
                  <div className="font-medium">
                    {pendingCommissionsTotal >= 100 ? "Próximo ciclo de pagos" : "Pendiente de umbral mínimo"}
                  </div>
                </div>
              </div>
              
              <div className="rounded-md border p-3 bg-muted/30">
                <div className="flex gap-2 text-sm">
                  <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Política de pagos</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Los pagos se procesan los días 15 de cada mes para todas las comisiones acumuladas que superen los {formatCurrency(100)}.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={pendingCommissionsTotal < 100}
              >
                {pendingCommissionsTotal >= 100 ? "Solicitar pago ahora" : "Umbral mínimo no alcanzado"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
          <CardDescription>
            Registro de todos los pagos recibidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-6">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-lg font-medium">No hay pagos recibidos</h3>
              <p className="text-sm text-muted-foreground">
                Tus pagos aparecerán aquí una vez procesados
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.reference}</TableCell>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell className="capitalize">{payment.method}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default">
                          {payment.status === "completed" ? "Completado" : payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            Los pagos pueden tardar hasta 24 horas en procesarse una vez emitidos.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}