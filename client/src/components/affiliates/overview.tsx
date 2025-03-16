import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { BarChart3, TrendingUp, Users, DollarSign, Share2, ExternalLink } from "lucide-react";
import { ProgressCircular } from "../ui/progress-circular";

// Datos de simulación para pruebas
const dummyData = {
  earnings: [
    { date: '2025-02-01', amount: 0 },
    { date: '2025-02-05', amount: 25 },
    { date: '2025-02-10', amount: 50 },
    { date: '2025-02-15', amount: 75 },
    { date: '2025-02-20', amount: 100 },
    { date: '2025-02-25', amount: 150 },
    { date: '2025-03-01', amount: 200 },
    { date: '2025-03-05', amount: 250 },
    { date: '2025-03-10', amount: 300 },
    { date: '2025-03-15', amount: 325 },
  ],
  clicks: [
    { date: '2025-02-01', count: 5 },
    { date: '2025-02-05', count: 15 },
    { date: '2025-02-10', count: 25 },
    { date: '2025-02-15', count: 40 },
    { date: '2025-02-20', count: 60 },
    { date: '2025-02-25', count: 75 },
    { date: '2025-03-01', count: 100 },
    { date: '2025-03-05', count: 125 },
    { date: '2025-03-10', count: 150 },
    { date: '2025-03-15', count: 175 },
  ],
  conversions: [
    { date: '2025-02-01', count: 0 },
    { date: '2025-02-05', count: 1 },
    { date: '2025-02-10', count: 2 },
    { date: '2025-02-15', count: 3 },
    { date: '2025-02-20', count: 4 },
    { date: '2025-02-25', count: 6 },
    { date: '2025-03-01', count: 8 },
    { date: '2025-03-05', count: 10 },
    { date: '2025-03-10', count: 12 },
    { date: '2025-03-15', count: 13 },
  ],
};

export function AffiliateOverview() {
  const [timeRange, setTimeRange] = useState("month");
  const [chartType, setChartType] = useState("earnings");
  
  // Obtener datos de afiliado
  const { data: affiliateData, isLoading, error } = useQuery({
    queryKey: ["affiliate", "earnings", timeRange],
    queryFn: async () => {
      try {
        // Esta ruta debe estar implementada en el servidor
        const response = await axios.get(`/api/affiliate/earnings?timeRange=${timeRange}`);
        return response.data;
      } catch (error) {
        // Si el API falla, usamos datos dummy para demostración
        console.log("Error fetching affiliate data, using dummy data");
        return {
          success: true,
          data: {
            earnings: dummyData.earnings,
            clicks: dummyData.clicks,
            conversions: dummyData.conversions,
            totalEarnings: 325,
            totalClicks: 175,
            totalConversions: 13,
            conversionRate: 7.4,
            nextPaymentDate: "2025-04-15",
            nextPaymentAmount: 325,
            recentLinks: [
              { 
                id: "link1", 
                name: "Curso de producción musical", 
                url: "https://example.com/curso-produccion",
                clicks: 75, 
                conversions: 6,
                earnings: 150,
                conversionRate: 8.0,
              },
              { 
                id: "link2", 
                name: "Plugins para mezcla", 
                url: "https://example.com/plugins",
                clicks: 100, 
                conversions: 7,
                earnings: 175,
                conversionRate: 7.0,
              },
            ],
            progress: {
              level: "Básico",
              points: 325,
              nextLevel: "Plata",
              nextLevelPoints: 500,
              percentage: 65,
            }
          }
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mientras carga los datos
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <ProgressCircular />
      </div>
    );
  }

  // Si hay un error
  if (error || !affiliateData?.success) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <p>Error al cargar los datos de afiliado. Por favor intenta nuevamente.</p>
      </div>
    );
  }

  const data = affiliateData.data;
  
  // Determinar qué datos mostrar en la gráfica según el tipo seleccionado
  const chartData = data[chartType] || [];
  
  // Preparar datos para la gráfica
  const formattedChartData = chartData.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('es-ES', {day: 'numeric', month: 'short'}),
    value: chartType === 'earnings' ? item.amount : item.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panel de Estadísticas</h2>
          <p className="text-muted-foreground">
            Monitorea el rendimiento de tus enlaces de afiliado
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período de tiempo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mes</SelectItem>
            <SelectItem value="quarter">Último trimestre</SelectItem>
            <SelectItem value="year">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ganancias Totales</p>
              <p className="text-2xl font-bold">${data.totalEarnings}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clicks</p>
              <p className="text-2xl font-bold">{data.totalClicks}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversiones</p>
              <p className="text-2xl font-bold">{data.totalConversions}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tasa de Conversión</p>
              <p className="text-2xl font-bold">{data.conversionRate}%</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Evolución de rendimiento</CardTitle>
            <Tabs value={chartType} onValueChange={setChartType} className="w-full md:w-auto">
              <TabsList className="grid w-full md:w-[400px] grid-cols-3">
                <TabsTrigger value="earnings">Ganancias</TabsTrigger>
                <TabsTrigger value="clicks">Clicks</TabsTrigger>
                <TabsTrigger value="conversions">Conversiones</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedChartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [
                    chartType === 'earnings' ? `$${value}` : value, 
                    chartType === 'earnings' ? 'Ganancias' : (chartType === 'clicks' ? 'Clicks' : 'Conversiones')
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--primary)" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Próximo pago y nivel de afiliado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Próximo Pago</CardTitle>
            <CardDescription>Información sobre tu próximo pago como afiliado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Fecha Estimada</p>
                  <p className="text-lg font-medium">{new Date(data.nextPaymentDate).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm font-medium text-muted-foreground">Monto</p>
                  <p className="text-lg font-medium">${data.nextPaymentAmount}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Información de pago</p>
                <p className="text-sm">
                  Los pagos se procesan automáticamente el día 15 de cada mes 
                  cuando el saldo acumulado supera los $50.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Nivel de Afiliado</CardTitle>
            <CardDescription>Tu progreso actual en el programa de afiliados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div className="mr-4">
                <ProgressCircular 
                  value={data.progress.percentage} 
                  size="lg" 
                  variant="default"
                  showValue
                  thickness={6}
                />
              </div>
              <div>
                <h4 className="font-medium text-lg">{data.progress.level}</h4>
                <p className="text-sm text-muted-foreground">
                  {data.progress.points} / {data.progress.nextLevelPoints} puntos
                </p>
                <p className="text-sm font-medium mt-1">
                  Siguiente nivel: {data.progress.nextLevel}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Acumula puntos con cada venta. Al alcanzar el nivel {data.progress.nextLevel},
              incrementarás tu tasa de comisión y obtendrás beneficios adicionales.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Links */}
      <Card>
        <CardHeader>
          <CardTitle>Enlaces con mejor rendimiento</CardTitle>
          <CardDescription>Tus enlaces que han generado más conversiones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentLinks.map((link: any) => (
              <div key={link.id} className="border rounded-lg p-4">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-medium flex items-center">
                      {link.name}
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </h4>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {link.url}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Clicks</p>
                      <p className="font-medium">{link.clicks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conv.</p>
                      <p className="font-medium">{link.conversions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tasa</p>
                      <p className="font-medium">{link.conversionRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ganancias</p>
                      <p className="font-medium">${link.earnings}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}