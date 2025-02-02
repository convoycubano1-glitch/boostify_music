import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface Strategy {
  focus: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStrategyUpdate: () => void;
}

export function StrategyDialog({ open, onOpenChange, onStrategyUpdate }: StrategyDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<string[]>([]);

  const generateStrategy = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Error",
        description: "Por favor, inicia sesión para generar una estrategia.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar estrategia');
      }

      const data = await response.json();
      if (!Array.isArray(data.strategy)) {
        throw new Error('Formato de respuesta inválido');
      }

      setGeneratedStrategy(data.strategy);
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la estrategia. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveStrategy = async () => {
    if (!auth.currentUser || !generatedStrategy.length) {
      toast({
        title: "Error",
        description: "No hay estrategia para guardar o no has iniciado sesión.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const strategiesRef = collection(db, "strategies");
      await addDoc(strategiesRef, {
        focus: generatedStrategy,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: "Éxito",
        description: "Estrategia actualizada exitosamente",
      });

      onOpenChange(false);
      onStrategyUpdate();
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la estrategia. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Actualizar Estrategia</DialogTitle>
          <DialogDescription>
            Genera y personaliza tu estrategia de crecimiento con asistencia de IA
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!generatedStrategy.length ? (
            <Button
              className="w-full"
              onClick={generateStrategy}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                'Generar Estrategia con IA'
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Estrategia Generada:</h3>
                <ul className="space-y-2 text-sm">
                  {generatedStrategy.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedStrategy([])}
                  disabled={isLoading}
                >
                  Generar Nueva
                </Button>
                <Button
                  onClick={saveStrategy}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Estrategia'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}