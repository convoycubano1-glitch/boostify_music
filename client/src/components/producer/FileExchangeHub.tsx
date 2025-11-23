import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Upload, Download, RefreshCcw, FolderOpen, Trash2, RotateCw, AlertCircle, Check, X, Music, Zap, CheckCircle2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { storage, db, auth } from "../../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, getMetadata, deleteObject } from "firebase/storage";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Badge } from "../ui/badge";
import { onAuthStateChanged, User } from "firebase/auth";

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  downloadUrl?: string;
  fileId?: string;
  uploadDate?: Date;
  fileSize?: string;
  fileType?: string;
}

interface FileMetadata {
  id: string;
  name: string;
  downloadUrl: string;
  uploadDate: Date;
  userId: string;
  fileSize: string;
  fileType: string;
  dawType?: string;
}

const DAW_EXTENSIONS = {
  'ptx': { name: 'Pro Tools', icon: '🎛️', color: 'from-blue-500 to-blue-600' },
  'cpr': { name: 'Cubase', icon: '🎚️', color: 'from-cyan-500 to-cyan-600' },
  'logic': { name: 'Logic Pro', icon: '🎹', color: 'from-purple-500 to-purple-600' },
  'als': { name: 'Ableton Live', icon: '🎵', color: 'from-orange-500 to-orange-600' },
  'rpp': { name: 'REAPER', icon: '🎚️', color: 'from-gray-700 to-gray-800' },
  'flp': { name: 'FL Studio', icon: '🎸', color: 'from-blue-400 to-blue-500' },
  'aup': { name: 'Audacity', icon: '🔊', color: 'from-red-500 to-red-600' },
  'aup3': { name: 'Audacity v3', icon: '🔊', color: 'from-red-500 to-red-600' },
  'sesx': { name: 'Adobe Audition', icon: '🎧', color: 'from-red-600 to-red-700' },
  'ardour': { name: 'Ardour', icon: '🎛️', color: 'from-amber-600 to-amber-700' },
  'band': { name: 'GarageBand', icon: '🎹', color: 'from-pink-500 to-pink-600' },
  'rns': { name: 'Reason', icon: '🎚️', color: 'from-orange-600 to-orange-700' },
  'mmpz': { name: 'LMMS', icon: '🎵', color: 'from-green-500 to-green-600' },
  'wav': { name: 'WAV Audio', icon: '🎵', color: 'from-slate-500 to-slate-600' },
  'mp3': { name: 'MP3 Audio', icon: '🎵', color: 'from-slate-500 to-slate-600' },
  'aif': { name: 'AIFF Audio', icon: '🎵', color: 'from-slate-500 to-slate-600' },
  'aiff': { name: 'AIFF Audio', icon: '🎵', color: 'from-slate-500 to-slate-600' },
};

