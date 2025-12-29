import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { ArrowDownUp, Settings2, AlertCircle, Zap, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { useBTF2300 } from "@/hooks/use-btf2300";
import { useArtistTokens } from "@/hooks/use-artist-tokens";
import { TOKEN_PREFIXES } from "@/lib/btf2300-config";
import { formatEther } from "viem";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function SwapInterface() {
  const { toast } = useToast();
  const { isConnected, address, isWeb3Ready } = useWeb3();
  const btf2300 = useBTF2300();
  const artistTokens = useArtistTokens();
  
  const [swapMode, setSwapMode] = useState<'buy' | 'sell'>('buy'); // buy = MATIC to token, sell = token to MATIC
  const [selectedToken, setSelectedToken] = useState("");
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [isSuccess, setIsSuccess] = useState(false);
  const [poolInfo, setPoolInfo] = useState<any>(null);

  // Get the token ID from selected artist
  const getTokenId = useCallback((tokenIdStr: string) => {
    const artistId = parseInt(tokenIdStr);
    return TOKEN_PREFIXES.ARTIST + artistId;
  }, []);

  // Fetch pool info when token is selected
  useEffect(() => {
    if (selectedToken) {
      const tokenId = getTokenId(selectedToken);
      btf2300.getPoolInfo(tokenId).then(setPoolInfo);
    }
  }, [selectedToken, btf2300, getTokenId]);

  // Calculate expected output when input changes
  useEffect(() => {
    const calculateOutput = async () => {
      if (!selectedToken || !inputAmount || parseFloat(inputAmount) <= 0) {
        setOutputAmount("");
        return;
      }

      const tokenId = getTokenId(selectedToken);
      
      if (swapMode === 'buy') {
        // Buying tokens with MATIC
        const expectedTokens = await btf2300.getExpectedTokensOut(tokenId, inputAmount);
        setOutputAmount(expectedTokens.toString());
      } else {
        // Selling tokens for MATIC
        const expectedMatic = await btf2300.getExpectedEthOut(tokenId, parseInt(inputAmount));
        setOutputAmount(expectedMatic);
      }
    };

    const debounce = setTimeout(calculateOutput, 300);
    return () => clearTimeout(debounce);
  }, [inputAmount, selectedToken, swapMode, btf2300, getTokenId]);

  const handleSwap = async () => {
    if (!selectedToken || !inputAmount) {
      toast({
        title: "Error",
        description: "Selecciona un token y cantidad",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Wallet no conectada",
        description: "Conecta tu wallet primero",
        variant: "destructive",
      });
      return;
    }

    const tokenId = getTokenId(selectedToken);
    let result;

    try {
      if (swapMode === 'buy') {
        // Buy tokens with MATIC via DEX
        const minTokensOut = parseInt(outputAmount) || 0;
        result = await btf2300.buyTokensFromDEX(
          tokenId,
          inputAmount,
          minTokensOut,
          parseFloat(slippage)
        );
      } else {
        // Sell tokens for MATIC via DEX
        const tokenAmount = parseInt(inputAmount);
        result = await btf2300.sellTokens(
          tokenId,
          tokenAmount,
          outputAmount,
          parseFloat(slippage)
        );
      }

      if (result.success) {
        setIsSuccess(true);
        setInputAmount("");
        setOutputAmount("");
        
        // Refresh pool info
        btf2300.getPoolInfo(tokenId).then(setPoolInfo);
        
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Swap error:', error);
    }
  };

  const toggleSwapMode = () => {
    setSwapMode(swapMode === 'buy' ? 'sell' : 'buy');
    setInputAmount(outputAmount);
    setOutputAmount(inputAmount);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700 hover:border-orange-500/30 transition">
      <CardHeader className="border-b border-slate-700/50">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-400" />
          Swap Artist Tokens
          <Badge className="ml-auto bg-purple-500/20 text-purple-300 border-purple-500/30">
            Polygon Mainnet
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Mode Indicator */}
        <div className="flex gap-2">
          <Button
            variant={swapMode === 'buy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSwapMode('buy')}
            className={swapMode === 'buy' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            Comprar Tokens
          </Button>
          <Button
            variant={swapMode === 'sell' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSwapMode('sell')}
            className={swapMode === 'sell' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            Vender Tokens
          </Button>
        </div>

        {/* Token Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Seleccionar Token de Artista</Label>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 hover:border-orange-500/50">
              <SelectValue placeholder="Selecciona un artista" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {artistTokens.map((token) => (
                <SelectItem key={token.id} value={token.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{token.symbol}</span>
                    <span className="text-muted-foreground text-xs">${token.price.toFixed(2)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input Amount */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            {swapMode === 'buy' ? 'Cantidad (MATIC)' : 'Cantidad (Tokens)'}
          </Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.0"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="bg-slate-900/50 text-lg pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {swapMode === 'buy' ? 'MATIC' : 'Tokens'}
            </span>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <Button
            size="icon"
            variant="outline"
            onClick={toggleSwapMode}
            className="rounded-full hover:bg-orange-500/20 border-orange-500/50"
          >
            <ArrowDownUp className="h-4 w-4 text-orange-400" />
          </Button>
        </div>

        {/* Output Amount */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            Recibirás ({swapMode === 'buy' ? 'Tokens' : 'MATIC'})
          </Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="0.0"
              value={outputAmount}
              disabled
              className="bg-slate-900/50 text-lg opacity-70 pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {swapMode === 'buy' ? 'Tokens' : 'MATIC'}
            </span>
          </div>
        </div>

        {/* Pool Info */}
        {poolInfo && poolInfo.isActive && (
          <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reserva de Tokens</span>
              <span className="text-white font-medium">{poolInfo.tokenReserve.toString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reserva de MATIC</span>
              <span className="text-white font-medium">{formatEther(poolInfo.ethReserve)} MATIC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee Acumulado</span>
              <span className="text-green-400 font-medium">{formatEther(poolInfo.feeAccumulated)} MATIC</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-700">
              <span className="text-muted-foreground">Max Slippage</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-16 h-8 text-xs bg-slate-800 border-slate-600"
                  min="0.1"
                  max="50"
                  step="0.1"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        )}

        {/* No Pool Warning */}
        {selectedToken && (!poolInfo || !poolInfo.isActive) && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 text-sm font-semibold">Pool no disponible</p>
              <p className="text-yellow-400/70 text-xs">Este token aún no tiene liquidez en el DEX</p>
            </div>
          </div>
        )}

        {/* Wallet Warning */}
        {!isConnected && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-400 text-xs">Conecta tu wallet para ejecutar swaps</p>
          </div>
        )}

        {/* Connect Wallet Button - uses RainbowKit when Web3 is ready */}
        {!isConnected && (
          <div className="w-full flex justify-center">
            {isWeb3Ready ? (
              <ConnectButton 
                showBalance={false}
                chainStatus="icon"
                accountStatus="address"
                label="🔗 Conectar Wallet para Swap"
              />
            ) : (
              <Button 
                onClick={() => toast({ title: "⏳ Inicializando Web3...", description: "Por favor espera un momento e intenta de nuevo" })}
                className="w-full bg-purple-500 hover:bg-purple-600 text-lg py-6"
              >
                Conectar Wallet
              </Button>
            )}
          </div>
        )}

        {/* Swap Button - only shown when connected */}
        {isConnected && (
          <Button
            onClick={handleSwap}
            disabled={btf2300.isLoading || !selectedToken || !inputAmount || isSuccess}
            className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-6 disabled:opacity-50"
          >
            {btf2300.isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Procesando en Polygon...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                ¡Swap Exitoso!
              </>
            ) : (
              <>
                {swapMode === 'buy' ? 'Comprar' : 'Vender'} Tokens
              </>
            )}
          </Button>
        )}

        {/* Transaction Link */}
        {btf2300.txHash && (
          <a 
            href={`https://polygonscan.com/tx/${btf2300.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="h-4 w-4" />
            Ver transacción en PolygonScan
          </a>
        )}
      </CardContent>
    </Card>
  );
}
