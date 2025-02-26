import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Download, Loader2, ChevronRight, Eye, Upload, CalendarDays, MapPin } from "lucide-react";
import { managerToolsService } from "@/lib/services/managertoolsopenrouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { downloadTextFile } from "@/lib/download-helper";

interface LogisticsDocument {
  id: string;
  content: string;
  createdAt: any;
}

export function LogisticsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [details, setDetails] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { data: logisticsDocuments = [], isLoading } = useQuery({
    queryKey: ['logistics', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const data = await managerToolsService.getFromFirestore(user.uid, 'logistics');
      return data as LogisticsDocument[];
    },
    enabled: !!user
  });

  const generatePreviewMutation = useMutation({
    mutationFn: async (details: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      const prompt = `Create a detailed logistics plan for this event/tour: ${details}. Include transportation, accommodation, equipment handling, and timeline. Format as a comprehensive plan with clear sections for each aspect of logistics management.`;
      const content = await managerToolsService.generateWithAI(prompt, 'logistics');
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

  const generateLogisticsMutation = useMutation({
    mutationFn: async (details: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      return managerToolsService.generateContentByType('logistics', details, user.uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics', user?.uid] });
      toast({
        title: "Success",
        description: "Logistics plan generated successfully"
      });
      setIsDialogOpen(false);
      setDetails("");
      setPreviewContent(null);
      setIsPreviewMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate logistics plan",
        variant: "destructive"
      });
    }
  });

  const handlePreviewLogistics = async () => {
    if (!details.trim()) {
      toast({
        title: "Error",
        description: "Please enter the event/tour details",
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

  const handleGenerateLogistics = async () => {
    try {
      setIsGenerating(true);
      await generateLogisticsMutation.mutateAsync(details);
    } catch (error) {
      console.error("Error generating logistics plan:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (doc: LogisticsDocument) => {
    try {
      const filename = `logistics-plan-${new Date(doc.createdAt.toDate()).toISOString().split('T')[0]}.txt`;
      await downloadTextFile(doc.content, filename);
      
      toast({
        title: "Success",
        description: "Logistics plan downloaded successfully"
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download logistics plan",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Logistics Generator Card */}
      <Card className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <Truck className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Production Logistics</h3>
            <p className="text-muted-foreground">
              Generate detailed logistics plans
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {[
            'Transportation scheduling',
            'Equipment handling plan',
            'Timeline coordination'
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
              <Truck className="mr-2 h-5 w-5" />
              Create Logistics Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Generate Logistics Plan</DialogTitle>
              <DialogDescription>
                Enter event/tour details to generate a comprehensive logistics plan for smooth operations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="details">Event/Tour Details</Label>
                <Textarea
                  id="details"
                  placeholder="Enter event name, location, date, type, number of personnel, equipment needs, special requirements..."
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
                  onClick={handlePreviewLogistics}
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
                      Preview Plan
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
                    onClick={handleGenerateLogistics}
                    disabled={generateLogisticsMutation.isPending}
                    className="flex-1"
                  >
                    {generateLogisticsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Save Logistics Plan"
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Generated Logistics Card */}
      <Card className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <MapPin className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Generated Logistics</h3>
            <p className="text-muted-foreground">
              View and download your logistics plans
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : logisticsDocuments.length > 0 ? (
            logisticsDocuments.map((doc: LogisticsDocument) => (
              <div key={doc.id} className="p-4 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">Logistics Plan</p>
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
                    <VisuallyHidden>Download Logistics Plan</VisuallyHidden>
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-sm line-clamp-3">{doc.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No logistics plans generated yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
