import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Building2, Loader2, ChevronRight } from "lucide-react";
import { managerToolsService } from "@/lib/services/managertoolsopenrouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface TechnicalRider {
  id: string;
  content: string;
  createdAt: any;
}

export function TechnicalRiderSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: technicalRiders = [], isLoading } = useQuery({
    queryKey: ['technical-riders', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const data = await managerToolsService.getFromFirestore(user.uid, 'technical');
      return data as TechnicalRider[];
    },
    enabled: !!user
  });

  const generateRiderMutation = useMutation({
    mutationFn: async (requirements: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      return managerToolsService.generateContentByType('technical', requirements, user.uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-riders', user?.uid] });
      toast({
        title: "Success",
        description: "Technical rider generated successfully"
      });
      setIsDialogOpen(false);
      setRequirements("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate technical rider",
        variant: "destructive"
      });
    }
  });

  const handleGenerateRider = async () => {
    if (!requirements.trim()) {
      toast({
        title: "Error",
        description: "Please enter your technical requirements",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      await generateRiderMutation.mutateAsync(requirements);
    } catch (error) {
      console.error("Error generating rider:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (rider: TechnicalRider) => {
    try {
      const blob = new Blob([rider.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `technical-rider-${new Date(rider.createdAt.toDate()).toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Technical rider downloaded successfully"
      });
    } catch (error) {
      console.error("Error downloading rider:", error);
      toast({
        title: "Error",
        description: "Failed to download technical rider",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Generate Technical Rider Card */}
      <Card className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Technical Rider</h3>
            <p className="text-muted-foreground">
              Generate professional technical specifications
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {[
            'Stage plot and dimensions',
            'Equipment specifications',
            'Audio requirements'
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
              <Upload className="mr-2 h-5 w-5" />
              Create New Rider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Generate Technical Rider</DialogTitle>
              <DialogDescription>
                Enter your technical requirements and we'll generate a professional technical rider.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">Technical Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="Enter your technical requirements..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleGenerateRider}
                disabled={isGenerating || !requirements.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Technical Rider"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Generated Riders Card */}
      <Card className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <Building2 className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Generated Riders</h3>
            <p className="text-muted-foreground">
              View and download your technical riders
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : technicalRiders.length > 0 ? (
            technicalRiders.map((rider: TechnicalRider) => (
              <div key={rider.id} className="p-4 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">Technical Rider</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(rider.createdAt.toDate()).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(rider)}
                    className="hover:bg-orange-500/10"
                  >
                    <Download className="h-4 w-4" />
                    <VisuallyHidden>Download Technical Rider</VisuallyHidden>
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-sm line-clamp-3">{rider.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No technical riders generated yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}