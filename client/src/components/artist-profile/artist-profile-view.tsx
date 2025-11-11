import { Music, ShoppingBag, Play, Pause } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useState, useRef } from "react";
import type { ArtistProfile, Song, Merchandise } from "../../pages/artist-profile";

interface ArtistProfileViewProps {
  profile: ArtistProfile;
  songs: Song[];
  merchandise: Merchandise[];
  isOwner: boolean;
}

export function ArtistProfileView({
  profile,
  songs,
  merchandise,
  isOwner
}: ArtistProfileViewProps) {
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = (song: Song) => {
    if (playingSongId === song.id) {
      audioRef.current?.pause();
      setPlayingSongId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = song.audioUrl;
        audioRef.current.play();
      }
      setPlayingSongId(song.id);
    }
  };

  const coverImage = profile.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop';
  const profileImage = profile.profileImage || '/assets/default-avatar.png';
  const artistName = profile.artistName || profile.username || 'Artist';

  return (
    <div className="w-full">
      <audio ref={audioRef} onEnded={() => setPlayingSongId(null)} />
      
      <div 
        className="relative h-64 md:h-96 bg-cover bg-center"
        style={{ backgroundImage: `url(${coverImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container max-w-6xl mx-auto flex items-end gap-6">
            <img
              src={profileImage}
              alt={artistName}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background object-cover"
              data-testid="img-profile"
            />
            <div className="flex-1 pb-2">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" data-testid="text-artist-name">
                {artistName}
              </h1>
              {profile.slug && (
                <p className="text-lg text-white/80" data-testid="text-slug">
                  @{profile.slug}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Songs {songs.length > 0 && `(${songs.length})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {songs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {isOwner ? "You haven't uploaded any songs yet." : "No songs available yet."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {songs.filter(s => s.isPublished).map((song) => (
                      <div
                        key={song.id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                        data-testid={`card-song-${song.id}`}
                      >
                        <div className="flex-shrink-0">
                          {song.coverArt ? (
                            <img
                              src={song.coverArt}
                              alt={song.title}
                              className="w-16 h-16 rounded object-cover"
                              data-testid={`img-song-cover-${song.id}`}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                              <Music className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate" data-testid={`text-song-title-${song.id}`}>
                            {song.title}
                          </h3>
                          {song.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {song.description}
                            </p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {song.genre && (
                              <Badge variant="secondary" className="text-xs">
                                {song.genre}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {song.plays} plays
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={playingSongId === song.id ? "default" : "outline"}
                          onClick={() => handlePlayPause(song)}
                          data-testid={`button-play-${song.id}`}
                        >
                          {playingSongId === song.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Merchandise {merchandise.length > 0 && `(${merchandise.length})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {merchandise.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {isOwner ? "You haven't added any merchandise yet." : "No merchandise available yet."}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {merchandise.filter(m => m.isAvailable).map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        data-testid={`card-merch-${item.id}`}
                      >
                        {item.images.length > 0 ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-48 object-cover"
                            data-testid={`img-merch-${item.id}`}
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted flex items-center justify-center">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold mb-1" data-testid={`text-merch-name-${item.id}`}>
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold" data-testid={`text-merch-price-${item.id}`}>
                              ${item.price}
                            </span>
                            <Badge variant={item.stock > 0 ? "default" : "secondary"}>
                              {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Songs</p>
                    <p className="font-medium">{songs.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Plays</p>
                    <p className="font-medium">
                      {songs.reduce((acc, song) => acc + song.plays, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
