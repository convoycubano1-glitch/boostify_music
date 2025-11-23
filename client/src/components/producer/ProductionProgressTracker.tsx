import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  CheckCircle2, Clock, AlertCircle, Plus, Trash2, Calendar, Zap,
  TrendingUp, Target, Milestone, Edit2, Save, X, Play, Pause,
  ArrowRight, MoreVertical, Users, FileText, Music, Video
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "../ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useToast } from "../../hooks/use-toast";

interface ProductionPhase {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: "pending" | "in-progress" | "completed" | "on-hold";
  priority: "low" | "medium" | "high";
  startDate: Date;
  dueDate: Date;
  assignee?: string;
  tasks: ProductionTask[];
  milestones: Milestone[];
}

interface ProductionTask {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: Date;
  assignee?: string;
}

interface Milestone {
  id: string;
  name: string;
  date: Date;
  completed: boolean;
  description?: string;
}

export function ProductionProgressTracker() {
  const { toast } = useToast();
  const [phases, setPhases] = useState<ProductionPhase[]>([
    {
      id: "1",
      name: "Pre-Production",
      description: "Planning, scripting, and concept development",
      progress: 100,
      status: "completed",
      priority: "high",
      startDate: new Date(2025, 10, 1),
      dueDate: new Date(2025, 10, 15),
      tasks: [
        { id: "t1", name: "Script writing", completed: true },
        { id: "t2", name: "Storyboard creation", completed: true },
        { id: "t3", name: "Location scouting", completed: true }
      ],
      milestones: [
        { id: "m1", name: "Script approved", date: new Date(2025, 10, 5), completed: true }
      ]
    },
    {
      id: "2",
      name: "Production",
      description: "Filming and recording sessions",
      progress: 65,
      status: "in-progress",
      priority: "high",
      startDate: new Date(2025, 10, 16),
      dueDate: new Date(2025, 11, 15),
      assignee: "Production Team",
      tasks: [
        { id: "t4", name: "Camera setup", completed: true },
        { id: "t5", name: "Main recording session", completed: true },
        { id: "t6", name: "Audio recording", completed: false },
        { id: "t7", name: "B-roll collection", completed: false }
      ],
      milestones: [
        { id: "m2", name: "Filming started", date: new Date(2025, 10, 16), completed: true },
        { id: "m3", name: "Main shots completed", date: new Date(2025, 11, 1), completed: true }
      ]
    },
    {
      id: "3",
      name: "Post-Production",
      description: "Editing, color grading, and effects",
      progress: 30,
      status: "in-progress",
      priority: "high",
      startDate: new Date(2025, 11, 16),
      dueDate: new Date(2025, 11, 30),
      tasks: [
        { id: "t8", name: "Rough cut", completed: true },
        { id: "t9", name: "Color grading", completed: false },
        { id: "t10", name: "VFX integration", completed: false },
        { id: "t11", name: "Sound mixing", completed: false }
      ],
      milestones: [
        { id: "m4", name: "First cut ready", date: new Date(2025, 11, 16), completed: true }
      ]
    },
    {
      id: "4",
      name: "Distribution",
      description: "Platform uploads and marketing",
      progress: 0,
      status: "pending",
      priority: "medium",
      startDate: new Date(2025, 11, 31),
      dueDate: new Date(2025, 11, 31),
      tasks: [
        { id: "t12", name: "YouTube upload", completed: false },
        { id: "t13", name: "Social media promotion", completed: false },
        { id: "t14", name: "Analytics setup", completed: false }
      ],
      milestones: []
    }
  ]);

  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDescription, setNewPhaseDescription] = useState("");

  const overallProgress = Math.round(
    phases.reduce((sum, p) => sum + p.progress, 0) / phases.length
  );

  const completedPhases = phases.filter(p => p.status === "completed").length;
  const inProgressPhases = phases.filter(p => p.status === "in-progress").length;

  const handleAddPhase = () => {
    if (!newPhaseName.trim()) {
      toast({
        title: "❌ Error",
        description: "Phase name is required",
        variant: "destructive"
      });
      return;
    }

    const newPhase: ProductionPhase = {
      id: Date.now().toString(),
      name: newPhaseName,
      description: newPhaseDescription,
      progress: 0,
      status: "pending",
      priority: "medium",
      startDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      tasks: [],
      milestones: []
    };

    setPhases([...phases, newPhase]);
    setNewPhaseName("");
    setNewPhaseDescription("");

    toast({
      title: "✅ Phase Added",
      description: `"${newPhaseName}" added to your production timeline`
    });
  };

  const handleUpdateProgress = (phaseId: string, newProgress: number) => {
    setPhases(phases.map(p =>
      p.id === phaseId
        ? {
            ...p,
            progress: newProgress,
            status: newProgress === 100 ? "completed" : p.status === "pending" ? "in-progress" : p.status
          }
        : p
    ));
  };

  const handleToggleTask = (phaseId: string, taskId: string) => {
    setPhases(phases.map(p =>
      p.id === phaseId
        ? {
            ...p,
            tasks: p.tasks.map(t =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            )
          }
        : p
    ));
  };

  const handleDeletePhase = (phaseId: string) => {
    setPhases(phases.filter(p => p.id !== phaseId));
    toast({
      title: "✅ Deleted",
      description: "Phase removed from timeline"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "in-progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "on-hold":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "in-progress":
        return <Zap className="w-4 h-4" />;
      case "on-hold":
        return <Pause className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Production Progress</h2>
            </div>
            <p className="text-slate-400">Track your creative process and production timeline</p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Phase
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle>Add Production Phase</DialogTitle>
                <DialogDescription>Create a new phase for your production workflow</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white">Phase Name</label>
                  <Input
                    placeholder="e.g., Post-Production, Marketing"
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    data-testid="input-phase-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white">Description</label>
                  <Textarea
                    placeholder="Describe what this phase entails..."
                    value={newPhaseDescription}
                    onChange={(e) => setNewPhaseDescription(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    data-testid="textarea-phase-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddPhase} className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-phase">
                  Create Phase
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overall Progress */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm font-medium mb-2">Overall Progress</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{overallProgress}%</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm font-medium mb-2">In Progress</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-400">{inProgressPhases}</span>
              <span className="text-slate-400">phases</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm font-medium mb-2">Completed</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-400">{completedPhases}</span>
              <span className="text-slate-400">phases</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm font-medium mb-2">Total Phases</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-300">{phases.length}</span>
              <span className="text-slate-400">phases</span>
            </div>
          </div>
        </div>

        {/* Master Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Master Timeline</span>
            <span className="text-sm text-slate-400">{overallProgress}% Complete</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>
      </Card>

      {/* Phases Timeline */}
      <div className="space-y-4">
        {phases.map((phase, idx) => (
          <Card key={phase.id} className="p-6 bg-slate-900 border-slate-700 hover:border-slate-600 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(phase.status)}
                    <h3 className="text-lg font-semibold text-white">{phase.name}</h3>
                  </div>
                  <Badge className={`border ${getStatusColor(phase.status)} text-xs`}>
                    {phase.status}
                  </Badge>
                  {phase.priority === "high" && (
                    <Badge variant="outline" className="bg-red-500/10 border-red-500/50 text-red-400">
                      High Priority
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-3">{phase.description}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-phase-menu-${phase.id}`}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem
                    onClick={() => handleDeletePhase(phase.id)}
                    className="text-red-400 cursor-pointer"
                    data-testid={`menu-delete-phase-${phase.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Phase Progress */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Phase Progress</span>
                <span className="text-slate-300 font-medium">{phase.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={phase.progress}
                onChange={(e) => handleUpdateProgress(phase.id, parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                data-testid={`slider-progress-${phase.id}`}
              />
              <Progress value={phase.progress} className="h-2" />
            </div>

            {/* Dates */}
            <div className="flex gap-4 text-sm mb-4 pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                Start: {phase.startDate.toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                Due: {phase.dueDate.toLocaleDateString()}
              </div>
              {phase.assignee && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-4 h-4" />
                  {phase.assignee}
                </div>
              )}
            </div>

            {/* Tasks */}
            {phase.tasks.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-slate-300">Tasks ({phase.tasks.filter(t => t.completed).length}/{phase.tasks.length})</p>
                {phase.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded hover:bg-slate-800 transition">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(phase.id, task.id)}
                      className="w-4 h-4 cursor-pointer"
                      data-testid={`checkbox-task-${task.id}`}
                    />
                    <span className={`text-sm flex-1 ${task.completed ? "line-through text-slate-500" : "text-slate-300"}`}>
                      {task.name}
                    </span>
                    {task.completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                ))}
              </div>
            )}

            {/* Milestones */}
            {phase.milestones.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-300">Milestones</p>
                {phase.milestones.map(milestone => (
                  <div key={milestone.id} className="flex items-center gap-2 p-2 bg-blue-500/10 rounded border border-blue-500/30">
                    <Milestone className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-300">{milestone.name}</span>
                    <span className="text-xs text-blue-400">{milestone.date.toLocaleDateString()}</span>
                    {milestone.completed && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
