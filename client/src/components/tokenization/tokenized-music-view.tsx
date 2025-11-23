import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ShoppingCart, Sparkles } from 'lucide-react';
import { BuyTokensDialog } from './buy-tokens-dialog';

interface TokenizedSong {
  id: number;
  songName: string;
  tokenSymbol: string;
  totalSupply: number;
  availableSupply: number;
  pricePerTokenUsd: string;
  pricePerTokenEth: string;
  imageUrl?: string;
  description?: string;
  benefits?: string[];
  contractAddress: string;
  tokenId: number;
}

interface ArtistSong {
  id: number;
  title: string;
  audioUrl: string;
  genre: string;
  duration: string;
  description: string;
  coverArt?: string;
}

interface TokenizedMusicViewProps {
  artistId: string | number;
  postgresId?: number | null;
  isAIGenerated?: boolean;
  artistName?: string;
}

export function TokenizedMusicView({ artistId, postgresId, isAIGenerated, artistName }: TokenizedMusicViewProps) {
  const { isConnected } = useAccount();
  const [selectedSong, setSelectedSong] = useState<TokenizedSong | null>(null);
  
  const numericArtistId = typeof artistId === 'string' ? parseInt(artistId) : artistId;
  const isValidId = !isNaN(numericArtistId);

  const { data: tokenizedSongs = [], isLoading: tokenLoading } = useQuery<TokenizedSong[]>({
    queryKey: [`/api/tokenization/songs/active/${numericArtistId}`],
    enabled: isValidId,
  });

  const { data: aiGeneratedSongs = [], isLoading: aiLoading } = useQuery<ArtistSong[]>({
    queryKey: postgresId ? [`/api/songs/user/${postgresId}`] : [],
    enabled: postgresId ? true : false,
  });

  const isLoading = tokenLoading || aiLoading;
  const hasTokenizedSongs = tokenizedSongs.length > 0;
  const hasAISongs = aiGeneratedSongs.length > 0;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (!hasTokenizedSongs && !hasAISongs) {
    return null;
  }

  return (
    <div className="space-y-8" data-testid="tokenized-music-view">
      {hasTokenizedSongs && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Música Tokenizada
              </h2>
              <p className="text-muted-foreground">
                Compra tokens exclusivos con MetaMask y obtén beneficios especiales
              </p>
            </div>
            {!isConnected && (
              <ConnectButton 
                chainStatus="none"
                showBalance={false}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokenizedSongs.map((song) => (
              <Card 
                key={song.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow"
                data-testid={`card-song-${song.id}`}
              >
                {song.imageUrl && (
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img 
                      src={song.imageUrl} 
                      alt={song.songName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{song.songName}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className="font-mono">
                          {song.tokenSymbol}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {song.availableSupply} disponibles
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {song.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {song.description}
                    </p>
                  )}

                  {song.benefits && song.benefits.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">Beneficios:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {song.benefits.slice(0, 3).map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="line-clamp-1">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold">${song.pricePerTokenUsd}</span>
                      <span className="text-sm text-muted-foreground">
                        por token
                      </span>
                    </div>
                    
                    {song.pricePerTokenEth && (
                      <p className="text-xs text-muted-foreground">
                        ≈ {parseFloat(song.pricePerTokenEth).toFixed(6)} ETH
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() => setSelectedSong(song)}
                    disabled={song.availableSupply === 0}
                    data-testid={`button-buy-tokens-${song.id}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {song.availableSupply === 0 ? 'Agotado' : 'Comprar Tokens'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {hasAISongs && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              AI-Generated Tracks
            </h2>
            <p className="text-muted-foreground">
              Listen to songs created with AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiGeneratedSongs.map((song) => (
              <Card 
                key={song.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
                data-testid={`card-ai-song-${song.id}`}
              >
                {song.coverArt && (
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img 
                      src={song.coverArt}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-1">{song.title}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mt-2">
                      {song.genre}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {song.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {song.description}
                    </p>
                  )}
                  
                  {song.audioUrl && (
                    <audio 
                      controls 
                      className="w-full h-8"
                      data-testid={`audio-ai-song-${song.id}`}
                    >
                      <source src={song.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}

                  {song.duration && (
                    <p className="text-xs text-muted-foreground">
                      Duration: {song.duration}s
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedSong && (
        <BuyTokensDialog
          song={selectedSong}
          artistName={artistName}
          isConnected={isConnected}
          onClose={() => setSelectedSong(null)}
        />
      )}
    </div>
  );
}
