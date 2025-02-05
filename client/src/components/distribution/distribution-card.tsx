import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music2, ExternalLink, Globe, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const distributors = [
  {
    name: "DistroKid",
    description: "Distribución ilimitada por una tarifa anual fija",
    url: "https://distrokid.com/vip/seven/641439",
    icon: Music2,
    benefits: "100% de las ganancias, distribución ilimitada",
  },
  {
    name: "CD Baby",
    description: "Pago único por lanzamiento",
    url: "https://cdbaby.com",
    icon: Globe,
    benefits: "Distribución permanente, servicios de publicación",
  },
  {
    name: "TuneCore",
    description: "Distribución profesional con análisis detallados",
    url: "https://www.tunecore.com/r/17346764",
    icon: DollarSign,
    benefits: "100% de las regalías, herramientas de marketing",
  }
];

export function DistributionCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Globe className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Distribución Digital</h2>
          <p className="text-sm text-muted-foreground">
            Distribuye tu música en plataformas de streaming
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {distributors.map((distributor) => (
          <motion.div
            key={distributor.name}
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-lg border bg-card hover:bg-orange-500/5 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-md">
                  <distributor.icon className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{distributor.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {distributor.description}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-orange-500 hover:text-orange-600"
                onClick={() => window.open(distributor.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Registrarse
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {distributor.benefits}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-orange-500/5 rounded-lg">
        <h4 className="font-semibold mb-2">¿Por qué usar un distribuidor digital?</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Distribuye tu música en todas las plataformas principales</li>
          <li>• Recibe pagos directamente de las plataformas de streaming</li>
          <li>• Mantén el control total de tus derechos</li>
          <li>• Accede a estadísticas y análisis detallados</li>
        </ul>
      </div>
    </Card>
  );
}
