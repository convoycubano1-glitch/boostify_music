import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Scatter, ScatterChart, ZAxis,
  Treemap, Sankey, Layer, Rectangle
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const PRODUCT_COLORS = {
  'Suscripciones': '#4f46e5',
  'Cursos': '#06b6d4',
  'Videos': '#10b981',
};

export default function ProductPerformanceDashboard() {
  const [artistData, setArtistData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [analysisTimeframe, setAnalysisTimeframe] = useState<string>('month');
  
  // Estados para métricas calculadas
  const [productRevenue, setProductRevenue] = useState<any[]>([]);
  const [courseData, setCourseData] = useState<any[]>([]);
  const [videoData, setVideoData] = useState<any[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<any[]>([]);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [productTrends, setProductTrends] = useState<any[]>([]);
  const [crossSellData, setCrossSellData] = useState<any[]>([]);
  
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
  
  // Cálculo de métricas de productos basadas en los datos de artistas
  const calculateMetrics = (artists: any[]) => {
    // Recopilar datos de cursos
    const courses: Record<string, number> = {};
    let totalCourseRevenue = 0;
    let coursePurchases = 0;
    
    // Recopilar datos de videos
    const videos: Record<string, number> = {};
    let totalVideoRevenue = 0;
    let videoPurchases = 0;
    
    // Recopilar datos de suscripciones
    const subscriptions: Record<string, number> = { 'Basic': 0, 'Pro': 0, 'Enterprise': 0 };
    const subscriptionRevenue: Record<string, number> = { 'Basic': 0, 'Pro': 0, 'Enterprise': 0 };
    
    // Procesar datos de artistas
    artists.forEach(artist => {
      // Cursos
      if (artist.purchases && artist.purchases.courses && artist.purchases.courses.courses) {
        const artistCourses = artist.purchases.courses.courses;
        coursePurchases += artistCourses.length;
        totalCourseRevenue += artist.purchases.courses.totalSpent || 0;
        
        // Contar ocurrencias de cada curso
        artistCourses.forEach((course: any) => {
          if (course.title) {
            courses[course.title] = (courses[course.title] || 0) + 1;
          }
        });
      }
      
      // Videos
      if (artist.purchases && artist.purchases.videos && artist.purchases.videos.videos) {
        const artistVideos = artist.purchases.videos.videos;
        videoPurchases += artistVideos.length;
        totalVideoRevenue += artist.purchases.videos.totalSpent || 0;
        
        // Contar ocurrencias de cada tipo de video
        artistVideos.forEach((video: any) => {
          if (video.type) {
            videos[video.type] = (videos[video.type] || 0) + 1;
          }
        });
      }
      
      // Suscripciones
      if (artist.subscription && artist.subscription.plan) {
        const plan = artist.subscription.plan;
        const price = artist.subscription.price || 0;
        
        subscriptions[plan] = (subscriptions[plan] || 0) + 1;
        subscriptionRevenue[plan] = (subscriptionRevenue[plan] || 0) + price;
      }
    });
    
    // Formatear datos para gráficos
    const productRevenueData = [
      { 
        name: 'Suscripciones', 
        value: Object.values(subscriptionRevenue).reduce((a, b) => a + b, 0),
        users: Object.values(subscriptions).reduce((a, b) => a + b, 0)
      },
      { 
        name: 'Cursos', 
        value: totalCourseRevenue,
        users: coursePurchases
      },
      { 
        name: 'Videos', 
        value: totalVideoRevenue,
        users: videoPurchases
      }
    ];
    
    // Formatear datos de cursos
    const coursesData = Object.keys(courses).map(title => ({
      name: title,
      value: courses[title],
      revenue: courses[title] * (Math.floor(Math.random() * 100) + 150) // Simular precios entre $150-$250
    })).sort((a, b) => b.value - a.value);
    
    // Formatear datos de videos
    const videosData = Object.keys(videos).map(type => ({
      name: type,
      value: videos[type],
      revenue: videos[type] * 199 // Precio fijo de $199
    })).sort((a, b) => b.value - a.value);
    
    // Formatear datos de suscripciones
    const subscriptionsData = Object.keys(subscriptions).map(plan => ({
      name: plan,
      value: subscriptions[plan],
      revenue: subscriptionRevenue[plan]
    })).sort((a, b) => b.value - a.value);
    
    // Generar datos de rendimiento y tendencias
    const performanceData = generatePerformanceData(productRevenueData);
    const trendData = generateTrendData();
    
    // Generar datos de cross-selling
    const crossSell = generateCrossSellData(artists);
    
    // Actualizar estados
    setProductRevenue(productRevenueData);
    setCourseData(coursesData);
    setVideoData(videosData);
    setSubscriptionData(subscriptionsData);
    setProductPerformance(performanceData);
    setProductTrends(trendData);
    setCrossSellData(crossSell);
  };
  
  // Generar datos de rendimiento simulados
  const generatePerformanceData = (baseData: any[]) => {
    const metrics = ['Ingresos', 'Margen', 'Conversión', 'Retención', 'Satisfacción'];
    
    return baseData.map(product => {
      const performanceData: Record<string, any> = { name: product.name };
      
      metrics.forEach(metric => {
        // Generar valores simulados para cada métrica (escala 0-100)
        // Diferentes productos tendrán diferentes fortalezas
        const baseValue = 50 + Math.random() * 30;
        
        // Añadir variaciones basadas en producto y métrica
        let modifier = 0;
        
        if (product.name === 'Suscripciones') {
          if (metric === 'Retención' || metric === 'Ingresos') modifier = 15;
          else if (metric === 'Margen') modifier = 20;
        } else if (product.name === 'Cursos') {
          if (metric === 'Satisfacción' || metric === 'Margen') modifier = 15;
          else if (metric === 'Conversión') modifier = 10;
        } else if (product.name === 'Videos') {
          if (metric === 'Conversión') modifier = 15;
        }
        
        // Valor final con variación aleatoria
        performanceData[metric] = Math.min(100, Math.max(10, 
          baseValue + modifier + (Math.random() * 10 - 5)
        ));
      });
      
      return performanceData;
    });
  };
  
  // Generar datos de tendencias simulados
  const generateTrendData = () => {
    const months = 12;
    const data = [];
    
    // Obtener fecha actual
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    
    for (let i = 0; i < months; i++) {
      // Calcular mes actual (0-11)
      const month = (currentMonth - months + i + 1 + 12) % 12;
      const date = new Date(currentDate.getFullYear(), month, 1);
      
      // Factores estacionales para simular tendencias
      // Más suscripciones en enero, más cursos en septiembre, etc.
      const seasonFactor = {
        Suscripciones: month === 0 ? 1.3 : month === 6 ? 1.2 : 1,
        Cursos: month === 8 ? 1.3 : month === 1 ? 1.2 : 1,
        Videos: month === 10 ? 1.25 : month === 5 ? 1.15 : 1
      };
      
      // Factores de crecimiento general con el tiempo
      const growthFactor = 1 + (0.05 * i / months);
      
      // Base con crecimiento linear + variabilidad
      const baseSubs = 8000 * growthFactor * (0.9 + Math.random() * 0.2);
      const baseCourses = 5000 * growthFactor * (0.85 + Math.random() * 0.3);
      const baseVideos = 4000 * growthFactor * (0.8 + Math.random() * 0.4);
      
      // Aplicar factores estacionales
      data.push({
        name: date.toLocaleDateString('default', { month: 'short' }),
        Suscripciones: Math.round(baseSubs * seasonFactor.Suscripciones),
        Cursos: Math.round(baseCourses * seasonFactor.Cursos),
        Videos: Math.round(baseVideos * seasonFactor.Videos)
      });
    }
    
    return data;
  };
  
  // Generar datos de cross-selling/up-selling
  const generateCrossSellData = (artists: any[]) => {
    // Contadores para análisis de cross-selling
    const combos: Record<string, number> = {
      'Suscripciones+Cursos': 0,
      'Suscripciones+Videos': 0,
      'Cursos+Videos': 0,
      'Todos': 0,
      'Solo Suscripciones': 0,
      'Solo Cursos': 0,
      'Solo Videos': 0,
      'Ninguno': 0
    };
    
    // Analizar patrones de compra
    artists.forEach(artist => {
      const hasSub = artist.subscription && artist.subscription.plan;
      const hasCourses = artist.purchases?.courses?.courses?.length > 0;
      const hasVideos = artist.purchases?.videos?.videos?.length > 0;
      
      if (hasSub && hasCourses && hasVideos) {
        combos['Todos']++;
      } else if (hasSub && hasCourses) {
        combos['Suscripciones+Cursos']++;
      } else if (hasSub && hasVideos) {
        combos['Suscripciones+Videos']++;
      } else if (hasCourses && hasVideos) {
        combos['Cursos+Videos']++;
      } else if (hasSub) {
        combos['Solo Suscripciones']++;
      } else if (hasCourses) {
        combos['Solo Cursos']++;
      } else if (hasVideos) {
        combos['Solo Videos']++;
      } else {
        combos['Ninguno']++;
      }
    });
    
    // Formatear para TreeMap
    const data = Object.keys(combos).map(combo => ({
      name: combo,
      value: combos[combo],
      percentage: (combos[combo] / artists.length * 100).toFixed(1)
    }));
    
    return data;
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando datos de productos...</div>;
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Rendimiento de Productos</h2>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(productRevenue.reduce((sum, item) => sum + item.value, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(5 + Math.random() * 10)}% vs mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptionData.reduce((sum, item) => sum + item.value, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(3 + Math.random() * 8)} nuevas suscripciones
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cursos Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courseData.reduce((sum, item) => sum + item.value, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {courseData.length} cursos diferentes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Videos Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videoData.reduce((sum, item) => sum + item.value, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {videoData.length} tipos de videos
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="overview">Visión General</TabsTrigger>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
          </TabsList>
          
          <Select value={analysisTimeframe} onValueChange={setAnalysisTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período de análisis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Último Mes</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Año</SelectItem>
              <SelectItem value="all">Todo el Histórico</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Gráfico de ingresos por producto */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Producto</CardTitle>
                <CardDescription>Distribución de ingresos por línea de producto</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productRevenue}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {productRevenue.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PRODUCT_COLORS[entry.name as keyof typeof PRODUCT_COLORS] || COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Cuadro comparativo con métricas */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
                <CardDescription>Comparativa entre productos (escala 0-100)</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={90} data={productPerformance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    {['Ingresos', 'Margen', 'Conversión', 'Retención', 'Satisfacción'].map((dataKey, index) => (
                      <Radar
                        key={dataKey}
                        name={dataKey}
                        dataKey={dataKey}
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.1}
                      />
                    ))}
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Gráfico de cross-selling */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Análisis de Cross-Selling</CardTitle>
                <CardDescription>Combinaciones de productos por cliente</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={crossSellData}
                    dataKey="value"
                    ratio={4/3}
                    stroke="#fff"
                    fill="#8884d8"
                    content={(props: any) => {
                      const { x, y, width, height, name, value, percentage } = props;
                      return (
                        <g>
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            style={{
                              fill: COLORS[props.index % COLORS.length],
                              stroke: '#fff',
                              strokeWidth: 2,
                              strokeOpacity: 1,
                            }}
                          />
                          {width > 50 && height > 30 && (
                            <>
                              <text
                                x={x + width / 2}
                                y={y + height / 2 - 10}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize={14}
                              >
                                {name}
                              </text>
                              <text
                                x={x + width / 2}
                                y={y + height / 2 + 10}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize={12}
                              >
                                {percentage}%
                              </text>
                            </>
                          )}
                        </g>
                      );
                    }}
                  />
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Detalle de suscripciones */}
            <Card>
              <CardHeader>
                <CardTitle>Planes de Suscripción</CardTitle>
                <CardDescription>Distribución de planes activos</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subscriptionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value) => [`${value} usuarios`, 'Cantidad']} />
                    <Bar dataKey="value" fill="#4f46e5">
                      {subscriptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {subscriptionData.map((data, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        ></div>
                        <span>{data.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(data.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Detalle de cursos */}
            <Card>
              <CardHeader>
                <CardTitle>Cursos Populares</CardTitle>
                <CardDescription>Top cursos por número de ventas</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={courseData.slice(0, 5)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip formatter={(value) => [`${value} ventas`, 'Cantidad']} />
                    <Bar dataKey="value" fill="#06b6d4">
                      {courseData.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {courseData.slice(0, 5).map((data, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        ></div>
                        <span className="truncate max-w-[150px]">{data.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(data.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Detalle de videos */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Videos</CardTitle>
                <CardDescription>Distribución por tipo de video</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={videoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => 
                        percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
                      }
                    >
                      {videoData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} videos`, 'Cantidad']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {videoData.map((data, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        ></div>
                        <span>{data.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(data.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabla comparativa */}
          <Card>
            <CardHeader>
              <CardTitle>Comparativa de Productos</CardTitle>
              <CardDescription>Métricas clave por línea de producto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium">Producto</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Ventas</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Ingresos</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Precio Medio</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Margen</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Conversión</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Valoración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productRevenue.map((product, i) => {
                      // Generar datos simulados para la tabla
                      const avgPrice = product.value / Math.max(1, product.users);
                      const margin = 40 + Math.random() * 30;
                      const conversion = 5 + Math.random() * 15;
                      const rating = 3.5 + Math.random() * 1.5;
                      
                      return (
                        <tr key={i} className="border-b">
                          <td className="p-4 align-middle font-medium">{product.name}</td>
                          <td className="p-4 align-middle">{product.users}</td>
                          <td className="p-4 align-middle">{formatCurrency(product.value)}</td>
                          <td className="p-4 align-middle">{formatCurrency(avgPrice)}</td>
                          <td className="p-4 align-middle">{margin.toFixed(1)}%</td>
                          <td className="p-4 align-middle">{conversion.toFixed(1)}%</td>
                          <td className="p-4 align-middle">{rating.toFixed(1)}/5.0</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Gráfico de tendencias de ingresos */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Ingresos</CardTitle>
                <CardDescription>Últimos 12 meses por línea de producto</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={productTrends}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Suscripciones" 
                      stroke="#4f46e5" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Cursos" 
                      stroke="#06b6d4" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Videos" 
                      stroke="#10b981" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Gráfico de área acumulada */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos Acumulados</CardTitle>
                <CardDescription>Contribución de cada producto al total</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={productTrends}
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
                      stroke="#4f46e5" 
                      fill="#4f46e5" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Cursos" 
                      stackId="1"
                      stroke="#06b6d4" 
                      fill="#06b6d4" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Videos" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Gráfico de burbujas para análisis de productos */}
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Portafolio de Productos</CardTitle>
                <CardDescription>Volumen vs. Rentabilidad vs. Crecimiento</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="volume" 
                      name="Volumen" 
                      unit="%" 
                      domain={[0, 100]}
                      label={{ value: 'Volumen de Ventas (%)', position: 'bottom', offset: 0 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="margin" 
                      name="Margen" 
                      unit="%" 
                      domain={[0, 100]}
                      label={{ value: 'Margen (%)', angle: -90, position: 'left' }}
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="growth" 
                      range={[50, 800]} 
                      name="Crecimiento" 
                      unit="%" 
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'Crecimiento' ? `${value}% anual` : `${value}%`, 
                        name
                      ]} 
                      cursor={{ strokeDasharray: '3 3' }}
                    />
                    <Legend />
                    <Scatter 
                      name="Productos" 
                      data={[
                        { 
                          name: 'Suscripciones', 
                          volume: 70, 
                          margin: 80, 
                          growth: 25,
                          color: '#4f46e5'
                        },
                        { 
                          name: 'Cursos', 
                          volume: 55, 
                          margin: 65, 
                          growth: 35,
                          color: '#06b6d4'
                        },
                        { 
                          name: 'Videos', 
                          volume: 40, 
                          margin: 50, 
                          growth: 45,
                          color: '#10b981'
                        },
                        { 
                          name: 'Planes Enterprise', 
                          volume: 15, 
                          margin: 90, 
                          growth: 20,
                          color: '#eab308'
                        },
                        { 
                          name: 'Merchandising', 
                          volume: 20, 
                          margin: 40, 
                          growth: 15,
                          color: '#ec4899'
                        }
                      ]} 
                      fill="#8884d8"
                      shape={(props: any) => {
                        const { cx, cy, r, name, color } = props;
                        return (
                          <g>
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={r} 
                              stroke={color} 
                              strokeWidth={2} 
                              fill={color} 
                              fillOpacity={0.3}
                            />
                            <text 
                              x={cx} 
                              y={cy - r - 5} 
                              textAnchor="middle" 
                              fill={color}
                              fontSize={12}
                              fontWeight={500}
                            >
                              {name}
                            </text>
                          </g>
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">
                  <p>La gráfica muestra la relación entre volumen de ventas, margen de beneficio y crecimiento (tamaño de burbuja).</p>
                  <p>Los productos ideales están en la esquina superior derecha con burbujas grandes (alto volumen, alto margen, alto crecimiento).</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}