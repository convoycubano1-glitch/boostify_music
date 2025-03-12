import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  Clock,
  Download,
  Upload,
  MoreVertical,
  XCircle,
  Plus,
  Volume2,
  VolumeX,
  Share2,
  History
} from "lucide-react";
import { Slider } from "../ui/slider";
import { Textarea } from "../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { db, auth, storage } from "../../firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  getMetadata 
} from "firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";

interface Version {
  id: string;
  name: string;
  date: Date;
  duration: string;
  status: "pending" | "approved" | "rejected";
  feedback?: string[];
  audioUrl?: string;
  uploadedBy: string;
  uploadedByName: string;
  projectId: string;
  trackName: string;
  waveform?: number[];
}

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  tracks: string[];
}

export function VersionControl() {
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  // Sample data
  const demoVersions: Version[] = [
    {
      id: "v1",
      name: "Mix v1",
      date: new Date("2025-02-19T15:30:00"),
      duration: "3:45",
      status: "approved",
      feedback: [
        "Good balance overall, but the bass needs a bit more presence.",
        "The vocals are well placed in the mix. Great job on the reverb!"
      ],
      audioUrl: "https://example.com/mixes/v1.mp3",
      uploadedBy: "user-1",
      uploadedByName: "Michael Johnson",
      projectId: "proj-1",
      trackName: "Summer Breeze"
    },
    {
      id: "v2",
      name: "Mix v2",
      date: new Date("2025-02-20T10:15:00"),
      duration: "3:46",
      status: "pending",
      audioUrl: "https://example.com/mixes/v2.mp3",
      uploadedBy: "user-1",
      uploadedByName: "Michael Johnson",
      projectId: "proj-1",
      trackName: "Summer Breeze"
    },
    {
      id: "v3",
      name: "Mix Final",
      date: new Date("2025-02-22T09:45:00"),
      duration: "3:48",
      status: "pending",
      audioUrl: "https://example.com/mixes/v3.mp3",
      uploadedBy: "user-3",
      uploadedByName: "Alex Rivera",
      projectId: "proj-1",
      trackName: "Summer Breeze"
    },
    {
      id: "v4",
      name: "Mix v1",
      date: new Date("2025-02-15T14:20:00"),
      duration: "4:12",
      status: "rejected",
      feedback: [
        "The drums are too loud in this mix.",
        "Vocals are getting lost in the mix. Need more presence."
      ],
      audioUrl: "https://example.com/mixes/v4.mp3",
      uploadedBy: "user-1",
      uploadedByName: "Michael Johnson",
      projectId: "proj-2",
      trackName: "Midnight Drive"
    }
  ];

  const demoProjects: Project[] = [
    {
      id: "proj-1",
      name: "Summer EP",
      createdAt: new Date("2025-02-15"),
      tracks: ["Summer Breeze", "Ocean Waves", "Sunset Dreams"]
    },
    {
      id: "proj-2",
      name: "Night Sessions",
      createdAt: new Date("2025-02-10"),
      tracks: ["Midnight Drive", "Urban Lights", "Starry Night"]
    }
  ];

  // Firebase auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Initialize with demo data
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setVersions(demoVersions);
      setProjects(demoProjects);
      setSelectedProject(demoProjects[0].id);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter versions by selected project
  const filteredVersions = versions.filter(
    version => version.projectId === selectedProject
  );

  // Audio control effects
  useEffect(() => {
    if (audioRef.current) {
      // Update time display
      const updateTime = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          setDuration(audioRef.current.duration || 0);
        }
      };

      // Ended event
      const onEnded = () => {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          setCurrentTime(0);
        }
      };

      // Add event listeners
      audioRef.current.addEventListener("timeupdate", updateTime);
      audioRef.current.addEventListener("ended", onEnded);
      audioRef.current.addEventListener("loadedmetadata", updateTime);

      // Clean up
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("timeupdate", updateTime);
          audioRef.current.removeEventListener("ended", onEnded);
          audioRef.current.removeEventListener("loadedmetadata", updateTime);
        }
      };
    }
  }, [audioRef.current]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Play/Pause control
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
          toast({
            title: "Playback Error",
            description: "Could not play the audio file. This is a demo.",
            variant: "destructive"
          });
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Play/Pause toggle
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Skip back 10 seconds
  const skipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  // Skip forward 10 seconds
  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration || 0,
        audioRef.current.currentTime + 10
      );
    }
  };

  // Change current time when slider is moved
  const handleTimeChange = (value: number) => {
    setCurrentTime(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Format time in MM:SS format
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle version selection
  const selectVersion = (version: Version) => {
    setCurrentVersion(version);
    setIsPlaying(false);
    setCurrentTime(0);

    // In a real app, would load the audio file here
    toast({
      title: "Version Selected",
      description: `Now playing: ${version.name} (${version.trackName})`,
    });
  };

  // Update version status
  const updateVersionStatus = (versionId: string, status: "approved" | "rejected") => {
    // Update version status in state
    setVersions(prev => 
      prev.map(v => 
        v.id === versionId 
          ? { ...v, status } 
          : v
      )
    );

    // Provide feedback based on status
    if (status === "approved") {
      toast({
        title: "Version Approved",
        description: "The producer will be notified of your approval.",
        variant: "default"
      });
    } else {
      toast({
        title: "Version Rejected",
        description: "Please provide feedback to help improve the mix.",
        variant: "destructive"
      });
    }
  };

  // Send feedback
  const sendFeedback = (versionId: string) => {
    if (!feedback.trim()) {
      toast({
        title: "Error",
        description: "Please enter feedback before sending",
        variant: "destructive"
      });
      return;
    }

    // Update version in state
    setVersions(prev => 
      prev.map(v => 
        v.id === versionId 
          ? { 
              ...v, 
              feedback: v.feedback 
                ? [...v.feedback, feedback] 
                : [feedback] 
            } 
          : v
      )
    );

    // Clear feedback field
    setFeedback("");

    toast({
      title: "Feedback Sent",
      description: "Your feedback has been sent to the producer.",
    });
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentUser || !selectedProject || !selectedTrack || !newVersionName) {
      toast({
        title: "Error",
        description: "Please fill all required fields before uploading",
        variant: "destructive"
      });
      return;
    }

    const file = files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'];

    if (!allowedExtensions.includes(fileExtension || '')) {
      toast({
        title: "Unsupported file type",
        description: "Please upload an audio file (MP3, WAV, OGG, AAC, M4A, FLAC)",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // For demo purposes, simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 200);

      // Simulate network request
      setTimeout(() => {
        clearInterval(uploadInterval);
        setUploadProgress(100);

        // Create new version
        const newVersion: Version = {
          id: `v-${Date.now()}`,
          name: newVersionName,
          date: new Date(),
          duration: "0:00", // Would be extracted from audio metadata
          status: "pending",
          audioUrl: URL.createObjectURL(file), // For demo only, would be a Firebase URL
          uploadedBy: currentUser.uid,
          uploadedByName: currentUser.displayName || "You",
          projectId: selectedProject,
          trackName: selectedTrack
        };

        // Add to versions list
        setVersions(prev => [newVersion, ...prev]);

        // Reset state and close dialog
        setNewVersionName("");
        setIsUploading(false);
        setUploadProgress(0);
        setShowUploadDialog(false);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        toast({
          title: "Upload Successful",
          description: "Your new version has been uploaded and is ready for review",
        });
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Prepare for upload
  const prepareUpload = () => {
    setShowUploadDialog(true);
  };

  // Get available tracks for the selected project
  const getTracksForProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.tracks : [];
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold">Version Control</h3>
          <p className="text-sm text-muted-foreground">
            Listen, compare, and approve different versions of your tracks
          </p>
        </div>
        <div className="flex flex-col xs:flex-row items-center gap-2 w-full sm:w-auto">
          <Select
            value={selectedProject}
            onValueChange={setSelectedProject}
          >
            <SelectTrigger className="w-full xs:w-[180px]">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="default" 
            size="sm" 
            onClick={prepareUpload}
            className="w-full xs:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Version
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Current playback */}
          {currentVersion && (
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 flex-shrink-0"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-medium truncate">{currentVersion.name} - {currentVersion.trackName}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <Clock className="h-3 w-3" />
                      <span>{currentVersion.duration}</span>
                      <Badge
                        variant={
                          currentVersion.status === "approved" ? "default" :
                          currentVersion.status === "rejected" ? "destructive" :
                          "outline"
                        }
                        className="ml-0 sm:ml-2"
                      >
                        {currentVersion.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={toggleMute}>
                            {isMuted ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isMuted ? "Unmute" : "Mute"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Slider
                      value={[volume]}
                      max={100}
                      step={1}
                      className="w-20 sm:w-24"
                      onValueChange={([value]) => setVolume(value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 sm:gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipBack}
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    className="flex-1"
                    onValueChange={([value]) => handleTimeChange(value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipForward}
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <audio ref={audioRef} src={currentVersion.audioUrl} />
            </div>
          )}

          <div className="space-y-4">
            {filteredVersions.length === 0 ? (
              <div className="text-center py-8 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">No versions found for this project</p>
                <Button variant="outline" className="mt-4" onClick={prepareUpload}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload First Version
                </Button>
              </div>
            ) : (
              filteredVersions.map((version) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 space-y-4 ${
                    currentVersion?.id === version.id ? 'border-primary' : 'border-border'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          selectVersion(version);
                          setIsPlaying(true);
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-medium truncate">{version.name}</h4>
                          <Badge
                            variant={
                              version.status === "approved" ? "default" :
                              version.status === "rejected" ? "destructive" :
                              "outline"
                            }
                          >
                            {version.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <Clock className="h-3 w-3" />
                          <span>{version.duration}</span>
                          <span className="mx-1">•</span>
                          <span>{new Date(version.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <Button
                        variant={version.status === "approved" ? "default" : "outline"}
                        size="sm"
                        className="h-7"
                        onClick={() => updateVersionStatus(version.id, "approved")}
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        <span className="hidden xs:inline">Approve</span>
                      </Button>
                      <Button
                        variant={version.status === "rejected" ? "destructive" : "outline"}
                        size="sm"
                        className="h-7"
                        onClick={() => updateVersionStatus(version.id, "rejected")}
                      >
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        <span className="hidden xs:inline">Reject</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => selectVersion(version)}>
                            <Play className="h-4 w-4 mr-2" />
                            Play
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <History className="h-4 w-4 mr-2" />
                            Version History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-500">
                            <XCircle className="h-4 w-4 mr-2 text-red-500" />
                            Delete Version
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Feedback section */}
                  {version.feedback && version.feedback.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Feedback</span>
                      </div>
                      <div className="space-y-2">
                        {version.feedback.map((fb, index) => (
                          <p key={index} className="text-sm text-muted-foreground pl-6">{fb}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add feedback section - only for pending or rejected versions */}
                  {(version.status === "pending" || version.status === "rejected") && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add your feedback here..."
                        value={version.id === currentVersion?.id ? feedback : ""}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="h-20"
                      />
                      <Button 
                        className="w-full"
                        onClick={() => sendFeedback(version.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Feedback
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Upload New Version</DialogTitle>
            <DialogDescription>
              Upload a new version of your track for review and feedback.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="version-name" className="text-sm font-medium">
                Version Name
              </label>
              <Input
                id="version-name"
                placeholder="e.g., Mix v1, Final Mix, etc."
                value={newVersionName}
                onChange={e => setNewVersionName(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="track-select" className="text-sm font-medium">
                Track
              </label>
              <Select
                value={selectedTrack}
                onValueChange={setSelectedTrack}
              >
                <SelectTrigger id="track-select" className="w-full">
                  <SelectValue placeholder="Select track" />
                </SelectTrigger>
                <SelectContent>
                  {projects.find(p => p.id === selectedProject)?.tracks.map(track => (
                    <SelectItem key={track} value={track}>
                      {track}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="file-upload" className="text-sm font-medium">
                Audio File
              </label>
              <Input
                id="file-upload"
                type="file"
                accept="audio/*"
                ref={fileInputRef}
                disabled={isUploading}
                className="w-full text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: MP3, WAV, OGG, AAC, M4A, FLAC
              </p>
            </div>
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uploading...</span>
                  <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowUploadDialog(false)}
              disabled={isUploading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !newVersionName || !selectedTrack}
              className="w-full sm:w-auto"
            >
              {isUploading ? "Uploading..." : "Upload Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden input for actual file upload triggering */}
      <input 
        type="file"
        accept="audio/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
    </Card>
  );
}