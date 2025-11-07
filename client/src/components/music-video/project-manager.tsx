import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Save, FolderOpen, Trash2, Loader2, Download, Calendar } from "lucide-react";
import { musicVideoProjectService, type MusicVideoProject } from "../../lib/services/music-video-project-service";
import { useToast } from "../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

interface ProjectManagerProps {
  userId: string;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSaveProject: () => Promise<void>;
  onLoadProject: (project: MusicVideoProject) => void;
  isSaving: boolean;
  currentProjectId?: string;
}

export function ProjectManager({
  userId,
  projectName,
  onProjectNameChange,
  onSaveProject,
  onLoadProject,
  isSaving,
  currentProjectId
}: ProjectManagerProps) {
  const { toast } = useToast();
  const [projects, setProjects] = useState<MusicVideoProject[]>([]);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Load user projects
  const loadProjects = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const userProjects = await musicVideoProjectService.getUserProjects(userId);
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error loading projects",
        description: "Could not load your saved projects",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    setIsDeleting(projectId);
    try {
      await musicVideoProjectService.deleteProject(projectId);
      toast({
        title: "Project deleted",
        description: "Project has been successfully deleted"
      });
      await loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error deleting project",
        description: "Could not delete the project",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Load project
  const handleLoadProject = (project: MusicVideoProject) => {
    onLoadProject(project);
    setIsLoadDialogOpen(false);
    toast({
      title: "Project loaded",
      description: `Loaded "${project.name}" successfully`
    });
  };

  // Open load dialog and refresh projects
  const openLoadDialog = () => {
    setIsLoadDialogOpen(true);
    loadProjects();
  };

  return (
    <>
      <Card className="p-4 space-y-3 border-2 border-primary/20">
        <div className="flex items-center gap-2">
          <Save className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Project Management</h3>
          {currentProjectId && (
            <Badge variant="secondary" className="ml-auto">Saved</Badge>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-name">Project Name</Label>
          <Input
            id="project-name"
            placeholder="My Music Video"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            data-testid="input-project-name"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onSaveProject}
            disabled={isSaving || !projectName.trim()}
            className="flex-1"
            data-testid="button-save-project"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {currentProjectId ? 'Update' : 'Save'} Project
              </>
            )}
          </Button>

          <Button
            onClick={openLoadDialog}
            variant="outline"
            data-testid="button-load-project"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Load
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          💾 Projects are auto-saved every 5 seconds while you work
        </p>
      </Card>

      {/* Load Project Dialog */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Load Project</DialogTitle>
            <DialogDescription>
              Choose a project to load. Your current work will be replaced.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No saved projects found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="p-4 hover:border-primary transition-colors cursor-pointer"
                    onClick={() => handleLoadProject(project)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{project.name}</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline">
                            {project.totalScenes} scenes
                          </Badge>
                          <Badge variant="outline">
                            {project.generatedImages} images
                          </Badge>
                          <Badge variant="outline">
                            {project.generatedVideos} videos
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(project.duration)}s
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Updated: {project.updatedAt.toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadProject(project);
                          }}
                          data-testid={`button-load-${project.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          disabled={isDeleting === project.id}
                          data-testid={`button-delete-${project.id}`}
                        >
                          {isDeleting === project.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLoadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
