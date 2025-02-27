import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit2, 
  Plus, 
  Trash2, 
  Calendar, 
  MessageSquare,
  CheckCircle,
  FilePlus2,
  Play,
  Pause, 
  MoreVertical,
  ArrowDown,
  ArrowUp,
  Save,
  Loader2,
  Users,
  User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { 
  productionProgressService, 
  ProductionProject, 
  ProductionPhase, 
  ProductionTask, 
  ProductionNote as Note,
  ProductionCollaborator as Collaborator
} from "@/lib/services/production-progress-service";
import { useQueryClient } from "@tanstack/react-query";

export function ProductionProgress() {
  const { toast } = useToast();
  
  // State
  const [editMode, setEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProductionProject | null>(null);
  const [phases, setPhases] = useState<ProductionPhase[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [showAddPhaseDialog, setShowAddPhaseDialog] = useState(false);
  const [showPhaseDetails, setShowPhaseDetails] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<ProductionPhase | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteInput, setNoteInput] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "notes" | "files">("tasks");
  const [files, setFiles] = useState<any[]>([]);

  // Form inputs for new phase
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseStatus, setNewPhaseStatus] = useState<ProductionPhase["status"]>("pending");
  const [newPhaseProgress, setNewPhaseProgress] = useState(0);
  const [newPhaseEta, setNewPhaseEta] = useState("");
  const [newPhasePriority, setNewPhasePriority] = useState<"low" | "medium" | "high">("medium");

  // Sample project data for demo
  const demoProject: ProductionProject = {
    id: "demo-project-1",
    name: "EP Album Production",
    description: "5-track EP album for indie artist",
    startDate: new Date("2025-02-15"),
    targetCompletionDate: new Date("2025-05-15"),
    status: "on-track",
    phases: [
      {
        id: "phase-1",
        name: "Pre-production",
        status: "completed",
        progress: 100,
        startDate: new Date("2025-02-15"),
        completionDate: new Date("2025-02-28"),
        tasks: [
          { id: "task-1", phaseId: "phase-1", name: "Songwriting review", completed: true },
          { id: "task-2", phaseId: "phase-1", name: "Arrangement preparation", completed: true },
          { id: "task-3", phaseId: "phase-1", name: "Session planning", completed: true }
        ],
        notes: ["All songs finalized and ready for recording", "Budget approved by artist management"]
      },
      {
        id: "phase-2",
        name: "Recording",
        status: "in-progress",
        progress: 65,
        eta: "7 days",
        startDate: new Date("2025-03-01"),
        tasks: [
          { id: "task-4", phaseId: "phase-2", name: "Rhythm section recording", completed: true },
          { id: "task-5", phaseId: "phase-2", name: "Lead instrument recording", completed: true },
          { id: "task-6", phaseId: "phase-2", name: "Vocal recording", completed: false }
        ],
        notes: ["Drum session completed ahead of schedule", "Need to reschedule backing vocals"]
      },
      {
        id: "phase-3",
        name: "Editing",
        status: "pending",
        progress: 0,
        eta: "14 days",
        dependencies: ["phase-2"]
      },
      {
        id: "phase-4",
        name: "Mixing",
        status: "pending",
        progress: 0,
        eta: "10 days",
        dependencies: ["phase-3"]
      },
      {
        id: "phase-5",
        name: "Mastering",
        status: "pending",
        progress: 0,
        eta: "5 days",
        dependencies: ["phase-4"]
      }
    ],
    currentPhaseId: "phase-2"
  };

  // Sample notes
  const demoNotes: Note[] = [
    {
      id: "note-1",
      phaseId: "phase-1",
      content: "Completed initial songwriting review. All tracks are solid, with minor arrangement changes needed for track 3.",
      createdAt: new Date("2025-02-20"),
      createdBy: "user-1",
      createdByName: "Producer"
    },
    {
      id: "note-2",
      phaseId: "phase-1",
      content: "Finalized all arrangements and prepared charts for session musicians.",
      createdAt: new Date("2025-02-25"),
      createdBy: "user-1",
      createdByName: "Producer"
    },
    {
      id: "note-3",
      phaseId: "phase-2",
      content: "Drums and bass tracked for all songs. Excellent session!",
      createdAt: new Date("2025-03-05"),
      createdBy: "user-1",
      createdByName: "Producer"
    },
    {
      id: "note-4",
      phaseId: "phase-2",
      content: "Vocal session delayed by one day due to artist having a slight cold.",
      createdAt: new Date("2025-03-10"),
      createdBy: "user-2",
      createdByName: "Assistant Engineer"
    }
  ];

  // Demo collaborators
  const demoCollaborators: Collaborator[] = [
    { id: "user-1", name: "Michael Johnson", role: "Producer" },
    { id: "user-2", name: "Sarah Davis", role: "Assistant Engineer" },
    { id: "user-3", name: "Alex Rivera", role: "Mixing Engineer" },
    { id: "user-4", name: "Maria García", role: "Artist" }
  ];

  // Demo tasks collection
  const demoTasks: ProductionTask[] = [
    { id: "task-1", phaseId: "phase-1", name: "Songwriting review", completed: true },
    { id: "task-2", phaseId: "phase-1", name: "Arrangement preparation", completed: true },
    { id: "task-3", phaseId: "phase-1", name: "Session planning", completed: true },
    { id: "task-4", phaseId: "phase-2", name: "Rhythm section recording", completed: true },
    { id: "task-5", phaseId: "phase-2", name: "Lead instrument recording", completed: true },
    { id: "task-6", phaseId: "phase-2", name: "Vocal recording", completed: false, assignedTo: "user-4", dueDate: new Date("2025-03-15") },
    { id: "task-7", phaseId: "phase-2", name: "Background vocals recording", completed: false, assignedTo: "user-4", dueDate: new Date("2025-03-18") },
    { id: "task-8", phaseId: "phase-3", name: "Edit rhythm tracks", completed: false, assignedTo: "user-2" },
    { id: "task-9", phaseId: "phase-3", name: "Edit vocals", completed: false },
    { id: "task-10", phaseId: "phase-3", name: "Comping", completed: false },
    { id: "task-11", phaseId: "phase-4", name: "Initial mix setup", completed: false, assignedTo: "user-3" },
    { id: "task-12", phaseId: "phase-4", name: "Mix revisions", completed: false },
    { id: "task-13", phaseId: "phase-5", name: "Master final mixes", completed: false }
  ];

  // Firebase auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Initialize with demo data for now
  // In a real application, this would fetch from Firebase
  useEffect(() => {
    setIsLoading(true);
    // Simulating data loading delay
    const timer = setTimeout(() => {
      setCurrentProject(demoProject);
      setPhases(demoProject.phases);
      setNotes(demoNotes);
      setTasks(demoTasks);
      setCollaborators(demoCollaborators);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Helper functions
  const getStatusIcon = (status: ProductionPhase["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "delayed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: ProductionPhase["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-orange-500";
      case "delayed":
        return "bg-red-500";
      default:
        return "bg-muted-foreground";
    }
  };

  const getPriorityBadge = (priority?: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="default">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Format relative time (e.g., "2 days ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return "Just now";
    }
  };

  // Phase management
  const addPhase = () => {
    if (!newPhaseName) {
      toast({
        title: "Error",
        description: "Please provide a name for the phase",
        variant: "destructive"
      });
      return;
    }

    const newPhase: ProductionPhase = {
      id: `phase-${Date.now()}`,
      name: newPhaseName,
      status: newPhaseStatus,
      progress: newPhaseProgress,
      eta: newPhaseEta || undefined,
      priority: newPhasePriority,
      tasks: [],
      notes: []
    };

    // In a real app, would save to Firebase first
    setPhases(prev => [...prev, newPhase]);
    
    // Update the current project
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        phases: [...currentProject.phases, newPhase]
      };
      setCurrentProject(updatedProject);
    }

    // Reset form
    setNewPhaseName("");
    setNewPhaseStatus("pending");
    setNewPhaseProgress(0);
    setNewPhaseEta("");
    setNewPhasePriority("medium");
    
    setShowAddPhaseDialog(false);
    
    toast({
      title: "Phase Added",
      description: `${newPhaseName} has been added to the project`
    });
  };

  const updatePhaseProgress = (phaseId: string, newProgress: number) => {
    setPhases(prev => 
      prev.map(phase => 
        phase.id === phaseId 
          ? { ...phase, progress: newProgress } 
          : phase
      )
    );

    // Also update in the current project
    if (currentProject) {
      const updatedPhases = currentProject.phases.map(phase => 
        phase.id === phaseId 
          ? { ...phase, progress: newProgress } 
          : phase
      );
      
      setCurrentProject({
        ...currentProject,
        phases: updatedPhases
      });
    }
  };

  const updatePhaseStatus = (phaseId: string, newStatus: ProductionPhase["status"]) => {
    const now = new Date();
    
    setPhases(prev => 
      prev.map(phase => 
        phase.id === phaseId 
          ? { 
              ...phase, 
              status: newStatus,
              progress: newStatus === "completed" ? 100 : phase.progress,
              completionDate: newStatus === "completed" ? now : phase.completionDate
            } 
          : phase
      )
    );

    // Also update in the current project
    if (currentProject) {
      const updatedPhases = currentProject.phases.map(phase => 
        phase.id === phaseId 
          ? { 
              ...phase, 
              status: newStatus,
              progress: newStatus === "completed" ? 100 : phase.progress,
              completionDate: newStatus === "completed" ? now : phase.completionDate
            } 
          : phase
      );
      
      setCurrentProject({
        ...currentProject,
        phases: updatedPhases
      });
    }

    toast({
      title: "Status Updated",
      description: `Phase status changed to ${newStatus}`
    });
  };

  // Task management
  const addTask = (phaseId: string) => {
    if (!newTaskName) {
      toast({
        title: "Error",
        description: "Please provide a task name",
        variant: "destructive"
      });
      return;
    }

    const newTask: ProductionTask = {
      id: `task-${Date.now()}`,
      phaseId,
      name: newTaskName,
      completed: false
    };

    // Add task to tasks collection
    setTasks(prev => [...prev, newTask]);

    // Reset input
    setNewTaskName("");

    toast({
      title: "Task Added",
      description: `"${newTaskName}" has been added`
    });
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed } 
          : task
      )
    );
  };

  const updateTaskAssignment = (taskId: string, assignedTo: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, assignedTo } 
          : task
      )
    );
  };

  // Note management
  const addNote = (phaseId: string) => {
    if (!noteInput.trim() || !currentUser) {
      return;
    }

    const newNote: Note = {
      id: `note-${Date.now()}`,
      phaseId,
      content: noteInput.trim(),
      createdAt: new Date(),
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || "You"
    };

    setNotes(prev => [...prev, newNote]);
    setNoteInput("");

    toast({
      title: "Note Added",
      description: "Your note has been added to the phase"
    });
  };

  // Project management
  const calculateOverallProgress = () => {
    if (!phases.length) return 0;
    
    const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
    return Math.round(totalProgress / phases.length);
  };

  const getPhaseById = (phaseId: string): ProductionPhase | undefined => {
    return phases.find(phase => phase.id === phaseId);
  };

  const getTasksForPhase = (phaseId: string): ProductionTask[] => {
    return tasks.filter(task => task.phaseId === phaseId);
  };

  const getNotesForPhase = (phaseId: string): Note[] => {
    return notes
      .filter(note => note.phaseId === phaseId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const getCollaboratorById = (id?: string): Collaborator | undefined => {
    if (!id) return undefined;
    return collaborators.find(collaborator => collaborator.id === id);
  };

  const getTaskCompletionPercentage = (phaseId: string): number => {
    const phaseTasks = getTasksForPhase(phaseId);
    if (phaseTasks.length === 0) return 0;
    
    const completedTasks = phaseTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / phaseTasks.length) * 100);
  };

  const updatePhaseProgressBasedOnTasks = (phaseId: string) => {
    const completionPercentage = getTaskCompletionPercentage(phaseId);
    updatePhaseProgress(phaseId, completionPercentage);
  };

  // Phase detail panel
  const openPhaseDetails = (phaseId: string) => {
    setShowPhaseDetails(phaseId);
    const phase = getPhaseById(phaseId);
    if (phase) {
      setCurrentPhase(phase);
      setActiveTab("tasks");
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Production Progress</h3>
          <p className="text-sm text-muted-foreground">
            Track your creative process and production timeline
          </p>
        </div>
        <div className="flex gap-2">
          {currentProject && (
            <div className="flex items-center gap-1 mr-2">
              <Badge variant={
                currentProject.status === "on-track" ? "default" :
                currentProject.status === "at-risk" ? "warning" :
                currentProject.status === "delayed" ? "destructive" :
                "success"
              }>
                {currentProject.status}
              </Badge>
              <span className="text-sm font-medium">{calculateOverallProgress()}% complete</span>
            </div>
          )}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setEditMode(!editMode)}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            {editMode ? "View Mode" : "Edit Mode"}
          </Button>
          <Button 
            size="sm" 
            variant="default"
            onClick={() => setShowAddPhaseDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Phase
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Project info */}
          {currentProject && (
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-semibold">{currentProject.name}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Project Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Edit Project Details</DropdownMenuItem>
                    <DropdownMenuItem>Share Project</DropdownMenuItem>
                    <DropdownMenuItem>Export Timeline</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-500">Archive Project</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Start Date</p>
                  <p className="font-medium">{formatDate(currentProject.startDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Target Completion</p>
                  <p className="font-medium">{formatDate(currentProject.targetCompletionDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Current Phase</p>
                  <p className="font-medium">
                    {currentProject.currentPhaseId 
                      ? getPhaseById(currentProject.currentPhaseId)?.name 
                      : "Not started"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Collaborators</p>
                  <p className="font-medium">{collaborators.length} people</p>
                </div>
              </div>
            </div>
          )}

          {/* Phases */}
          {phases.map((phase, index) => (
            <div 
              key={phase.id} 
              className={`border rounded-lg p-4 ${
                showPhaseDetails === phase.id ? 'border-primary' : 'border-border'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(phase.status)}
                    <span 
                      className={`text-sm font-medium cursor-pointer hover:text-primary transition-colors ${
                        showPhaseDetails === phase.id ? 'text-primary' : ''
                      }`}
                      onClick={() => openPhaseDetails(phase.id)}
                    >
                      {phase.name}
                    </span>
                    {phase.priority && (
                      getPriorityBadge(phase.priority)
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {phase.eta && (
                      <span className="text-xs text-muted-foreground">
                        ETA: {phase.eta}
                      </span>
                    )}
                    <span className="text-xs font-medium">
                      {phase.progress}%
                    </span>
                    
                    {editMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Phase Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updatePhaseStatus(phase.id, "in-progress")}>
                            <Play className="mr-2 h-4 w-4" />
                            Mark as In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updatePhaseStatus(phase.id, "completed")}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updatePhaseStatus(phase.id, "delayed")}>
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Mark as Delayed
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openPhaseDetails(phase.id)}>
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Phase
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Progress 
                    value={phase.progress} 
                    className={`h-1.5 flex-1 ${getStatusColor(phase.status)}`}
                  />
                  {editMode && (
                    <div className="w-32 flex items-center gap-2">
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        className="h-6 w-14 text-xs" 
                        value={phase.progress}
                        onChange={e => updatePhaseProgress(phase.id, parseInt(e.target.value))}
                      />
                      <span className="text-xs">%</span>
                    </div>
                  )}
                </div>

                {/* Phase details */}
                {showPhaseDetails === phase.id && (
                  <div className="mt-4 border-t pt-4 bg-background/50 rounded-md">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                      <TabsList className="grid grid-cols-3 mb-4">
                        <TabsTrigger value="tasks">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Tasks
                        </TabsTrigger>
                        <TabsTrigger value="notes">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Notes
                        </TabsTrigger>
                        <TabsTrigger value="files">
                          <FilePlus2 className="w-4 h-4 mr-2" />
                          Files
                        </TabsTrigger>
                      </TabsList>

                      {/* Tasks Tab */}
                      <TabsContent value="tasks" className="space-y-4">
                        <div className="space-y-2">
                          {getTasksForPhase(phase.id).length === 0 ? (
                            <div className="text-center p-4 bg-muted/20 rounded-lg">
                              <p className="text-sm text-muted-foreground">No tasks yet</p>
                            </div>
                          ) : (
                            getTasksForPhase(phase.id).map(task => (
                              <div key={task.id} className="flex items-center justify-between p-2 border-b border-muted">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => toggleTaskCompletion(task.id)}
                                  >
                                    {task.completed ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                                    )}
                                  </Button>
                                  <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.name}
                                  </span>
                                </div>
                                {editMode ? (
                                  <Select
                                    value={task.assignedTo || ""}
                                    onValueChange={value => updateTaskAssignment(task.id, value)}
                                  >
                                    <SelectTrigger className="h-7 w-40">
                                      <SelectValue placeholder="Assign to..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Unassigned</SelectItem>
                                      {collaborators.map(collab => (
                                        <SelectItem key={collab.id} value={collab.id}>
                                          {collab.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  task.assignedTo && (
                                    <Badge variant="outline">
                                      {getCollaboratorById(task.assignedTo)?.name || "Unknown"}
                                    </Badge>
                                  )
                                )}
                              </div>
                            ))
                          )}
                        </div>
                        
                        {editMode && (
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="New task name"
                              value={newTaskName}
                              onChange={e => setNewTaskName(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              onClick={() => addTask(phase.id)}
                            >
                              Add Task
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => updatePhaseProgressBasedOnTasks(phase.id)}
                              title="Update progress based on completed tasks"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TabsContent>

                      {/* Notes Tab */}
                      <TabsContent value="notes" className="space-y-4">
                        <div className="max-h-48 overflow-y-auto space-y-3">
                          {getNotesForPhase(phase.id).length === 0 ? (
                            <div className="text-center p-4 bg-muted/20 rounded-lg">
                              <p className="text-sm text-muted-foreground">No notes yet</p>
                            </div>
                          ) : (
                            getNotesForPhase(phase.id).map(note => (
                              <div key={note.id} className="p-3 bg-muted/20 rounded-lg">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-medium">{note.createdByName}</span>
                                  <span className="text-xs text-muted-foreground">{formatRelativeTime(note.createdAt)}</span>
                                </div>
                                <p className="text-sm">{note.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Textarea
                            placeholder="Add a note..."
                            value={noteInput}
                            onChange={e => setNoteInput(e.target.value)}
                            className="flex-1 min-h-[60px]"
                          />
                          <Button 
                            onClick={() => addNote(phase.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </TabsContent>

                      {/* Files Tab */}
                      <TabsContent value="files">
                        <div className="text-center p-8 bg-muted/20 rounded-lg">
                          <FilePlus2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">No files uploaded yet</p>
                          <Button>
                            Upload Files
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Phase Dialog */}
      <Dialog open={showAddPhaseDialog} onOpenChange={setShowAddPhaseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Production Phase</DialogTitle>
            <DialogDescription>
              Define a new phase for your production process.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phase-name">Phase Name</Label>
              <Input
                id="phase-name"
                placeholder="e.g., Recording, Mixing, Mastering"
                value={newPhaseName}
                onChange={e => setNewPhaseName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phase-status">Status</Label>
                <Select 
                  value={newPhaseStatus} 
                  onValueChange={value => setNewPhaseStatus(value as ProductionPhase["status"])}
                >
                  <SelectTrigger id="phase-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phase-priority">Priority</Label>
                <Select 
                  value={newPhasePriority} 
                  onValueChange={value => setNewPhasePriority(value as "low" | "medium" | "high")}
                >
                  <SelectTrigger id="phase-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phase-progress">Initial Progress</Label>
              <div className="flex items-center gap-4">
                <Slider 
                  id="phase-progress"
                  value={[newPhaseProgress]} 
                  max={100} 
                  step={5}
                  onValueChange={value => setNewPhaseProgress(value[0])}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-9">{newPhaseProgress}%</span>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phase-eta">Estimated Time (optional)</Label>
              <Input
                id="phase-eta"
                placeholder="e.g., 5 days, 2 weeks"
                value={newPhaseEta}
                onChange={e => setNewPhaseEta(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPhaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addPhase}>
              Add Phase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}