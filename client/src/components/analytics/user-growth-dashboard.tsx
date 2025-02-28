import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const GENDER_COLORS = {
  'Mujer': '#d946ef', 
  'Hombre': '#3b82f6'
};

// Mapear nombres de géneros musicales a categorías
const genreCategories: Record<string, string> = {
  'Pop': 'Mainstream',
  'Rock': 'Rock/Alternative',
  'Hip Hop': 'Urban',
  'R&B': 'Urban',
  'Electronic': 'Electronic/Dance',
  'Jazz': 'Niche',
  'Classical': 'Niche',
  'Country': 'Folk/Country',
  'Folk': 'Folk/Country',
  'Reggae': 'World',
  'Blues': 'Niche',
  'Metal': 'Rock/Alternative',
  'Punk': 'Rock/Alternative',
  'Alternative': 'Rock/Alternative',
  'Indie': 'Rock/Alternative',
  'Latin': 'World',
  'K-Pop': 'World',
  'J-Pop': 'World',
  'Trap': 'Urban',
  'Techno': 'Electronic/Dance',
  'House': 'Electronic/Dance',
  'EDM': 'Electronic/Dance',
  'Soul': 'Urban',
  'Funk': 'Urban',
  'Disco': 'Electronic/Dance',
  'Synthwave': 'Electronic/Dance',
  'Lo-Fi': 'Electronic/Dance',
  'Ambient': 'Electronic/Dance'
};

