import React, { useState, useEffect } from "react";
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
    <div className="bg-slate-800/30 border-t border-b border-slate-700/50 py-2 px-4 overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-6 min-w-min">
          {prices.map((crypto) => (
            <div
              key={crypto.symbol}
              className="flex-shrink-0 flex items-center gap-2 hover:opacity-80 transition group"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-orange-400">
                {crypto.image}
              </div>
              <div>
                <p className="text-xs font-bold text-white whitespace-nowrap">{crypto.symbol}</p>
                <p className="text-xs text-muted-foreground">${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-semibold whitespace-nowrap ${
                crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {crypto.change24h >= 0 ? (
                  <TrendingUp className="h-2 w-2" />
                ) : (
                  <TrendingDown className="h-2 w-2" />
                )}
                {Math.abs(crypto.change24h).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
