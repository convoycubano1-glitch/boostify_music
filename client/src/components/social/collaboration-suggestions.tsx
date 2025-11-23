import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Handshake, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { useAuth } from "../../hooks/use-auth";

export function CollaborationSuggestions() {
  const { user } = useAuth() || {};

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["/api/social/users", user?.id, "collaboration-suggestions"],
    queryFn: async () => {
      if (!user?.id) return [];
      return apiRequest({
        url: `/api/social/users/${user.id}/collaboration-suggestions`,
        method: "GET",
      }) as Promise<any[]>;
    },
    enabled: !!user?.id,
  });

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className="bg-slate-800/30 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Handshake className="h-5 w-5 text-purple-400" />
            Artistas para Colaborar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Completa tu perfil con género y ubicación para ver sugerencias de colaboración
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-400" />
          Artistas para Colaborar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.slice(0, 3).map((suggestion) => (
            <div
              key={suggestion.userId}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition"
            >
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={suggestion.user.avatar || undefined} />
                  <AvatarFallback>
                    {suggestion.user.displayName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {suggestion.user.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.reason || "Compatible artista"}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/50"
              >
                {suggestion.compatibilityScore}%
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
