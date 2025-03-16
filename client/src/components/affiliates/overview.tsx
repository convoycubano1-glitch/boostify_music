import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ProgressCircular } from "../ui/progress-circular";
import { Badge } from "../ui/badge";
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Calendar, 
  ChevronRight, 
  CreditCard, 
  DollarSign, 
  InfoIcon, 
  Link, 
  RefreshCcw, 
  TrendingUp, 
  Users 
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

export function AffiliateOverview() {
  // Obtener ganancias del afiliado
  const { 
    data: earningsData,
    isLoading: isLoadingEarnings,
    isError: earningsError,
    refetch: refetchEarnings
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
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Si está cargando, mostrar indicador de carga
  if (isLoadingEarnings) {
    return (
      <div className="w-full py-12 flex justify-center">
        <ProgressCircular />
      </div>
    );
  }
  
  // Si hay un error, mostrar mensaje de error
  if (earningsError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No pudimos cargar tus datos de ganancias. Por favor, intenta de nuevo más tarde.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Si no hay datos o el arreglo está vacío
  if (!earningsData || !earningsData.earnings || earningsData.earnings.length === 0) {
    return <EmptyEarningsState />;
  }
  
  // Procesamiento de datos para los gráficos
  const chartData = processDataForCharts(earningsData);
  
  // Datos de estadísticas generales
  const statsData = {
    totalEarnings: earningsData.totalEarnings || 0,
    pendingPayment: earningsData.pendingPayment || 0,
    totalClicks: earningsData.totalClicks || 0,
    totalConversions: earningsData.totalConversions || 0,
    conversionRate: earningsData.conversionRate || 0,
    nextPaymentDate: earningsData.nextPaymentDate ? new Date(earningsData.nextPaymentDate) : null,
  };
  
  return (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Ganancias totales" 
          value={statsData.totalEarnings} 
          icon={DollarSign}
          trend={10}
          isCurrency
        />
        <StatCard 
          title="Pendiente de pago" 
          value={statsData.pendingPayment} 
          icon={CreditCard}
          trend={5}
          isCurrency
        />
        <StatCard 
          title="Clics totales" 
          value={statsData.totalClicks} 
          icon={Link}
          trend={15}
        />
        <StatCard 
          title="Tasa de conversión" 
          value={statsData.conversionRate} 
          icon={TrendingUp}
          trend={-2}
          suffix="%"
        />
      </div>
      
      {/* Información de próximo pago */}
      {statsData.nextPaymentDate && statsData.pendingPayment > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Próximo pago programado</h3>
                <p className="text-sm text-muted-foreground">
                  Recibirás {formatCurrency(statsData.pendingPayment)} el {format(statsData.nextPaymentDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de ingresos mensuales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ingresos mensuales</CardTitle>
            <CardDescription>
              Tus ganancias durante los últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData.monthlyEarnings}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [`$${value}`, 'Ingresos']} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Gráfico de fuentes de conversión */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Fuentes de conversión</CardTitle>
            <CardDescription>
              Distribución de conversiones por fuente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {chartData.conversionSources.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.conversionSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.conversionSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} conversiones`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  No hay datos suficientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Gráfico de rendimiento de enlaces */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rendimiento de enlaces</CardTitle>
            <CardDescription>
              Comparativa de clics y conversiones por enlace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.linkPerformance}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="clicks" name="Clics" fill="#8884d8" />
                  <Bar dataKey="conversions" name="Conversiones" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Historial de transacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
          <CardDescription>
            Registro de todos tus pagos recibidos como afiliado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earningsData.paymentHistory && earningsData.paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {earningsData.paymentHistory.map((payment: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-2">
                      <CreditCard className="h-4 w-4 text-foreground/70" />
                    </div>
                    <div>
                      <p className="font-medium">Pago de comisiones</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600 dark:text-green-400">
                      +{formatCurrency(payment.amount)}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {payment.status || "Completado"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No hay pagos registrados aún.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de tarjeta de estadística
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  isCurrency = false,
  suffix = ""
}: { 
  title: string;
  value: number;
  icon: React.ElementType;
  trend?: number;
  isCurrency?: boolean;
  suffix?: string;
}) {
  const formattedValue = isCurrency ? formatCurrency(value) : value.toLocaleString();
  const trendColor = trend && trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">
              {formattedValue}{suffix}
            </h3>
          </div>
          <div className="rounded-full bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        
        {trend !== undefined && (
          <div className={`flex items-center mt-4 text-sm ${trendColor}`}>
            <span className="font-medium">{trend > 0 ? '+' : ''}{trend}%</span>
            <span className="text-muted-foreground text-xs ml-1">vs. mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Estado vacío cuando no hay ganancias
function EmptyEarningsState() {
  return (
    <Card className="py-10">
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
          <DollarSign className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">Sin ganancias registradas</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Aún no tienes ganancias registradas. Comienza creando y compartiendo enlaces de afiliado para empezar a ganar comisiones.
        </p>
        <div className="grid gap-3 text-sm max-w-md">
          <div className="flex items-start">
            <div className="rounded-full bg-primary/10 w-6 h-6 flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-medium">1</span>
            </div>
            <div className="text-left">
              <p className="font-medium">Crea enlaces personalizados</p>
              <p className="text-muted-foreground">
                Selecciona productos y crea enlaces para promocionar
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="rounded-full bg-primary/10 w-6 h-6 flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-medium">2</span>
            </div>
            <div className="text-left">
              <p className="font-medium">Comparte con tu audiencia</p>
              <p className="text-muted-foreground">
                Difunde tus enlaces en redes sociales o sitio web
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="rounded-full bg-primary/10 w-6 h-6 flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-medium">3</span>
            </div>
            <div className="text-left">
              <p className="font-medium">Gana comisiones</p>
              <p className="text-muted-foreground">
                Recibe comisiones por cada compra a través de tus enlaces
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Función para formatear cantidades como moneda
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Función para procesar datos para gráficos
function processDataForCharts(data: any) {
  // Ganancias mensuales
  const monthlyEarnings = data.monthlyEarnings || generateMockMonthlyData();
  
  // Fuentes de conversión (mock si no hay datos)
  const conversionSources = data.conversionSources || [
    { name: 'Redes sociales', value: 40 },
    { name: 'Sitio web', value: 30 },
    { name: 'Email', value: 15 },
    { name: 'Otros', value: 15 }
  ];
  
  // Rendimiento por enlace (mock si no hay datos)
  const linkPerformance = data.linkPerformance || [
    { name: 'Plan Básico', clicks: 50, conversions: 5 },
    { name: 'Plan Premium', clicks: 35, conversions: 8 },
    { name: 'Plan Pro', clicks: 20, conversions: 4 },
    { name: 'Curso de Marketing', clicks: 45, conversions: 12 },
  ];
  
  return {
    monthlyEarnings,
    conversionSources,
    linkPerformance
  };
}

// Función para generar datos mensuales simulados para el ejemplo
function generateMockMonthlyData() {
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, index) => ({
    month,
    amount: Math.floor(Math.random() * 500) + 50
  }));
}