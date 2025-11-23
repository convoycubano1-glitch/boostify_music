import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, ShoppingCart, Music2, Loader2 } from "lucide-react";
import { TokenCardVisual } from "./token-card-visual";
import { ArtistDetailModal } from "./artist-detail-modal";
import { artistProfiles, ArtistProfile } from "@/data/artist-profiles";
import { getArtistImage } from "@/data/artist-images";

export function ArtistTokensMarketplace() {
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedArtistProfile, setSelectedArtistProfile] =
    useState<ArtistProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch tokenized songs that are being traded on BoostiSwap
  const { data: tokenizedSongs = [], isLoading } = useQuery({
    queryKey: ["/api/boostiswap/tokenized-songs"],
    queryFn: async () => {
      try {
        console.log("📡 Fetching real tokenized songs from blockchain...");
        const songs = await apiRequest({
          url: "/api/boostiswap/tokenized-songs",
          method: "GET",
        });
        console.log(`✅ Loaded ${songs.length} real tokenized songs`);
        return songs;
      } catch (error) {
        console.log("Using demo tokenized songs with 20 professional artists");
        // Fallback demo data with 20 professional artists
        return [
          { id: 1, songName: "Moonlight Dreams", artist: "Luna Echo", tokenSymbol: "LUNA", pricePerTokenUsd: 2.45, totalSupply: 10000, availableSupply: 3500, volume24h: 15000, holders: 248, imageUrl: getArtistImage(1), description: "A haunting synthwave track with ethereal vocals", change24h: 12.5 },
          { id: 2, songName: "Urban Rhythm", artist: "Urban Flow", tokenSymbol: "URBAN", pricePerTokenUsd: 3.15, totalSupply: 15000, availableSupply: 5200, volume24h: 24000, holders: 412, imageUrl: getArtistImage(2), description: "High-energy hip-hop with infectious beats", change24h: 15.2 },
          { id: 3, songName: "Electric Pulse", artist: "Electric Dreams", tokenSymbol: "ELDREAM", pricePerTokenUsd: 4.22, totalSupply: 8000, availableSupply: 1200, volume24h: 45000, holders: 589, imageUrl: getArtistImage(3), description: "Electropop sensation breaking charts worldwide", change24h: 18.7 },
          { id: 4, songName: "Soul Connection", artist: "Soul Harmony", tokenSymbol: "SOUL", pricePerTokenUsd: 2.88, totalSupply: 12000, availableSupply: 4100, volume24h: 32000, holders: 356, imageUrl: getArtistImage(4), description: "Deep R&B with timeless soul vibes", change24h: 5.4 },
          { id: 5, songName: "River Road", artist: "Maya Rivers", tokenSymbol: "MAYA", pricePerTokenUsd: 1.99, totalSupply: 9000, availableSupply: 3200, volume24h: 12000, holders: 198, imageUrl: getArtistImage(5), description: "Indie folk masterpiece with acoustic instrumentation", change24h: 8.3 },
          { id: 6, songName: "Reggae Sunset", artist: "Jah Vibes", tokenSymbol: "JAH", pricePerTokenUsd: 2.15, totalSupply: 11000, availableSupply: 4100, volume24h: 18000, holders: 267, imageUrl: getArtistImage(6), description: "Relaxing reggae vibes for the soul", change24h: 6.9 },
          { id: 7, songName: "Classical Symphony", artist: "David Chen", tokenSymbol: "CHEN", pricePerTokenUsd: 5.50, totalSupply: 5000, availableSupply: 800, volume24h: 38000, holders: 421, imageUrl: getArtistImage(7), description: "A virtuosic classical composition", change24h: 22.1 },
          { id: 8, songName: "K-Pop Dream", artist: "Sophia Kim", tokenSymbol: "SOPHIA", pricePerTokenUsd: 3.80, totalSupply: 12000, availableSupply: 2500, volume24h: 52000, holders: 678, imageUrl: getArtistImage(8), description: "Chart-topping K-pop sensation", change24h: 28.4 },
          { id: 9, songName: "Jazz Nights", artist: "Marcus Stone", tokenSymbol: "MARCUS", pricePerTokenUsd: 4.15, totalSupply: 7000, availableSupply: 1500, volume24h: 35000, holders: 356, imageUrl: getArtistImage(9), description: "Smooth jazz saxophone performance", change24h: 14.7 },
          { id: 10, songName: "Reggaeton Fire", artist: "Isabella Santos", tokenSymbol: "BELLA", pricePerTokenUsd: 3.45, totalSupply: 13000, availableSupply: 3800, volume24h: 41000, holders: 512, imageUrl: getArtistImage(10), description: "Hot reggaeton track with infectious rhythm", change24h: 19.8 },
          { id: 11, songName: "Country Roads", artist: "Luke Bradley", tokenSymbol: "LUKE", pricePerTokenUsd: 2.65, totalSupply: 10000, availableSupply: 3900, volume24h: 19000, holders: 289, imageUrl: getArtistImage(11), description: "Classic country ballad", change24h: 7.2 },
          { id: 12, songName: "Ambient Cosmos", artist: "Aria Nova", tokenSymbol: "ARIA", pricePerTokenUsd: 2.20, totalSupply: 8500, availableSupply: 4200, volume24h: 14000, holders: 221, imageUrl: getArtistImage(12), description: "Ethereal ambient electronic soundscape", change24h: 5.6 },
          { id: 13, songName: "Trap Beats", artist: "Alex Thunder", tokenSymbol: "ALEX", pricePerTokenUsd: 3.55, totalSupply: 11000, availableSupply: 2800, volume24h: 39000, holders: 445, imageUrl: getArtistImage(13), description: "Heavy trap production masterpiece", change24h: 16.3 },
          { id: 14, songName: "Opera Aria", artist: "Victoria Cross", tokenSymbol: "VICTORIA", pricePerTokenUsd: 6.10, totalSupply: 4000, availableSupply: 600, volume24h: 48000, holders: 502, imageUrl: getArtistImage(14), description: "Classical opera performance", change24h: 31.5 },
          { id: 15, songName: "Funk Groove", artist: "Prince Diesel", tokenSymbol: "DIESEL", pricePerTokenUsd: 3.90, totalSupply: 9500, availableSupply: 2200, volume24h: 36000, holders: 389, imageUrl: getArtistImage(15), description: "Funky rhythmic groove", change24h: 13.2 },
          { id: 16, songName: "Rock Anthem", artist: "Ryan Phoenix", tokenSymbol: "RYAN", pricePerTokenUsd: 3.25, totalSupply: 10500, availableSupply: 3600, volume24h: 28000, holders: 367, imageUrl: getArtistImage(16), description: "Indie rock anthem", change24h: 11.4 },
          { id: 17, songName: "Latin Fire", artist: "Pablo Fuego", tokenSymbol: "PABLO", pricePerTokenUsd: 2.99, totalSupply: 12000, availableSupply: 4500, volume24h: 33000, holders: 421, imageUrl: getArtistImage(17), description: "Energetic Latin music", change24h: 10.7 },
          { id: 18, songName: "Pop Perfection", artist: "Emma White", tokenSymbol: "EMMA", pricePerTokenUsd: 3.55, totalSupply: 13500, availableSupply: 3200, volume24h: 47000, holders: 589, imageUrl: getArtistImage(18), description: "Catchy pop hit", change24h: 20.3 },
          { id: 19, songName: "Dubstep Drop", artist: "Chris Void", tokenSymbol: "VOID", pricePerTokenUsd: 4.05, totalSupply: 9000, availableSupply: 1800, volume24h: 42000, holders: 467, imageUrl: getArtistImage(19), description: "Massive dubstep bass drop", change24h: 25.8 },
          { id: 20, songName: "Soul Serenade", artist: "James Grant", tokenSymbol: "JAMES", pricePerTokenUsd: 3.35, totalSupply: 11000, availableSupply: 3400, volume24h: 31000, holders: 398, imageUrl: getArtistImage(20), description: "Soulful R&B ballad", change24h: 9.1 },
        ];
      }
    },
  });

  const filteredSongs = selectedArtist
    ? tokenizedSongs.filter((song: any) => song.artist === selectedArtist)
    : tokenizedSongs;

  const uniqueArtists = Array.from(
    new Set(tokenizedSongs.map((song: any) => song.artist))
  );

  const getArtistTracks = (artistName: string) => {
    const profile = Object.values(artistProfiles).find(p => p.name.toLowerCase() === artistName.toLowerCase());
    return profile?.tracks || [];
  };

  const handleTokenCardClick = (songId: number, artistName?: string) => {
    console.log("🎯 Clicked token card for song ID:", songId, "Artist:", artistName);
    
    // Find the profile by searching through all profiles for matching name
    let profile: ArtistProfile | null = null;
    
    // First try to find by artist name (exact match)
    if (artistName) {
      profile = Object.values(artistProfiles).find(p => p.name.toLowerCase() === artistName.toLowerCase()) || null;
      console.log("🔍 Found by artist name:", profile?.name);
    }
    
    // If not found, try loose matching (substring)
    if (!profile && artistName) {
      profile = Object.values(artistProfiles).find(p => 
        artistName.toLowerCase().includes(p.name.split(' ')[0].toLowerCase())
      ) || null;
      console.log("🔍 Found by loose match:", profile?.name);
    }
    
    // Try tokenId/songId mapping
    if (!profile) {
      // Map token IDs 1-20 to artist profile IDs 1-20
      const profileId = ((songId - 1) % 20) + 1;
      profile = artistProfiles[profileId] || null;
      console.log("🔍 Found by token ID mapping:", profile?.name);
    }
    
    // Last fallback: use first available profile
    if (!profile) {
      profile = Object.values(artistProfiles)[0] || null;
      console.log("🔍 Using first profile as fallback:", profile?.name);
    }
    
    if (profile) {
      console.log("📊 Opening modal for artist:", profile.name);
      setSelectedArtistProfile(profile);
      setIsModalOpen(true);
    } else {
      console.warn("❌ No profile found for song:", songId);
    }
  };

  return (
    <div className="space-y-6">
      <ArtistDetailModal
        artist={selectedArtistProfile}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        artistImage={selectedArtistProfile ? getArtistImage(selectedArtistProfile.id) : undefined}
      />
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Artist Token Marketplace</h2>
        <p className="text-muted-foreground">Buy and trade tokenized music from your favorite artists</p>
      </div>

      {/* Artist Filter */}
      {uniqueArtists.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedArtist === null ? "default" : "outline"}
            onClick={() => setSelectedArtist(null)}
            className={selectedArtist === null ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            All Artists
          </Button>
          {uniqueArtists.map((artist) => (
            <Button
              key={artist}
              variant={selectedArtist === artist ? "default" : "outline"}
              onClick={() => setSelectedArtist(artist as string)}
              className={selectedArtist === artist ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              {artist}
            </Button>
          ))}
        </div>
      )}

      {/* Tokenized Songs Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </div>
      ) : filteredSongs.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700">
          <CardContent className="py-12 text-center">
            <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No tokenized songs available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSongs.map((song: any) => (
            <div
              key={song.id}
              className="group cursor-pointer"
              data-testid={`tokenized-song-${song.id}`}
            >
              {/* Token Card Visual */}
              <div
                className="mb-3 transform transition group-hover:scale-105"
                onClick={() => handleTokenCardClick(song.id, song.artist)}
              >
                <TokenCardVisual
                  songName={song.songName}
                  artistName={song.artist}
                  tokenSymbol={song.tokenSymbol}
                  price={song.pricePerTokenUsd}
                  artistImage={song.imageUrl}
                  songImageUrl={song.imageUrl}
                  change24h={song.change24h || 0}
                  tracks={getArtistTracks(song.artist)}
                />
              </div>

              {/* Stats Below Card */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Available</p>
                    <p className="font-semibold text-white">
                      {song.availableSupply.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Holders</p>
                    <p className="font-semibold text-white">
                      {song.holders.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded p-2">
                  <p className="text-muted-foreground text-xs">24h Volume</p>
                  <p className="font-semibold text-green-400">
                    ${(song.volume24h / 1000).toFixed(0)}K
                  </p>
                </div>

                {song.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {song.description}
                  </p>
                )}

                <Button 
                  onClick={() => handleTokenCardClick(song.id, song.artist)}
                  className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-sm py-2 h-auto"
                  data-testid={`button-buy-token-${song.id}`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Buy Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
