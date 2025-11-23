import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Plus, Trash2, Loader2 } from "lucide-react";
import { AddLiquidityModal } from "./add-liquidity-modal";

interface MyLiquidityProps {
  userId: string | number;
}

export function MyLiquidity({ userId }: MyLiquidityProps) {
  const { toast } = useToast();

  // Mock liquidity positions for demo
  const mockPositions = [
    {
      id: 1,
      pair: "Luna Echo / USDC",
      shares: "2.5",
      value: "$2,850.50",
      earned: "$156.25",
      token1Amount: "150",
      token2Amount: "2500",
      poolId: 1,
    },
    {
      id: 2,
      pair: "Urban Flow / USDC",
      shares: "1.8",
      value: "$1,920.75",
      earned: "$89.42",
      token1Amount: "100",
      token2Amount: "1800",
      poolId: 3,
    },
  ];

  const removeLiquidityMutation = useMutation({
    mutationFn: async (positionId: number) => {
      return apiRequest({
        url: "/api/boostiswap/contracts/liquidity/remove",
        method: "POST",
        data: {
          userId,
          positionId,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Liquidity Removed",
        description: "Your liquidity position has been closed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/boostiswap/positions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove liquidity",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">My Liquidity Positions</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Total earned: <span className="text-green-400 font-semibold">$245.67</span>
          </p>
        </div>
        <AddLiquidityModal triggerLabel="Add Liquidity" />
      </div>

      {mockPositions.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700">
          <CardContent className="pt-12 pb-12 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No liquidity positions yet</p>
            <AddLiquidityModal triggerLabel="Create First Position" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {mockPositions.map((pos) => (
            <Card
              key={pos.id}
              className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700 hover:border-orange-500/50 transition"
              data-testid={`liquidity-position-${pos.id}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold">
                        💧
                      </div>
                      <h3 className="font-bold text-lg text-white">{pos.pair}</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-muted-foreground text-xs">LP Tokens</p>
                        <p className="font-semibold text-white text-lg">{pos.shares}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Position Value</p>
                        <p className="font-semibold text-white text-lg">{pos.value}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Fees Earned</p>
                        <p className="font-semibold text-green-400 text-lg">{pos.earned}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Pool APY</p>
                        <p className="font-semibold text-orange-400 text-lg">14.2%</p>
                      </div>
                    </div>

                    {/* Token breakdown */}
                    <div className="bg-slate-900/50 rounded-lg p-3 text-xs space-y-1">
                      <p className="text-muted-foreground">
                        Your stake: {pos.token1Amount} + {pos.token2Amount} USDC
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-500/50 hover:border-orange-500"
                    >
                      Increase
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => removeLiquidityMutation.mutate(pos.id)}
                      disabled={removeLiquidityMutation.isPending}
                    >
                      {removeLiquidityMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
