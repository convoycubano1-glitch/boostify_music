import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { SwapInterface } from "../components/boostiswap/swap-interface";
import { PoolsView } from "../components/boostiswap/pools-view";
import { MyLiquidity } from "../components/boostiswap/my-liquidity";
import { DashboardView } from "../components/boostiswap/dashboard-view";
import { ArtistTokensMarketplace } from "../components/boostiswap/artist-tokens-marketplace";
import { WalletConnectButton } from "../components/boostiswap/wallet-connect-button";
import { CryptoPriceWidget } from "../components/boostiswap/crypto-price-widget";
import { ArtistPricesTicker } from "../components/boostiswap/artist-prices-ticker";
import { useWeb3 } from "../hooks/use-web3";
import { Zap, Droplets, TrendingUp, Wallet, AlertCircle, Music2 } from "lucide-react";

export default function BoostiSwapPage() {
  const { isConnected, address, balanceFormatted, symbol } = useWeb3();
  const [activeTab, setActiveTab] = useState("artists");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Wallet Connect */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">BoostiSwap</h1>
                <p className="text-sm text-orange-400">Decentralized Music Token Exchange</p>
              </div>
            </div>
            <WalletConnectButton />
          </div>

          {/* Wallet Status Alert */}
          {!isConnected && (
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-medium text-sm">Connect your wallet to use BoostiSwap</p>
                <p className="text-amber-400/70 text-xs mt-1">You need a compatible wallet (MetaMask, WalletConnect, etc.) to execute swaps</p>
              </div>
            </div>
          )}

          {/* Connected Wallet Info */}
          {isConnected && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
              <p className="text-green-400 text-sm">
                ✅ Connected • Balance: <span className="font-semibold">{balanceFormatted} {symbol}</span>
              </p>
            </div>
          )}
        </div>

        {/* Crypto Price Widget */}
        <div className="mb-4">
          <CryptoPriceWidget />
        </div>

        {/* Artist Prices Ticker */}
        <div className="mb-6">
          <ArtistPricesTicker />
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-700 rounded-lg p-4 hover:border-orange-500/50 transition">
            <div className="text-sm text-muted-foreground">24h Volume</div>
            <div className="text-2xl font-bold text-orange-400">$2.4M</div>
            <div className="text-xs text-green-400 mt-1">+12.5%</div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-700 rounded-lg p-4 hover:border-orange-500/50 transition">
            <div className="text-sm text-muted-foreground">Total Liquidity</div>
            <div className="text-2xl font-bold text-orange-400">$8.2M</div>
            <div className="text-xs text-green-400 mt-1">+8.3%</div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-700 rounded-lg p-4 hover:border-orange-500/50 transition">
            <div className="text-sm text-muted-foreground">Active Pairs</div>
            <div className="text-2xl font-bold text-orange-400">24</div>
            <div className="text-xs text-blue-400 mt-1">+3 new</div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border border-slate-700 rounded-lg p-4 hover:border-orange-500/50 transition">
            <div className="text-sm text-muted-foreground">Average APY</div>
            <div className="text-2xl font-bold text-orange-400">14.2%</div>
            <div className="text-xs text-green-400 mt-1">+2.1%</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-slate-800/50">
            <TabsTrigger value="artists" className="gap-2 flex items-center">
              <Music2 className="h-4 w-4" />
              <span className="hidden sm:inline">Artist Tokens</span>
            </TabsTrigger>
            <TabsTrigger value="swap" className="gap-2 flex items-center">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Swap</span>
            </TabsTrigger>
            <TabsTrigger value="pools" className="gap-2 flex items-center">
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">Pools</span>
            </TabsTrigger>
            <TabsTrigger value="liquidity" className="gap-2 flex items-center">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">My Liquidity</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 flex items-center">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artists" className="space-y-4">
            <ArtistTokensMarketplace />
          </TabsContent>

          <TabsContent value="swap" className="space-y-4">
            <SwapInterface />
          </TabsContent>

          <TabsContent value="pools" className="space-y-4">
            <PoolsView />
          </TabsContent>

          <TabsContent value="liquidity" className="space-y-4">
            <MyLiquidity userId={address || "guest"} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <DashboardView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
