import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, TrendingUp, PackageCheck, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface ApifyRun {
  status: string;
  stats: {
    viewsGenerated: number;
    remainingViews: number;
  };
}

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

// Datos de ejemplo para el gráfico
const generateChartData = () => {
  return Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    views: Math.floor(Math.random() * 5000) + 1000
  }));
};

export default function YoutubeViewsPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const chartData = generateChartData();

  const { data: apifyData, refetch } = useQuery({
    queryKey: ["apify-run"],
    queryFn: async () => {
      const response = await fetch("https://api.apify.com/v2/actor-runs/bzOMo18w7llC41Yij?token=apify_api_nrudThRO1hQ9XCTFzUZkRI0VKCcSkv2h3mYq");
      if (!response.ok) {
        throw new Error("Error fetching Apify data");
      }
      return response.json() as Promise<ApifyRun>;
    },
    enabled: false
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

    setSelectedPackage(packageIndex);

    try {
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("No se pudo inicializar Stripe");
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: packageIndex,
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

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">YouTube Views Generator</h2>
          <p className="text-muted-foreground">
            Impulsa tus videos con visualizaciones orgánicas y de alta retención
          </p>
        </div>
      </div>

      {/* Video URL Input */}
      <Card className="p-6">
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
            />
          </div>
        </div>
      </Card>

      {/* Packages */}
      <div className="grid gap-6 md:grid-cols-3">
        {viewsPackages.map((pkg, index) => (
          <Card key={index} className="p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/2 to-transparent" />
            <div className="relative">
              <h3 className="text-2xl font-bold">{pkg.views.toLocaleString()} Views</h3>
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
                className="w-full mt-6"
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
                disabled={isGenerating}
              >
                Seleccionar Plan
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Compra</DialogTitle>
            <DialogDescription>
              Estás a punto de comprar {selectedPackage !== null ? viewsPackages[selectedPackage].views.toLocaleString() : ''} views
              por ${selectedPackage !== null ? viewsPackages[selectedPackage].price : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>Detalles del pedido:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>URL del video: {videoUrl}</li>
              <li>Precio: ${selectedPackage !== null ? viewsPackages[selectedPackage].price : ''}</li>
              <li>Views: {selectedPackage !== null ? viewsPackages[selectedPackage].views.toLocaleString() : ''}</li>
            </ul>
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

      {/* Analytics Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tendencia de Visualizaciones</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Important Information */}
      <Card className="p-6 border-yellow-500/20 bg-yellow-500/5">
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

      {/* Status Section */}
      {apifyData && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Estado del Proceso</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Views Generadas</p>
                <p className="text-2xl font-bold">
                  {apifyData.stats.viewsGenerated.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Views Restantes</p>
                <p className="text-2xl font-bold">
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
      )}
    </div>
  );
}