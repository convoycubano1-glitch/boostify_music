import { useState } from 'react';
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
}

export function TokenizationPanel({ artistId }: TokenizationPanelProps) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageTab, setImageTab] = useState<'url' | 'generate'>('url');
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

  const { data: songs = [], isLoading } = useQuery<TokenizedSong[]>({
    queryKey: ['/api/tokenization/songs', artistId],
  });

  const { data: earnings } = useQuery({
    queryKey: ['/api/tokenization/earnings', artistId],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest({
      url: '/api/tokenization/create',
      method: 'POST',
      data: data,
    }),
    onSuccess: () => {
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
      toast({
        title: 'Error',
        description: error.message || 'No se pudo tokenizar la canción',
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
        title: '¡Descripción mejorada!',
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
        title: '¡Imagen generada!',
        description: 'La IA ha generado la imagen para tu canción',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo generar la imagen',
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
            Tokenización de Música (Web3)
          </CardTitle>
          <CardDescription>
            Tokeniza tus canciones en blockchain y permite que los fans compren tokens con MetaMask
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Canciones Tokenizadas</p>
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
                    <p className="text-sm text-muted-foreground">Ganancias Totales</p>
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
                    <p className="text-sm text-muted-foreground">Tokens Activos</p>
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
                Tokenizar Nueva Canción
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tokenizar Canción</DialogTitle>
                <DialogDescription>
                  Crea tokens ERC-1155 para tu canción en Polygon blockchain
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="songName">Nombre de la Canción</Label>
                  <Input
                    id="songName"
                    value={formData.songName}
                    onChange={(e) => setFormData({ ...formData, songName: e.target.value })}
                    placeholder="Mi Canción Increíble"
                    data-testid="input-song-name"
                  />
                </div>

                <div>
                  <Label htmlFor="tokenSymbol">Símbolo del Token</Label>
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
                    <Label htmlFor="totalSupply">Supply Total</Label>
                    <Input
                      id="totalSupply"
                      type="number"
                      value={formData.totalSupply}
                      onChange={(e) => setFormData({ ...formData, totalSupply: parseInt(e.target.value) })}
                      data-testid="input-total-supply"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pricePerToken">Precio por Token (USD)</Label>
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
                    <Label htmlFor="description">Descripción</Label>
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
                          Mejorando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Mejorar con IA
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe tu canción... (o usa IA para generar)"
                    rows={4}
                    data-testid="input-description"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tip: Ingresa el nombre de la canción y haz clic en "Mejorar con IA"
                  </p>
                </div>

                <div>
                  <Label htmlFor="benefits">Beneficios (separados por comas)</Label>
                  <Input
                    id="benefits"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    placeholder="Acceso exclusivo, Descuentos en merch, Meet & greet"
                    data-testid="input-benefits"
                  />
                </div>

                <div>
                  <Label>Imagen de la Canción</Label>
                  <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as 'url' | 'generate')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url">
                        <Upload className="w-3 h-3 mr-1" />
                        URL de Imagen
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
                  {createMutation.isPending ? 'Tokenizando...' : 'Tokenizar Canción'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-4">
            <h3 className="font-semibold">Tus Canciones Tokenizadas</h3>
            {isLoading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : songs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No tienes canciones tokenizadas aún. ¡Crea tu primera tokenización!
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
