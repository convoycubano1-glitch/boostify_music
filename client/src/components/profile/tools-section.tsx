import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Sparkles, FileText, Image, Lock, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { CollapsibleSection } from "./collapsible-section";
import { useToast } from "../../hooks/use-toast";

interface Subscription {
  plan: string;
  aiGenerationLimit?: number;
  aiGenerationUsed?: number;
  epkLimit?: number;
  epkUsed?: number;
  imageGalleriesLimit?: number;
  imageGalleriesUsed?: number;
}

export function ToolsSection() {
  const { toast } = useToast();
  
  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscriptions/current"],
  });

  if (!subscription) return null;

  const isFreePlan = subscription.plan === "free";
  const isBasic = subscription.plan === "basic";
  const isPro = subscription.plan === "pro";
  const isPremium = subscription.plan === "premium";

  const tools = [
    {
      id: "ai-generation",
      name: "Generación Automática con IA",
      description: isFreePlan 
        ? "Generar contenido con IA es obligatorio en tu plan" 
        : "Crea contenido automático con inteligencia artificial",
      icon: Sparkles,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      limit: subscription.aiGenerationLimit || 0,
      used: subscription.aiGenerationUsed || 0,
      href: "/ai-generation-tool",
      isLocked: false,
      isMandatory: isFreePlan
    },
    {
      id: "epk",
      name: "Electronic Press Kit (EPK)",
      description: "Crea kits profesionales de prensa para tu carrera musical",
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      limit: subscription.epkLimit || 0,
      used: subscription.epkUsed || 0,
      href: "/epk-creator",
      isLocked: !isBasic && !isPro && !isPremium,
      isMandatory: false
    },
    {
      id: "galleries",
      name: "Galerías de Imágenes Profesionales",
      description: "Crea galerías de imágenes de alta calidad para tu perfil",
      icon: Image,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      limit: subscription.imageGalleriesLimit || 0,
      used: subscription.imageGalleriesUsed || 0,
      href: "/image-galleries",
      isLocked: !isBasic && !isPro && !isPremium,
      isMandatory: false
    }
  ];

  return (
    <CollapsibleSection
      title="Herramientas Profesionales"
      icon={<Sparkles className="h-4 w-4" />}
      defaultOpen={false}
    >
      <div className="space-y-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const percentageUsed = tool.limit > 0 ? (tool.used / tool.limit) * 100 : 0;
          const isAtLimit = tool.used >= tool.limit && tool.limit > 0;

          return (
            <Card
              key={tool.id}
              className="p-4 bg-slate-800/30 border-slate-700 hover:border-slate-600 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className={`p-2 ${tool.bgColor} rounded-lg flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${tool.color}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-white text-sm">{tool.name}</h4>
                      {tool.isMandatory && (
                        <Badge variant="destructive" className="text-xs">
                          Obligatorio
                        </Badge>
                      )}
                      {tool.isLocked && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{tool.description}</p>

                    {/* Usage Bar */}
                    {tool.limit > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Uso</span>
                          <span className={isAtLimit ? "text-red-400 font-medium" : "text-gray-400"}>
                            {tool.used}/{tool.limit}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isAtLimit
                                ? "bg-red-500"
                                : percentageUsed > 80
                                ? "bg-yellow-500"
                                : tool.bgColor.replace("bg-", "bg-gradient-to-r from-")
                            }`}
                            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  {tool.isLocked ? (
                    <Link href="/pricing">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs whitespace-nowrap"
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        Upgrade
                      </Button>
                    </Link>
                  ) : isAtLimit ? (
                    <Button
                      size="sm"
                      disabled
                      variant="outline"
                      className="text-xs whitespace-nowrap"
                    >
                      Límite
                    </Button>
                  ) : (
                    <Link href={tool.href}>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-xs whitespace-nowrap"
                      >
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        Usar
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {/* Upgrade Banner */}
        {isFreePlan && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-xs text-orange-400">
              💡 <span className="font-semibold">Nota:</span> Tu plan gratis solo permite generación obligatoria con IA. Upgrade para acceder a EPK y Galerías.
            </p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
