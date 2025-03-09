import { useState } from "react";
import { Label } from "@/components/ui/label";
import { TimelineClip } from "./timeline-editor";
import FaceSwap, { FaceSwapResult } from "@/components/face-swap/face-swap";

interface ArtistCustomizationProps {
  clips?: TimelineClip[];
  onUpdateClip?: (clipId: number, updates: Partial<TimelineClip>) => void;
  onFaceSwapComplete?: (results: FaceSwapResult[]) => void;
  isPurchased?: boolean;
  videoId?: string;
}

/**
 * Componente para la personalización de artista en el video musical
 * Incluye la integración con Face Swap
 */
export function ArtistCustomization({ 
  clips = [], 
  onUpdateClip,
  onFaceSwapComplete,
  isPurchased = false,
  videoId 
}: ArtistCustomizationProps) {
  const [faceSwapResults, setFaceSwapResults] = useState<FaceSwapResult[]>([]);
  
  // Manejar la finalización del face swap
  const handleFaceSwapComplete = (results: FaceSwapResult[]) => {
    setFaceSwapResults(results);
    
    if (onFaceSwapComplete) {
      onFaceSwapComplete(results);
    }
  };
  
  return (
    <div className="border rounded-lg p-4">
      <Label className="text-lg font-semibold mb-4 block">Personalización de Artista</Label>
      
      {/* Componente de Face Swap */}
      <FaceSwap 
        videoId={videoId}
        onComplete={handleFaceSwapComplete}
        isPurchased={isPurchased}
      />
    </div>
  );
}
