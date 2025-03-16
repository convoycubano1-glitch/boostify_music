import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { LineChart, Circle, DollarSign, TrendingUp, Users, AlertCircle, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { useAuth } from "../../hooks/use-auth";

interface AffiliateStats {
  totalClicks: number;
  conversions: number;
  earnings: number;
  pendingPayment: number;
}

interface AffiliateData {
  id: string;
  level: string;
  status: string;
  firstName: string;
  lastName: string;
  stats: AffiliateStats;
  createdAt: Date;
  nextPayoutDate?: Date;
}

export function AffiliateOverview() {
  const { user } = useAuth() || {};
  const [nextPayout, setNextPayout] = useState<Date | null>(null);

  // Fetch affiliate data from the server
  const { data: affiliateData, isLoading, error } = useQuery<{success: boolean, data: AffiliateData}>({
    queryKey: ["affiliate", "me"],
    queryFn: async () => {
      const response = await axios.get('/api/affiliate/me');
      return response.data;
    },
    enabled: !!user,
    retry: 1
  });

  // Calculate next payout date (15th of next month)
  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    setNextPayout(nextMonth);
  }, []);

  // Calculate days until next payout
  const calculateDaysUntilPayout = () => {
    if (!nextPayout) return 0;
    
    const today = new Date();
    const diffTime = nextPayout.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Calculate conversion rate
  const calculateConversionRate = () => {
    if (!affiliateData?.data?.stats) return 0;
    
    const { totalClicks, conversions } = affiliateData.data.stats;
    if (totalClicks === 0) return 0;
    
    return (conversions / totalClicks) * 100;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-primary/5 h-40 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="animate-pulse bg-primary/5 h-32 rounded-lg"></div>
          <div className="animate-pulse bg-primary/5 h-32 rounded-lg"></div>
          <div className="animate-pulse bg-primary/5 h-32 rounded-lg"></div>
          <div className="animate-pulse bg-primary/5 h-32 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !affiliateData?.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error ? (error as Error).message : "Error al cargar datos de afiliado"}
        </AlertDescription>
      </Alert>
    );
  }

  const affiliate = affiliateData.data;
  const stats = affiliate?.stats || { totalClicks: 0, conversions: 0, earnings: 0, pendingPayment: 0 };
  const conversionRate = calculateConversionRate();
  const daysUntilPayout = calculateDaysUntilPayout();

  return (
    <div className="space-y-6">
      {/* Main overview card */}
      <Card className="border-primary/10 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Resumen de Afiliado
                </CardTitle>
                <CardDescription className="mt-1">
                  Vista general de tu cuenta y rendimiento como afiliado
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                Estado: {affiliate?.status === 'approved' ? 'Aprobado' : 'Pendiente'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 my-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Clics totales</span>
                <span className="text-2xl font-bold mt-1">{stats.totalClicks.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Conversiones</span>
                <span className="text-2xl font-bold mt-1">{stats.conversions.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Tasa de conversión</span>
                <span className="text-2xl font-bold mt-1">{conversionRate.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Nivel de afiliado</span>
                <span className="text-2xl font-bold mt-1">{affiliate?.level || "Básico"}</span>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Stats cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Earnings card */}
        <Card className="border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Ganancias totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.earnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Acumulado desde que te uniste
            </p>
          </CardContent>
        </Card>

        {/* Pending payment card */}
        <Card className="border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Pago pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingPayment.toLocaleString()}</div>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Próximo pago en:</span>
                <span className="font-medium">{daysUntilPayout} días</span>
              </div>
              <Progress value={(30 - daysUntilPayout) / 30 * 100} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Conversion rate card */}
        <Card className="border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Tasa de conversión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.conversions} ventas de {stats.totalClicks} clics
            </p>
            <Progress 
              value={conversionRate > 5 ? 100 : conversionRate * 20} 
              className="h-1.5 mt-2" 
            />
          </CardContent>
        </Card>

        {/* Next level card */}
        <Card className="border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Siguiente nivel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {affiliate?.level === "Básico" ? "Plata" : 
               affiliate?.level === "Plata" ? "Oro" : 
               affiliate?.level === "Oro" ? "Platino" : "Máximo"}
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progreso:</span>
                <span className="font-medium">
                  {stats.earnings < 500 ? `$${stats.earnings.toLocaleString()} / $500` : 
                   stats.earnings < 2000 ? `$${stats.earnings.toLocaleString()} / $2,000` :
                   stats.earnings < 5000 ? `$${stats.earnings.toLocaleString()} / $5,000` : "Nivel máximo"}
                </span>
              </div>
              <Progress 
                value={
                  stats.earnings < 500 ? (stats.earnings / 500) * 100 : 
                  stats.earnings < 2000 ? (stats.earnings / 2000) * 100 :
                  stats.earnings < 5000 ? (stats.earnings / 5000) * 100 : 100
                } 
                className="h-1.5" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg">Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Crear nuevo enlace</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              <span>Ver estadísticas</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Historial de pagos</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}