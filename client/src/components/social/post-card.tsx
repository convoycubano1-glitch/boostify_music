import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, MessageSquare, Share, Send } from "lucide-react";
import type { Post, Comment, SocialUser } from "@/lib/social/types";

interface PostCardProps {
  post: Post & {
    user: SocialUser;
    comments: (Comment & { user: SocialUser; replies?: (Comment & { user: SocialUser })[] })[];
  };
}

export function PostCard({ post }: PostCardProps) {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLike = async () => {
    try {
      await apiRequest({
        url: `/api/social/posts/${post.id}/like`,
        method: "POST",
        data: {},
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      toast({
        title: "Post liked!",
        description: "Your like has been recorded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not like the post.",
        variant: "destructive",
      });
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;

    try {
      await apiRequest({
        url: `/api/social/posts/${post.id}/comments`,
        method: "POST",
        data: { content: comment },
      });
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      toast({
        title: "Comment added!",
        description: "Your comment has been posted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not post the comment.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    toast({
      title: "Share feature",
      description: "The share feature is coming soon!",
    });
  };

  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="p-4 pb-0 flex items-center space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.user.avatar || ""} alt={post.user.displayName} />
          <AvatarFallback>{post.user.displayName.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold">{post.user.displayName}</span>
          <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.mediaUrl && (
          <div className="mt-3">
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="rounded-md max-h-96 w-auto"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col">
        <div className="flex justify-between items-center w-full mb-2 text-sm text-gray-500">
          <div>{post.likes} likes</div>
          <div>{post.comments.length} comments • {post.shares} shares</div>
        </div>
        <div className="flex justify-between items-center w-full border-t border-b py-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={handleLike}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Like
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Comment
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={handleShare}
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 w-full space-y-4">
            {post.comments.map((comment) => (
              <div key={comment.id} className="pl-2 border-l-2 border-gray-200">
                <div className="flex items-start space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.avatar || ""} alt={comment.user.displayName} />
                    <AvatarFallback>{comment.user.displayName.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                      <div className="font-semibold text-sm">{comment.user.displayName}</div>
                      <div className="text-sm">{comment.content}</div>
                    </div>
                    <div className="flex space-x-4 text-xs mt-1 text-gray-500">
                      <span>{formatDate(comment.createdAt)}</span>
                      <button className="hover:text-gray-700">Like ({comment.likes})</button>
                      <button className="hover:text-gray-700">Reply</button>
                    </div>
                    
                    {/* Replies to this comment */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-2 pl-4 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={reply.user.avatar || ""} alt={reply.user.displayName} />
                              <AvatarFallback>{reply.user.displayName.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                                <div className="font-semibold text-sm">{reply.user.displayName}</div>
                                <div className="text-sm">{reply.content}</div>
                              </div>
                              <div className="flex space-x-4 text-xs mt-1 text-gray-500">
                                <span>{formatDate(reply.createdAt)}</span>
                                <button className="hover:text-gray-700">Like ({reply.likes})</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center space-x-2 mt-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center space-x-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[40px] h-10 py-2"
                />
                <Button size="sm" onClick={handleComment} className="h-10">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}