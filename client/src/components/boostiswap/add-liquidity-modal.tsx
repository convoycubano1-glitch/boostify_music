import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWeb3 } from "@/hooks/use-web3";
import { useArtistTokens } from "@/hooks/use-artist-tokens";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus } from "lucide-react";

interface AddLiquidityModalProps {
  triggerLabel?: string;
  poolId?: number;
}

export function AddLiquidityModal({ triggerLabel = "Add Liquidity", poolId }: AddLiquidityModalProps) {
  const [open, setOpen] = useState(false);
  const [token1, setToken1] = useState("");
  const [token2, setToken2] = useState("");
  const [amount1, setAmount1] = useState("");
  const [amount2, setAmount2] = useState("");
  const { isConnected, address } = useWeb3();
  const artistTokens = useArtistTokens();
  const { toast } = useToast();

  const addLiquidityMutation = useMutation({
    mutationFn: async () => {
      if (!token1 || !token2 || !amount1 || !amount2) {
        throw new Error("Fill in all fields");
      }
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      return apiRequest({
        url: "/api/boostiswap/contracts/liquidity/add",
        method: "POST",
        data: {
          userId: 1,
          token1Id: parseInt(token1),
          token2Id: parseInt(token2),
          amount1: parseFloat(amount1),
          amount2: parseFloat(amount2),
          walletAddress: address,
        },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Liquidity Added",
        description: `Added ${amount1} + ${amount2} to pool. LP shares: ${data.liquidity.liquidityShares}`,
      });
      setOpen(false);
      setToken1("");
      setToken2("");
      setAmount1("");
      setAmount2("");
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Liquidity",
        description: error.message || "Failed to add liquidity",
        variant: "destructive",
      });
    },
  });

  // Auto-calculate amount2 based on amount1 (simple 1:1 ratio for demo)
  React.useEffect(() => {
    if (amount1 && parseFloat(amount1) > 0) {
      setAmount2((parseFloat(amount1) * 1.5).toFixed(4));
    }
  }, [amount1]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle>Add Liquidity</DialogTitle>
          <DialogDescription>Provide liquidity to earn trading fees</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isConnected && (
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-3">
              <p className="text-amber-400 text-sm">Connect your wallet first</p>
            </div>
          )}

          {/* Token 1 */}
          <div className="space-y-2">
            <Label>Token 1</Label>
            <Select value={token1} onValueChange={setToken1}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700">
                <SelectValue placeholder="Select first token" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {artistTokens.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.symbol} - {t.artist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="0.0"
              value={amount1}
              onChange={(e) => setAmount1(e.target.value)}
              className="bg-slate-900/50 border-slate-700"
            />
          </div>

          {/* Token 2 */}
          <div className="space-y-2">
            <Label>Token 2</Label>
            <Select value={token2} onValueChange={setToken2}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700">
                <SelectValue placeholder="Select second token" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {artistTokens.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.symbol} - {t.artist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="0.0"
              value={amount2}
              onChange={(e) => setAmount2(e.target.value)}
              className="bg-slate-900/50 border-slate-700"
            />
          </div>

          {/* Info */}
          {amount1 && amount2 && (
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Your share</p>
                  <p className="font-semibold text-orange-400">~0.15 LP</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pool fee APY</p>
                  <p className="font-semibold text-green-400">14.2%</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() => addLiquidityMutation.mutate()}
            disabled={!isConnected || addLiquidityMutation.isPending || !token1 || !token2 || !amount1 || !amount2}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {addLiquidityMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Liquidity"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