export default function UserGrowthDashboard() {
  const [artistData, setArtistData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('12months');
  
  // Estados para métricas calculadas
  const [genderDistribution, setGenderDistribution] = useState<any[]>([]);
  const [ageDistribution, setAgeDistribution] = useState<any[]>([]);
  const [genreDistribution, setGenreDistribution] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [userEngagement, setUserEngagement] = useState<any[]>([]);
  
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
  
  // Cálculo de métricas de usuarios basadas en los datos de artistas
  const calculateMetrics = (artists: any[]) => {
    // Distribución por género
    const genderCounts: Record<string, number> = {};
    
    // Distribución por edad
    const ageCounts: Record<string, number> = {};
    
    // Distribución por género musical
    const genreCounts: Record<string, number> = {};
    
    // Categorías de géneros musicales
    const categoryCounts: Record<string, number> = {};
    
    // Procesar datos de artistas
    artists.forEach(artist => {
      // Género del artista
      if (artist.look && artist.look.description) {
        const description = artist.look.description;
        if (description.includes('Mujer')) {
          genderCounts['Mujer'] = (genderCounts['Mujer'] || 0) + 1;
        } else if (description.includes('Hombre')) {
          genderCounts['Hombre'] = (genderCounts['Hombre'] || 0) + 1;
        }
        
        // Extraer información de edad
        if (description.includes('joven (18-25 años)')) {
          ageCounts['18-25'] = (ageCounts['18-25'] || 0) + 1;
        } else if (description.includes('adulto joven (26-35 años)')) {
          ageCounts['26-35'] = (ageCounts['26-35'] || 0) + 1;
        }
      }
      
      // Géneros musicales
      if (artist.music_genres && Array.isArray(artist.music_genres)) {
        artist.music_genres.forEach((genre: string) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          
          // Categorizar géneros
          const category = genreCategories[genre] || 'Otros';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
    });
    
    // Formatear datos para gráficos
    const genderData = Object.keys(genderCounts).map(gender => ({
      name: gender,
      value: genderCounts[gender]
    }));
    
    const ageData = Object.keys(ageCounts).map(age => ({
      name: age,
      value: ageCounts[age]
    }));
    
    // Ordenar géneros musicales por popularidad
    const genreData = Object.keys(genreCounts)
      .map(genre => ({
        name: genre,
        value: genreCounts[genre]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 géneros
    
    const categoryData = Object.keys(categoryCounts).map(category => ({
      name: category,
      value: categoryCounts[category]
    }));
    
    // Generar datos de crecimiento simulados
    const growthData = generateGrowthData(artists.length);
    
    // Generar datos de retención simulados
    const retention = generateRetentionData();
    
    // Generar datos de engagement simulados
    const engagement = generateEngagementData();
    
    // Actualizar estados
    setGenderDistribution(genderData);
    setAgeDistribution(ageData);
    setGenreDistribution(genreData);
    setCategoryDistribution(categoryData);
    setUserGrowth(growthData);
    setRetentionData(retention);
    setUserEngagement(engagement);
  };
  
  // Generar datos de crecimiento simulados
  const generateGrowthData = (currentUsers: number) => {
    const data = [];
    const months = timeRange === '6months' ? 6 : 
                  timeRange === '12months' ? 12 : 
                  timeRange === '3years' ? 36 : 24;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Definir tasa de crecimiento mensual (entre 5% y 15%)
    const growthRate = 0.08 + Math.random() * 0.07;
    
    // Iniciar con una base de usuarios
    const startingUsers = Math.max(10, Math.floor(currentUsers / Math.pow(1 + growthRate, months)));
    
    for (let i = 0; i < months; i++) {
      const date = new Date(currentYear, currentMonth - (months - 1) + i);
      
      // Calcular usuarios acumulados con crecimiento compuesto
      // y añadir variabilidad aleatoria
      const baseGrowth = startingUsers * Math.pow(1 + growthRate, i);
      const randomFactor = 0.9 + Math.random() * 0.2; // Variabilidad entre 90% y 110%
      const users = Math.round(baseGrowth * randomFactor);
      
      // Calcular nuevos usuarios (diferencia con mes anterior)
      const prevUsers = i > 0 ? data[i-1].Usuarios : 0;
      const newUsers = Math.max(0, users - prevUsers);
      
      // Calcular engagement con variabilidad (60-90% de usuarios totales)
      const engagementRate = 0.6 + Math.random() * 0.3;
      const activeUsers = Math.round(users * engagementRate);
      
      data.push({
        name: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        'Usuarios': users,
        'Nuevos': newUsers,
        'Activos': activeUsers
      });
    }
    
    return data;
  };
  
  // Generar datos de retención simulados
  const generateRetentionData = () => {
    // Cohortes representando meses
    const cohorts = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    
    // Generar datos de retención para cada cohorte
    return cohorts.map(cohort => {
      // Comenzar con 100% de retención
      let data: Record<string, any> = { name: cohort };
      
      // Generar tasas de retención decrecientes para cada mes
      for (let month = 0; month < 6; month++) {
        // Base de retención que disminuye con el tiempo
        const baseRetention = 100 * Math.pow(0.8, month);
        
        // Añadir variabilidad entre cohortes
        const cohortFactor = 0.9 + Math.random() * 0.2;
        
        // Calcular porcentaje final de retención
        data[`Mes ${month + 1}`] = Math.round(baseRetention * cohortFactor);
      }
      
      return data;
    });
  };
  
  // Generar datos de engagement simulados
  const generateEngagementData = () => {
    return [
      { 
        metric: 'Frecuencia de Uso', 
        value: 65 + Math.floor(Math.random() * 20) 
      },
      { 
        metric: 'Tiempo de Sesión', 
        value: 70 + Math.floor(Math.random() * 20) 
      },
      { 
        metric: 'Contenido Generado', 
        value: 55 + Math.floor(Math.random() * 30) 
      },
      { 
        metric: 'Interacción Social', 
        value: 60 + Math.floor(Math.random() * 25) 
      },
      { 
        metric: 'Retención', 
        value: 75 + Math.floor(Math.random() * 15) 
      },
      { 
        metric: 'Uso de Funciones', 
        value: 68 + Math.floor(Math.random() * 22) 
      },
      { 
        metric: 'Tasa de Conversión', 
        value: 45 + Math.floor(Math.random() * 25) 
      },
      { 
        metric: 'Satisfacción', 
        value: 80 + Math.floor(Math.random() * 15) 
      }
    ];
  };
  
  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando datos de usuarios...</div>;
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Análisis de Usuarios</h2>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{artistData.length}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(artistData.length * 0.12)} vs mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(artistData.length * 0.85)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(artistData.length * 0.85 / artistData.length * 100)}% del total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(45 + Math.random() * 15)}%</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(2 + Math.random() * 5)}% vs mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retención</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(70 + Math.random() * 15)}%</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(1 + Math.random() * 4)}% vs mes anterior
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Crecimiento de Usuarios</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccionar rango" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6months">6 Meses</SelectItem>
            <SelectItem value="12months">12 Meses</SelectItem>
            <SelectItem value="3years">3 Años</SelectItem>
            <SelectItem value="5years">5 Años</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Gráfico de crecimiento de usuarios */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Crecimiento de Usuarios</CardTitle>
            <CardDescription>Evolución de usuarios totales y activos</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={userGrowth}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="Usuarios" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="Activos" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Gráfico de adquisición de nuevos usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Nuevos Usuarios</CardTitle>
            <CardDescription>Adquisición mensual</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userGrowth}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Nuevos" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Gráfica de retención por cohorte */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Retención por Cohorte</CardTitle>
            <CardDescription>Porcentaje de usuarios retenidos por mes</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={retentionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="Mes 1" stroke="#8884d8" />
                <Line type="monotone" dataKey="Mes 2" stroke="#82ca9d" />
                <Line type="monotone" dataKey="Mes 3" stroke="#ffc658" />
                <Line type="monotone" dataKey="Mes 4" stroke="#ff8042" />
                <Line type="monotone" dataKey="Mes 5" stroke="#0088fe" />
                <Line type="monotone" dataKey="Mes 6" stroke="#00c49f" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Gráfico de radar de engagement */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement de Usuarios</CardTitle>
            <CardDescription>Métricas clave (percentiles)</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} data={userEngagement}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Engagement"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <h3 className="text-xl font-semibold">Demografía y Preferencias</h3>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Distribución por género */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Género</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
                >
                  {genderDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={GENDER_COLORS[entry.name as keyof typeof GENDER_COLORS] || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} usuarios`, 'Cantidad']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Distribución por edad */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Edad</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ageDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value) => [`${value} usuarios`, 'Cantidad']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Distribución por género musical */}
        <Card className="lg:col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Géneros Musicales Preferidos</CardTitle>
            <CardDescription>Top 10 géneros por popularidad</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={genreDistribution}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => [`${value} artistas`, 'Cantidad']} />
                <Bar dataKey="value" fill="#0ea5e9">
                  {genreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Distribución por categoría musical */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Distribución por Categoría Musical</CardTitle>
            <CardDescription>Agrupación de géneros similares</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} artistas`, 'Cantidad']} />
                <Legend />
                <Bar dataKey="value" name="Artistas" fill="#8884d8">
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}