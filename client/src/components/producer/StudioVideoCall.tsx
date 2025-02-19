import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Mic, MicOff, VideoOff, Phone, Users } from "lucide-react";

export function StudioVideoCall() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOn(!isVideoOn);
  const toggleCall = () => setIsCallActive(!isCallActive);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Sesión de Estudio Virtual</h3>
          <p className="text-sm text-muted-foreground">
            Conecta con otros productores en tiempo real
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Users className="w-4 h-4 mr-2" />
          4 Participantes
        </Button>
      </div>

      <div className="aspect-video bg-black rounded-lg mb-4 relative overflow-hidden">
        {isCallActive ? (
          <div className="absolute inset-0 grid grid-cols-2 gap-2 p-2">
            <div className="bg-zinc-800 rounded-lg relative">
              <video className="w-full h-full object-cover rounded-lg" />
              <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                Producer
              </span>
            </div>
            <div className="bg-zinc-800 rounded-lg relative">
              <video className="w-full h-full object-cover rounded-lg" />
              <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                Artist
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Button onClick={toggleCall}>Iniciar Sesión de Estudio</Button>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Button
          variant={!isVideoOn ? "destructive" : "secondary"}
          size="icon"
          onClick={toggleVideo}
        >
          {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </Button>
        <Button
          variant={isCallActive ? "destructive" : "default"}
          size="icon"
          onClick={toggleCall}
        >
          <Phone className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
