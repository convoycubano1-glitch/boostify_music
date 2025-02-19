import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  Clock
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

interface Version {
  id: number;
  name: string;
  date: string;
  duration: string;
  status: "pending" | "approved" | "rejected";
  feedback?: string;
}

const versions: Version[] = [
  {
    id: 1,
    name: "Mix v1",
    date: "2024-02-19",
    duration: "3:45",
    status: "approved",
    feedback: "Buen balance, ajustar graves"
  },
  {
    id: 2,
    name: "Mix v2",
    date: "2024-02-19",
    duration: "3:46",
    status: "pending"
  }
];

export function VersionControl() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [feedback, setFeedback] = useState("");

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Control de Versiones</h3>
        <p className="text-sm text-muted-foreground">
          Escucha y aprueba las diferentes versiones
        </p>
      </div>

      <div className="space-y-6">
        {versions.map((version) => (
          <div
            key={version.id}
            className="bg-muted/50 rounded-lg p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <div>
                  <h4 className="text-sm font-medium">{version.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{version.duration}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={version.status === "approved" ? "default" : "outline"}
                  size="sm"
                  className="h-7"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Aprobar
                </Button>
                <Button
                  variant={version.status === "rejected" ? "destructive" : "outline"}
                  size="sm"
                  className="h-7"
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  Rechazar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <SkipBack className="h-3 w-3" />
                </Button>
                <Slider
                  value={[currentTime]}
                  max={100}
                  step={1}
                  className="flex-1"
                  onValueChange={([value]) => setCurrentTime(value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <SkipForward className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {version.feedback && (
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Feedback</span>
                </div>
                <p className="text-sm text-muted-foreground">{version.feedback}</p>
              </div>
            )}

            {version.status === "pending" && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Añade tu feedback aquí..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="h-20"
                />
                <Button className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Feedback
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
