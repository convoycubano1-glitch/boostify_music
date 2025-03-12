import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import FinanceDashboard from '../components/analytics/finance-dashboard';
import UserGrowthDashboard from '../components/analytics/user-growth-dashboard';
import ProductPerformanceDashboard from '../components/analytics/product-performance-dashboard';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowUpRight, Users, DollarSign, CreditCard, TrendingUp, Music, FileVideo, GraduationCap } from 'lucide-react';

// Colores para gráficos
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

interface SummaryData {
  totalArtists: number;
  totalRevenue: number;
  activeSubscriptions: number;
  growthRate: number;
  subscriptionDistribution: {
    Basic: number;
    Pro: number;
    Enterprise: number;
  };
  productDistribution: {
    Videos: number;
    Cursos: number;
  };
}

export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState('finances');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('monthly');
  const [summary, setSummary] = useState<SummaryData>({
    totalArtists: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    growthRate: 0,
    subscriptionDistribution: {
      Basic: 0,
      Pro: 0,
      Enterprise: 0
    },
    productDistribution: {
      Videos: 0,
      Cursos: 0
    }
  });
  const [overviewData, setOverviewData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSummaryData() {
      try {
        // Obtener datos de artistas para generar resumen
        const artistsCollection = collection(db, 'generated_artists');
        const artistsSnapshot = await getDocs(artistsCollection);
        const artists = artistsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calcular métricas
        const artistCount = artists.length;
        
        // Calcular ingresos totales y distribución de subscripciones
        let totalRevenue = 0;
        let subscriptionCount = 0;
        const subscriptionDistribution = {
          Basic: 0,
          Pro: 0,
          Enterprise: 0
        };
        
        let videoCount = 0;
        let courseCount = 0;
        
        artists.forEach(artist => {
          // Suscripciones
          if (artist.subscription?.plan) {
            totalRevenue += artist.subscription.price || 0;
            subscriptionCount++;
            
            // Contar por tipo de plan
            if (artist.subscription.plan in subscriptionDistribution) {
              subscriptionDistribution[artist.subscription.plan as keyof typeof subscriptionDistribution]++;
            }
          }
          
          // Cursos
          if (artist.purchases?.courses?.courses) {
            totalRevenue += artist.purchases.courses.totalSpent || 0;
            courseCount += artist.purchases.courses.courses.length || 0;
          }
          
          // Videos
          if (artist.purchases?.videos?.videos) {
            totalRevenue += artist.purchases.videos.totalSpent || 0;
            videoCount += artist.purchases.videos.videos.length || 0;
          }
        });
        
        // Generar datos de crecimiento para gráfico de resumen
        const summaryChartData = generateOverviewData(artistCount, totalRevenue);
        
        // Actualizar estado
        setSummary({
          totalArtists: artistCount,
          totalRevenue: totalRevenue,
          activeSubscriptions: subscriptionCount,
          growthRate: Math.round(10 + Math.random() * 15), // Valor simulado entre 10-25%
          subscriptionDistribution,
          productDistribution: {
            Videos: videoCount,
            Cursos: courseCount
          }
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
    
    // Definir tasa de crecimiento mensual
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

  // Generar datos para el gráfico de distribución de ingresos
  const getRevenueDistribution = () => {
    // Estimar ingresos de suscripciones
    const subscriptionRevenue = summary.subscriptionDistribution.Basic * 59.99 +
                               summary.subscriptionDistribution.Pro * 99.99 +
                               summary.subscriptionDistribution.Enterprise * 149.99;
    
    // Estimar ingresos de productos
    const videoRevenue = summary.productDistribution.Videos * 199;
    const courseRevenue = summary.productDistribution.Cursos * 225; // Promedio entre 149 y 299
    
    return [
      { name: 'Suscripciones', value: subscriptionRevenue, color: COLORS[0] },
      { name: 'Videos', value: videoRevenue, color: COLORS[1] },
      { name: 'Cursos', value: courseRevenue, color: COLORS[2] }
    ];
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Panel de Análisis</h1>
          <p className="text-muted-foreground mt-1">Visualiza el rendimiento y métricas clave</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" /> 
            +{summary.growthRate}% crecimiento
          </div>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total de Artistas</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalArtists.toLocaleString()}</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-500 flex items-center font-medium">
                <ArrowUpRight className="h-3 w-3 mr-1" /> 
                {summary.growthRate}%
              </span>
              <span className="text-xs text-muted-foreground ml-2">vs. mes pasado</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-green-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-500 flex items-center font-medium">
                <ArrowUpRight className="h-3 w-3 mr-1" /> 
                {Math.round(summary.growthRate * 1.2)}%
              </span>
              <span className="text-xs text-muted-foreground ml-2">vs. mes pasado</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-amber-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.activeSubscriptions}</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-500 flex items-center font-medium">
                {((summary.activeSubscriptions / Math.max(1, summary.totalArtists)) * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground ml-2">tasa de conversión</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-purple-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Ingreso Por Usuario</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(summary.totalRevenue / Math.max(1, summary.totalArtists))}
            </div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-500 flex items-center font-medium">
                <ArrowUpRight className="h-3 w-3 mr-1" /> 
                {Math.round(summary.growthRate * 0.8)}%
              </span>
              <span className="text-xs text-muted-foreground ml-2">vs. mes pasado</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tendencia de Crecimiento</CardTitle>
                <CardDescription>Evolución de métricas clave (12 meses)</CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className={`px-3 py-1 text-xs rounded-full cursor-pointer ${timeRange === 'monthly' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => setTimeRange('monthly')}>
                  Mensual
                </div>
                <div className={`px-3 py-1 text-xs rounded-full cursor-pointer ${timeRange === 'quarterly' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => setTimeRange('quarterly')}>
                  Trimestral
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={overviewData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(value) => value.toLocaleString()} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Ingresos') return [formatCurrency(Number(value)), name];
                    if (name === 'ARPU') return [formatCurrency(Number(value)), name];
                    return [value.toLocaleString(), name];
                  }} 
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="Usuarios" 
                  stroke={COLORS[0]} 
                  fillOpacity={1}
                  fill="url(#colorUsers)" 
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="Ingresos" 
                  stroke={COLORS[1]} 
                  fillOpacity={1}
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Ingresos</CardTitle>
            <CardDescription>Por fuente de ingresos</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getRevenueDistribution()}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {getRevenueDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Products Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Suscripciones</CardTitle>
            <Music className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{summary.activeSubscriptions}</div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Basic</span>
                  <span className="font-medium">{summary.subscriptionDistribution.Basic}</span>
                </div>
                <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-primary" 
                    style={{ 
                      width: `${(summary.subscriptionDistribution.Basic / Math.max(1, summary.activeSubscriptions)) * 100}%` 
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Pro</span>
                  <span className="font-medium">{summary.subscriptionDistribution.Pro}</span>
                </div>
                <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ 
                      width: `${(summary.subscriptionDistribution.Pro / Math.max(1, summary.activeSubscriptions)) * 100}%` 
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Enterprise</span>
                  <span className="font-medium">{summary.subscriptionDistribution.Enterprise}</span>
                </div>
                <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ 
                      width: `${(summary.subscriptionDistribution.Enterprise / Math.max(1, summary.activeSubscriptions)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Videos Vendidos</CardTitle>
            <FileVideo className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{summary.productDistribution.Videos}</div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Total vendido</div>
              <div className="text-xl font-semibold">
                {formatCurrency(summary.productDistribution.Videos * 199)}
              </div>
              <div className="flex items-center text-xs">
                <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full px-2 py-0.5">
                  {((summary.productDistribution.Videos / Math.max(1, summary.totalArtists)) * 100).toFixed(0)}% de usuarios
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Cursos Vendidos</CardTitle>
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{summary.productDistribution.Cursos}</div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Total vendido</div>
              <div className="text-xl font-semibold">
                {formatCurrency(summary.productDistribution.Cursos * 225)}
              </div>
              <div className="flex items-center text-xs">
                <div className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full px-2 py-0.5">
                  {((summary.productDistribution.Cursos / Math.max(1, summary.totalArtists)) * 100).toFixed(0)}% de usuarios
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Dashboard Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Detallado</CardTitle>
          <CardDescription>Explora métricas detalladas por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="finances" className="text-base">Finanzas</TabsTrigger>
              <TabsTrigger value="users" className="text-base">Usuarios</TabsTrigger>
              <TabsTrigger value="products" className="text-base">Productos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="finances" className="py-2 px-1">
              <FinanceDashboard />
            </TabsContent>
            
            <TabsContent value="users" className="py-2 px-1">
              <UserGrowthDashboard />
            </TabsContent>
            
            <TabsContent value="products" className="py-2 px-1">
              <ProductPerformanceDashboard />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-8 p-6 bg-muted/50 dark:bg-gray-800/50 rounded-lg border border-muted">
        <h3 className="text-lg font-semibold mb-3">Notas Metodológicas</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Los datos presentados en este panel se basan en artistas generados aleatoriamente en el sistema.
          Las proyecciones y tendencias son simulaciones basadas en patrones típicos de la industria y no
          constituyen pronósticos financieros oficiales. Los datos de crecimiento y comparativas mensuales
          son valores estimados para propósitos de demostración.
        </p>
      </div>
    </div>
  );
}