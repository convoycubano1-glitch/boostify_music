import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ApifyRun {
  status: string;
  stats: {
    viewsGenerated: number;
    remainingViews: number;
  };
}

export default function YoutubeViewsPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleGenerateViews = async () => {
    if (!videoUrl) {
      toast({
        title: "Error",
        description: "Por favor, ingresa una URL de YouTube válida",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      await refetch();
      toast({
        title: "¡Éxito!",
        description: "El proceso de generación de views ha comenzado",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al generar las views",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Generador de Views</h2>
          <p className="text-muted-foreground">
            Impulsa tus videos de YouTube con visualizaciones orgánicas
          </p>
        </div>
      </div>

      <div className="grid gap-6">
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
            <Button
              className="w-full sm:w-auto"
              onClick={handleGenerateViews}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Generar Views
                </>
              )}
            </Button>
          </div>
        </Card>

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
    </div>
  );
}
