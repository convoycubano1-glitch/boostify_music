import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { FileText, Upload, Download, Building2, Loader2, Eye, Trash2, Edit, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { useAuth } from "../../hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { MdMusicNote, MdOutlineAudiotrack, MdLightbulb } from "react-icons/md";
import { FiDownload, FiFilePlus } from "react-icons/fi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";

interface ManagerDocument {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  images?: {
    url: string;
    prompt: string;
    type: string;
  }[];
  createdAt: { _seconds: number };
  updatedAt: { _seconds: number };
}

export function TechnicalRiderSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [requirements, setRequirements] = useState("");
  const [documentType, setDocumentType] = useState<'technical-rider' | 'lighting-setup' | 'stage-plot'>('technical-rider');
  const [includeImages, setIncludeImages] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ManagerDocument | null>(null);
  const [activeTab, setActiveTab] = useState("generate");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const { data: documents = [], isLoading } = useQuery<ManagerDocument[]>({
    queryKey: ['/api/manager/documents', user?.uid],
    enabled: !!user?.uid
  });

  const generateDocumentMutation = useMutation({
    mutationFn: async (data: { userId: string; type: string; requirements: string; includeImages: boolean }) => {
      const response = await apiRequest('/api/manager/documents/generate', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response.document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manager/documents', user?.uid] });
      toast({
        title: "Success",
        description: "Document generated successfully"
      });
      setIsDialogOpen(false);
      setRequirements("");
      setIncludeImages(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate document",
        variant: "destructive"
      });
    }
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string }) => {
      const response = await apiRequest(`/api/manager/documents/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: data.title, content: data.content })
      });
      return response.document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manager/documents', user?.uid] });
      toast({
        title: "Success",
        description: "Document updated successfully"
      });
      setIsEditMode(false);
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update document",
        variant: "destructive"
      });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/manager/documents/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manager/documents', user?.uid] });
      toast({
        title: "Success",
        description: "Document deleted successfully"
      });
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive"
      });
    }
  });

  const regenerateImagesMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/manager/documents/${id}/regenerate-images`, {
        method: 'POST'
      });
      return response.document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manager/documents', user?.uid] });
      toast({
        title: "Success",
        description: "Images regenerated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate images",
        variant: "destructive"
      });
    }
  });

  const handleGenerateDocument = async () => {
    if (!requirements.trim()) {
      toast({
        title: "Error",
        description: "Please enter your requirements",
        variant: "destructive"
      });
      return;
    }

    if (!user?.uid) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    await generateDocumentMutation.mutateAsync({
      userId: user.uid,
      type: documentType,
      requirements,
      includeImages
    });
  };

  const handleUpdateDocument = async () => {
    if (!selectedDocument) return;

    await updateDocumentMutation.mutateAsync({
      id: selectedDocument.id,
      title: editTitle,
      content: editContent
    });
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocumentMutation.mutateAsync(id);
    }
  };

  const handleDownload = (document: ManagerDocument) => {
    const blob = new Blob([document.content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${document.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Document downloaded successfully"
    });
  };

  const handleViewDocument = (document: ManagerDocument) => {
    setSelectedDocument(document);
    setEditTitle(document.title);
    setEditContent(document.content);
    setIsEditMode(false);
  };

  const handleRegenerateImages = (id: string) => {
    regenerateImagesMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="generate" className="flex items-center gap-2" data-testid="tab-create-rider">
            <FiFilePlus className="h-4 w-4" />
            Create Document
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2" data-testid="tab-my-riders">
            <Building2 className="h-4 w-4" />
            My Documents
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
                  Professional technical rider with complete audio requirements, stage plot, and equipment specifications.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                data-testid="button-sound-template"
                onClick={() => {
                  setDocumentType('technical-rider');
                  setRequirements("Create a comprehensive technical rider for a 5-piece band performing at medium-sized venues (500-1000 capacity). Include: stage plot with exact positions, complete audio requirements (PA system, monitors, microphones with specific models), backline equipment, power requirements, and personnel needs.");
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
                  Detailed lighting plan with fixture specifications, positioning diagrams, and visual concepts with AI-generated images.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                data-testid="button-lighting-template"
                onClick={() => {
                  setDocumentType('lighting-setup');
                  setRequirements("Design a professional concert lighting setup for a modern pop/rock performance. Include LED moving heads, PAR cans, spotlights, atmospheric effects (haze, strobes), color palettes for different song sections, DMX control setup, and power distribution. Generate visual diagrams showing the lighting rig layout.");
                  setIncludeImages(true);
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
                <h3 className="text-xl font-semibold">Stage Plot</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Complete stage layout with 3D visualization, equipment positions, cable runs, and technical specifications.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                data-testid="button-stage-plot-template"
                onClick={() => {
                  setDocumentType('stage-plot');
                  setRequirements("Create a detailed stage plot for a 5-piece band (drums, bass, 2 guitars, vocals). Include exact positions for all instruments, monitor wedges, microphone placements, audio snake location, power distribution, and cable routing. Generate both top-down diagram and 3D visualization.");
                  setIncludeImages(true);
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
                <h3 className="text-2xl font-semibold">Custom Document</h3>
                <p className="text-muted-foreground">
                  Generate a professional document with AI-powered text and optional visual diagrams
                </p>
              </div>
            </div>

            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              data-testid="button-create-custom"
              onClick={() => setIsDialogOpen(true)}
            >
              <Upload className="mr-2 h-5 w-5" />
              Create Custom Document
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
                  <h3 className="text-2xl font-semibold">My Documents</h3>
                  <p className="text-muted-foreground">
                    View, edit, download or delete your professional documents
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : documents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc: ManagerDocument) => (
                  <div 
                    key={doc.id} 
                    className="p-4 rounded-xl bg-orange-500/5 hover:bg-orange-500/10 transition-colors border border-transparent hover:border-orange-200"
                    data-testid={`document-card-${doc.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium" data-testid={`text-document-title-${doc.id}`}>{doc.title}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-document-date-${doc.id}`}>
                          {new Date(doc.createdAt._seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      {doc.images && doc.images.length > 0 && (
                        <ImageIcon className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <div className="mt-2 mb-4">
                      <p className="text-sm line-clamp-3">{doc.content}</p>
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                        className="flex-1"
                        data-testid={`button-view-${doc.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="flex-1"
                        data-testid={`button-download-${doc.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="flex-1"
                        data-testid={`button-delete-${doc.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/20">
                <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                <p>No documents generated yet</p>
                <Button 
                  variant="link" 
                  onClick={() => setActiveTab("generate")}
                  className="mt-2"
                  data-testid="button-create-first"
                >
                  Create your first document
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* View/Edit Document Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Document' : selectedDocument?.title}</DialogTitle>
            <DialogDescription>
              {selectedDocument && new Date(selectedDocument.createdAt._seconds * 1000).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          {isEditMode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  data-testid="input-edit-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  data-testid="textarea-edit-content"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="whitespace-pre-line p-4 rounded bg-muted/30 font-mono text-sm max-h-[400px] overflow-y-auto">
                {selectedDocument?.content}
              </div>
              
              {selectedDocument?.images && selectedDocument.images.length > 0 && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <Label>Generated Images</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedDocument && handleRegenerateImages(selectedDocument.id)}
                      disabled={regenerateImagesMutation.isPending}
                      data-testid="button-regenerate-images"
                    >
                      {regenerateImagesMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate Images
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedDocument.images.map((image, index) => (
                      <div key={index} className="space-y-2">
                        <img 
                          src={image.url} 
                          alt={image.type}
                          className="w-full rounded-lg border"
                        />
                        <p className="text-sm text-muted-foreground">{image.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          <DialogFooter className="flex gap-2 sm:space-x-0">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateDocument}
                  disabled={updateDocumentMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="button-save-edit"
                >
                  {updateDocumentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(true)}
                  data-testid="button-edit-document"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => selectedDocument && handleDownload(selectedDocument)}
                  data-testid="button-download-document"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Document Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate Professional Document</DialogTitle>
            <DialogDescription>
              Enter your requirements to generate a professional document powered by Gemini AI
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <select
                id="document-type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md"
                data-testid="select-document-type"
              >
                <option value="technical-rider">Technical Rider</option>
                <option value="lighting-setup">Lighting Setup</option>
                <option value="stage-plot">Stage Plot</option>
                <option value="hospitality">Hospitality Rider</option>
                <option value="contract">Performance Contract</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                placeholder="Describe your specific requirements in detail..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="min-h-[200px]"
                data-testid="textarea-requirements"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="include-images"
                checked={includeImages}
                onCheckedChange={setIncludeImages}
                data-testid="switch-include-images"
              />
              <Label htmlFor="include-images" className="cursor-pointer">
                Include AI-generated diagrams and images (Nano Banana)
              </Label>
            </div>
            
            {includeImages && (
              <p className="text-sm text-muted-foreground">
                ⚡ Professional images will be generated showing lighting setups, stage layouts, or equipment diagrams based on your document type.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleGenerateDocument}
              disabled={generateDocumentMutation.isPending || !requirements.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600"
              data-testid="button-generate-document"
            >
              {generateDocumentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with Gemini{includeImages ? ' + Nano Banana' : ''}...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
