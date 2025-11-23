import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { ArrowDownUp, Settings2, AlertCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { useArtistTokens } from "@/hooks/use-artist-tokens";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function SwapInterface() {
  const { toast } = useToast();
  const { isConnected, address } = useWeb3();
  const artistTokens = useArtistTokens();
  const [inputToken, setInputToken] = useState("");
  const [outputToken, setOutputToken] = useState("");
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch estimate when input changes
  const { data: estimate } = useQuery({
    queryKey: ['/api/boostiswap/contracts/estimate-swap', inputAmount, inputToken, outputToken],
    queryFn: async () => {
      if (!inputAmount || !inputToken || !outputToken) return null;
      return apiRequest({
        url: '/api/boostiswap/contracts/estimate-swap',
        method: 'GET',
        data: {
          amountIn: inputAmount,
          tokenIn: inputToken,
          tokenOut: outputToken
        }
      });
    },
    enabled: !!inputAmount && !!inputToken && !!outputToken,
  });

  // Update output amount when estimate changes
  useEffect(() => {
    if (estimate?.estimate?.amountOut) {
      setOutputAmount(estimate.estimate.amountOut.toFixed(4));
    }
  }, [estimate]);

  const handleSwap = async () => {
    if (!inputToken || !outputToken || !inputAmount) {
      toast({
        title: "Error",
        description: "Fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest({
        url: '/api/boostiswap/contracts/swap',
        method: 'POST',
        data: {
          userId: 1,
          tokenInId: parseInt(inputToken),
          tokenOutId: parseInt(outputToken),
          amountIn: parseFloat(inputAmount),
          minAmountOut: parseFloat(outputAmount) * (1 - parseFloat(slippage) / 100),
          walletAddress: address,
        }
      });

      toast({
        title: "✅ Swap Successful",
        description: `You received ${result.swap.amountOut.toFixed(4)} tokens`,
      });

      setInputAmount("");
      setOutputAmount("");
    } catch (error) {
      toast({
        title: "Swap Failed",
        description: "Transaction could not be completed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const swapTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount(outputAmount);
    setOutputAmount(inputAmount);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700 hover:border-orange-500/30 transition">
      <CardHeader className="border-b border-slate-700/50">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-400" />
          Swap Artist Tokens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Token Input */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">From (Token In)</Label>
          <Select value={inputToken} onValueChange={setInputToken}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 hover:border-orange-500/50">
              <SelectValue placeholder="Select artist token" />
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
          <Input
            type="number"
            placeholder="0.0"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            className="bg-slate-900/50 text-lg"
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            size="icon"
            variant="outline"
            onClick={swapTokens}
            className="rounded-full hover:bg-orange-500/20 border-orange-500/50"
          >
            <ArrowDownUp className="h-4 w-4 text-orange-400" />
          </Button>
        </div>

        {/* Token Output */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">To (Token Out)</Label>
          <Select value={outputToken} onValueChange={setOutputToken}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 hover:border-orange-500/50">
              <SelectValue placeholder="Select artist token" />
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
          <Input
            type="number"
            placeholder="0.0"
            value={outputAmount}
            onChange={(e) => setOutputAmount(e.target.value)}
            disabled
            className="bg-slate-900/50 text-lg opacity-50"
          />
        </div>

        {/* Swap Info & Slippage */}
        {estimate?.estimate && (
          <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <span className="text-white font-medium">1 {artistTokens.find(t => t.id === inputToken)?.symbol} = {(parseFloat(outputAmount) / parseFloat(inputAmount) || 0).toFixed(4)} {artistTokens.find(t => t.id === outputToken)?.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price Impact</span>
              <span className={parseFloat(estimate.estimate.priceImpact) > 5 ? "text-red-400" : "text-orange-400"}>
                {estimate.estimate.priceImpact}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Boostify Fee (5%)</span>
              <span className="text-xs text-yellow-400">{estimate.estimate.boostifyFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">LP Reward (0.25%)</span>
              <span className="text-xs text-green-400">{estimate.estimate.lpReward}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-700">
              <span className="text-muted-foreground">Max Slippage</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-16 h-8 text-xs bg-slate-800 border-slate-600"
                  min="0"
                  max="50"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Warning */}
        {!isConnected && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-400 text-xs">Connect your wallet to execute swaps</p>
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={!isConnected || isLoading || !estimate?.estimate}
          className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-6 disabled:opacity-50"
        >
          {!isConnected ? "Connect Wallet" : isLoading ? "Processing..." : "Swap"}
        </Button>
      </CardContent>
    </Card>
  );
}
