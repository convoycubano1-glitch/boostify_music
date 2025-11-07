import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Download, Trash2, Video, Loader2, Play, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { queryClient, apiRequest } from "../../lib/queryClient";
import { format } from "date-fns";

interface GeneratedVideo {
  id: number;
  user_id: string;
  song_name: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number;
  is_paid: boolean;
  payment_intent_id: string | null;
  amount: number | null;
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  metadata: any;
}

export function MyGeneratedVideos() {
  const { toast } = useToast();

  // Obtener videos del usuario
  const { data: videos, isLoading } = useQuery<GeneratedVideo[]>({
    queryKey: ['/api/videos/my-videos'],
    select: (data: any) => data?.videos || []
  });

  // Mutación para eliminar video
  const deleteMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Error deleting video');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos/my-videos'] });
      toast({
        title: "Video deleted",
        description: "The video has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete video",
        variant: "destructive",
      });
    }
  });

  const handleDownload = async (videoUrl: string, songName: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${songName.replace(/\s+/g, '_')}_music_video.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: "Your video is downloading",
      });
    } catch (error) {
      console.error('Error descargando video:', error);
      toast({
        title: "Download error",
        description: "Could not download the video. Try opening it in a new tab.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (videoId: number, songName: string) => {
    if (confirm(`Are you sure you want to delete the video "${songName}"?`)) {
      deleteMutation.mutate(videoId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'generating':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1 animate-spin" />Generating</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            My Generated Videos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            My Generated Videos
          </CardTitle>
          <CardDescription>
            Your generated music videos will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">You have no generated videos</p>
            <p className="text-sm">Generate your first music video to see it here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="my-generated-videos">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          My Generated Videos ({videos.length})
        </CardTitle>
        <CardDescription>
          All your AI-generated music videos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden" data-testid={`video-card-${video.id}`}>
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div className="relative w-full sm:w-48 h-32 bg-muted flex items-center justify-center">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.song_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Video className="w-12 h-12 text-muted-foreground opacity-50" />
                    )}
                    {video.is_paid && (
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500">
                        Premium
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg" data-testid={`video-title-${video.id}`}>
                          {video.song_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Created on {format(new Date(video.created_at), 'MM/dd/yyyy HH:mm')}
                        </p>
                      </div>
                      {getStatusBadge(video.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>Duration: {Math.round(video.duration)}s</span>
                      {video.amount && (
                        <span>Paid: ${(video.amount / 100).toFixed(2)}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {video.status === 'completed' && video.video_url && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => window.open(video.video_url!, '_blank')}
                            data-testid={`button-play-${video.id}`}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(video.video_url!, video.song_name)}
                            data-testid={`button-download-${video.id}`}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </>
                      )}
                      {video.status === 'generating' && (
                        <Button size="sm" disabled>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Generating...
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(video.id, video.song_name)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${video.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
