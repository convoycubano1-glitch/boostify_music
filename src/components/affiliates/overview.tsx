import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, TrendingUp, Users, DollarSign, Link, Clock, ChevronRight, Download, Share2, Wallet, Award, ChevronUp, ChevronDown, ExternalLink, BarChart2, PieChart, Zap, FileDown, FileText, AreaChart, Rocket } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircularProgress } from "@/components/ui/circular-progress";

interface AffiliateOverviewProps {
  affiliateData: {
    id: string;
    level?: string;
    name?: string;
    stats?: {
      totalClicks?: number;
      conversions?: number;
      earnings?: number;
      pendingPayment?: number;
    };
    links?: any[];
  } | null;
}

export function AffiliateOverview({ affiliateData }: AffiliateOverviewProps) {
  const { user } = useAuth() || {};
  // Sample data for stats and performance
  const stats = [
    {
      title: "Total Clicks",
      value: affiliateData?.stats?.totalClicks || 0,
      change: +15,
      icon: <TrendingUp className="h-4 w-4 text-primary" />,
    },
    {
      title: "Conversions",
      value: affiliateData?.stats?.conversions || 0,
      change: +12.3,
      icon: <Users className="h-4 w-4 text-primary" />,
    },
    {
      title: "Earnings",
      value: `$${(affiliateData?.stats?.earnings || 0).toFixed(2)}`,
      change: +18.1,
      icon: <DollarSign className="h-4 w-4 text-primary" />,
    },
    {
      title: "Active Links",
      value: affiliateData?.links?.length || 0,
      change: +4,
      icon: <Link className="h-4 w-4 text-primary" />,
    },
  ];

  // Sample performance data for the chart
  const performanceData = [
    { name: "Mon", clicks: 120, conversions: 8 },
    { name: "Tue", clicks: 145, conversions: 10 },
    { name: "Wed", clicks: 132, conversions: 9 },
    { name: "Thu", clicks: 165, conversions: 12 },
    { name: "Fri", clicks: 187, conversions: 14 },
    { name: "Sat", clicks: 142, conversions: 9 },
    { name: "Sun", clicks: 130, conversions: 8 },
  ];

  // Sample popular products data
  const popularProducts = [
    {
      id: "prod1",
      name: "Music Production Masterclass",
      clicks: 234,
      conversions: 18,
      commissionRate: 25,
      earnings: 450.0,
    },
    {
      id: "prod2",
      name: "Pro Mastering Plugin",
      clicks: 187,
      conversions: 15,
      commissionRate: 20,
      earnings: 297.0,
    },
    {
      id: "prod3",
      name: "Music Distribution Package",
      clicks: 156,
      conversions: 12,
      commissionRate: 30,
      earnings: 396.0,
    },
  ];

  // Sample payment data
  const nextPayment = {
    amount: (affiliateData?.stats?.pendingPayment || 0).toFixed(2),
    date: "March 15, 2025",
  };

  // Sample traffic sources
  const trafficSources = [
    { name: "Social Media", percentage: 45, color: "bg-blue-500" },
    { name: "Blog/Content", percentage: 30, color: "bg-green-500" },
    { name: "Email", percentage: 15, color: "bg-yellow-500" },
    { name: "Other", percentage: 10, color: "bg-purple-500" },
  ];

  // Sample performance by device
  const devicePerformance = [
    { device: "Mobile", clicks: 542, conversions: 38, rate: 7.0 },
    { device: "Desktop", clicks: 423, conversions: 45, rate: 10.6 },
    { device: "Tablet", clicks: 157, conversions: 12, rate: 7.6 },
  ];

  // Sample alerts
  const alerts = [
    {
      title: "Commission Rate Increase",
      description: "Your commission rate for 'Music Production Masterclass' has increased to 30%",
      icon: <ChevronUp className="h-5 w-5 text-green-500" />,
      date: "Today"
    },
    {
      title: "New Product Available",
      description: "A new high-converting course 'Advanced Mixing Techniques' is now available for promotion",
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      date: "Yesterday"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera de acciones rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 rounded-lg border border-primary/10 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            ¡Bienvenido, {affiliateData?.name || "Afiliado"}!
          </h2>
          <p className="text-muted-foreground mt-1">
            Aquí está el rendimiento de tus campañas de afiliados hoy.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mt-3 md:mt-0">
          <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar Reporte</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Compartir Enlaces</span>
            <span className="sm:hidden">Compartir</span>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/40">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {stat.icon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View detailed {stat.title.toLowerCase()} analytics</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change > 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                    {stat.change > 0 ? "+" : ""}{stat.change}%
                  </span>{" "}
                  from last month
                </p>
                {index < 2 && (
                  <div className="h-8 w-16">
                    <AreaChart className="h-8 w-16 text-primary/70" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance chart */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Weekly Performance</CardTitle>
                <CardDescription>
                  Overview of clicks and conversions in the last 7 days
                </CardDescription>
              </div>
              <Tabs defaultValue="clicks" className="w-auto">
                <TabsList className="h-8 w-[180px]">
                  <TabsTrigger value="clicks" className="text-xs">Clicks</TabsTrigger>
                  <TabsTrigger value="conversions" className="text-xs">Conversions</TabsTrigger>
                  <TabsTrigger value="earnings" className="text-xs">Earnings</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {/* Chart placeholder */}
            <div className="h-[240px] mt-4 flex items-center justify-center border border-dashed rounded-md">
              <BarChart2 className="h-8 w-8 text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Weekly performance chart (UI placeholder)
              </span>
            </div>
            
            {/* Weekly data indicators */}
            <div className="grid grid-cols-7 gap-1 mt-4">
              {performanceData.map((day) => (
                <div key={day.name} className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground">{day.name}</div>
                  <div className="text-sm font-medium">{day.clicks}</div>
                  <div className="mt-1 h-16 w-full max-w-[30px] bg-primary/20 rounded-sm relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 w-full bg-primary"
                      style={{ 
                        height: `${(day.clicks / 200) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next payment & affiliate level */}
        <div className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Next Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-2">
                <Wallet className="h-5 w-5 text-primary mr-2" />
                <span className="text-2xl font-bold">${nextPayment.amount}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>Estimated date: {nextPayment.date}</span>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Payment threshold: $100.00</span>
                  <span className="font-medium">{Math.min(parseFloat(nextPayment.amount) / 100 * 100, 100).toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(parseFloat(nextPayment.amount) / 100 * 100, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Affiliate Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-amber-600 hover:bg-amber-700">{affiliateData?.level || "Básico"}</Badge>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  View Benefits
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Next level: Plata</span>
                    <span className="font-medium">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  $250.00 more in sales needed to reach the next level
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Popular products */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
          <CardDescription>
            Your most successful product promotions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground p-2 pl-0">Product</th>
                  <th className="text-center font-medium text-muted-foreground p-2">Clicks</th>
                  <th className="text-center font-medium text-muted-foreground p-2">Conv.</th>
                  <th className="text-center font-medium text-muted-foreground p-2">Rate</th>
                  <th className="text-center font-medium text-muted-foreground p-2">Commission</th>
                  <th className="text-center font-medium text-muted-foreground p-2">Earnings</th>
                  <th className="text-right font-medium text-muted-foreground p-2 pr-0"></th>
                </tr>
              </thead>
              <tbody>
                {popularProducts.map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="py-3 pl-0">{product.name}</td>
                    <td className="py-3 text-center">{product.clicks}</td>
                    <td className="py-3 text-center">{product.conversions}</td>
                    <td className="py-3 text-center">
                      {(product.conversions / product.clicks * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 text-center">{product.commissionRate}%</td>
                    <td className="py-3 text-center">${product.earnings.toFixed(2)}</td>
                    <td className="py-3 text-right pr-0">
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-3">
          <p className="text-sm text-muted-foreground">
            Showing top 3 of 10 products
          </p>
          <Button variant="outline" size="sm" className="h-8">
            View All Products
          </Button>
        </CardFooter>
      </Card>

      {/* Quick insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Traffic sources */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Traffic Sources</CardTitle>
            <CardDescription>
              Where your affiliate clicks come from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <PieChart className="h-24 w-24 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {trafficSources.map((source) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full ${source.color} mr-2`}></div>
                    <span className="text-sm">{source.name}</span>
                  </div>
                  <span className="text-sm font-medium">{source.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device performance */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Device Performance</CardTitle>
            <CardDescription>
              Conversion rates by device type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devicePerformance.map((device) => (
                <div key={device.device}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{device.device}</span>
                    <span className="text-sm text-muted-foreground">
                      {device.conversions} / {device.clicks} ({device.rate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${device.rate * 5}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent alerts */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className="flex gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-background flex items-center justify-center">
                  {alert.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{alert.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.description}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">{alert.date}</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-3">
          <Button variant="outline" size="sm" className="h-8 w-full">
            View All Updates
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}