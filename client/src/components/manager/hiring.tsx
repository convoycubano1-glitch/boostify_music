import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Download, Loader2, ChevronRight, Eye, FileText, UserPlus } from "lucide-react";
import { managerToolsService } from "@/lib/services/managertoolsopenrouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { downloadTextFile } from "@/lib/download-helper";

interface HiringDocument {
  id: string;
  content: string;
  createdAt: any;
}

export function HiringSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [positions, setPositions] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { data: hiringDocuments = [], isLoading } = useQuery({
    queryKey: ['hiring', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const data = await managerToolsService.getFromFirestore(user.uid, 'hiring');
      return data as HiringDocument[];
    },
    enabled: !!user
  });

  const generatePreviewMutation = useMutation({
    mutationFn: async (positions: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      const prompt = `Create detailed job descriptions and requirements for these positions: ${positions}. Include responsibilities, qualifications, experience needed, and any specific music industry skills required. Format each position with clear sections.`;
      const content = await managerToolsService.generateWithAI(prompt, 'hiring');
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

  const generateHiringMutation = useMutation({
    mutationFn: async (positions: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      return managerToolsService.generateContentByType('hiring', positions, user.uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hiring', user?.uid] });
      toast({
        title: "Success",
        description: "Job descriptions generated successfully"
      });
      setIsDialogOpen(false);
      setPositions("");
      setPreviewContent(null);
      setIsPreviewMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate job descriptions",
        variant: "destructive"
      });
    }
  });

  const handlePreviewPositions = async () => {
    if (!positions.trim()) {
      toast({
        title: "Error",
        description: "Please enter the position details",
        variant: "destructive"
      });
      return;
    }

    try {
      await generatePreviewMutation.mutateAsync(positions);
    } catch (error) {
      console.error("Error generating preview:", error);
    }
  };

  const handleGeneratePositions = async () => {
    try {
      setIsGenerating(true);
      await generateHiringMutation.mutateAsync(positions);
    } catch (error) {
      console.error("Error generating job descriptions:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (doc: HiringDocument) => {
    try {
      const filename = `job-descriptions-${new Date(doc.createdAt.toDate()).toISOString().split('T')[0]}.txt`;
      await downloadTextFile(doc.content, filename);
      
      toast({
        title: "Success",
        description: "Job descriptions downloaded successfully"
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download job descriptions",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Job Descriptions Generator Card */}
      <Card className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <Users className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Staff Management</h3>
            <p className="text-muted-foreground">
              Generate job descriptions and requirements
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {[
            'Technical positions',
            'Production roles',
            'Event staff requirements'
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
              <UserPlus className="mr-2 h-5 w-5" />
              Create Job Descriptions
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Generate Job Descriptions</DialogTitle>
              <DialogDescription>
                Enter the positions you need to fill and their requirements to generate comprehensive job descriptions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="positions">Position Details</Label>
                <Textarea
                  id="positions"
                  placeholder="Enter positions (e.g., Sound Engineer, Stage Manager, etc.), experience level, and any specific requirements..."
                  value={positions}
                  onChange={(e) => setPositions(e.target.value)}
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
                  onClick={handlePreviewPositions}
                  disabled={generatePreviewMutation.isPending || !positions.trim()}
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
                      Preview Descriptions
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
                    onClick={handleGeneratePositions}
                    disabled={generateHiringMutation.isPending}
                    className="flex-1"
                  >
                    {generateHiringMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Save Job Descriptions"
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Generated Job Descriptions Card */}
      <Card className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Generated Descriptions</h3>
            <p className="text-muted-foreground">
              View and download your job descriptions
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : hiringDocuments.length > 0 ? (
            hiringDocuments.map((doc: HiringDocument) => (
              <div key={doc.id} className="p-4 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">Job Descriptions</p>
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
                    <VisuallyHidden>Download Job Descriptions</VisuallyHidden>
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-sm line-clamp-3">{doc.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No job descriptions generated yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}