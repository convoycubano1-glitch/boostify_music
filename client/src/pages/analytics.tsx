import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Activity, TrendingUp, BarChart2, LineChart, PieChart, Download, Calendar, Music2, Users, DollarSign, Share2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import html2pdf from 'html2pdf.js';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [isExporting, setIsExporting] = useState(false);

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['analytics', 'metrics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    }
  });

  const { data: analyticsHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['analytics', 'history', selectedPeriod],
    queryFn: async () => {
      const startDate = new Date();
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '12m':
          startDate.setMonth(startDate.getMonth() - 12);
          break;
      }
      const response = await fetch(`/api/analytics/history?startDate=${startDate.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json();
    }
  });

  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/summary');
      if (!response.ok) throw new Error('Failed to fetch summary');
      return response.json();
    }
  });

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const formatMetricValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const generateTimeSeriesData = () => {
    if (!analyticsHistory) return [];

    const data: any[] = [];
    const metrics = ['streams', 'engagement', 'revenue'];

    // Group by date and combine metrics
    analyticsHistory.forEach((record: any) => {
      const date = format(new Date(record.timestamp), 'MM/dd/yyyy');
      const existingDay = data.find(d => d.date === date);

      if (existingDay) {
        existingDay[record.metricName] = record.metricValue;
      } else {
        const newDay = { date };
        newDay[record.metricName] = record.metricValue;
        data.push(newDay);
      }
    });

    return data;
  };

  const handleExportReport = async () => {
    try {
      setIsExporting(true);

      // Create report content
      const reportContent = document.createElement('div');
      reportContent.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #f97316; margin-bottom: 20px;">Informe de Analytics</h1>

          <div style="margin-bottom: 30px;">
            <h2>Métricas Principales</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <h3>Total Streams</h3>
                <p>${formatMetricValue(summary?.currentMetrics?.totalEngagement || 0)}</p>
              </div>
              <div>
                <h3>Monthly Listeners</h3>
                <p>${formatMetricValue(summary?.currentMetrics?.monthlyListeners || 0)}</p>
              </div>
              <div>
                <h3>Revenue</h3>
                <p>$${formatMetricValue(summary?.currentMetrics?.totalRevenue || 0)}</p>
              </div>
              <div>
                <h3>Social Engagement</h3>
                <p>${formatMetricValue(summary?.currentMetrics?.totalEngagement || 0)}</p>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 30px;">
            <h2>Distribución por Plataforma</h2>
            <ul>
              <li>Spotify: ${formatMetricValue(summary?.currentMetrics?.spotifyFollowers || 0)} seguidores</li>
              <li>Instagram: ${formatMetricValue(summary?.currentMetrics?.instagramFollowers || 0)} seguidores</li>
              <li>YouTube: ${formatMetricValue(summary?.currentMetrics?.youtubeViews || 0)} vistas</li>
            </ul>
          </div>

          <div>
            <h2>Período del Informe</h2>
            <p>Desde: ${format(subDays(new Date(), selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 365), 'dd/MM/yyyy')}</p>
            <p>Hasta: ${format(new Date(), 'dd/MM/yyyy')}</p>
          </div>
        </div>
      `;

      // Configure PDF options
      const options = {
        margin: 1,
        filename: `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      // Generate and download PDF
      await html2pdf().from(reportContent).set(options).save();

      toast({
        title: "Informe Exportado",
        description: "El informe ha sido generado y descargado exitosamente.",
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el informe. Por favor, intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
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
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => handlePeriodChange(selectedPeriod === '7d' ? '30d' : selectedPeriod === '30d' ? '12m' : '7d')}
                >
                  <Calendar className="h-4 w-4" />
                  {selectedPeriod === "7d" ? "7 días" : selectedPeriod === "30d" ? "30 días" : "12 meses"}
                </Button>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 gap-2"
                  onClick={handleExportReport}
                  disabled={isExporting}
                >
                  <Download className={`h-4 w-4 ${isExporting ? 'animate-spin' : ''}`} />
                  {isExporting ? 'Exportando...' : 'Exportar Informe'}
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
                    <p className="text-2xl font-bold">
                      {formatMetricValue(summary?.currentMetrics?.totalEngagement || 0)}
                    </p>
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
                    <p className="text-2xl font-bold">
                      {formatMetricValue(summary?.currentMetrics?.monthlyListeners || 0)}
                    </p>
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
                      <h3 className="text-sm font-medium">Revenue</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      ${formatMetricValue(summary?.currentMetrics?.totalRevenue || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Ingresos totales
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
                    <p className="text-2xl font-bold">
                      {formatMetricValue(summary?.currentMetrics?.totalEngagement || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Interacciones totales
                    </p>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
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
                    <AreaChart data={generateTimeSeriesData()}>
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
                  <h3 className="text-lg font-semibold mb-2">Platform Distribution</h3>
                  <p className="text-sm text-muted-foreground">
                    Distribución de engagement por plataforma
                  </p>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={[
                          { name: 'Spotify', value: summary?.currentMetrics?.spotifyFollowers || 0 },
                          { name: 'Instagram', value: summary?.currentMetrics?.instagramFollowers || 0 },
                          { name: 'YouTube', value: summary?.currentMetrics?.youtubeViews || 0 },
                        ]}
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
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
              </Card>
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}