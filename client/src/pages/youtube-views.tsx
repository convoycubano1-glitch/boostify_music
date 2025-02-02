import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, TrendingUp, PackageCheck, AlertCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getAuthToken } from "@/lib/firebase";
import { createYouTubeViewsOrder, checkApifyRun, YouTubeViewsData } from "@/lib/youtube-store";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { motion, AnimatePresence } from "framer-motion";
import 'react-circular-progressbar/dist/styles.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const viewsPackages = [
  {
    views: 1000,
    price: 50,
    description: "Perfect for new content creators",
    features: ["Organic views", "24/7 Support", "Real-time tracking"]
  },
  {
    views: 10000,
    price: 450,
    description: "Most popular for growing channels",
    features: ["Premium viewer retention", "Priority support", "Detailed analytics"]
  },
  {
    views: 100000,
    price: 4000,
    description: "For professional content creators",
    features: ["Maximum engagement", "Dedicated account manager", "Custom delivery schedule"]
  }
];

export default function YoutubeViewsPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { data: apifyData, refetch } = useQuery({
    queryKey: ["apify-run", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      return checkApifyRun(orderId);
    },
    enabled: !!orderId,
    refetchInterval: orderId ? 5000 : false
  });

  const handlePackageSelect = async (packageIndex: number) => {
    if (!videoUrl) {
      toast({
        title: "Error",
        description: "Por favor, ingresa una URL de YouTube válida",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para continuar",
        variant: "destructive"
      });
      return;
    }

    setSelectedPackage(packageIndex);

    try {
      const token = await getAuthToken();
      if (!token) {
        toast({
          title: "Error de autenticación",
          description: "Por favor, inicia sesión para continuar",
          variant: "destructive"
        });
        return;
      }

      // Crear orden en Firestore
      const orderData = await createYouTubeViewsOrder(user, {
        videoUrl,
        purchasedViews: viewsPackages[packageIndex].views,
        apifyRunId: '',
      });

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("No se pudo inicializar Stripe");
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoUrl,
          views: viewsPackages[packageIndex].views,
          price: viewsPackages[packageIndex].price
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la sesión de pago');
      }

      const session = await response.json();
      if (!session.id) {
        throw new Error('No se recibió el ID de sesión de Stripe');
      }

      setOrderId(`${user.uid}_${Date.now()}`);
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      console.error('Error en el proceso de pago:', error);
      toast({
        title: "Error en el pago",
        description: error.message || "Hubo un error al procesar el pago. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    }
  };
    const chartData = Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        views: Math.floor(Math.random() * 5000) + 1000
      }));
    
  const progress = 75;
  const currentViews = 7500;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gradient-to-b from-background to-background/80">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            YouTube Views Generator
          </h2>
          <p className="text-muted-foreground mt-2">
            Impulsa tus videos con visualizaciones orgánicas y de alta retención
          </p>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Progreso en Tiempo Real</h3>
              </div>
              <div className="flex items-center justify-between">
                <div className="w-32 h-32 relative">
                  <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
                  <CircularProgressbar
                    value={progress}
                    text={`${progress}%`}
                    styles={buildStyles({
                      pathColor: `hsl(var(--primary))`,
                      textColor: `hsl(var(--primary))`,
                      trailColor: 'rgba(255,255,255,0.1)',
                      pathTransition: 'stroke-dashoffset 0.5s ease 0s',
                    })}
                  />
                </div>
                <div className="flex-1 ml-8">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Vistas Actuales</p>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-bold tabular-nums bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                    >
                      {currentViews.toLocaleString()}
                    </motion.div>
                    <p className="text-sm text-green-500 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +2.5% desde ayer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Tendencias</h3>
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { time: '1h', views: 120 },
                    { time: '2h', views: 250 },
                    { time: '3h', views: 380 },
                    { time: '4h', views: 470 },
                    { time: '5h', views: 600 }
                  ]}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/0.1)" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Video URL Input con animación */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-6 backdrop-blur-sm border-primary/10">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="video-url" className="text-sm font-medium">
                URL del Video
              </label>
              <Input
                id="video-url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="bg-background/50 border-primary/10 focus:border-primary"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Paquetes con animación */}
      <div className="grid gap-6 md:grid-cols-3">
        {viewsPackages.map((pkg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          >
            <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-50" />
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
              <div className="relative">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {pkg.views.toLocaleString()} Views
                </h3>
                <p className="text-3xl font-bold mt-2">${pkg.price}</p>
                <p className="text-sm text-muted-foreground mt-2">{pkg.description}</p>

                <ul className="mt-4 space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <PackageCheck className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full mt-6 bg-primary/90 hover:bg-primary transition-colors"
                  onClick={() => {
                    if (!videoUrl) {
                      toast({
                        title: "Error",
                        description: "Por favor, ingresa una URL de YouTube válida",
                        variant: "destructive"
                      });
                      return;
                    }
                    setSelectedPackage(index);
                    setShowDialog(true);
                  }}
                >
                  Seleccionar Plan
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Dialog mejorado */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px] backdrop-blur-sm bg-background/95">
          <DialogHeader>
            <DialogTitle>Confirmar Compra de Visualizaciones</DialogTitle>
            <DialogDescription>
              Revisa los detalles de tu compra antes de continuar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">Detalles del pedido:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>URL del video: {videoUrl}</li>
                  <li>Precio: ${selectedPackage !== null ? viewsPackages[selectedPackage].price : ''}</li>
                  <li>Views: {selectedPackage !== null ? viewsPackages[selectedPackage].views.toLocaleString() : ''}</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (selectedPackage !== null) {
                    handlePackageSelect(selectedPackage);
                    setShowDialog(false);
                  }
                }}
              >
                Confirmar Compra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Información Importante con animación */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="p-6 border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-500">Información Importante</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Las visualizaciones se entregan de forma gradual para mantener la naturalidad</li>
                <li>• El proceso puede tomar entre 24-72 horas dependiendo del paquete</li>
                <li>• Garantizamos visualizaciones de alta retención y calidad</li>
                <li>• Soporte 24/7 para resolver cualquier duda</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Estado del Proceso con animación */}
      {apifyData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 backdrop-blur-sm border-primary/10">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Estado del Proceso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Views Generadas</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {apifyData.stats.viewsGenerated.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Views Restantes</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {apifyData.stats.remainingViews.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Estado: {apifyData.status}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}