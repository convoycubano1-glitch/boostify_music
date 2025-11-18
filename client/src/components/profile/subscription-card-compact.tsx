import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Crown, Sparkles, Gem, Zap, ArrowUpRight, Calendar, TrendingUp, Settings, ExternalLink } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { CollapsibleSection } from "./collapsible-section";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "../../lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface Subscription {
  id?: number;
  plan: string;
  status: string;
  price: number;
  currency: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  features: string[];
  stripeSubscriptionId?: string;
}

interface PlanUsage {
  videosGenerated: number;
  videosLimit: number;
  percentageUsed: number;
}

const planConfig = {
  free: {
    name: "Free",
    icon: Zap,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    limit: 0
  },
  essential: {
    name: "ESSENTIAL",
    icon: Sparkles,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    limit: 1
  },
  gold: {
    name: "GOLD",
    icon: Crown,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    limit: 2
  },
  platinum: {
    name: "PLATINUM",
    icon: Gem,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    limit: 4
  },
  diamond: {
    name: "DIAMOND",
    icon: Gem,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    limit: 8
  }
};

export function SubscriptionCardCompact() {
  const { toast } = useToast();
  const [showComparison, setShowComparison] = useState(false);
  
  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ["/api/subscriptions/current"],
  });

  // Mock data para uso del plan - se puede conectar a un endpoint real
  const usage: PlanUsage = {
    videosGenerated: 1,
    videosLimit: subscription ? planConfig[subscription.plan.toLowerCase() as keyof typeof planConfig]?.limit || 0 : 0,
    percentageUsed: subscription ? (1 / (planConfig[subscription.plan.toLowerCase() as keyof typeof planConfig]?.limit || 1)) * 100 : 0
  };

  const manageMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest({
        url: "/api/stripe/create-portal-session",
        method: "POST"
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo abrir el portal de gestión",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <CollapsibleSection
        title="Mi Suscripción"
        icon={<Crown className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </CollapsibleSection>
    );
  }

  if (!subscription) return null;

  const plan = subscription.plan.toLowerCase() as keyof typeof planConfig;
  const config = planConfig[plan] || planConfig.free;
  const Icon = config.icon;
  const isFreePlan = plan === "free";

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <CollapsibleSection
        title="Mi Suscripción"
        icon={<Icon className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          {/* Plan actual */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 ${config.bgColor} rounded-lg`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{config.name}</p>
                <p className="text-xs text-gray-400">
                  {isFreePlan ? "Plan gratuito" : `$${subscription.price}/${subscription.currency}/mes`}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {subscription.status === "active" ? "Activo" : 
               subscription.status === "trialing" ? "Prueba" : "Inactivo"}
            </Badge>
          </div>

          {/* Uso del plan */}
          {!isFreePlan && usage.videosLimit > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Videos este mes</span>
                <span className="text-white font-medium">{usage.videosGenerated}/{usage.videosLimit}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${config.bgColor} transition-all duration-300`}
                  style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Fecha de renovación */}
          {subscription.currentPeriodEnd && (
            <div className="flex items-center gap-2 text-xs text-gray-400 p-2 bg-gray-800/30 rounded">
              <Calendar className="h-3 w-3" />
              <span>
                {subscription.cancelAtPeriodEnd 
                  ? `Termina: ${formatDate(subscription.currentPeriodEnd)}`
                  : `Renueva: ${formatDate(subscription.currentPeriodEnd)}`
                }
              </span>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            {isFreePlan ? (
              <Link href="/music-video-pricing" className="flex-1">
                <Button
                  size="sm"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  data-testid="button-upgrade-plan-compact"
                >
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Mejorar Plan
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => manageMutation.mutate()}
                  disabled={manageMutation.isPending}
                  data-testid="button-manage-subscription-compact"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {manageMutation.isPending ? "Abriendo..." : "Gestionar"}
                </Button>
                <Link href="/music-video-pricing" className="flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    data-testid="button-change-plan-compact"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Cambiar
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Link a comparación */}
          <Button
            variant="link"
            size="sm"
            className="w-full text-xs text-orange-500 hover:text-orange-400 p-0 h-auto"
            onClick={() => setShowComparison(true)}
            data-testid="button-compare-plans"
          >
            Ver comparación de planes
          </Button>
        </div>
      </CollapsibleSection>

      {/* Modal de comparación de planes */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Comparar Planes</DialogTitle>
            <DialogDescription className="text-gray-400">
              Elige el plan perfecto para tus necesidades de producción musical
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {Object.entries(planConfig).filter(([key]) => key !== 'free').map(([key, planInfo]) => (
              <div
                key={key}
                className={`p-4 border rounded-lg ${
                  key === plan ? 'border-orange-500 bg-orange-500/5' : 'border-gray-700'
                }`}
              >
                <div className={`p-2 ${planInfo.bgColor} rounded-lg w-fit mb-3`}>
                  <planInfo.icon className={`h-5 w-5 ${planInfo.color}`} />
                </div>
                <h3 className="text-white font-bold mb-1">{planInfo.name}</h3>
                <p className="text-2xl font-bold text-white mb-1">
                  ${key === 'essential' ? '99' : key === 'gold' ? '149' : key === 'platinum' ? '249' : '399'}
                </p>
                <p className="text-xs text-gray-400 mb-4">/mes</p>
                <ul className="space-y-2 text-xs text-gray-300 mb-4">
                  <li className="flex items-start gap-1">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span>{planInfo.limit} video{planInfo.limit > 1 ? 's' : ''}/mes</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span>Calidad {key === 'essential' ? 'HD' : key === 'gold' ? '4K' : key === 'platinum' ? '4K HDR' : '8K'}</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-orange-500 mt-0.5">✓</span>
                    <span>Primer mes gratis</span>
                  </li>
                </ul>
                <Link href="/music-video-pricing">
                  <Button
                    size="sm"
                    className={`w-full ${
                      key === plan 
                        ? 'bg-gray-700' 
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                    disabled={key === plan}
                  >
                    {key === plan ? 'Plan Actual' : 'Seleccionar'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
