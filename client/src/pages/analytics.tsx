import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  TrendingUp, 
  BarChart2, 
  LineChart, 
  PieChart, 
  Download, 
  Calendar,
  Music2,
  Users,
  DollarSign,
  Share2
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { useState } from "react";
import { motion } from "framer-motion";

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  // Datos de ejemplo - Esto debería venir de tu backend
  const musicMetrics = {
    totalStreams: 1234567,
    monthlyListeners: 234567,
    topCountries: [
      { name: "United States", value: 40 },
      { name: "United Kingdom", value: 25 },
      { name: "Germany", value: 20 },
      { name: "France", value: 15 }
    ],
    revenueGrowth: 23.5
  };

  const generateTimeData = (days: number) => {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toLocaleDateString(),
      streams: Math.floor(Math.random() * 1000) + 500,
      engagement: Math.floor(Math.random() * 800) + 300,
      revenue: Math.floor(Math.random() * 600) + 200,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pt-14">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Análisis detallado y métricas de rendimiento
              </p>
            </motion.div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                {selectedPeriod === "7d" ? "7 días" : selectedPeriod === "30d" ? "30 días" : "12 meses"}
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                <Download className="h-4 w-4" />
                Exportar Informe
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Music2 className="h-5 w-5 text-orange-500" />
                    <h3 className="text-sm font-medium">Total Streams</h3>
                  </div>
                  <p className="text-2xl font-bold">{musicMetrics.totalStreams.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-green-500">↑ 12.5%</span> vs último periodo
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-orange-500" />
                    <h3 className="text-sm font-medium">Monthly Listeners</h3>
                  </div>
                  <p className="text-2xl font-bold">{musicMetrics.monthlyListeners.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-green-500">↑ 8.3%</span> vs último mes
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-orange-500" />
                    <h3 className="text-sm font-medium">Revenue Growth</h3>
                  </div>
                  <p className="text-2xl font-bold">+{musicMetrics.revenueGrowth}%</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Crecimiento mensual
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Share2 className="h-5 w-5 text-orange-500" />
                    <h3 className="text-sm font-medium">Social Engagement</h3>
                  </div>
                  <p className="text-2xl font-bold">87.2%</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-green-500">↑ 5.2%</span> engagement rate
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Main Analytics Content */}
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart2 className="h-4 w-4" />
                Vista General
              </TabsTrigger>
              <TabsTrigger value="music" className="gap-2">
                <Music2 className="h-4 w-4" />
                Música
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-2">
                <Share2 className="h-4 w-4" />
                Social
              </TabsTrigger>
              <TabsTrigger value="revenue" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Ingresos
              </TabsTrigger>
              <TabsTrigger value="predictions" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Predicciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Performance Overview Chart */}
                <Card className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Performance Overview</h3>
                    <p className="text-sm text-muted-foreground">
                      Tendencias de streams y engagement
                    </p>
                  </div>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={generateTimeData(30)}>
                        <defs>
                          <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="streams"
                          name="Streams"
                          stroke="hsl(24, 95%, 53%)"
                          fillOpacity={1}
                          fill="url(#colorPerformance)"
                        />
                        <Area
                          type="monotone"
                          dataKey="engagement"
                          name="Engagement"
                          stroke="hsl(24, 95%, 53%)"
                          fillOpacity={0.5}
                          fill="url(#colorPerformance)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Geographic Distribution */}
                <Card className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Geographic Distribution</h3>
                    <p className="text-sm text-muted-foreground">
                      Distribución de oyentes por país
                    </p>
                  </div>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={musicMetrics.topCountries}
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {musicMetrics.topCountries.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      {musicMetrics.topCountries.map((country, index) => (
                        <div key={country.name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm">{country.name}</span>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {country.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}