import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Calendar, Target, BarChart2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Strategy {
  focus: string[];
  phases: Phase[];
  targetAudience: string;
  priority: string;
  timeline: string;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Phase {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  dueDate?: Date;
}

const predefinedPhases: Phase[] = [
  {
    id: "1",
    name: "Content Creation",
    description: "Create and prepare high-quality music content",
    completed: false,
  },
  {
    id: "2",
    name: "Platform Setup",
    description: "Optimize presence on streaming platforms",
    completed: false,
  },
  {
    id: "3",
    name: "Marketing Launch",
    description: "Execute initial marketing campaign",
    completed: false,
  },
  {
    id: "4",
    name: "Audience Growth",
    description: "Expand fanbase through targeted promotion",
    completed: false,
  },
  {
    id: "5",
    name: "Monetization",
    description: "Implement revenue streams and partnerships",
    completed: false,
  }
];

const targetAudiences = [
  "Gen Z Music Enthusiasts",
  "Young Urban Professionals",
  "College Students",
  "Global Music Fans",
  "Local Scene Supporters"
];

const priorities = [
  { value: "high", label: "High Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "low", label: "Low Priority" }
];

const timelines = [
  { value: "1month", label: "1 Month" },
  { value: "3months", label: "3 Months" },
  { value: "6months", label: "6 Months" },
  { value: "1year", label: "1 Year" }
];

interface StrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStrategyUpdate: () => void;
}

export function StrategyDialog({ open, onOpenChange, onStrategyUpdate }: StrategyDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [phases, setPhases] = useState<Phase[]>(predefinedPhases);
  const [targetAudience, setTargetAudience] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [timeline, setTimeline] = useState<string>("");
  const [generatedFocus, setGeneratedFocus] = useState<string[]>([]);
  const [customPhase, setCustomPhase] = useState<string>("");

  const generateStrategy = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Error",
        description: "Please log in to generate a strategy.",
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
          targetAudience,
          timeline,
          priority
        })
      });

      if (!response.ok) {
        throw new Error('Error generating strategy');
      }

      const data = await response.json();
      setGeneratedFocus(data.strategy);
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error",
        description: "Could not generate strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveStrategy = async () => {
    if (!auth.currentUser || !generatedFocus.length) {
      toast({
        title: "Error",
        description: "No strategy to save or not logged in.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const strategiesRef = collection(db, "strategies");
      await addDoc(strategiesRef, {
        focus: generatedFocus,
        phases: phases,
        targetAudience,
        priority,
        timeline,
        status: "active",
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: "Success",
        description: "Strategy saved successfully",
      });

      onOpenChange(false);
      onStrategyUpdate();
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast({
        title: "Error",
        description: "Could not save strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePhaseCompletion = (phaseId: string) => {
    setPhases(prevPhases =>
      prevPhases.map(phase =>
        phase.id === phaseId ? { ...phase, completed: !phase.completed } : phase
      )
    );
  };

  const addCustomPhase = () => {
    if (customPhase.trim()) {
      const newPhase: Phase = {
        id: `custom-${Date.now()}`,
        name: customPhase,
        description: "Custom phase",
        completed: false
      };
      setPhases(prev => [...prev, newPhase]);
      setCustomPhase("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Growth Strategy Builder</DialogTitle>
          <DialogDescription>
            Create a comprehensive growth strategy for your music career
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Target Audience Selection */}
          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger>
                <SelectValue placeholder="Select target audience" />
              </SelectTrigger>
              <SelectContent>
                {targetAudiences.map((audience) => (
                  <SelectItem key={audience} value={audience}>
                    {audience}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label>Priority Level</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeline Selection */}
          <div className="space-y-2">
            <Label>Timeline</Label>
            <Select value={timeline} onValueChange={setTimeline}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeline" />
              </SelectTrigger>
              <SelectContent>
                {timelines.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Strategy Button */}
          {!generatedFocus.length && (
            <Button
              className="w-full"
              onClick={generateStrategy}
              disabled={isLoading || !targetAudience || !priority || !timeline}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Strategy'
              )}
            </Button>
          )}

          {/* Generated Strategy Display */}
          {generatedFocus.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-orange-500/5">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Strategic Focus Points
                </h3>
                <ul className="space-y-2">
                  {generatedFocus.map((focus, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5" />
                      <span>{focus}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Phases Section */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-orange-500" />
                  Implementation Phases
                </h3>
                <div className="space-y-3">
                  {phases.map((phase) => (
                    <div
                      key={phase.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-background/50"
                    >
                      <Checkbox
                        checked={phase.completed}
                        onCheckedChange={() => togglePhaseCompletion(phase.id)}
                      />
                      <div className="space-y-1">
                        <p className="font-medium">{phase.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {phase.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Phase */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom phase"
                    value={customPhase}
                    onChange={(e) => setCustomPhase(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={addCustomPhase}
                    disabled={!customPhase.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Save Strategy Button */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedFocus([]);
                    setPhases(predefinedPhases);
                  }}
                  disabled={isLoading}
                >
                  Reset
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