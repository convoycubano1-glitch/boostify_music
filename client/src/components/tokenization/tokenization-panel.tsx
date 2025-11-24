import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, Wallet, Plus, Eye, EyeOff, Sparkles, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { TokenizedSongPreview } from './tokenized-song-preview';

interface TokenizedSong {
  id: number;
  songName: string;
  tokenSymbol: string;
  totalSupply: number;
  availableSupply: number;
  pricePerTokenUsd: string;
  royaltyPercentageArtist: number;
  isActive: boolean;
  imageUrl?: string;
  description?: string;
}

interface TokenizationPanelProps {
  artistId: number;
  artistName?: string;
  artistImage?: string;
}

export function TokenizationPanel({ artistId, artistName = 'Tu Artista', artistImage }: TokenizationPanelProps) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageTab, setImageTab] = useState<'url' | 'generate'>('url');
  const [artistImageUrl, setArtistImageUrl] = useState<string>(artistImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Artist');
  const [formData, setFormData] = useState({
    songName: '',
    tokenSymbol: '',
    totalSupply: 10000,
    pricePerTokenUsd: 0.10,
    contractAddress: '0x0000000000000000000000000000000000000000',
    imageUrl: '',
    description: '',
    benefits: '',
  });

  // Fetch artist info to get current image if not provided
  useEffect(() => {
    const fetchArtistInfo = async () => {
      try {
        const response = await fetch(`/api/artist/${artistId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.artist) {
            if (!artistImage && data.artist.profileImage) {
              setArtistImageUrl(data.artist.profileImage);
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch artist info');
      }
    };

    if (!artistImage) {
      fetchArtistInfo();
    }
  }, [artistId, artistImage]);

  const { data: songs = [], isLoading } = useQuery<TokenizedSong[]>({
    queryKey: ['/api/tokenization/songs', artistId],
  });

  const { data: earnings } = useQuery({
    queryKey: ['/api/tokenization/earnings', artistId],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('🎵 [Tokenization] Enviando datos:', data);
      return apiRequest({
        url: '/api/tokenization/create',
        method: 'POST',
        data: data,
      });
    },
    onSuccess: () => {
      console.log('✅ [Tokenization] Canción tokenizada exitosamente');
      toast({
        title: '¡Canción tokenizada!',
        description: 'Tu canción ha sido tokenizada exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tokenization/songs', artistId] });
      setShowCreateDialog(false);
      setFormData({
        songName: '',
        tokenSymbol: '',
        totalSupply: 10000,
        pricePerTokenUsd: 0.10,
        contractAddress: '0x0000000000000000000000000000000000000000',
        imageUrl: '',
        description: '',
        benefits: '',
      });
    },
    onError: (error: any) => {
      console.error('❌ [Tokenization] Error completo:', error);
      console.error('❌ [Tokenization] Error message:', error.message);
      console.error('❌ [Tokenization] Error response:', error.response?.data);
      toast({
        title: 'Error de validación',
        description: JSON.stringify(error.response?.data) || error.message || 'No se pudo tokenizar la canción',
        variant: 'destructive',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (songId: number) => apiRequest({
      url: `/api/tokenization/song/${songId}/toggle`,
      method: 'PUT',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokenization/songs', artistId] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado de la canción ha sido actualizado.',
      });
    },
  });

  const handleCreate = () => {
    const benefitsArray = formData.benefits.split(',').map(b => b.trim()).filter(Boolean);
    
    createMutation.mutate({
      ...formData,
      benefits: benefitsArray.length > 0 ? benefitsArray : null,
    });
  };

  const handleImproveDescription = async () => {
    if (!formData.songName) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingresa el nombre de la canción primero',
        variant: 'destructive',
      });
      return;
    }

    setIsImprovingDescription(true);
    try {
      const result = await apiRequest({
        url: '/api/tokenization/ai/improve-description',
        method: 'POST',
        data: {
          songName: formData.songName,
          currentDescription: formData.description,
        },
      });

      setFormData({ ...formData, description: result.description });
      toast({
        title: '¡Description mejorada!',
        description: 'La IA ha mejorado tu descripción',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo mejorar la descripción',
        variant: 'destructive',
      });
    } finally {
      setIsImprovingDescription(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.songName) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingresa el nombre de la canción primero',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const result = await apiRequest({
        url: '/api/tokenization/ai/generate-image',
        method: 'POST',
        data: {
          songName: formData.songName,
          description: formData.description,
        },
      });

      setFormData({ ...formData, imageUrl: result.imageUrl });
      setImageTab('url');
      toast({
        title: 'Image generated!',
        description: 'AI has generated the image for your song',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not generate the image',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const totalEarningsEth = (earnings as any)?.totalEarningsEth || '0';

  return (
    <div className="space-y-6" data-testid="tokenization-panel">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Music Tokenization (Web3)
          </CardTitle>
          <CardDescription>
            Tokenize your songs on blockchain and allow fans to buy tokens with MetaMask
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tokenized Songs</p>
                    <p className="text-2xl font-bold">{songs.length}</p>
                  </div>
                  <Coins className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">{parseFloat(totalEarningsEth).toFixed(4)} ETH</p>
                  </div>
                  <Wallet className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Tokens</p>
                    <p className="text-2xl font-bold">{songs.filter(s => s.isActive).length}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full mb-4" data-testid="button-create-tokenized-song">
                <Plus className="w-4 h-4 mr-2" />
                Tokenize New Song
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tokenize Song</DialogTitle>
                <DialogDescription>
                  Create ERC-1155 tokens for your song on Polygon blockchain
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="songName">Song Name</Label>
                  <Input
                    id="songName"
                    value={formData.songName}
                    onChange={(e) => setFormData({ ...formData, songName: e.target.value })}
                    placeholder="My Awesome Song"
                    data-testid="input-song-name"
                  />
                </div>

                <div>
                  <Label htmlFor="tokenSymbol">Token Symbol</Label>
                  <Input
                    id="tokenSymbol"
                    value={formData.tokenSymbol}
                    onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })}
                    placeholder="SONG-001"
                    maxLength={20}
                    data-testid="input-token-symbol"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalSupply">Total Supply</Label>
                    <Input
                      id="totalSupply"
                      type="number"
                      value={formData.totalSupply}
                      onChange={(e) => setFormData({ ...formData, totalSupply: parseInt(e.target.value) })}
                      data-testid="input-total-supply"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pricePerToken">Price per Token (USD)</Label>
                    <Input
                      id="pricePerToken"
                      type="number"
                      step="0.01"
                      value={formData.pricePerTokenUsd}
                      onChange={(e) => setFormData({ ...formData, pricePerTokenUsd: parseFloat(e.target.value) })}
                      data-testid="input-price-per-token"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="description">Description</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleImproveDescription}
                      disabled={isImprovingDescription || !formData.songName}
                      className="gap-2"
                    >
                      {isImprovingDescription ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Improving...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Improve with AI
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your song... (or use AI to generate)"
                    rows={4}
                    data-testid="input-description"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tip: Ingresa el nombre de la canción y haz clic en "Improve with AI"
                  </p>
                </div>

                <div>
                  <Label htmlFor="benefits">Benefits (separated by commas)</Label>
                  <Input
                    id="benefits"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    placeholder="Exclusive access, Merch discounts, Meet & greet"
                    data-testid="input-benefits"
                  />
                </div>

                <div>
                  <Label>Song Image</Label>
                  <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as 'url' | 'generate')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url">
                        <Upload className="w-3 h-3 mr-1" />
                        Image URL
                      </TabsTrigger>
                      <TabsTrigger value="generate">
                        <ImageIcon className="w-3 h-3 mr-1" />
                        Generar con IA
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="url" className="space-y-2">
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        data-testid="input-image-url"
                      />
                      <p className="text-xs text-muted-foreground">
                        Pega la URL de una imagen existente
                      </p>
                    </TabsContent>
                    <TabsContent value="generate" className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !formData.songName}
                        className="w-full gap-2"
                      >
                        {isGeneratingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generando imagen...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generar Imagen con IA
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        La IA creará una imagen profesional basada en el nombre y descripción
                      </p>
                    </TabsContent>
                  </Tabs>
                  {formData.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleCreate} 
                  disabled={createMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-tokenization"
                >
                  {createMutation.isPending ? 'Tokenizing...' : 'Tokenize Song'}
                </Button>
              </div>

              {/* Token Preview on the Right */}
              <div className="flex flex-col gap-4">
                <div className="sticky top-0">
                  <TokenizedSongPreview
                    songName={formData.songName}
                    tokenSymbol={formData.tokenSymbol}
                    price={formData.pricePerTokenUsd}
                    artistImage={artistImageUrl}
                    songImageUrl={formData.imageUrl}
                    artistName={artistName}
                  />
                </div>
              </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-4">
            <h3 className="font-semibold">Your Tokenized Songs</h3>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : songs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  You don't have tokenized songs yet. Create your first tokenization!
                </CardContent>
              </Card>
            ) : (
              songs.map((song) => (
                <Card key={song.id} data-testid={`card-tokenized-song-${song.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{song.songName}</h4>
                          <Badge variant={song.isActive ? 'default' : 'secondary'}>
                            {song.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Símbolo</p>
                            <p className="font-medium">{song.tokenSymbol}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Disponibles</p>
                            <p className="font-medium">{song.availableSupply}/{song.totalSupply}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Precio</p>
                            <p className="font-medium">${song.pricePerTokenUsd}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Royalty</p>
                            <p className="font-medium">{song.royaltyPercentageArtist}%</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMutation.mutate(song.id)}
                        disabled={toggleMutation.isPending}
                        data-testid={`button-toggle-song-${song.id}`}
                      >
                        {song.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
