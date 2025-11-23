import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Download, Sparkles, Facebook, Instagram } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';

interface SocialPost {
  platform: 'facebook' | 'instagram' | 'tiktok';
  caption: string;
  hashtags: string[];
  cta: string;
  viralScore?: number;
}

export default function SocialMediaGeneratorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [artistData, setArtistData] = useState<any>(null);

  // Fetch artist data
  useQuery({
    queryKey: ['/api/artist/profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await fetch(`/api/artist/profile/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch artist data');
      const data = await response.json();
      setArtistData(data.artist || data);
      return data;
    }
  });

  // Generate content mutation
  const { mutate: generateContent, isPending } = useMutation({
    mutationFn: async () => {
      if (!artistData) throw new Error('Artist data not loaded');
      
      const response = await fetch('/api/social-media/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: artistData.artistName || artistData.displayName,
          biography: artistData.biography || 'Artista apasionado por la música',
          profileUrl: `${window.location.origin}/artist/${artistData.slug}`
        })
      });

      if (!response.ok) throw new Error('Failed to generate content');
      const data = await response.json();
      return data.posts || [];
    },
    onSuccess: (newPosts) => {
      setPosts(newPosts);
      toast({
        title: '✅ Contenido generado',
        description: 'Se crearon 3 posts virales para tus redes'
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Error',
        description: error.message || 'No se pudo generar el contenido',
        variant: 'destructive'
      });
    }
  });

  if (!user) return <Redirect to="/auth" />;

  const platformIcons: Record<string, any> = {
    instagram: Instagram,
    facebook: Facebook,
    tiktok: () => <span className="text-lg font-bold">🎵</span>
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado al portapapeles' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-orange-500" />
            Generador de Contenido Social
          </h1>
          <p className="text-gray-400">Crea posts virales para Facebook, Instagram y TikTok automáticamente</p>
        </div>

        {/* Generate Button */}
        <Card className="bg-black/50 border-orange-500/30 mb-8 p-6">
          <Button 
            onClick={() => generateContent()}
            disabled={isPending || !artistData}
            size="lg"
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            data-testid="button-generate-posts"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando contenido...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Posts Virales
              </>
            )}
          </Button>
        </Card>

        {/* Posts Display */}
        {posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post, idx) => (
              <Card key={idx} className="bg-black/50 border-orange-500/20 p-6 hover:border-orange-500/50 transition-all" data-testid={`card-post-${post.platform}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl capitalize font-bold text-orange-500">{post.platform}</div>
                    <Badge variant="outline" className="border-orange-500/50">
                      {post.viralScore && `Viral Score: ${post.viralScore}`}
                    </Badge>
                  </div>
                </div>

                {/* Caption */}
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <p className="text-white text-sm leading-relaxed">{post.caption}</p>
                  <p className="text-orange-400 text-xs mt-3 font-semibold">{post.cta}</p>
                </div>

                {/* Hashtags */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {post.hashtags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(`${post.caption}\n\n${post.hashtags.map(t => `#${t}`).join(' ')}\n\n${post.cta}`)}
                    data-testid={`button-copy-${post.platform}`}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </Button>
                  <Button size="sm" variant="outline" data-testid={`button-download-${post.platform}`}>
                    <Download className="w-4 h-4 mr-1" />
                    Descargar
                  </Button>
                </div>
              </Card>
            ))}

            {/* Regenerate Button */}
            <Button 
              onClick={() => generateContent()}
              disabled={isPending}
              variant="outline"
              className="w-full border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
              data-testid="button-regenerate"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Regenerar Contenido Diferente
            </Button>
          </div>
        )}

        {/* Empty State */}
        {posts.length === 0 && !isPending && (
          <Card className="bg-black/50 border-orange-500/20 p-12 text-center">
            <Sparkles className="w-16 h-16 text-orange-500/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Crea tu primer post viral</h3>
            <p className="text-gray-400">Haz clic en el botón superior para generar contenido optimizado para redes sociales</p>
          </Card>
        )}
      </div>
    </div>
  );
}
