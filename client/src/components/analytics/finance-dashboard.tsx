import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AreaChart as TremorAreaChart,
  BarChart as TremorBarChart,
  DonutChart,
  LineChart as TremorLineChart,
  Card as TremorCard,
  Title,
  Text
} from '@tremor/react';

interface RevenueData {
  title: string;
  [key: string]: any;
}

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const PLAN_COLORS = {
  'Basic': '#4338ca',
  'Pro': '#0ea5e9',
  'Enterprise': '#10b981',
};

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState('current');
  const [artistData, setArtistData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('6months');
  
  // Estados para métricas calculadas
  const [subscriptionRevenue, setSubscriptionRevenue] = useState<any>({});
  const [courseRevenue, setCourseRevenue] = useState<number>(0);
  const [videoRevenue, setVideoRevenue] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [projectedRevenue, setProjectedRevenue] = useState<any[]>([]);
  
  // Carga de datos de artistas desde Firestore
  useEffect(() => {
    async function fetchArtists() {
      try {
        const artistsCollection = collection(db, 'generated-artists');
        const artistsSnapshot = await getDocs(artistsCollection);
        const artistsList = artistsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setArtistData(artistsList);
        calculateMetrics(artistsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching artists:', error);
        setLoading(false);
      }
    }
    
    fetchArtists();
  }, []);
  
  // Cálculo de métricas financieras basadas en los datos de artistas
  const calculateMetrics = (artists: any[]) => {
    // Total de ingresos por suscripciones
    const planCounts: Record<string, number> = { 'Basic': 0, 'Pro': 0, 'Enterprise': 0 };
    const planRevenue: Record<string, number> = { 'Basic': 0, 'Pro': 0, 'Enterprise': 0 };
    
    // Ingresos por cursos y videos
    let totalCourseRevenue = 0;
    let totalVideoRevenue = 0;
    
    // Procesar datos de artistas
    artists.forEach(artist => {
      // Suscripciones
      if (artist.subscription && artist.subscription.plan) {
        const plan = artist.subscription.plan;
        const price = artist.subscription.price || 0;
        
        planCounts[plan] = (planCounts[plan] || 0) + 1;
        planRevenue[plan] = (planRevenue[plan] || 0) + price;
      }
      
      // Cursos
      if (artist.purchases && artist.purchases.courses) {
        totalCourseRevenue += artist.purchases.courses.totalSpent || 0;
      }
      
      // Videos
      if (artist.purchases && artist.purchases.videos) {
        totalVideoRevenue += artist.purchases.videos.totalSpent || 0;
      }
    });
    
    // Calcular total de ingresos
    const total = Object.values(planRevenue).reduce((sum: any, value) => sum + value, 0) + 
                 totalCourseRevenue + totalVideoRevenue;
    
    // Crear datos para gráfico de distribución de planes
    const planData = Object.keys(planCounts).map(plan => ({
      name: plan,
      value: planCounts[plan],
      revenue: planRevenue[plan]
    }));
    
    // Generar datos históricos mensuales simulados (últimos 12 meses)
    const currentMonth = new Date().getMonth();
    const monthlyData = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const date = new Date();
      date.setMonth(monthIndex);
      
      // Simular tendencia de crecimiento con algo de variabilidad
      const growthFactor = 1 + (0.1 * (12 - i) / 12); // Crecimiento del 10% anual
      const randomFactor = 0.9 + Math.random() * 0.2; // Variabilidad aleatoria entre 0.9 y 1.1
      
      // Calcular ingresos por tipo con variaciones
      const monthlySubscription = (total * 0.7 / 12) * growthFactor * randomFactor;
      const monthlyCourses = (total * 0.2 / 12) * growthFactor * (0.8 + Math.random() * 0.4);
      const monthlyVideos = (total * 0.1 / 12) * growthFactor * (0.7 + Math.random() * 0.6);
      
      monthlyData.push({
        name: date.toLocaleString('default', { month: 'short' }),
        Suscripciones: Math.round(monthlySubscription),
        Cursos: Math.round(monthlyCourses),
        Videos: Math.round(monthlyVideos),
        Total: Math.round(monthlySubscription + monthlyCourses + monthlyVideos)
      });
    }
    
    // Generar proyecciones financieras
    const projected = generateProjections(total, monthlyData);
    
    // Actualizar estados
    setSubscriptionRevenue(planRevenue);
    setCourseRevenue(totalCourseRevenue);
    setVideoRevenue(totalVideoRevenue);
    setTotalRevenue(total);
    setPlanDistribution(planData);
    setMonthlyRevenue(monthlyData);
    setProjectedRevenue(projected);
  };
  
  // Función para generar proyecciones financieras
  const generateProjections = (currentRevenue: number, historicalData: any[]) => {
    // Determinar tendencia de crecimiento basada en datos históricos
    let growthRate = 0.15; // Tasa de crecimiento anual predeterminada (15%)
    
    if (historicalData.length >= 6) {
      const recent = historicalData.slice(-3).reduce((sum, item) => sum + item.Total, 0);
      const older = historicalData.slice(-6, -3).reduce((sum, item) => sum + item.Total, 0);
      if (older > 0) {
        growthRate = Math.max(0.05, Math.min(0.5, (recent / older - 1) * 2)); // Limitar entre 5% y 50%
      }
    }
    
    // Generar proyecciones mensuales
    const projections = [];
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() + 1);
    
    // Definir escenarios
    const scenarios = [
      { name: 'Conservador', factor: 0.7 },
      { name: 'Esperado', factor: 1.0 },
      { name: 'Optimista', factor: 1.3 }
    ];
    
    // Proyectar para diferentes plazos según el rango seleccionado
    let months = 12;
    switch(timeRange) {
      case '6months': months = 6; break;
      case '1year': months = 12; break;
      case '3years': months = 36; break;
      case '5years': months = 60; break;
      default: months = 12;
    }
    
    // Última cifra de ingresos mensuales
    const lastMonthRevenue = historicalData.length > 0 
      ? historicalData[historicalData.length - 1].Total 
      : currentRevenue / 12;
    
    for (let i = 0; i < months; i++) {
      const date = new Date(lastMonth);
      date.setMonth(lastMonth.getMonth() + i);
      
      // Factor de crecimiento mensual (compuesto)
      const monthlyGrowthFactor = Math.pow(1 + growthRate, (i + 1) / 12);
      
      const projectedData: any = {
        name: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        month: i
      };
      
      // Calcular valores para cada escenario
      scenarios.forEach(scenario => {
        projectedData[scenario.name] = Math.round(
          lastMonthRevenue * monthlyGrowthFactor * scenario.factor
        );
      });
      
      projections.push(projectedData);
    }
    
    return projections;
  };
  
  const calculateTotal = (data: any[]) => {
    return data.reduce((total, item) => {
      return total + (item.value || 0);
    }, 0);
  };
  
  // Procesamiento de datos para resumen de ingresos
  const revenueData: RevenueData[] = [
    { 
      title: 'Ingresos por Suscripciones', 
      Basic: subscriptionRevenue.Basic || 0,
      Pro: subscriptionRevenue.Pro || 0,
      Enterprise: subscriptionRevenue.Enterprise || 0,
      Total: Object.values(subscriptionRevenue).reduce((sum: any, val) => sum + val, 0)
    },
    { 
      title: 'Ingresos por Cursos', 
      Cursos: courseRevenue, 
      Total: courseRevenue 
    },
    { 
      title: 'Ingresos por Videos', 
      Videos: videoRevenue, 
      Total: videoRevenue 
    },
    { 
      title: 'Total de Ingresos', 
      Total: totalRevenue 
    }
  ];
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando datos financieros...</div>;
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Panel Financiero</h2>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(totalRevenue * 0.12)} vs mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Object.values(subscriptionRevenue).reduce((sum: any, val) => sum + val, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {planDistribution.reduce((sum, item) => sum + item.value, 0)} suscriptores activos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos por Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(courseRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(courseRevenue / 200)} cursos vendidos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos por Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(videoRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(videoRevenue / 199)} videos vendidos
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="current" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="current">Datos Actuales</TabsTrigger>
            <TabsTrigger value="projected">Proyecciones</TabsTrigger>
          </TabsList>
          
          {activeTab === 'projected' && (
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar rango" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">6 Meses</SelectItem>
                <SelectItem value="1year">1 Año</SelectItem>
                <SelectItem value="3years">3 Años</SelectItem>
                <SelectItem value="5years">5 Años</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        <TabsContent value="current" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Gráfico de ingresos mensuales */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Ingresos Mensuales (Últimos 12 Meses)</CardTitle>
                <CardDescription>Desglose de ingresos por tipo de producto</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyRevenue}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="Suscripciones" 
                      stackId="1"
                      stroke="#8884d8" 
                      fill="#8884d8" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Cursos" 
                      stackId="1"
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Videos" 
                      stackId="1"
                      stroke="#ffc658" 
                      fill="#ffc658" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Gráfica de distribución de planes */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Planes</CardTitle>
                <CardDescription>Número de suscriptores por plan</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PLAN_COLORS[entry.name as keyof typeof PLAN_COLORS] || COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} usuarios`, 'Cantidad']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Gráfica de ingresos por tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Tipo</CardTitle>
                <CardDescription>Desglose de ingresos por categoría</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Suscripciones',
                        value: Object.values(subscriptionRevenue).reduce((sum: any, val) => sum + val, 0)
                      },
                      { name: 'Cursos', value: courseRevenue },
                      { name: 'Videos', value: videoRevenue }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="#8884d8">
                      {[
                        { name: 'Suscripciones', fill: '#4338ca' },
                        { name: 'Cursos', fill: '#0ea5e9' },
                        { name: 'Videos', fill: '#10b981' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="projected" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Proyección de ingresos */}
            <Card>
              <CardHeader>
                <CardTitle>Proyección de Ingresos</CardTitle>
                <CardDescription>
                  Estimación para los próximos {timeRange === '6months' ? '6 meses' : 
                                              timeRange === '1year' ? '12 meses' : 
                                              timeRange === '3years' ? '3 años' : 
                                              '5 años'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={projectedRevenue}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Conservador" 
                      stroke="#0ea5e9" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Esperado" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Optimista" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Proyección acumulada */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos Acumulados Proyectados</CardTitle>
                <CardDescription>Crecimiento total esperado</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={projectedRevenue.map((item, index, array) => {
                      // Calcular valores acumulados
                      const accConservador = array
                        .slice(0, index + 1)
                        .reduce((sum, cur) => sum + (cur.Conservador || 0), 0);
                      
                      const accEsperado = array
                        .slice(0, index + 1)
                        .reduce((sum, cur) => sum + (cur.Esperado || 0), 0);
                      
                      const accOptimista = array
                        .slice(0, index + 1)
                        .reduce((sum, cur) => sum + (cur.Optimista || 0), 0);
                      
                      return {
                        ...item,
                        "Acum. Conservador": accConservador,
                        "Acum. Esperado": accEsperado,
                        "Acum. Optimista": accOptimista
                      };
                    })}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="Acum. Conservador" 
                      stroke="#0ea5e9" 
                      fill="#0ea5e9" 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Acum. Esperado" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Acum. Optimista" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Tabla de resumen de proyecciones */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Proyecciones</CardTitle>
                <CardDescription>Valores clave en diferentes escenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="h-12 px-4 text-left align-middle font-medium">Plazo</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Conservador</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Esperado</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Optimista</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: '6 Meses', index: Math.min(5, projectedRevenue.length - 1) },
                        { label: '1 Año', index: Math.min(11, projectedRevenue.length - 1) },
                        { label: '3 Años', index: Math.min(35, projectedRevenue.length - 1) },
                        { label: '5 Años', index: Math.min(59, projectedRevenue.length - 1) }
                      ].map((period, i) => {
                        const data = projectedRevenue[period.index] || projectedRevenue[projectedRevenue.length - 1];
                        return data ? (
                          <tr key={i} className="border-b">
                            <td className="p-4 align-middle">{period.label}</td>
                            <td className="p-4 align-middle">{formatCurrency(data.Conservador || 0)}</td>
                            <td className="p-4 align-middle">{formatCurrency(data.Esperado || 0)}</td>
                            <td className="p-4 align-middle">{formatCurrency(data.Optimista || 0)}</td>
                          </tr>
                        ) : null;
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Tabla de resumen de ingresos actuales */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b">
                  <th className="h-12 px-4 text-left align-middle font-medium">Categoría</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Basic</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Pro</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Enterprise</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Cursos</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Videos</th>
                  <th className="h-12 px-4 text-right align-middle font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map((item, index) => (
                  <tr key={index} className={index === revenueData.length - 1 ? "font-medium" : "border-b"}>
                    <td className="p-4 align-middle">{item.title}</td>
                    <td className="p-4 align-middle">{item.Basic ? formatCurrency(item.Basic) : "-"}</td>
                    <td className="p-4 align-middle">{item.Pro ? formatCurrency(item.Pro) : "-"}</td>
                    <td className="p-4 align-middle">{item.Enterprise ? formatCurrency(item.Enterprise) : "-"}</td>
                    <td className="p-4 align-middle">{item.Cursos ? formatCurrency(item.Cursos) : "-"}</td>
                    <td className="p-4 align-middle">{item.Videos ? formatCurrency(item.Videos) : "-"}</td>
                    <td className="p-4 text-right align-middle">{formatCurrency(item.Total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}