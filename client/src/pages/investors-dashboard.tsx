import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  DollarSign,
  Download,
  FileText,
  TrendingUp,
  Calendar,
  BarChart2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Users,
  BarChart,
  Target,
  CreditCard,
  Check, 
  Calculator
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
// Investment Calculator Component
function InvestmentCalculator() {
  const [investmentAmount, setInvestmentAmount] = useState(5000);
  const [returnRate, setReturnRate] = useState(5); // Default to 5%
  const [durationMonths, setDurationMonths] = useState(12);
  const [monthlyReturn, setMonthlyReturn] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // Recalculate returns whenever inputs change
  useEffect(() => {
    const calculatedMonthlyReturn = (investmentAmount * returnRate) / 100;
    const calculatedTotalReturn = calculatedMonthlyReturn * durationMonths;
    const calculatedFinalAmount = investmentAmount + calculatedTotalReturn;

    setMonthlyReturn(calculatedMonthlyReturn);
    setTotalReturn(calculatedTotalReturn);
    setFinalAmount(calculatedFinalAmount);
  }, [investmentAmount, returnRate, durationMonths]);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Card className="p-6 mb-6">
          <h4 className="text-base font-medium mb-6">Adjust Parameters</h4>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Investment Amount</label>
                <span className="text-sm font-medium">${investmentAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-4">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[investmentAmount]}
                  min={2000}
                  max={100000}
                  step={1000}
                  onValueChange={(value) => setInvestmentAmount(value[0])}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Return Rate</label>
                <span className="text-sm font-medium">{returnRate}% monthly</span>
              </div>
              <div className="flex items-center gap-4">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[returnRate]}
                  min={4}
                  max={6}
                  step={0.1}
                  onValueChange={(value) => setReturnRate(value[0])}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Duration</label>
                <span className="text-sm font-medium">{durationMonths} months</span>
              </div>
              <div className="flex items-center gap-4">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[durationMonths]}
                  min={6}
                  max={36}
                  step={1}
                  onValueChange={(value) => setDurationMonths(value[0])}
                  className="flex-1"
                />
              </div>
            </div>

            <Button className="w-full" variant="outline">
              <Calculator className="mr-2 h-4 w-4" />
              Recalculate
            </Button>
          </div>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p>
            This calculator provides an estimate based on our current investment plans. Actual returns may vary.
          </p>
        </div>
      </div>

      <div>
        <Card className="p-6 overflow-hidden bg-gradient-to-br from-orange-500/10 to-background border-orange-500/20">
          <h4 className="text-lg font-medium mb-8">Investment Results</h4>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-background rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Return</p>
                <p className="text-2xl font-bold">${monthlyReturn.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
            
            <div className="flex justify-between items-center p-4 bg-background rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground">Total Return</p>
                <p className="text-2xl font-bold">${totalReturn.toFixed(2)}</p>
              </div>
              <BarChart2 className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
            
            <div className="flex justify-between items-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <div>
                <p className="text-sm text-muted-foreground">Monto Final</p>
                <p className="text-3xl font-bold">${finalAmount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className="text-xl font-bold text-orange-500">{((totalReturn / investmentAmount) * 100).toFixed(2)}%</p>
              </div>
            </div>

            <Button className="w-full bg-orange-500 hover:bg-orange-600 mt-4">
              <DollarSign className="mr-2 h-4 w-4" />
              Invertir Ahora
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Componente Timeline Roadmap
function RoadmapTimeline() {
  const roadmapData = [
    {
      date: "1 Marzo 2025",
      title: "Lanzamiento Oficial de Boostify",
      description: "Lanzamiento oficial de la plataforma completa de Boostify Music con todas las funcionalidades centrales y herramientas de IA.",
      stats: "Objetivo: 100 artistas verificados",
      status: "upcoming",
      isKey: true
    },
    {
      date: "15 Marzo 2025",
      title: "Integración con Spotify y Apple Music",
      description: "Conexión directa con las principales plataformas de streaming para sincronización de perfiles y estadísticas.",
      stats: "Mejora de engagement: +30%",
      status: "upcoming"
    },
    {
      date: "Abril 2025",
      title: "Lanzamiento de Herramientas para Managers",
      description: "Suite completa de herramientas de gestión para managers musicales, incluyendo contratos automatizados y booking digital.",
      stats: "Objetivo: 250 usuarios activos",
      status: "upcoming"
    },
    {
      date: "Mayo 2025",
      title: "Integración de Pasarela de Pagos",
      description: "Implementación de sistema de pagos para monetización directa de contenido y servicios entre artistas y fans.",
      stats: "Proyección: primeros $10k en transacciones",
      status: "upcoming"
    },
    {
      date: "Junio 2025",
      title: "Hito: 500 Usuarios Activos",
      description: "Primera meta de crecimiento, con foco en artistas emergentes y productores independientes.",
      stats: "500 usuarios, $25k en transacciones mensuales",
      status: "upcoming",
      isKey: true
    },
    {
      date: "Julio 2025",
      title: "Lanzamiento de Distribuidor Digital",
      description: "Servicio propio de distribución digital a todas las plataformas con analíticas avanzadas y pagos transparentes.",
      stats: "Comisión competitiva: solo 10%",
      status: "upcoming"
    },
    {
      date: "Agosto 2025",
      title: "Marketplace para Colaboraciones",
      description: "Plataforma para conectar artistas, productores, ingenieros y otros creativos para colaboraciones remuneradas.",
      stats: "Proyección: 120 colaboraciones mensuales",
      status: "upcoming"
    },
    {
      date: "Septiembre 2025",
      title: "Hito: 1,500 Usuarios Activos",
      description: "Expansión significativa de la base de usuarios. Inicio de adquisición de sellos independientes.",
      stats: "1,500 usuarios, $80k en transacciones",
      status: "upcoming",
      isKey: true
    },
    {
      date: "Octubre 2025",
      title: "Lanzamiento de Festival Virtual",
      description: "Primer festival virtual de Boostify con artistas de la plataforma, utilizando tecnología de streaming inmersivo.",
      stats: "Meta: 5,000 asistentes virtuales",
      status: "upcoming"
    },
    {
      date: "Noviembre 2025",
      title: "Integración con TikTok y YouTube",
      description: "Herramientas avanzadas para promoción y monetización en las principales plataformas de video social.",
      stats: "Proyección: +40% de visibilidad para artistas",
      status: "upcoming"
    },
    {
      date: "Diciembre 2025",
      title: "Hito: 10,000 Usuarios Activos",
      description: "Meta ambiciosa de crecimiento para el cierre del año 2025, consolidando Boostify como plataforma líder.",
      stats: "10,000 usuarios, $250k en transacciones mensuales",
      status: "upcoming",
      isKey: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Gráfica de Crecimiento Proyectado */}
      <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-6 rounded-lg mb-8">
        <h4 className="text-lg font-semibold mb-4">Crecimiento Proyectado de Usuarios en 2025</h4>
        <div className="h-64 relative">
          {/* Eje Y */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between items-end pr-2">
            <span className="text-xs text-muted-foreground">10K</span>
            <span className="text-xs text-muted-foreground">7.5K</span>
            <span className="text-xs text-muted-foreground">5K</span>
            <span className="text-xs text-muted-foreground">2.5K</span>
            <span className="text-xs text-muted-foreground">0</span>
          </div>
          
          {/* Gráfica */}
          <div className="ml-12 h-full flex items-end">
            <div className="flex-1 flex items-end space-x-4">
              {[
                { month: "Mar", users: 100, height: "1%" },
                { month: "Abr", users: 250, height: "2.5%" },
                { month: "May", users: 375, height: "3.75%" },
                { month: "Jun", users: 500, height: "5%" },
                { month: "Jul", users: 750, height: "7.5%" },
                { month: "Ago", users: 1200, height: "12%" },
                { month: "Sep", users: 1500, height: "15%" },
                { month: "Oct", users: 3000, height: "30%" },
                { month: "Nov", users: 6000, height: "60%" },
                { month: "Dic", users: 10000, height: "100%" }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full max-w-[50px] bg-gradient-to-t from-orange-500 to-orange-400 rounded-t relative group cursor-pointer"
                    style={{ height: item.height }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.users.toLocaleString()} usuarios
                    </div>
                  </div>
                  <span className="text-xs mt-2 text-muted-foreground">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="relative mt-8">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-orange-500/20"></div>
        <div className="space-y-8">
          {roadmapData.map((item, index) => (
            <div key={index} className="relative pl-16">
              <div className={`absolute left-5 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                item.status === 'completed' ? 'bg-orange-500 border-orange-500' : 
                item.status === 'inProgress' ? 'bg-background border-orange-500' : 
                item.isKey ? 'bg-background border-yellow-500' : 'bg-background border-muted-foreground'
              }`}>
                {item.status === 'completed' ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : item.status === 'inProgress' ? (
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                ) : item.isKey ? (
                  <Calendar className="h-3.5 w-3.5 text-yellow-500" />
                ) : (
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>

              <div className={`pb-4 ${item.isKey ? 'bg-orange-500/5 p-4 rounded-lg border border-orange-500/20' : ''}`}>
                <span className={`text-sm font-medium ${item.isKey ? 'text-orange-500' : 'text-muted-foreground'} px-2 py-1 ${item.isKey ? 'bg-orange-500/10' : 'bg-muted/50'} rounded mb-2 inline-block`}>
                  {item.date}
                </span>
                <h4 className={`text-base font-medium mt-2 mb-1 ${item.isKey ? 'text-orange-500' : ''}`}>{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {item.stats && (
                  <div className="mt-2 text-xs inline-block px-2 py-1 bg-black/20 rounded font-medium">
                    {item.stats}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente Gráfico de Rendimiento de Inversión
function InvestmentPerformanceChart({ data }: { data: { month: string; return: number }[] }) {
  return (
    <div className="w-full h-64 flex flex-col justify-center">
      <div className="flex justify-between items-center h-full">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center justify-end h-full flex-1">
            <div 
              className="w-8 bg-orange-500 rounded-t-sm relative group"
              style={{ height: `${(item.return / 6) * 100}%` }}
            >
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-background border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.return}% en {item.month}
              </div>
            </div>
            <span className="text-xs text-muted-foreground mt-2">{item.month}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Rendimiento mensual en porcentaje (%)
      </div>
    </div>
  );
}

// Componente Tabla de Riesgo/Retorno
function RiskReturnTable() {
  const riskReturnData = [
    { riskLevel: "Bajo", returnRange: "4.0 - 4.5%", volatility: "Baja", recommendation: "Conservadores" },
    { riskLevel: "Medio", returnRange: "4.5 - 5.5%", volatility: "Media", recommendation: "Balanceados" },
    { riskLevel: "Alto", returnRange: "5.5 - 6.0%", volatility: "Alta", recommendation: "Crecimiento" }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3">Nivel de Riesgo</th>
            <th className="text-left py-2 px-3">Retorno Mensual</th>
            <th className="text-left py-2 px-3">Volatilidad</th>
            <th className="text-left py-2 px-3">Recomendado para</th>
          </tr>
        </thead>
        <tbody>
          {riskReturnData.map((item, index) => (
            <tr key={index} className="border-b hover:bg-muted/50">
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    item.riskLevel === "Bajo" ? "bg-blue-500" :
                    item.riskLevel === "Medio" ? "bg-orange-500" : "bg-red-500"
                  }`}></div>
                  {item.riskLevel}
                </div>
              </td>
              <td className="py-3 px-3">{item.returnRange}</td>
              <td className="py-3 px-3">{item.volatility}</td>
              <td className="py-3 px-3">Inversores {item.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente Estadísticas del Inversor 
function InvestorStats() {
  const stats = [
    { 
      title: "Inversores Activos", 
      value: "187", 
      growth: "+12%", 
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10" 
    },
    { 
      title: "Inversión Promedio", 
      value: "$7,250", 
      growth: "+5%", 
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10" 
    },
    { 
      title: "Retorno Promedio", 
      value: "4.8%", 
      growth: "+0.2%", 
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10" 
    },
    { 
      title: "Capital Recaudado", 
      value: "$3.2M", 
      growth: "+8%", 
      icon: BarChart,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10" 
    }
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 ${stat.bgColor} rounded-lg`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{stat.value}</p>
                <span className="text-xs font-medium text-green-500">{stat.growth}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}

export default function InvestorsDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { user } = useAuth();

  // Simulated user investment data
  const investmentData = {
    totalInvested: 5000,
    currentValue: 5450,
    monthlyReturns: [
      { month: 'Jan', return: 4.2 },
      { month: 'Feb', return: 5.1 },
      { month: 'Mar', return: 4.8 },
      { month: 'Apr', return: 5.3 },
      { month: 'May', return: 4.9 },
      { month: 'Jun', return: 5.5 }
    ],
    nextPaymentDate: '2025-03-15',
    investmentRounds: [
      { name: 'Seed Round', date: '2024-06-01', status: 'Closed', raised: '$500K' },
      { name: 'Angel Round', date: '2024-09-15', status: 'Closed', raised: '$1.2M' },
      { name: 'Series A', date: '2025-01-30', status: 'Active', raised: '$3.5M' },
      { name: 'Series B', date: '2025-07-15', status: 'Upcoming', target: '$8M' }
    ]
  };

  // Handle investment button click
  const handleInvestNow = () => {
    // Redirect to Stripe payment or show payment modal
    console.log("Redirecting to payment gateway...");
    alert("Redirecting to Stripe payment gateway... This is a simulation.");
  };

  // Handle contract download
  const handleDownloadContract = () => {
    console.log("Downloading investment contract...");
    alert("Downloading investment contract template... This is a simulation.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
          <div className="container mx-auto px-4 py-6">
            {/* Hero Section */}
            <section className="relative rounded-xl overflow-hidden mb-12 bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-background p-8">
              <div className="relative">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Panel de Inversores
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mb-6">
                  Gestiona tus inversiones, monitorea rendimientos y explora nuevas oportunidades con Boostify Music
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={handleInvestNow} size="lg" className="bg-orange-500 hover:bg-orange-600">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Invertir Ahora
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleDownloadContract}>
                    <Download className="mr-2 h-5 w-5" />
                    Descargar Contrato
                  </Button>
                </div>
              </div>
            </section>

            {/* Main Content Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-4 max-w-[800px] mb-8">
                <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500">
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Resumen
                </TabsTrigger>
                <TabsTrigger value="calculator" className="data-[state=active]:bg-orange-500">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Calculadora
                </TabsTrigger>
                <TabsTrigger value="investments" className="data-[state=active]:bg-orange-500">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Inversiones
                </TabsTrigger>
                <TabsTrigger value="roadmap" className="data-[state=active]:bg-orange-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  Roadmap
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <InvestorStats />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Rendimiento de Inversión</h3>
                    <InvestmentPerformanceChart data={investmentData.monthlyReturns} />
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Riesgo y Retorno</h3>
                    <RiskReturnTable />
                  </Card>
                </div>

                <Card className="p-6 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Información para Inversores</h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Info
                    </Button>
                  </div>

                  <div className="prose prose-orange dark:prose-invert max-w-none">
                    <h4>Invertir en Boostify Music</h4>
                    <p>
                      Boostify Music ofrece una oportunidad única para invertir en el futuro de la industria musical. Nuestra plataforma impulsada por IA está revolucionando la forma en que artistas, productores y aficionados interactúan con la música.
                    </p>
                    
                    <h4>Beneficios de Inversión</h4>
                    <ul>
                      <li><strong>Rentabilidad mensual:</strong> 4-6% según el plan de inversión seleccionado</li>
                      <li><strong>Inversión mínima:</strong> $2,000 USD</li>
                      <li><strong>Pagos mensuales:</strong> Distribución de beneficios el día 15 de cada mes</li>
                      <li><strong>Contratos transparentes:</strong> Términos claros y documentación completa</li>
                      <li><strong>Panel exclusivo:</strong> Acceso a estadísticas en tiempo real y herramientas de análisis</li>
                    </ul>

                    <h4>Próximos Hitos</h4>
                    <p>
                      Estamos en plena expansión, con el lanzamiento próximo de nuestra plataforma de streaming mejorada con IA y nuevas herramientas para creadores. La Serie B de financiación permitirá acelerar nuestro crecimiento internacional.
                    </p>
                    
                    <div className="not-prose mt-6">
                      <Button onClick={handleInvestNow} className="bg-orange-500 hover:bg-orange-600">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Comenzar a Invertir
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Calculator Tab */}
              <TabsContent value="calculator">
                <Card className="p-6 mb-8">
                  <h3 className="text-xl font-semibold mb-6">Calculadora de Inversión</h3>
                  <InvestmentCalculator />
                </Card>

                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Planes de Inversión</h3>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Detalles Completos
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <Card className="p-6 border-2 border-muted">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium">Plan Estándar</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Bajo Riesgo</span>
                      </div>
                      <div className="flex items-baseline mb-6">
                        <span className="text-4xl font-bold">4%</span>
                        <span className="text-muted-foreground ml-1">mensual</span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Inversión mínima: $2,000</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Plazo mínimo: 6 meses</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Pagos mensuales</span>
                        </li>
                      </ul>
                      <Button className="w-full" variant="outline">Seleccionar Plan</Button>
                    </Card>

                    <Card className="p-6 border-2 border-orange-500 shadow-lg relative">
                      <div className="absolute -top-3 right-4 px-3 py-1 bg-orange-500 text-white text-xs rounded-full">
                        Recomendado
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium">Plan Premium</h4>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Riesgo Medio</span>
                      </div>
                      <div className="flex items-baseline mb-6">
                        <span className="text-4xl font-bold">5%</span>
                        <span className="text-muted-foreground ml-1">mensual</span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Inversión mínima: $5,000</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Plazo mínimo: 12 meses</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Pagos mensuales</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Acceso a eventos exclusivos</span>
                        </li>
                      </ul>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">Seleccionar Plan</Button>
                    </Card>

                    <Card className="p-6 border-2 border-muted">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium">Plan Elite</h4>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Alto Potencial</span>
                      </div>
                      <div className="flex items-baseline mb-6">
                        <span className="text-4xl font-bold">6%</span>
                        <span className="text-muted-foreground ml-1">mensual</span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Inversión mínima: $25,000</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Plazo mínimo: 18 meses</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Pagos mensuales</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2" />
                          <span>Participación en decisiones estratégicas</span>
                        </li>
                      </ul>
                      <Button className="w-full" variant="outline">Seleccionar Plan</Button>
                    </Card>
                  </div>

                  <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800 dark:text-amber-300">Aviso Importante</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Toda inversión implica riesgos. Los rendimientos pasados no garantizan resultados futuros. Por favor lea detenidamente el contrato y consulte con un asesor financiero antes de invertir.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Investments Tab */}
              <TabsContent value="investments">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <DollarSign className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Inversión Total</p>
                        <p className="text-2xl font-bold">${investmentData.totalInvested}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Actual</p>
                        <p className="text-2xl font-bold">${investmentData.currentValue}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Clock className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Próximo Pago</p>
                        <p className="text-2xl font-bold">{new Date(investmentData.nextPaymentDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-6">Historial de Inversiones</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Fecha</th>
                          <th className="text-left py-3 px-4">Tipo</th>
                          <th className="text-left py-3 px-4">Cantidad</th>
                          <th className="text-left py-3 px-4">Estado</th>
                          <th className="text-left py-3 px-4">Retorno</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">15 Ene 2025</td>
                          <td className="py-3 px-4">Plan Premium</td>
                          <td className="py-3 px-4">$5,000</td>
                          <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Activa</span></td>
                          <td className="py-3 px-4">$250 / mes</td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">20 Dic 2024</td>
                          <td className="py-3 px-4">Pago Mensual</td>
                          <td className="py-3 px-4">$250</td>
                          <td className="py-3 px-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Recibido</span></td>
                          <td className="py-3 px-4">-</td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">20 Nov 2024</td>
                          <td className="py-3 px-4">Pago Mensual</td>
                          <td className="py-3 px-4">$250</td>
                          <td className="py-3 px-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Recibido</span></td>
                          <td className="py-3 px-4">-</td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">20 Oct 2024</td>
                          <td className="py-3 px-4">Pago Mensual</td>
                          <td className="py-3 px-4">$250</td>
                          <td className="py-3 px-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Recibido</span></td>
                          <td className="py-3 px-4">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Rondas de Inversión</h3>
                    <Button variant="outline" size="sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Invertir
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Ronda</th>
                          <th className="text-left py-3 px-4">Fecha</th>
                          <th className="text-left py-3 px-4">Estado</th>
                          <th className="text-left py-3 px-4">Monto</th>
                          <th className="text-left py-3 px-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investmentData.investmentRounds.map((round, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">{round.name}</td>
                            <td className="py-3 px-4">{round.date}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                round.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                round.status === 'Closed' ? 'bg-gray-100 text-gray-800' : 
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {round.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">{round.raised || round.target}</td>
                            <td className="py-3 px-4">
                              {round.status === 'Active' && (
                                <Button size="sm" variant="outline">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Invertir
                                </Button>
                              )}
                              {round.status === 'Upcoming' && (
                                <Button size="sm" variant="ghost" disabled>
                                  Próximamente
                                </Button>
                              )}
                              {round.status === 'Closed' && (
                                <Button size="sm" variant="ghost" disabled>
                                  Cerrada
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* Roadmap Tab */}
              <TabsContent value="roadmap">
                <Card className="p-6 mb-8">
                  <h3 className="text-xl font-semibold mb-6">Roadmap de Boostify Music</h3>
                  <RoadmapTimeline />
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6">Proyecciones Financieras</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-base font-medium mb-4">Crecimiento Proyectado de Usuarios</h4>
                      <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Gráfico de crecimiento de usuarios</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-base font-medium mb-4">Crecimiento Proyectado de Ingresos</h4>
                      <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Gráfico de crecimiento de ingresos</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid md:grid-cols-3 gap-6">
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <h4 className="text-base font-medium">Usuarios Proyectados</h4>
                      </div>
                      <p className="text-3xl font-bold">2.5M</p>
                      <p className="text-sm text-muted-foreground">Para finales de 2025</p>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <BarChart className="h-5 w-5 text-green-500" />
                        <h4 className="text-base font-medium">Ingresos Anuales</h4>
                      </div>
                      <p className="text-3xl font-bold">$12M</p>
                      <p className="text-sm text-muted-foreground">Proyectados para 2025</p>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="h-5 w-5 text-red-500" />
                        <h4 className="text-base font-medium">Retorno de Inversión</h4>
                      </div>
                      <p className="text-3xl font-bold">78%</p>
                      <p className="text-sm text-muted-foreground">ROI proyectado a 24 meses</p>
                    </Card>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}