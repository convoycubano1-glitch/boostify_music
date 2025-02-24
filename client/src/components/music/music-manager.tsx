import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, getStorage, UploadTaskSnapshot } from "firebase/storage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Play, Pause, Trash } from "lucide-react";

interface Song {
  id: string;
  title: string;
  artistId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  format: string;
}

export function MusicManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadSongs();
  }, [user]);

  const loadSongs = async () => {
    if (!user) return;

    try {
      const songsRef = collection(db, 'artist_music');
      const q = query(
        songsRef,
        where("artistId", "==", user.uid),
        orderBy("uploadedAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const loadedSongs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Song));

      setSongs(loadedSongs);
    } catch (error) {
      console.error('Error loading songs:', error);
      toast({
        title: "Error",
        description: "Could not load your songs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files?.length) return;

    const file = event.target.files[0];
    const fileName = file.name;
    const fileFormat = file.type;

    // Validate file type
    if (!fileFormat.match(/^audio\/(mpeg|wav|x-wav)$/)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an MP3 or WAV file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `artist_music/${user.uid}/${fileName}`);
      const uploadTask = uploadBytes(storageRef, file);

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading file:', error);
          toast({
            title: "Upload Failed",
            description: "There was an error uploading your song. Please try again.",
            variant: "destructive",
          });
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // Save metadata to Firestore
          const songData = {
            title: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
            artistId: user.uid,
            fileName,
            fileUrl: downloadUrl,
            uploadedAt: new Date(),
            format: fileFormat,
          };

          await addDoc(collection(db, 'artist_music'), songData);
          await loadSongs();

          toast({
            title: "Success",
            description: "Your song has been uploaded successfully.",
          });
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const togglePlay = async (song: Song) => {
    if (currentlyPlaying === song.id) {
      audioElement?.pause();
      setCurrentlyPlaying(null);
      setAudioElement(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      try {
        const audio = new Audio(song.fileUrl);
        await audio.play();
        setAudioElement(audio);
        setCurrentlyPlaying(song.id);

        // Add ended event listener
        audio.addEventListener('ended', () => {
          setCurrentlyPlaying(null);
          setAudioElement(null);
        });
      } catch (error) {
        console.error('Error playing audio:', error);
        toast({
          title: "Playback Error",
          description: "Could not play the audio file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async (song: Song) => {
    if (!user) return;

    try {
      // Stop playback if the song is currently playing
      if (currentlyPlaying === song.id && audioElement) {
        audioElement.pause();
        setCurrentlyPlaying(null);
        setAudioElement(null);
      }

      // Delete from Storage
      const storageRef = ref(storage, `artist_music/${user.uid}/${song.fileName}`);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'artist_music', song.id));

      toast({
        title: "Success",
        description: "The song has been deleted from your library.",
      });

      await loadSongs();
    } catch (error) {
      console.error('Error deleting song:', error);
      toast({
        title: "Error",
        description: "Failed to delete the song. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold">Please log in to manage your music.</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept="audio/mpeg,audio/wav"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="max-w-xs"
          />
          {isUploading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Uploading... {Math.round(uploadProgress)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {songs.map((song) => (
            <Card
              key={song.id}
              className="p-4 bg-black/10 hover:bg-black/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePlay(song)}
                  >
                    {currentlyPlaying === song.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <p className="font-medium">{song.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(song.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(song)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}