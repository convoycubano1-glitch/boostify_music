import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  image: string;
}

const CRYPTO_PRICES: CryptoPrice[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67843.21, change24h: 2.5, image: '₿' },
  { symbol: 'ETH', name: 'Ethereum', price: 3451.82, change24h: 1.8, image: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', price: 142.35, change24h: 3.2, image: '◎' },
  { symbol: 'AVAX', name: 'Avalanche', price: 38.45, change24h: -1.2, image: '⛓' },
];

export function CryptoPriceWidget() {
  const [prices, setPrices] = useState<CryptoPrice[]>(CRYPTO_PRICES);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(crypto => ({
        ...crypto,
        price: crypto.price * (1 + (Math.random() - 0.5) * 0.001),
        change24h: crypto.change24h + (Math.random() - 0.5) * 0.5,
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 pb-2">
        {prices.map((crypto) => (
          <div
            key={crypto.symbol}
            className="flex-shrink-0 bg-gradient-to-br from-slate-800/80 to-slate-700/50 border border-slate-600 rounded-lg p-4 w-60 hover:border-orange-500/50 transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold">
                  {crypto.image}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{crypto.symbol}</p>
                  <p className="text-xs text-muted-foreground">{crypto.name}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-lg font-bold text-white">
                ${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {crypto.change24h >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(crypto.change24h).toFixed(2)}%
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-600/50">
              <p className="text-xs text-muted-foreground">24h Change</p>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all ${
                    crypto.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(Math.abs(crypto.change24h) * 10, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">Real-time prices update every 3 seconds • Data simulated for demo</p>
    </div>
  );
}
