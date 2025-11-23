import React, { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  Music2,
  Target,
  Zap,
  Award,
  Calendar,
  X,
  BarChart3,
  Rocket,
  ShoppingCart,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ArtistProfile } from "@/data/artist-profiles";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BOOSTIFY_CONTRACT_ADDRESS, ERC1155_ABI } from "@/lib/web3-config";
import { ArtistProgressWidget } from "./artist-progress-widget";

interface ArtistDetailModalProps {
  artist: ArtistProfile | null;
  isOpen: boolean;
  onClose: () => void;
  artistImage?: string;
}

export function ArtistDetailModal({
  artist,
  isOpen,
  onClose,
  artistImage,
}: ArtistDetailModalProps) {
  // Early return BEFORE any hooks - required for React Hook Rules
  if (!artist) return null;
  
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Generate chart data for growth trends
  const generateGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
      month,
      fans: artist.fans * (1 + (artist.growthMetrics.monthlyGrowth / 100) * i),
      streams: artist.streams * (1 + (artist.growthMetrics.monthlyGrowth / 100) * i),
      tokenValue: 0.50 * (1 + (artist.growthMetrics.tokenAppreciation / 100) * i / 12)
    }));
  };

  const handleBuyTokens = async (selectedArtist: ArtistProfile) => {
    if (!isConnected) {
      toast({
        title: "Wallet no conectada",
        description: "Por favor conecta tu MetaMask para comprar tokens",
        variant: "destructive",
      });
      return;
    }

    if (!address) {
      toast({
        title: "Error",
        description: "No se pudo obtener tu dirección de wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      console.log("🛒 Comprando tokens para:", selectedArtist.name);

      // Convert 100 tokens at 0.005 ETH each
      const tokenAmount = BigInt(100);
      const pricePerTokenEth = "0.005"; // 0.005 ETH por token
      const totalPrice = parseFloat(pricePerTokenEth) * 100;
      const value = parseEther(totalPrice.toString());

      // Call the smart contract using safeBatchTransferFrom or mint function
      // Using the correct function that exists in ERC1155 standard
      writeContract({
        address: BOOSTIFY_CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC1155_ABI,
        functionName: "mint",
        args: [address, BigInt(selectedArtist.id), tokenAmount, "0x"],
        value,
      });

      toast({
        title: "✅ Transacción enviada",
        description: `Comprando 100 tokens de ${selectedArtist.name}...`,
      });
    } catch (error: any) {
      console.error("❌ Error:", error);
      toast({
        title: "Error en la compra",
        description: error.message || "No se pudo procesar la compra",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle transaction confirmation
  React.useEffect(() => {
    if (isSuccess) {
      toast({
        title: "✅ Compra exitosa!",
        description: `Transacción confirmada: ${hash}`,
      });
      onClose();
    }
    if (writeError) {
      toast({
        title: "❌ Transacción cancelada",
        description: writeError.message,
        variant: "destructive",
      });
    }
  }, [isSuccess, writeError, hash, toast, onClose]);

  const potentialColors = {
    High: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "Very High": "bg-purple-500/20 text-purple-300 border-purple-500/30",
    Exceptional: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50 text-white max-h-[90vh] overflow-y-auto">
        {/* Artist Image Header */}
        {artistImage && (
          <div className="relative w-full h-48 -mx-6 -mt-6 mb-4 rounded-t-lg overflow-hidden">
            <img 
              src={artistImage} 
              alt={artist.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900" />
          </div>
        )}
        
        <DialogHeader className={`${artistImage ? 'border-t border-slate-700/30' : 'border-b border-slate-700/30'} pb-4`}>
          <div className="flex items-start justify-between w-full">
            <div className="flex-1">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                {artist.name}
              </DialogTitle>
              <p className="text-muted-foreground mt-1">{artist.genre}</p>
            </div>
            <Badge
              className={`${potentialColors[artist.investmentPotential]} border text-sm py-1 px-3`}
            >
              {artist.investmentPotential}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Artist Progress Milestones */}
          <ArtistProgressWidget 
            milestones={artist.milestones}
            streams={artist.streams}
          />

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-lg p-4 border border-orange-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-orange-400" />
                <p className="text-xs text-muted-foreground">Fans</p>
              </div>
              <p className="text-lg font-bold text-orange-300">
                {(artist.fans / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-green-400 mt-1">↑ +12.5%/mo</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Music2 className="h-4 w-4 text-purple-400" />
                <p className="text-xs text-muted-foreground">Streams</p>
              </div>
              <p className="text-lg font-bold text-purple-300">
                {(artist.streams / 1000000).toFixed(0)}M
              </p>
              <p className="text-xs text-green-400 mt-1">↑ +145%/year</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <p className="text-xs text-muted-foreground">ROI</p>
              </div>
              <p className="text-lg font-bold text-green-400">+{artist.roi}%</p>
              <p className="text-xs text-orange-300 mt-1">Token Potential</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 rounded-lg p-4 border border-pink-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-pink-400" />
                <p className="text-xs text-muted-foreground">Active Since</p>
              </div>
              <p className="text-lg font-bold text-pink-300">{artist.founded}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date().getFullYear() - artist.founded} years</p>
            </div>
          </div>

          {/* Growth Trend Chart */}
          <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              <h3 className="font-semibold">6-Month Growth Projection</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={generateGrowthData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                <XAxis dataKey="month" stroke="rgba(148,163,184,0.5)" />
                <YAxis stroke="rgba(148,163,184,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(100,116,139,0.3)' }} />
                <Legend />
                <Line type="monotone" dataKey="tokenValue" stroke="#ff8800" strokeWidth={2} name="Token Value ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Growth Metrics */}
          <div className="bg-gradient-to-r from-slate-800/40 to-slate-900/40 rounded-lg p-4 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-orange-400" />
              <h3 className="font-semibold">Growth Metrics</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Monthly Growth
                </p>
                <p className="text-2xl font-bold text-blue-400">
                  +{artist.growthMetrics.monthlyGrowth}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Yearly Growth
                </p>
                <p className="text-2xl font-bold text-purple-400">
                  +{artist.growthMetrics.yearlyGrowth}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Token Appreciation
                </p>
                <p className="text-2xl font-bold text-green-400">
                  +{artist.growthMetrics.tokenAppreciation}%
                </p>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-yellow-400" />
              <h3 className="font-semibold">Achievements & Highlights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {artist.highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/20 flex items-start gap-2"
                >
                  <Zap className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Market Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-pink-400" />
                <p className="text-xs text-muted-foreground">Target Audience</p>
              </div>
              <p className="text-sm font-semibold">{artist.targetAudience}</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <p className="text-xs text-muted-foreground">Market Size</p>
              </div>
              <p className="text-sm font-semibold">{artist.marketSize}</p>
            </div>
          </div>

          {/* Roadmap */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="h-5 w-5 text-orange-400" />
              <h3 className="font-semibold">Roadmap</h3>
            </div>
            <div className="space-y-2">
              {artist.roadmap.map((milestone, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-lg p-3 border border-orange-500/20 flex items-start gap-3"
                >
                  <div className="bg-orange-500/30 rounded-full p-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                  </div>
                  <p className="text-sm">{milestone}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Artist Profile Link */}
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/10 rounded-lg p-4 border border-blue-500/30">
            <p className="text-sm text-muted-foreground mb-3">
              Learn more about{" "}
              <span className="font-semibold text-blue-300">
                {artist.name}
              </span>
            </p>
            <a 
              href={`/artist/${artist.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="w-full inline-block"
            >
              <Button 
                variant="outline"
                className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
              >
                Visit Profile Page
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>

          {/* Investment Call to Action */}
          <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/10 rounded-lg p-4 border border-orange-500/30">
            <p className="text-sm text-muted-foreground mb-3">
              Ready to invest in{" "}
              <span className="font-semibold text-orange-300">
                {artist.name}
              </span>
              's future?
            </p>
            <div className="space-y-3">
              {!isConnected && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-300">Conecta tu MetaMask para comprar</p>
                </div>
              )}
              <Button 
                onClick={() => handleBuyTokens(artist)}
                disabled={isProcessing || isConfirming || !isConnected}
                className="w-full bg-orange-500 hover:bg-orange-600 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-buy-artist-token"
              >
                {!isConnected ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Connect MetaMask
                  </>
                ) : isProcessing || isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isConfirming ? "Confirmando..." : "Procesando..."}
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    ¡Compra exitosa!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Comprar 100 Tokens - 0.5 ETH
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-400 text-center">
                {isConnected ? (
                  <>💳 100 tokens @ 0.005 ETH • Pago seguro en blockchain</>
                ) : (
                  <>Conecta tu MetaMask para comprar</>
                )}
              </p>
              {hash && (
                <p className="text-xs text-slate-500 text-center truncate">
                  TX: {hash}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
