import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Post } from "@/lib/social/types";
import { PostCard } from "./post-card";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function PostFeed() {
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: posts, isLoading, error, refetch } = useQuery<Post[]>({
    queryKey: ["/api/social/posts"],
  });

  const handleSubmitPost = async () => {
    if (!newPost.trim()) return;

    setIsSubmitting(true);
    try {
      await apiRequest({
        url: "/api/social/posts",
        method: "POST",
        data: { content: newPost },
      });
      setNewPost("");
      toast({
        title: "Post created!",
        description: "Your post has been published.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not create your post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading posts. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitPost}
                  disabled={isSubmitting || !newPost.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : posts && posts.length > 0 ? (
        posts.map((post) => <PostCard key={post.id} post={post as any} />)
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
        </Card>
      )}
    </div>
  );
}