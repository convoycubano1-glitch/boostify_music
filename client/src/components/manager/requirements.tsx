import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, MapPin, Download, Loader2, ChevronRight, Eye, Upload } from "lucide-react";
import { managerToolsService } from "../../lib/services/managertoolsopenrouter";
import { useToast } from "../../hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "../ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VisuallyHidden } from "../ui/visually-hidden";

interface RequirementDocument {
  id: string;
  content: string;
  createdAt: any;
}

export function RequirementsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [details, setDetails] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { data: requirementDocuments = [], isLoading } = useQuery({
    queryKey: ['requirements', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const data = await managerToolsService.getFromFirestore(user.uid, 'requirements');
      return data as RequirementDocument[];
    },
    enabled: !!user
  });

  const generatePreviewMutation = useMutation({
    mutationFn: async (details: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      const prompt = `Create a comprehensive requirements list for this event/artist: ${details}. Include all necessary technical, logistical, and personnel requirements.`;
      const content = await managerToolsService.generateWithAI(prompt, 'requirements');
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

  const generateRequirementsMutation = useMutation({
    mutationFn: async (details: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      return managerToolsService.generateContentByType('requirements', details, user.uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements', user?.uid] });
      toast({
        title: "Success",
        description: "Requirements document generated successfully"
      });
      setIsDialogOpen(false);
      setDetails("");
      setPreviewContent(null);
      setIsPreviewMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate requirements document",
        variant: "destructive"
      });
    }
  });

  const handlePreviewRequirements = async () => {
    if (!details.trim()) {
      toast({
        title: "Error",
        description: "Please enter the requirements details",
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

  const handleGenerateRequirements = async () => {
    try {
      setIsGenerating(true);
      await generateRequirementsMutation.mutateAsync(details);
    } catch (error) {
      console.error("Error generating requirements:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (doc: RequirementDocument) => {
    try {
      const blob = new Blob([doc.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `requirements-${new Date(doc.createdAt.toDate()).toISOString().split('T')[0]}.txt`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Requirements document downloaded successfully"
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download requirements document",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Template 1: Touring Artist */}
        <Card className="p-6 hover:shadow-lg transition-all">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-4 bg-orange-500/10 rounded-full mb-4">
              <Coffee className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold">Touring Artist</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Generate full tour requirements including catering, accommodations, and transportation needs.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setDetails("Create tour requirements for a 5-piece rock band on a 15-city national tour. They need vegetarian and vegan food options, 5 hotel rooms, and local ground transportation at each venue. Include green room requirements and specific alcohol requests.");
              setIsDialogOpen(true);
            }}
          >
            Use Template
          </Button>
        </Card>

        {/* Template 2: Festival Performer */}
        <Card className="p-6 hover:shadow-lg transition-all">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-4 bg-orange-500/10 rounded-full mb-4">
              <MapPin className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold">Festival Performer</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Create festival-specific requirements for artists performing at large multi-day events.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setDetails("Generate requirements for an electronic music DJ performing at a major 3-day festival. Include backline equipment, staging needs, hospitality requirements for a 3-person team, and transportation from artist hotel to festival grounds.");
              setIsDialogOpen(true);
            }}
          >
            Use Template
          </Button>
        </Card>

        {/* Template 3: VIP Artist */}
        <Card className="p-6 hover:shadow-lg transition-all">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-4 bg-orange-500/10 rounded-full mb-4">
              <ChevronRight className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold">VIP Artist</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Comprehensive requirements document for high-profile artists with specific needs.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setDetails("Create a comprehensive VIP requirements document for a Grammy-winning artist with a 12-person entourage. Include luxury accommodations (5-star hotel), security personnel, private transportation, specialized catering with specific dietary restrictions, and green room requirements including furniture, lighting, and temperature specifications.");
              setIsDialogOpen(true);
            }}
          >
            Use Template
          </Button>
        </Card>
      </div>

      {/* Custom Requirements Document Creator */}
      <Card className="p-6 hover:shadow-lg transition-all mt-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-orange-500/10 rounded-xl">
            <Coffee className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Custom Requirements Document</h3>
            <p className="text-muted-foreground">
              Generate detailed artist requirements tailored to your specific needs
            </p>
          </div>
        </div>

        <Button 
          className="w-full bg-orange-500 hover:bg-orange-600"
          onClick={() => setIsDialogOpen(true)}
        >
          <Upload className="mr-2 h-5 w-5" />
          Create Custom Requirements
        </Button>
      </Card>

      {/* My Requirements Documents */}
      <Card className="p-6 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-500/10 rounded-xl">
              <MapPin className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">My Requirements Documents</h3>
              <p className="text-muted-foreground">
                View and download your saved requirements documents
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : requirementDocuments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {requirementDocuments.map((doc: RequirementDocument) => (
                <div key={doc.id} className="p-4 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 transition-colors border border-transparent hover:border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">Requirements Document</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.createdAt.toDate()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 mb-4">
                    <p className="text-sm line-clamp-3">{doc.content}</p>
                  </div>
                  <div className="flex">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/20">
              <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
              <p>No requirements documents generated yet</p>
              <Button 
                variant="link" 
                onClick={() => setIsDialogOpen(true)}
                className="mt-2"
              >
                Create your first requirements document
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Requirements Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Generate Requirements Document</DialogTitle>
            <DialogDescription>
              Enter the artist/event details to generate a comprehensive requirements document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="details">Artist/Event Details</Label>
              <Textarea
                id="details"
                placeholder="Enter artist name, event type, preferences, and special needs..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
            {isPreviewMode && previewContent && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-4 rounded-lg bg-muted/50 whitespace-pre-line max-h-[300px] overflow-y-auto">
                  {previewContent}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            {!isPreviewMode ? (
              <Button
                onClick={handlePreviewRequirements}
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
                    Preview
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
                  onClick={handleGenerateRequirements}
                  disabled={generateRequirementsMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {generateRequirementsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Final Version"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}