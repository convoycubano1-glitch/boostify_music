import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Building2, Loader2, ChevronRight, Eye } from "lucide-react";
import { managerToolsService } from "@/lib/services/managertoolsopenrouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { MdMusicNote, MdOutlineAudiotrack, MdLightbulb } from "react-icons/md";
import { FiDownload, FiFilePlus } from "react-icons/fi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedRider, setSelectedRider] = useState<TechnicalRider | null>(null);
  const [activeTab, setActiveTab] = useState("generate");
  const pdfRef = useRef<HTMLDivElement>(null);
  
  const { toPDF, targetRef } = useReactToPdf({
    filename: 'technical-rider.pdf',
    quality: 0.95,
    onComplete: () => {
      toast({
        title: "Success",
        description: "PDF exported successfully",
      });
    },
  });

  const { data: technicalRiders = [], isLoading } = useQuery({
    queryKey: ['technical-riders', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const data = await managerToolsService.getFromFirestore(user.uid, 'technical');
      return data as TechnicalRider[];
    },
    enabled: !!user
  });

  const generatePreviewMutation = useMutation({
    mutationFn: async (requirements: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      const content = await managerToolsService.previewTechnicalRider(requirements);
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
      setPreviewContent(null);
      setIsPreviewMode(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate technical rider",
        variant: "destructive"
      });
    }
  });

  const handlePreviewRider = async () => {
    if (!requirements.trim()) {
      toast({
        title: "Error",
        description: "Please enter your technical requirements",
        variant: "destructive"
      });
      return;
    }

    try {
      await generatePreviewMutation.mutateAsync(requirements);
    } catch (error) {
      console.error("Error generating preview:", error);
    }
  };

  const handleGenerateRider = async () => {
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
  
  const handleViewRider = (rider: TechnicalRider) => {
    setSelectedRider(rider);
  };
  
  const handleExportPDF = () => {
    if (targetRef.current) {
      toPDF();
    } else {
      toast({
        title: "Error",
        description: "Could not create PDF, please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <FiFilePlus className="h-4 w-4" />
            Create Rider
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            My Riders
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 hover:shadow-lg transition-all">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="p-4 bg-orange-500/10 rounded-full mb-4">
                  <MdMusicNote className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold">Sound Equipment</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Specify your sound requirements, including PA system, monitors, microphones, and mixing console needs.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setRequirements("I need a professional sound system for a live band performance with 5 members: drums, bass, guitar, keys, and vocals. Please include specific microphone and monitor requirements.");
                  setIsDialogOpen(true);
                }}
              >
                Use Template
              </Button>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-all">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="p-4 bg-orange-500/10 rounded-full mb-4">
                  <MdLightbulb className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold">Lighting Setup</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Define your lighting requirements, including types of lights, positioning, colors, and special effects needed.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setRequirements("I need a professional lighting setup for a concert venue with LED stage lights, spotlights, and atmospheric effects. The performance will have specific color themes for each song section.");
                  setIsDialogOpen(true);
                }}
              >
                Use Template
              </Button>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-all">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="p-4 bg-orange-500/10 rounded-full mb-4">
                  <MdOutlineAudiotrack className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold">Full Technical Rider</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Create a comprehensive technical rider with stage layout, equipment list, power requirements, and personnel needs.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setRequirements("Create a comprehensive technical rider for a 5-piece band performing at medium-sized venues. Include stage plot, audio requirements, lighting needs, backline equipment, and hospitality requirements.");
                  setIsDialogOpen(true);
                }}
              >
                Use Template
              </Button>
            </Card>
          </div>
          
          <Card className="p-6 hover:shadow-lg transition-all mt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-orange-500/10 rounded-xl">
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Custom Technical Rider</h3>
                <p className="text-muted-foreground">
                  Generate a technical rider tailored to your specific requirements
                </p>
              </div>
            </div>

            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => setIsDialogOpen(true)}
            >
              <Upload className="mr-2 h-5 w-5" />
              Create Custom Rider
            </Button>
          </Card>
        </TabsContent>
        
        <TabsContent value="library">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-orange-500/10 rounded-xl">
                  <Building2 className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">My Technical Riders</h3>
                  <p className="text-muted-foreground">
                    View, download or export your technical riders
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : technicalRiders.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {technicalRiders.map((rider: TechnicalRider) => (
                  <div 
                    key={rider.id} 
                    className="p-4 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 transition-colors border border-transparent hover:border-orange-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">Technical Rider</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(rider.createdAt.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 mb-4">
                      <p className="text-sm line-clamp-3">{rider.content}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(rider)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Text</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRider(rider)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          handleViewRider(rider);
                          setTimeout(() => handleExportPDF(), 100);
                        }}
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        <FilePdf className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">PDF</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/20">
                <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                <p>No technical riders generated yet</p>
                <Button 
                  variant="link" 
                  onClick={() => setActiveTab("generate")}
                  className="mt-2"
                >
                  Create your first rider
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* PDF Export Template (Hidden) */}
      <div className="hidden">
        <div ref={targetRef} className="p-8 bg-white max-w-4xl mx-auto">
          {selectedRider && (
            <>
              <div className="mb-8 text-center border-b pb-4">
                <h1 className="text-3xl font-bold text-orange-600">Technical Rider</h1>
                <p className="text-gray-500 mt-2">Created: {new Date(selectedRider.createdAt.toDate()).toLocaleDateString()}</p>
              </div>
              <div className="whitespace-pre-line">{selectedRider.content}</div>
              <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                <p>Generated with Boostify Artist Tools</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* View Rider Dialog */}
      <Dialog open={!!selectedRider} onOpenChange={(open) => !open && setSelectedRider(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Technical Rider</DialogTitle>
            <DialogDescription>
              {selectedRider && new Date(selectedRider.createdAt.toDate()).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="whitespace-pre-line p-4 rounded bg-muted/30">
            {selectedRider?.content}
          </div>
          
          <DialogFooter className="flex gap-2 sm:space-x-0">
            <Button
              variant="outline"
              onClick={() => selectedRider && handleDownload(selectedRider)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download as Text
            </Button>
            <Button
              onClick={handleExportPDF}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <FilePdf className="h-4 w-4 mr-2" />
              Export as PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Rider Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Generate Technical Rider</DialogTitle>
            <DialogDescription>
              Enter your technical requirements and preview before generating the final technical rider.
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
                onClick={handlePreviewRider}
                disabled={generatePreviewMutation.isPending || !requirements.trim()}
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
                  Edit Requirements
                </Button>
                <Button
                  onClick={handleGenerateRider}
                  disabled={generateRiderMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {generateRiderMutation.isPending ? (
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