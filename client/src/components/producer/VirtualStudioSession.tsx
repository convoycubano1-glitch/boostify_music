import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { 
  Video, Mic, MicOff, VideoOff, Phone, Users, Share, MessageSquare, 
  Volume2, Settings, Music, FileAudio, Copy, Play, Pause, Send,
  RotateCcw, Maximize2, Minimize2, Eye, EyeOff, Radio, Zap, User, Clock
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { auth, db, storage } from "../../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  role: 'host' | 'artist' | 'producer' | 'guest';
  joinedAt: Date;
  status: 'active' | 'idle' | 'away';
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
}

interface SharedAudio {
  id: string;
  name: string;
  url: string;
  uploaderName: string;
  duration: string;
  timestamp: Date;
}

export function VirtualStudioSession() {
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Session state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Media state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<"participants" | "chat" | "audio">("participants");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [sharedAudios, setSharedAudios] = useState<SharedAudio[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<SharedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Audio volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Initialize media devices
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach(track => {
        track.enabled = track.kind === 'audio' ? !isMuted : isVideoOn;
      });

      toast({
        title: "✅ Media Ready",
        description: "Camera and microphone initialized"
      });
    } catch (error) {
      console.error("Media error:", error);
      toast({
        title: "❌ Permission Denied",
        description: "Please allow access to camera and microphone",
        variant: "destructive"
      });
      setIsVideoOn(false);
    }
  };

  // Stop media
  const stopMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  // Start session
  const startSession = () => {
    const newSessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setSessionId(newSessionId);
    setIsSessionActive(true);
    setSessionStartTime(new Date());
    initializeMedia();

    if (currentUser) {
      const hostParticipant: Participant = {
        id: currentUser.uid,
        name: currentUser.displayName || "You",
        avatar: currentUser.photoURL || undefined,
        isMuted,
        isVideoOn,
        isScreenSharing: false,
        role: 'host',
        joinedAt: new Date(),
        status: 'active'
      };
      setParticipants([hostParticipant]);
      addSystemMessage(`🎤 ${hostParticipant.name} started the studio session`);
    }

    toast({
      title: "🎬 Session Started",
      description: `ID: ${newSessionId} - Share to invite others`
    });
  };

  // End session
  const endSession = () => {
    stopMedia();
    setIsSessionActive(false);
    setSessionId("");
    setSessionStartTime(null);
    setParticipants([]);
    setChatMessages([]);

    toast({
      title: "👋 Session Ended",
      description: "Studio session closed"
    });
  };

  // Join session
  const joinSession = () => {
    if (!joinCode) {
      toast({
        title: "❌ Error",
        description: "Enter a valid session code",
        variant: "destructive"
      });
      return;
    }

    setSessionId(joinCode);
    setIsSessionActive(true);
    setSessionStartTime(new Date());
    initializeMedia();

    if (currentUser) {
      const newParticipant: Participant = {
        id: currentUser.uid,
        name: currentUser.displayName || "Guest",
        avatar: currentUser.photoURL || undefined,
        isMuted,
        isVideoOn,
        isScreenSharing: false,
        role: 'guest',
        joinedAt: new Date(),
        status: 'active'
      };
      setParticipants(prev => [...prev, newParticipant]);
      addSystemMessage(`👋 ${newParticipant.name} joined the session`);
    }

    setJoinCode("");
    toast({
      title: "✅ Joined",
      description: `Connected to session ${joinCode}`
    });
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
    setParticipants(prev => prev.map(p =>
      p.id === currentUser?.uid ? { ...p, isMuted: !isMuted } : p
    ));
  };

  // Toggle video
  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
    }
    setParticipants(prev => prev.map(p =>
      p.id === currentUser?.uid ? { ...p, isVideoOn: !isVideoOn } : p
    ));
  };

  // Screen share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      await initializeMedia();
      setParticipants(prev => prev.map(p =>
        p.id === currentUser?.uid ? { ...p, isScreenSharing: false } : p
      ));
      toast({
        title: "🎬 Camera Active",
        description: "Switched back to camera"
      });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });

        localStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        setIsScreenSharing(true);
        setParticipants(prev => prev.map(p =>
          p.id === currentUser?.uid ? { ...p, isScreenSharing: true } : p
        ));

        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          toggleScreenShare();
        });

        toast({
          title: "📺 Screen Sharing",
          description: "Your screen is visible to all"
        });
      } catch (error) {
        console.error("Screen share error:", error);
        toast({
          title: "❌ Error",
          description: "Could not start screen sharing",
          variant: "destructive"
        });
      }
    }
  };

  // Copy session ID
  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    toast({
      title: "📋 Copied",
      description: "Session ID copied to clipboard"
    });
  };

  // Send chat message
  const sendMessage = () => {
    if (!currentMessage.trim() || !currentUser) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || "User",
      senderAvatar: currentUser.photoURL || undefined,
      content: currentMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setChatMessages(prev => [...prev, message]);
    setCurrentMessage("");
  };

  // Add system message
  const addSystemMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'system',
      senderName: 'System',
      content,
      timestamp: new Date(),
      type: 'system'
    };
    setChatMessages(prev => [...prev, message]);
  };

  // Upload audio
  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentUser) return;

    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExt = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'];

    if (!allowedExt.includes(ext || '')) {
      toast({
        title: "❌ Invalid Format",
        description: "Upload MP3, WAV, OGG, AAC, M4A, or FLAC",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "❌ File Too Large",
        description: "Max 100MB per file",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      const storageRef = ref(storage, `studio/${sessionId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        snapshot => {
          setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        },
        error => {
          console.error(error);
          toast({
            title: "❌ Upload Failed",
            description: "Could not upload audio",
            variant: "destructive"
          });
          setIsUploading(false);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          const audio = new Audio(url);
          audio.onloadedmetadata = () => {
            const duration = Math.floor(audio.duration);
            const mins = Math.floor(duration / 60);
            const secs = duration % 60;

            const newAudio: SharedAudio = {
              id: Date.now().toString(),
              name: file.name,
              url,
              uploaderName: currentUser.displayName || "User",
              duration: `${mins}:${secs.toString().padStart(2, '0')}`,
              timestamp: new Date()
            };

            setSharedAudios(prev => [newAudio, ...prev]);
            addSystemMessage(`🎵 ${currentUser.displayName} shared: ${file.name}`);

            toast({
              title: "✅ Uploaded",
              description: `${file.name} is ready to play`
            });

            setIsUploading(false);
            setUploadProgress(0);
          };
        }
      );
    } catch (error) {
      console.error(error);
      toast({
        title: "❌ Error",
        description: "Upload failed",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  // Calculate session duration
  const getSessionDuration = () => {
    if (!sessionStartTime) return "00:00";
    const diff = Date.now() - sessionStartTime.getTime();
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg animate-pulse">
              <Radio className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Virtual Studio Session</h2>
              <p className="text-sm text-slate-400">Real-time collaboration hub</p>
            </div>
          </div>

          {isSessionActive ? (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getSessionDuration()}
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                {sessionId}
              </Badge>
            </div>
          ) : (
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              Offline
            </Badge>
          )}
        </div>
      </Card>

      {/* Main Content */}
      {!isSessionActive ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Start Session */}
          <Card className="p-6 bg-slate-900 border-slate-700 flex flex-col justify-center">
            <div className="text-center space-y-4">
              <Video className="w-12 h-12 mx-auto text-blue-500" />
              <h3 className="text-lg font-semibold text-white">Start New Session</h3>
              <p className="text-sm text-slate-400">Create a studio session and invite collaborators</p>
              <Button onClick={startSession} className="bg-blue-600 hover:bg-blue-700 w-full">
                <Radio className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            </div>
          </Card>

          {/* Join Session */}
          <Card className="p-6 bg-slate-900 border-slate-700 space-y-4">
            <h3 className="text-lg font-semibold text-white">Join Session</h3>
            <Input
              placeholder="Enter session code..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
              data-testid="input-join-code"
            />
            <Button onClick={joinSession} className="bg-green-600 hover:bg-green-700 w-full">
              <Users className="w-4 h-4 mr-2" />
              Join
            </Button>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Video Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className={`bg-slate-900 border-slate-700 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
              <div className="relative bg-black aspect-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                    <VideoOff className="w-12 h-12 text-slate-600" />
                  </div>
                )}

                {/* Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleMute}
                          className={isMuted ? "bg-red-500/20 hover:bg-red-500/30" : "bg-slate-800/50 hover:bg-slate-700/50"}
                          data-testid="button-toggle-mute"
                        >
                          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleVideo}
                          className={!isVideoOn ? "bg-red-500/20 hover:bg-red-500/30" : "bg-slate-800/50 hover:bg-slate-700/50"}
                          data-testid="button-toggle-video"
                        >
                          {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isVideoOn ? "Stop Video" : "Start Video"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleScreenShare}
                          className={isScreenSharing ? "bg-blue-500/20 hover:bg-blue-500/30" : "bg-slate-800/50 hover:bg-slate-700/50"}
                          data-testid="button-toggle-screen"
                        >
                          <Share className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isScreenSharing ? "Stop Sharing" : "Share Screen"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="bg-slate-800/50 hover:bg-slate-700/50"
                          data-testid="button-toggle-fullscreen"
                        >
                          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    onClick={endSession}
                    className="bg-red-600 hover:bg-red-700"
                    size="icon"
                    data-testid="button-end-session"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Session Info */}
            <Card className="p-3 bg-slate-900 border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Users className="w-4 h-4" />
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copySessionId}
                className="border-slate-600 text-slate-300"
                data-testid="button-copy-session"
              >
                <Copy className="w-3 h-3 mr-1" />
                {sessionId}
              </Button>
            </Card>
          </div>

          {/* Sidebar */}
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="lg:col-span-1">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
              <TabsTrigger value="participants" className="text-xs">Participants</TabsTrigger>
              <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
              <TabsTrigger value="audio" className="text-xs">Audio</TabsTrigger>
            </TabsList>

            {/* Participants Tab */}
            <TabsContent value="participants" className="space-y-2">
              {participants.map(p => (
                <Card key={p.id} className="p-3 bg-slate-800 border-slate-700">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.role}</p>
                    </div>
                    <div className="flex gap-1">
                      {p.isMuted && <MicOff className="w-3 h-3 text-red-500" />}
                      {!p.isVideoOn && <VideoOff className="w-3 h-3 text-red-500" />}
                      {p.isScreenSharing && <Share className="w-3 h-3 text-blue-500" />}
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="space-y-2 h-[400px] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-2 bg-slate-800/50 rounded-lg p-2">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={msg.type === 'system' ? 'text-center' : ''}>
                    {msg.type === 'system' ? (
                      <p className="text-xs text-slate-500 italic">{msg.content}</p>
                    ) : (
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-slate-300">{msg.senderName}</span>
                          <span className="text-slate-600 text-[10px]">{msg.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-400 break-words">{msg.content}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-1">
                <Input
                  placeholder="Message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="text-xs bg-slate-700 border-slate-600"
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={sendMessage}
                  size="icon"
                  className="w-8 h-8 bg-blue-600 hover:bg-blue-700"
                  data-testid="button-send-message"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </TabsContent>

            {/* Audio Tab */}
            <TabsContent value="audio" className="space-y-2">
              <div className="text-xs">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="audio-input"
                  data-testid="input-audio-file"
                />
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8">
                  <label className="cursor-pointer" data-testid="button-upload-audio">
                    <Music className="w-3 h-3 mr-1" />
                    {isUploading ? `Uploading ${uploadProgress}%` : "Upload Audio"}
                  </label>
                </Button>
              </div>

              {isUploading && <Progress value={uploadProgress} className="h-1" />}

              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {sharedAudios.map(audio => (
                  <Card key={audio.id} className="p-2 bg-slate-800 border-slate-700">
                    <div className="flex items-center gap-2 text-xs">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6"
                        onClick={() => {
                          setCurrentlyPlaying(audio);
                          setIsPlaying(!isPlaying);
                        }}
                        data-testid={`button-play-audio-${audio.id}`}
                      >
                        {currentlyPlaying?.id === audio.id && isPlaying ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 truncate font-medium">{audio.name}</p>
                        <p className="text-slate-500">{audio.duration}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {currentlyPlaying && (
                <div className="space-y-1 bg-slate-800 rounded p-2">
                  <p className="text-xs text-slate-400">Now Playing: <span className="text-slate-200">{currentlyPlaying.name}</span></p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full h-1"
                    data-testid="slider-volume"
                  />
                  <audio
                    ref={audioRef}
                    src={currentlyPlaying.url}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
