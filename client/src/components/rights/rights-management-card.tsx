import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music2, ExternalLink, Shield, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const societies = [
  {
    name: "ASCAP",
    description: "American Society of Composers, Authors and Publishers",
    url: "https://www.ascap.com/join",
    icon: Music2,
    benefits: "Protege los derechos de interpretación pública",
  },
  {
    name: "BMI",
    description: "Broadcast Music Inc.",
    url: "https://www.bmi.com/join",
    icon: Shield,
    benefits: "Licencias y regalías para compositores",
  },
  {
    name: "SESAC",
    description: "Society of European Stage Authors and Composers",
    url: "https://www.sesac.com/join",
    icon: DollarSign,
    benefits: "Sociedad de derechos por invitación",
  }
];

export function RightsManagementCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Gestión de Derechos</h2>
          <p className="text-sm text-muted-foreground">
            Registra y protege tus derechos musicales
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {societies.map((society) => (
          <motion.div
            key={society.name}
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-lg border bg-card hover:bg-orange-500/5 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-md">
                  <society.icon className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{society.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {society.description}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-orange-500 hover:text-orange-600"
                onClick={() => window.open(society.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Registrarse
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {society.benefits}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-orange-500/5 rounded-lg">
        <h4 className="font-semibold mb-2">¿Por qué registrarte?</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Protege tus derechos de autor</li>
          <li>• Cobra regalías por reproducciones</li>
          <li>• Accede a recursos y herramientas profesionales</li>
          <li>• Conecta con la comunidad musical</li>
        </ul>
      </div>
    </Card>
  );
}
