import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FinanceDashboard from '../components/analytics/finance-dashboard';
import UserGrowthDashboard from '../components/analytics/user-growth-dashboard';
import ProductPerformanceDashboard from '../components/analytics/product-performance-dashboard';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [summary, setSummary] = useState<any>({
    totalArtists: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    growthRate: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [overviewData, setOverviewData] = useState<any[]>([]);

  // Cargar datos resumidos
  useEffect(() => {
    async function fetchSummaryData() {
      try {
        // Obtener datos de artistas para generar resumen
        const artistsCollection = collection(db, 'generated-artists');
        const artistsSnapshot = await getDocs(artistsCollection);
        const artists = artistsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calcular métricas
        const artistCount = artists.length;
        
        // Calcular ingresos totales (suscripciones + cursos + videos)
        let totalRevenue = 0;
        let subscriptionCount = 0;
        
        artists.forEach(artist => {
          // Suscripciones
          if (artist.subscription && artist.subscription.price) {
            totalRevenue += artist.subscription.price;
            subscriptionCount++;
          }
          
          // Cursos
          if (artist.purchases?.courses?.totalSpent) {
            totalRevenue += artist.purchases.courses.totalSpent;
          }
          
          // Videos
          if (artist.purchases?.videos?.totalSpent) {
            totalRevenue += artist.purchases.videos.totalSpent;
          }
        });
        
        // Generar datos de crecimiento para gráfico de resumen
        const summaryChartData = generateOverviewData(artistCount, totalRevenue);
        
        // Actualizar estado
        setSummary({
          totalArtists: artistCount,
          totalRevenue: totalRevenue,
          activeSubscriptions: subscriptionCount,
          growthRate: Math.round(10 + Math.random() * 15) // Valor simulado entre 10-25%
        });
        setOverviewData(summaryChartData);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos de resumen:", error);
        setLoading(false);
      }
    }
    
    fetchSummaryData();
  }, []);

  // Generar datos simulados para el gráfico de visión general
  const generateOverviewData = (currentUsers: number, currentRevenue: number) => {
    const months = 12;
    const data = [];
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Definir tasa de crecimiento mensual (entre 5% y 10%)
    const userGrowthRate = 0.06 + Math.random() * 0.04;
    const revenueGrowthRate = 0.08 + Math.random() * 0.05;
    
    // Iniciar con una base de usuarios e ingresos
    const startingUsers = Math.max(5, Math.floor(currentUsers / Math.pow(1 + userGrowthRate, months)));
    const startingRevenue = Math.max(500, Math.floor(currentRevenue / Math.pow(1 + revenueGrowthRate, months)));
    
    for (let i = 0; i < months; i++) {
      const date = new Date(currentYear, currentMonth - (months - 1) + i);
      
      // Calcular valores con crecimiento compuesto y variabilidad aleatoria
      const baseUserGrowth = startingUsers * Math.pow(1 + userGrowthRate, i);
      const baseRevenueGrowth = startingRevenue * Math.pow(1 + revenueGrowthRate, i);
      
      const randomFactor = 0.9 + Math.random() * 0.2; // Variabilidad entre 90% y 110%
      const users = Math.round(baseUserGrowth * randomFactor);
      const revenue = Math.round(baseRevenueGrowth * randomFactor);
      
      data.push({
        name: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        'Usuarios': users,
        'Ingresos': revenue,
        'ARPU': Math.round((revenue / users) * 100) / 100
      });
    }
    
    return data;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Cargando datos analíticos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-6">Panel de Análisis</h1>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Artistas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalArtists}</div>
            <p className="text-xs text-muted-foreground">
              Crecimiento +{summary.growthRate}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(summary.growthRate * 1.2)}% vs mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {((summary.activeSubscriptions / Math.max(1, summary.totalArtists)) * 100).toFixed(0)}% de tasa de conversión
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingreso Promedio (ARPU)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalRevenue / Math.max(1, summary.totalArtists))}
            </div>
            <p className="text-xs text-muted-foreground">
              Por usuario activo
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico de visión general */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Resumen General</CardTitle>
          <CardDescription>Evolución de usuarios e ingresos (últimos 12 meses)</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={overviewData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Ingresos') return [formatCurrency(Number(value)), name];
                  if (name === 'ARPU') return [formatCurrency(Number(value)), name];
                  return [value, name];
                }} 
              />
              <Legend />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="Usuarios" 
                stroke="#8884d8" 
                fillOpacity={1}
                fill="url(#colorUsers)" 
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="Ingresos" 
                stroke="#82ca9d" 
                fillOpacity={1}
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="finances">Finanzas</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="finances" className="py-4">
          <FinanceDashboard />
        </TabsContent>
        
        <TabsContent value="users" className="py-4">
          <UserGrowthDashboard />
        </TabsContent>
        
        <TabsContent value="products" className="py-4">
          <ProductPerformanceDashboard />
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Notas Metodológicas</h3>
        <p className="text-sm text-muted-foreground">
          Los datos presentados en este panel se basan en artistas generados aleatoriamente en el sistema.
          Las proyecciones y tendencias son simulaciones basadas en patrones típicos de la industria y no
          constituyen pronósticos financieros oficiales. Los datos de crecimiento y comparativas mensuales
          son valores estimados para propósitos de demostración.
        </p>
      </div>
    </div>
  );
}