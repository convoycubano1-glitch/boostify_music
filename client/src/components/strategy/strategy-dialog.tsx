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
    if (!auth.currentUser) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
        })
      });

      if (!response.ok) throw new Error('Failed to generate strategy');

      const data = await response.json();
      setGeneratedStrategy(data.strategy);

    } catch (error) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error",
        description: "Failed to generate strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveStrategy = async () => {
    if (!auth.currentUser || !generatedStrategy.length) return;

    setIsLoading(true);
    try {
      const strategyData: Partial<Strategy> = {
        focus: generatedStrategy,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const strategiesRef = collection(db, "strategies");
      await addDoc(strategiesRef, {
        ...strategyData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: "Strategy updated successfully",
      });

      onOpenChange(false);
      onStrategyUpdate();

    } catch (error) {
      console.error('Error saving strategy:', error);
      toast({
        title: "Error",
        description: "Failed to save strategy. Please try again.",
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
          <DialogTitle>Update Strategy</DialogTitle>
          <DialogDescription>
            Generate and customize your growth strategy with AI assistance
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
                  Generating...
                </>
              ) : (
                'Generate Strategy with AI'
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Generated Strategy:</h3>
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
                  Generate New
                </Button>
                <Button
                  onClick={saveStrategy}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Strategy'
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
