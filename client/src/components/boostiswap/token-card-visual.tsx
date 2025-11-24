import React, { useState } from "react";
import { Music2 } from "lucide-react";

interface Track {
  id: string;
  title: string;
  duration: number;
  url: string;
}

interface TokenCardVisualProps {
  songName: string;
  artistName: string;
  tokenSymbol: string;
  price: number;
  artistImage: string;
  songImageUrl?: string;
  change24h: number;
  tracks?: Track[];
}

export function TokenCardVisual({
  songName,
  artistName,
  tokenSymbol,
  price,
  artistImage,
  songImageUrl,
  change24h,
  tracks,
}: TokenCardVisualProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    console.log("🎨 TokenCardVisual - Artist:", artistName, "Image URL:", artistImage);
    if (artistImage) {
      const img = new Image();
      img.onload = () => console.log("✅ Image loaded:", artistImage);
      img.onerror = () => console.error("❌ Image failed:", artistImage);
      img.src = artistImage;
    }
  }, [artistImage, artistName]);

  return (
    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-orange-500/30 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-purple-900/30 to-slate-900 animate-pulse" />

      {/* Artist Profile Circle - Full Background Behind */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        {artistImage && !imageError ? (
          <img
            src={artistImage}
            alt={artistName}
            className="w-full h-full object-cover blur-2xl scale-150"
            onError={() => {
              console.error("❌ Background image failed to load:", artistImage);
              setImageError(true);
            }}
            onLoad={() => console.log("✅ Background image loaded")}
          />
        ) : (
          <Music2 className="w-32 h-32 text-orange-400" />
        )}
      </div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

      {/* Artist Profile Circle - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <div className="w-20 h-20 rounded-full border-4 border-orange-400 overflow-hidden shadow-2xl bg-gradient-to-br from-slate-700 to-slate-900 backdrop-blur-md">
          {artistImage && !imageError ? (
            <img
              src={artistImage}
              alt={artistName}
              className="w-full h-full object-cover"
              onLoad={() => {
                setImageLoaded(true);
                console.log("✅ Profile image loaded:", artistName);
              }}
              onError={() => {
                console.error("❌ Profile image failed:", artistImage);
                setImageError(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
              <Music2 className="w-10 h-10 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Token Symbol Badge - Top Left */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 backdrop-blur-md rounded-lg px-4 py-2 border border-orange-400/70 shadow-lg">
          <p className="text-white font-bold text-sm">{tokenSymbol}</p>
        </div>
      </div>

      {/* Price Change - Top Center */}
      {change24h !== undefined && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div
            className={`px-4 py-2 rounded-lg font-bold text-xs border shadow-lg backdrop-blur-md ${
              change24h >= 0
                ? "bg-gradient-to-r from-green-500 to-green-600 border-green-400/70 text-white"
                : "bg-gradient-to-r from-red-500 to-red-600 border-red-400/70 text-white"
            }`}
          >
            {change24h >= 0 ? "↑ +" : "↓ "}{change24h.toFixed(2)}%
          </div>
        </div>
      )}

      {/* Content - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10 space-y-3">
        {/* Song Title */}
        <div className="mb-4">
          <h3 className="text-white font-bold text-lg leading-tight truncate drop-shadow-lg">
            {songName}
          </h3>
          <p className="text-orange-300 text-sm font-semibold drop-shadow">{artistName}</p>
        </div>

        {/* Price - Bottom */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-orange-200/80 uppercase tracking-wider font-semibold mb-1">
              Price
            </p>
            <p className="text-3xl font-bold text-orange-400 drop-shadow-lg">
              ${price.toFixed(2)}
            </p>
          </div>

          {/* Music Note Icon */}
          <div className="text-5xl opacity-30 animate-bounce">♪</div>
        </div>
      </div>

      {/* Premium Border Glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/20 via-transparent to-purple-400/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Shine effect for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-xl" />
    </div>
  );
}
