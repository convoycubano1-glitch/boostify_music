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
          <h3 className="text-lg font-semibold">Virtual Studio Session</h3>
          <p className="text-sm text-muted-foreground">
            Connect with producers and artists in real-time video collaboration
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Users className="w-4 h-4 mr-2" />
          4 Participants
        </Button>
      </div>

      <div className="aspect-video bg-zinc-900 rounded-lg mb-4 relative overflow-hidden shadow-lg">
        {isCallActive ? (
          <div className="absolute inset-0 grid grid-cols-2 gap-2 p-2">
            <div className="bg-zinc-800 rounded-lg relative overflow-hidden shadow-inner">
              <video className="w-full h-full object-cover rounded-lg opacity-90" />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded-full">
                <span className="text-xs text-white font-medium">Producer</span>
              </div>
            </div>
            <div className="bg-zinc-800 rounded-lg relative overflow-hidden shadow-inner">
              <video className="w-full h-full object-cover rounded-lg opacity-90" />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded-full">
                <span className="text-xs text-white font-medium">Artist</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-white/80">
            <p className="text-sm">Start a virtual studio session to collaborate in real-time</p>
            <Button onClick={toggleCall} variant="default" className="bg-primary">
              Start Studio Session
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          onClick={toggleMute}
          className="hover:opacity-90 transition-opacity"
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Button
          variant={!isVideoOn ? "destructive" : "secondary"}
          size="icon"
          onClick={toggleVideo}
          className="hover:opacity-90 transition-opacity"
        >
          {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </Button>
        <Button
          variant={isCallActive ? "destructive" : "default"}
          size="icon"
          onClick={toggleCall}
          className="hover:opacity-90 transition-opacity"
        >
          <Phone className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}