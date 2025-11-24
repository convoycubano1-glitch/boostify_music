import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Image, Lock, Plus } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { Link } from "wouter";

interface Subscription {
  plan: string;
  imageGalleriesLimit?: number;
  imageGalleriesUsed?: number;
}

export default function ImageGalleriesPage() {
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

  const galleriesLimit = subscription.imageGalleriesLimit || 0;
  const galleriesUsed = subscription.imageGalleriesUsed || 0;
  const isAtLimit = galleriesUsed >= galleriesLimit;
  const isLocked = galleriesLimit === 0;

  if (isLocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-4 bg-purple-500/20 rounded-lg w-fit mx-auto mb-4">
            <Lock className="h-8 w-8 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Herramienta Bloqueada</h1>
          <p className="text-gray-400 mb-6">
            Galerías de Imágenes Profesionales está disponible solo para planes BASIC, PRO y PREMIUM
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
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Image className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Galerías de Imágenes Profesionales</h1>
              <p className="text-gray-400 mt-1">Crea galerías de alta calidad para tu perfil</p>
            </div>
          </div>
        </div>

        {/* Usage Info */}
        <Card className="p-6 bg-slate-800/50 border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-semibold">Galerías creadas</span>
            <Badge variant={isAtLimit ? "destructive" : "secondary"}>
              {galleriesUsed}/{galleriesLimit}
            </Badge>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                isAtLimit ? "bg-red-500" : "bg-gradient-to-r from-purple-500 to-pink-500"
              }`}
              style={{
                width: `${Math.min((galleriesUsed / galleriesLimit) * 100, 100)}%`
              }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {isAtLimit 
              ? "Has alcanzado tu límite de galerías" 
              : `Tienes ${galleriesLimit - galleriesUsed} galería${galleriesLimit - galleriesUsed !== 1 ? 's' : ''} disponible${galleriesLimit - galleriesUsed !== 1 ? 's' : ''}`}
          </p>
        </Card>

        {/* Create Gallery */}
        {!isAtLimit && (
          <Card className="p-6 bg-slate-800/50 border-slate-700 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Crear Nueva Galería</h2>
            <Button className="bg-purple-500 hover:bg-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Crear Galería
            </Button>
          </Card>
        )}

        {/* Existing Galleries */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Mis Galerías</h2>
          <div className="text-center py-8 text-gray-400">
            <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tienes galerías creadas aún</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
