import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingCart, Music2, Loader2, Music } from "lucide-react";
import { TokenCardVisual } from "./token-card-visual";
import { getArtistImage } from "@/data/artist-images";

export function SongTokensMarketplace() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const { data: tokenizedSongs = [], isLoading } = useQuery({
    queryKey: ["/api/boostiswap/song-tokens"],
    queryFn: async () => {
      try {
        const songs = await apiRequest({
          url: "/api/boostiswap/tokenized-songs",
          method: "GET",
        });
        return songs;
      } catch {
        return [
          { id: 1, songName: "Moonlight Dreams", artist: "Luna Echo", tokenSymbol: "LUNA", pricePerTokenUsd: 2.45, totalSupply: 10000, availableSupply: 3500, volume24h: 15000, holders: 248, imageUrl: getArtistImage(1), description: "A haunting synthwave track", change24h: 12.5, genre: "Electronic" },
          { id: 2, songName: "Urban Rhythm", artist: "Urban Flow", tokenSymbol: "URBAN", pricePerTokenUsd: 3.15, totalSupply: 15000, availableSupply: 5200, volume24h: 24000, holders: 412, imageUrl: getArtistImage(2), description: "High-energy hip-hop", change24h: 15.2, genre: "Hip-Hop" },
          { id: 3, songName: "Electric Pulse", artist: "Electric Dreams", tokenSymbol: "ELDREAM", pricePerTokenUsd: 4.22, totalSupply: 8000, availableSupply: 1200, volume24h: 45000, holders: 589, imageUrl: getArtistImage(3), description: "Electropop sensation", change24h: 18.7, genre: "Pop" },
          { id: 4, songName: "Soul Connection", artist: "Soul Harmony", tokenSymbol: "SOUL", pricePerTokenUsd: 2.88, totalSupply: 12000, availableSupply: 4100, volume24h: 32000, holders: 356, imageUrl: getArtistImage(4), description: "Deep R&B vibes", change24h: 5.4, genre: "R&B" },
          { id: 5, songName: "Classical Symphony", artist: "David Chen", tokenSymbol: "CHEN", pricePerTokenUsd: 5.50, totalSupply: 5000, availableSupply: 800, volume24h: 38000, holders: 421, imageUrl: getArtistImage(7), description: "Virtuosic composition", change24h: 22.1, genre: "Classical" },
        ];
      }
    },
  });

  const genres = Array.from(new Set(tokenizedSongs.map((s: any) => s.genre || "Other")));
  const filtered = selectedGenre ? tokenizedSongs.filter((s: any) => s.genre === selectedGenre) : tokenizedSongs;

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">🎵 Song Tokens</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Trade tokenized individual songs</p>
      </div>

      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          <Button size="sm" variant={selectedGenre === null ? "default" : "outline"} onClick={() => setSelectedGenre(null)} className={selectedGenre === null ? "bg-orange-500 hover:bg-orange-600 whitespace-nowrap" : "whitespace-nowrap"}>
            All Songs
          </Button>
          {genres.map((genre) => (
            <Button key={genre} size="sm" variant={selectedGenre === genre ? "default" : "outline"} onClick={() => setSelectedGenre(genre)} className={selectedGenre === genre ? "bg-orange-500 hover:bg-orange-600 whitespace-nowrap" : "whitespace-nowrap"}>
              {genre}
            </Button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700">
          <CardContent className="py-12 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No song tokens available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filtered.map((song: any) => (
            <div key={song.id} className="group cursor-pointer">
              <div className="mb-2 sm:mb-3 transform transition group-hover:scale-105">
                <TokenCardVisual songName={song.songName} artistName={song.artist} tokenSymbol={song.tokenSymbol} price={song.pricePerTokenUsd} artistImage={song.imageUrl} songImageUrl={song.imageUrl} change24h={song.change24h || 0} tracks={[]} />
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3 border border-slate-700 space-y-2 text-xs sm:text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Available</p>
                    <p className="font-semibold text-white">{(song.availableSupply / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Holders</p>
                    <p className="font-semibold text-white">{song.holders}</p>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded p-2">
                  <p className="text-muted-foreground text-xs">24h Volume</p>
                  <p className="font-semibold text-green-400">${(song.volume24h / 1000).toFixed(0)}K</p>
                </div>
                {song.description && <p className="text-xs text-muted-foreground line-clamp-1">{song.description}</p>}
                <Button className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-xs sm:text-sm py-2 h-auto">
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                  Buy
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
