import React from "react";
import { useArtistTokens } from "@/hooks/use-artist-tokens";
import { TrendingUp, TrendingDown } from "lucide-react";

export function ArtistPricesTicker() {
  const artistTokens = useArtistTokens();

  if (!artistTokens || artistTokens.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800/40 border-t border-b border-slate-700/50 py-2 px-4 overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-6 min-w-min">
          {artistTokens.map((token) => (
            <div
              key={token.id}
              className="flex-shrink-0 flex items-center gap-1.5 hover:opacity-80 transition"
            >
              <span className="text-xs font-bold text-white whitespace-nowrap">{token.symbol}</span>
              <span className="text-xs font-semibold text-orange-400">${token.price.toFixed(2)}</span>
              <div className={`flex items-center text-xs font-semibold whitespace-nowrap ${
                token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {token.change24h >= 0 ? (
                  <TrendingUp className="h-2.5 w-2.5" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5" />
                )}
                {Math.abs(token.change24h).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
