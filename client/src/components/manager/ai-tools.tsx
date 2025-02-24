import { Card } from "@/components/ui/card";
import { Brain, Wand2, Calculator, ChartBar, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { managerToolsService } from "@/lib/services/managertoolsopenrouter";
import { useMutation } from "@tanstack/react-query";

export function AIToolsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      return managerToolsService.generateContentByType('ai', prompt, user.uid);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI response generated successfully"
      });
      setPrompt("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate response",
        variant: "destructive"
      });
    }
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter your question or request",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      await generateMutation.mutateAsync(prompt);
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* AI Assistant Card */}
      <Card className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <Brain className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">AI Assistant</h3>
            <p className="text-muted-foreground">
              Get AI-powered insights and recommendations
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all">
            <h4 className="font-medium mb-4">Ask AI Assistant</h4>
            <Textarea
              className="mb-4 min-h-[120px]"
              placeholder="Ask about management strategies, technical requirements, or get recommendations..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Get AI Response
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions Card */}
      <Card className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <Wand2 className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Quick Actions</h3>
            <p className="text-muted-foreground">
              Common AI-powered tasks and analysis
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            { icon: Calculator, text: "Budget Analysis", prompt: "Analyze my event budget" },
            { icon: ChartBar, text: "Performance Insights", prompt: "Analyze recent performance metrics" }
          ].map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex items-start gap-3 hover:bg-orange-500/5"
              onClick={() => {
                setPrompt(action.prompt);
                handleGenerate();
              }}
            >
              <action.icon className="h-5 w-5 mt-0.5 text-orange-500" />
              <div className="text-left">
                <p className="font-medium">{action.text}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Get instant AI analysis and recommendations
                </p>
              </div>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}