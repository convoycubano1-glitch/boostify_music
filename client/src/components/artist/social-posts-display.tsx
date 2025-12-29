import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SocialPost {
  id: number;
  platform: 'facebook' | 'instagram' | 'tiktok';
  caption: string;
  hashtags: string[];
  cta: string;
  viralScore?: number;
  createdAt: string;
}

interface SocialPostsDisplayProps {
  userId: number;
}

export function SocialPostsDisplay({ userId }: SocialPostsDisplayProps) {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<SocialPost[] | { posts: SocialPost[] }>({
    queryKey: ['/api/social-media/posts', userId],
    enabled: !!userId,
  });

  // Ensure posts is always an array regardless of API response shape
  const posts: SocialPost[] = Array.isArray(data) 
    ? data 
    : (data && typeof data === 'object' && 'posts' in data && Array.isArray(data.posts))
      ? data.posts 
      : [];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado al portapapeles' });
  };

  const platformColors: Record<string, string> = {
    instagram: 'bg-pink-500/10 border-pink-500/30',
    facebook: 'bg-blue-500/10 border-blue-500/30',
    tiktok: 'bg-black/50 border-orange-500/30'
  };

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-orange-500" />
        <h3 className="text-2xl font-bold text-white">Social Media Posts</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            className={`p-4 border transition-all hover:shadow-lg ${platformColors[post.platform]}`}
            data-testid={`card-social-post-${post.platform}`}
          >
            <div className="flex items-center justify-between mb-3">
              <Badge className="capitalize">{post.platform}</Badge>
              {post.viralScore && (
                <Badge variant="outline" className="text-xs">
                  Score: {post.viralScore}
                </Badge>
              )}
            </div>

            <p className="text-sm text-white mb-3 line-clamp-4">{post.caption}</p>

            <div className="mb-3 flex flex-wrap gap-1">
              {post.hashtags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {post.hashtags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{post.hashtags.length - 3}
                </Badge>
              )}
            </div>

            <p className="text-xs text-orange-400 mb-3 font-semibold">{post.cta}</p>

            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => copyToClipboard(`${post.caption}\n\n${post.hashtags.map(t => `#${t}`).join(' ')}\n\n${post.cta}`)}
              data-testid={`button-copy-social-${post.platform}`}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copiar
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