export function FileExchangeHub() {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [allFiles, setAllFiles] = useState<FileMetadata[]>([]);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [downloadingAll, setDownloadingAll] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [fileToDelete, setFileToDelete] = useState<FileMetadata | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [uploadedCount, setUploadedCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchProjectFiles();
      } else {
        setAllFiles([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchProjectFiles = async () => {
    try {
      setSyncStatus("syncing");
      setIsLoading(true);
      
      const filesRef = collection(db, "projectFiles");
      const q = query(filesRef, orderBy("uploadDate", "desc"));
      const querySnapshot = await getDocs(q);
      
      const fetchedFiles: FileMetadata[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const ext = data.name.substring(data.name.lastIndexOf(".") + 1).toLowerCase();
        const dawInfo = DAW_EXTENSIONS[ext as keyof typeof DAW_EXTENSIONS];
        
        fetchedFiles.push({
          id: doc.id,
          name: data.name,
          downloadUrl: data.downloadUrl,
          uploadDate: data.uploadDate.toDate(),
          userId: data.userId,
          fileSize: data.fileSize || "Unknown",
          fileType: data.fileType || "Unknown",
          dawType: dawInfo?.name || "Project File"
        });
      });
      
      setAllFiles(fetchedFiles);
      setSyncStatus("synced");
      
      toast({
        title: "✅ Synced",
        description: `${fetchedFiles.length} project files loaded`,
      });
    } catch (error) {
      console.error("Error fetching project files:", error);
      setSyncStatus("error");
      toast({
        title: "Sync Error",
        description: "Failed to fetch project files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentUser) return;

    const validateFile = (file: File): boolean => {
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 500MB limit`,
          variant: "destructive",
        });
        return false;
      }

      const allowedExtensions = [
        ".ptx", ".cpr", ".logic", ".aup", ".flp", ".aif", ".wav", 
        ".mp3", ".als", ".rpp", ".sesx", ".aup3", ".ardour", ".caf",
        ".band", ".aiff", ".mmpz", ".rns", ".zip"
      ];
      
      const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        toast({
          title: "Unsupported file type",
          description: `${fileExt} files are not supported. Upload .ptx, .cpr, .logic, .als, .rpp, etc.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    };

    Array.from(files).forEach(async (file) => {
      if (!validateFile(file)) return;

      const newUpload: UploadProgress = {
        fileName: file.name,
        progress: 0,
        status: "uploading",
      };

      setUploads(prev => [...prev, newUpload]);

      try {
        const storageRef = ref(storage, `projectFiles/${currentUser.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploads(prev => 
              prev.map(upload => 
                upload.fileName === file.name 
                  ? { ...upload, progress } 
                  : upload
              )
            );
          },
          (error) => {
            console.error("Upload error:", error);
            setUploads(prev =>
              prev.map(upload =>
                upload.fileName === file.name
                  ? { ...upload, status: "error" }
                  : upload
              )
            );
            toast({
              title: "Upload failed",
              description: `Failed to upload ${file.name}`,
              variant: "destructive",
            });
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);
              const fileSize = formatFileSize(metadata.size);
              const ext = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();
              const dawInfo = DAW_EXTENSIONS[ext as keyof typeof DAW_EXTENSIONS];
              
              const docRef = await addDoc(collection(db, "projectFiles"), {
                name: file.name,
                downloadUrl,
                uploadDate: serverTimestamp(),
                userId: currentUser.uid,
                storagePath: metadata.fullPath,
                fileSize,
                fileType: file.type || ext,
                dawType: dawInfo?.name || "Project File"
              });
              
              setUploads(prev =>
                prev.map(upload =>
                  upload.fileName === file.name
                    ? { 
                        ...upload, 
                        status: "completed", 
                        downloadUrl,
                        fileId: docRef.id,
                        uploadDate: new Date(),
                        fileSize,
                        fileType: file.type || ext,
                      }
                    : upload
                )
              );
              
              setAllFiles(prev => [{
                id: docRef.id,
                name: file.name,
                downloadUrl,
                uploadDate: new Date(),
                userId: currentUser.uid,
                fileSize,
                fileType: file.type || ext,
                dawType: dawInfo?.name || "Project File"
              }, ...prev]);

              setUploadedCount(prev => prev + 1);
              
              toast({
                title: "✅ Uploaded",
                description: `${file.name} uploaded successfully`,
              });
            } catch (error) {
              console.error("Error saving file metadata:", error);
              setUploads(prev =>
                prev.map(upload =>
                  upload.fileName === file.name
                    ? { ...upload, status: "error" }
                    : upload
                )
              );
              toast({
                title: "Error",
                description: "Failed to save file metadata",
                variant: "destructive",
              });
            }
          }
        );
      } catch (error) {
        console.error("File upload error:", error);
        setUploads(prev =>
          prev.map(upload =>
            upload.fileName === file.name
              ? { ...upload, status: "error" }
              : upload
          )
        );
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    });
  };

  const handleDownloadAll = async () => {
    if (allFiles.length === 0) {
      toast({
        title: "No files to download",
        description: "Upload some project files first",
      });
      return;
    }

    try {
      setDownloadingAll(true);
      
      if (allFiles.length === 1) {
        window.open(allFiles[0].downloadUrl, '_blank');
        toast({
          title: "✅ Download started",
          description: `Downloading ${allFiles[0].name}...`,
        });
        setDownloadingAll(false);
        return;
      }
      
      toast({
        title: "Preparing download",
        description: `Gathering ${allFiles.length} files...`,
      });
      
      const zip = new JSZip();
      let successCount = 0;

      const downloadPromises = allFiles.map(async (file) => {
        try {
          const response = await fetch(file.downloadUrl);
          const blob = await response.blob();
          zip.file(file.name, blob);
          successCount++;
          return true;
        } catch (error) {
          console.error(`Error downloading ${file.name}:`, error);
          return false;
        }
      });
      
      await Promise.all(downloadPromises);
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `boostify-projects-${new Date().toISOString().split('T')[0]}.zip`);
      
      toast({
        title: "✅ Download Complete",
        description: `${successCount} of ${allFiles.length} files packaged and ready`,
      });
    } catch (error) {
      console.error("Error downloading files:", error);
      toast({
        title: "Download failed",
        description: "Failed to download files",
        variant: "destructive",
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleDownloadFile = (file: FileMetadata) => {
    window.open(file.downloadUrl, '_blank');
    toast({
      title: "✅ Download started",
      description: `Downloading ${file.name}...`,
    });
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    
    try {
      await deleteDoc(doc(db, "projectFiles", fileToDelete.id));
      
      const filesRef = collection(db, "projectFiles");
      const q = query(filesRef, where("name", "==", fileToDelete.name), where("userId", "==", currentUser?.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        if (docData.storagePath) {
          const storageRef = ref(storage, docData.storagePath);
          await deleteObject(storageRef);
        }
      }
      
      setAllFiles(prev => prev.filter(file => file.id !== fileToDelete.id));
      setUploads(prev => prev.filter(upload => upload.fileId !== fileToDelete.id));
      
      toast({
        title: "✅ Deleted",
        description: `${fileToDelete.name} has been removed`,
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleSyncClick = () => {
    fetchProjectFiles();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderFileStatus = (upload: UploadProgress) => {
    switch (upload.status) {
      case "uploading":
        return (
          <div className="flex items-center gap-1 text-blue-500 text-xs font-medium">
            <RotateCw className="w-3 h-3 animate-spin" />
            {upload.progress}%
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center gap-1 text-green-500 text-xs font-medium">
            <Check className="w-3 h-3" />
            Uploaded
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Failed
          </div>
        );
      default:
        return null;
    }
  };

  const getDawIcon = (filename: string) => {
    const ext = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    const info = DAW_EXTENSIONS[ext as keyof typeof DAW_EXTENSIONS];
    return info?.icon || "📁";
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Music className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-white">Project Exchange Hub</h3>
            </div>
            <p className="text-sm text-slate-400">
              Share ProTools, Cubase, and other DAW project files • {allFiles.length} files
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={handleSyncClick}
                    disabled={syncStatus === "syncing"}
                    size="sm"
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    {syncStatus === "syncing" ? (
                      <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCcw className="w-4 h-4 mr-2" />
                    )}
                    Sync
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh all project files</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleDownloadAll}
                    disabled={downloadingAll || allFiles.length === 0}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {downloadingAll ? (
                      <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download all files as ZIP</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="space-y-6">
          {/* Upload Area */}
          <div className="relative border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-orange-500 transition">
            <input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              data-testid="file-input-upload"
            />
            <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
            <p className="text-base font-semibold text-white mb-1">
              Drag & drop your DAW files here
            </p>
            <p className="text-xs text-slate-400">
              Pro Tools, Cubase, Logic, Ableton, REAPER, FL Studio, Audacity, and more (max 500MB each)
            </p>
          </div>

          {/* Recent Uploads */}
          {uploads.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                Recent Uploads ({uploads.length})
              </h4>
              <div className="space-y-2">
                {uploads.map((upload, index) => (
                  <div key={index} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 backdrop-blur">
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-lg flex-shrink-0">{getDawIcon(upload.fileName)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{upload.fileName}</p>
                          <p className="text-xs text-slate-400">{upload.fileSize || 'Uploading...'}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {renderFileStatus(upload)}
                      </div>
                    </div>
                    <Progress value={upload.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Project Files */}
          {allFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                All Project Files ({allFiles.length})
              </h4>
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {allFiles.map((file) => (
                  <div key={file.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 hover:bg-slate-700/80 transition">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-lg flex-shrink-0">{getDawIcon(file.name)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{file.name}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline" className="text-xs bg-slate-800 border-slate-600 text-slate-300">
                              {file.dawType}
                            </Badge>
                            <span className="text-xs text-slate-400">{file.fileSize}</span>
                            <span className="text-xs text-slate-500">{formatDate(file.uploadDate)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-slate-600"
                                onClick={() => handleDownloadFile(file)}
                                data-testid={`button-download-${file.id}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download this file</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                                onClick={() => {
                                  setFileToDelete(file);
                                  setDeleteDialogOpen(true);
                                }}
                                data-testid={`button-delete-${file.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete this file</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && allFiles.length === 0 && uploads.length === 0 && (
            <div className="text-center py-8">
              <RotateCw className="w-8 h-8 mx-auto mb-3 text-slate-400 animate-spin" />
              <p className="text-sm text-slate-400">Loading project files...</p>
            </div>
          )}

          {syncStatus === "error" && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">Failed to sync files. Check your connection and try again.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project File?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. {fileToDelete?.name} will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteFile}>
              Delete File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
