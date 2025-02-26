import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Download, Loader2, ChevronRight, Eye, Upload, Calculator } from "lucide-react";
import { managerToolsService } from "@/lib/services/managertoolsopenrouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface BudgetDocument {
  id: string;
  content: string;
  createdAt: any;
}

export function BudgetSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [details, setDetails] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { data: budgetDocuments = [], isLoading } = useQuery({
    queryKey: ['budgets', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const data = await managerToolsService.getFromFirestore(user.uid, 'budget');
      return data as BudgetDocument[];
    },
    enabled: !!user
  });

  const generatePreviewMutation = useMutation({
    mutationFn: async (details: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      const prompt = `Create a detailed budget breakdown for this project: ${details}. Include all expected costs, contingencies, and potential revenue streams. Format the response with clear categories, line items, and totals.`;
      const content = await managerToolsService.generateWithAI(prompt, 'budget');
      return content;
    },
    onSuccess: (content) => {
      setPreviewContent(content);
      setIsPreviewMode(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate preview",
        variant: "destructive"
      });
    }
  });

  const generateBudgetMutation = useMutation({
    mutationFn: async (details: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      return managerToolsService.generateContentByType('budget', details, user.uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.uid] });
      toast({
        title: "Success",
        description: "Budget document generated successfully"
      });
      setIsDialogOpen(false);
      setDetails("");
      setPreviewContent(null);
      setIsPreviewMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate budget document",
        variant: "destructive"
      });
    }
  });

  const handlePreviewBudget = async () => {
    if (!details.trim()) {
      toast({
        title: "Error",
        description: "Please enter the project details",
        variant: "destructive"
      });
      return;
    }

    try {
      await generatePreviewMutation.mutateAsync(details);
    } catch (error) {
      console.error("Error generating preview:", error);
    }
  };

  const handleGenerateBudget = async () => {
    try {
      setIsGenerating(true);
      await generateBudgetMutation.mutateAsync(details);
    } catch (error) {
      console.error("Error generating budget:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (doc: BudgetDocument) => {
    try {
      const blob = new Blob([doc.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `budget-plan-${new Date(doc.createdAt.toDate()).toISOString().split('T')[0]}.txt`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Budget document downloaded successfully"
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download budget document",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Budget Generator Card */}
      <Card className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Production Budget</h3>
            <p className="text-muted-foreground">
              Generate detailed project budgets
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {[
            'Equipment & Technical expenses',
            'Staff & services costs',
            'Venue & logistics breakdown'
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <ChevronRight className="h-5 w-5 text-orange-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              <Calculator className="mr-2 h-5 w-5" />
              Create Budget Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Generate Budget Plan</DialogTitle>
              <DialogDescription>
                Enter your project details to generate a comprehensive budget breakdown.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="details">Project Details</Label>
                <Textarea
                  id="details"
                  placeholder="Enter project name, type, scale, duration, location, and special requirements..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              {isPreviewMode && previewContent && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="p-4 rounded-lg bg-muted/50 whitespace-pre-line overflow-auto max-h-[400px]">
                    {previewContent}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              {!isPreviewMode ? (
                <Button
                  onClick={handlePreviewBudget}
                  disabled={generatePreviewMutation.isPending || !details.trim()}
                  className="w-full"
                >
                  {generatePreviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Preview...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Budget
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsPreviewMode(false)}
                    className="flex-1"
                  >
                    Edit Details
                  </Button>
                  <Button
                    onClick={handleGenerateBudget}
                    disabled={generateBudgetMutation.isPending}
                    className="flex-1"
                  >
                    {generateBudgetMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Save Budget Plan"
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Generated Budgets Card */}
      <Card className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <Calculator className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Generated Budgets</h3>
            <p className="text-muted-foreground">
              View and download your budget documents
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : budgetDocuments.length > 0 ? (
            budgetDocuments.map((doc: BudgetDocument) => (
              <div key={doc.id} className="p-4 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">Budget Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(doc.createdAt.toDate()).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    className="hover:bg-orange-500/10"
                  >
                    <Download className="h-4 w-4" />
                    <VisuallyHidden>Download Budget</VisuallyHidden>
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-sm line-clamp-3">{doc.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No budget documents generated yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
