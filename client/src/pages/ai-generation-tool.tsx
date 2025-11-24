import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Sparkles, Zap, AlertCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";

interface Subscription {
  plan: string;
  aiGenerationLimit?: number;
  aiGenerationUsed?: number;
}

export default function AIGenerationToolPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscriptions/current"],
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Por favor inicia sesión para acceder a esta herramienta</p>
          <Link href="/login">
            <Button className="bg-orange-500 hover:bg-orange-600">Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Cargando datos de suscripción...</p>
      </div>
    );
  }

  const isFreePlan = subscription.plan === "free";
  const aiGenerationLimit = subscription.aiGenerationLimit || 0;
  const aiGenerationUsed = subscription.aiGenerationUsed || 0;
  const isAtLimit = aiGenerationUsed >= aiGenerationLimit && aiGenerationLimit > 0;

  const handleGenerate = async () => {
    if (isFreePlan && aiGenerationLimit === 0) {
      toast({
        title: "Plan Gratis",
        description: "Tu plan gratis requiere generación automática con IA. Usa esta herramienta para crear contenido.",
        variant: "default"
      });
      return;
    }

    if (isAtLimit) {
      toast({
        title: "Límite Alcanzado",
        description: `Ya has usado tus ${aiGenerationLimit} generaciones este mes. Upgrade tu plan para más.`,
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      // Simular generación
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "✅ Contenido Generado",
        description: "Tu contenido ha sido generado exitosamente con IA",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el contenido. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-6 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Sparkles className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Generación Automática con IA</h1>
              <p className="text-gray-400 mt-1">Crea contenido profesional automáticamente</p>
            </div>
          </div>
        </div>

        {/* Usage Info */}
        <Card className="p-6 bg-slate-800/50 border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-semibold">Tu uso este mes</span>
            <Badge variant={isAtLimit ? "destructive" : "secondary"}>
              {aiGenerationUsed}/{aiGenerationLimit}
            </Badge>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                isAtLimit ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-cyan-500"
              }`}
              style={{
                width: `${aiGenerationLimit > 0 ? Math.min((aiGenerationUsed / aiGenerationLimit) * 100, 100) : 0}%`
              }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {isAtLimit 
              ? "Has alcanzado tu límite de generaciones" 
              : `Tienes ${aiGenerationLimit - aiGenerationUsed} generaciones disponibles`}
          </p>
        </Card>

        {/* Plan Info */}
        {isFreePlan && (
          <Card className="p-4 bg-orange-500/10 border-orange-500/30 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-400 font-semibold text-sm">Plan Gratis</p>
                <p className="text-orange-400/70 text-xs mt-1">
                  Tu plan gratis requiere usar generación automática con IA para crear contenido. No tiene límite en tu plan.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Generation Tool */}
        <Card className="p-6 bg-slate-800/50 border-slate-700 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Generar Contenido</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ¿Qué tipo de contenido deseas generar?
              </label>
              <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                <option>Descripción de Artist Bio</option>
                <option>Biografía Profesional</option>
                <option>Notas de Prensa</option>
                <option>Descripción de Album</option>
                <option>Social Media Posts</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción o contexto (opcional)
              </label>
              <textarea
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                rows={4}
                placeholder="Describe qué tipo de contenido necesitas que genere la IA..."
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || isAtLimit}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
            >
              {generating ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : isAtLimit ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Límite Alcanzado
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Contenido
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Upgrade CTA */}
        {!isFreePlan && (
          <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-700">
            <p className="text-gray-400 text-sm mb-3">
              ¿Necesitas más generaciones?
            </p>
            <Link href="/pricing">
              <Button variant="outline" className="w-full">
                Ver Planes Premium
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
