import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { FileText, Lock, Plus } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";

interface Subscription {
  plan: string;
  epkLimit?: number;
  epkUsed?: number;
}

export default function EPKCreatorPage() {
  const { user } = useAuth();
  const { toast } = useToast();

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

  const epkLimit = subscription.epkLimit || 0;
  const epkUsed = subscription.epkUsed || 0;
  const isAtLimit = epkUsed >= epkLimit;
  const isLocked = epkLimit === 0;

  if (isLocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-4 bg-yellow-500/20 rounded-lg w-fit mx-auto mb-4">
            <Lock className="h-8 w-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Herramienta Bloqueada</h1>
          <p className="text-gray-400 mb-6">
            Electronic Press Kits está disponible solo para planes BASIC, PRO y PREMIUM
          </p>
          <Link href="/pricing">
            <Button className="bg-orange-500 hover:bg-orange-600">Ver Planes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-6 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FileText className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Electronic Press Kit (EPK)</h1>
              <p className="text-gray-400 mt-1">Crea kits profesionales de prensa para tu carrera</p>
            </div>
          </div>
        </div>

        {/* Usage Info */}
        <Card className="p-6 bg-slate-800/50 border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-semibold">EPKs creados</span>
            <Badge variant={isAtLimit ? "destructive" : "secondary"}>
              {epkUsed}/{epkLimit}
            </Badge>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                isAtLimit ? "bg-red-500" : "bg-gradient-to-r from-green-500 to-emerald-500"
              }`}
              style={{
                width: `${Math.min((epkUsed / epkLimit) * 100, 100)}%`
              }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {isAtLimit 
              ? "Has alcanzado tu límite de EPKs" 
              : `Tienes ${epkLimit - epkUsed} EPK${epkLimit - epkUsed !== 1 ? 's' : ''} disponible${epkLimit - epkUsed !== 1 ? 's' : ''}`}
          </p>
        </Card>

        {/* Create EPK */}
        {!isAtLimit && (
          <Card className="p-6 bg-slate-800/50 border-slate-700 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Crear Nuevo EPK</h2>
            <Button className="bg-green-500 hover:bg-green-600">
              <Plus className="h-4 w-4 mr-2" />
              Crear EPK
            </Button>
          </Card>
        )}

        {/* Existing EPKs */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Mis EPKs</h2>
          <div className="text-center py-8 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tienes EPKs creados aún</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
