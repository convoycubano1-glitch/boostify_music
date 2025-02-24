import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Building2, BadgeCheck, Settings, Calendar, ChevronRight } from "lucide-react";
import { managerToolsService } from "@/lib/services/managertoolsopenrouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function TechnicalRiderSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [requirements, setRequirements] = useState("");

  // Query para obtener los technical riders existentes
  const { data: technicalRiders = [], isLoading } = useQuery({
    queryKey: ['technical-riders', user?.uid],
    queryFn: () => managerToolsService.getFromFirestore(user?.uid || '', 'technical'),
    enabled: !!user
  });

  // Mutation para generar nuevo technical rider
  const generateRiderMutation = useMutation({
    mutationFn: (requirements: string) => 
      managerToolsService.technical.generateTechnicalRider(requirements, user?.uid || ''),
    onSuccess: () => {
      queryClient.invalidateQueries(['technical-riders']);
      toast({
        title: "Success",
        description: "Technical rider generated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate technical rider",
        variant: "destructive"
      });
    }
  });

  const handleGenerateRider = async () => {
    if (!requirements) {
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
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid gap-6 md:gap-8 md:grid-cols-2">
      <Card className="p-6 md:p-8 hover:bg-orange-500/5 transition-colors">
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
            <FileText className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-semibold">Generate Technical Rider</h3>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Create and manage technical specifications
            </p>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <ChevronRight className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <span className="text-base md:text-lg">Stage plot and dimensions</span>
          </div>
          <div className="flex items-center gap-3">
            <ChevronRight className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <span className="text-base md:text-lg">Equipment specifications</span>
          </div>
          <div className="flex items-center gap-3">
            <ChevronRight className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <span className="text-base md:text-lg">Audio requirements</span>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 h-auto py-3">
              <Upload className="mr-2 h-5 w-5 flex-shrink-0" />
              Create New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Technical Rider</DialogTitle>
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
              <Button 
                onClick={handleGenerateRider}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? "Generating..." : "Generate Technical Rider"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button size="lg" variant="outline" className="h-auto py-3 whitespace-nowrap mt-4">
            <Download className="mr-2 h-5 w-5 flex-shrink-0" />
            Download
        </Button>
      </Card>

      <Card className="p-6 md:p-8 hover:bg-orange-500/5 transition-colors">
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
            <Building2 className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-semibold">Generated Riders</h3>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              View and download your technical riders
            </p>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
          {isLoading ? (
            <div>Loading...</div>
          ) : technicalRiders.length > 0 ? (
            technicalRiders.map((rider: any) => (
              <div key={rider.id} className="p-4 rounded-lg bg-orange-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Technical Rider</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(rider.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {}}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-sm line-clamp-2">{rider.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground">
              No technical riders generated yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}