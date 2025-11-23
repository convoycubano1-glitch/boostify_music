import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Wallet, DollarSign, TrendingUp, Loader2, AlertCircle, Check } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";

interface WalletData {
  balance: number;
  totalEarned: number;
  totalPaidOut: number;
  stripeConnectId?: string;
  bankStatus: string;
}

interface ArtistWalletPanelProps {
  musicianId: number;
}

export function ArtistWalletPanel({ musicianId }: ArtistWalletPanelProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const { toast } = useToast();

  const loadWallet = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest({
        url: `/api/payments/wallet/${musicianId}`,
        method: "GET",
      }) as any;
      setWalletData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [musicianId]);

  const handleConnectStripe = async () => {
    try {
      setIsConnecting(true);
      const result = await apiRequest({
        url: "/api/payments/connect-account",
        method: "POST",
        data: { musicianId },
      }) as any;

      if (result.accountLink) {
        window.location.href = result.accountLink;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect Stripe account",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || isNaN(Number(payoutAmount))) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const amountInCents = Math.round(Number(payoutAmount) * 100);

    if (walletData && amountInCents > walletData.balance) {
      toast({
        title: "Error",
        description: "Insufficient balance",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRequestingPayout(true);
      await apiRequest({
        url: "/api/payments/payout-request",
        method: "POST",
        data: { musicianId, amount: amountInCents },
      });

      toast({
        title: "Success",
        description: "Payout request submitted. You'll receive it within 1-2 business days.",
      });
      setPayoutAmount("");
      await loadWallet();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request payout",
        variant: "destructive",
      });
    } finally {
      setIsRequestingPayout(false);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading wallet...</div>;
  }

  if (!walletData) {
    return null;
  }

  const isConnected = walletData.bankStatus !== "pending" && walletData.stripeConnectId;

  return (
    <div className="space-y-4">
      {/* Main Wallet Card */}
      <Card className="border-orange-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-orange-500" />
            Your Earnings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance Display */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-orange-500/20">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm text-muted-foreground">Available Balance</span>
              <span className="text-3xl font-bold text-orange-400">
                ${(walletData.balance / 100).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Ready to withdraw</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Total Earned</span>
              </div>
              <p className="text-lg font-bold">${(walletData.totalEarned / 100).toFixed(2)}</p>
            </div>
            <div className="bg-slate-800/50 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Paid Out</span>
              </div>
              <p className="text-lg font-bold">${(walletData.totalPaidOut / 100).toFixed(2)}</p>
            </div>
          </div>

          {/* Connect Stripe */}
          {!isConnected && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
              <p className="text-sm text-yellow-200 mb-3">
                Connect your bank account to receive payouts
              </p>
              <Button
                onClick={handleConnectStripe}
                disabled={isConnecting}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  "Connect Bank Account"
                )}
              </Button>
            </div>
          )}

          {isConnected && (
            <div className="bg-green-900/20 border border-green-500/30 rounded p-3 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <p className="text-xs text-green-200">Bank account connected</p>
            </div>
          )}

          {/* Payout Request */}
          {isConnected && walletData.balance > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full bg-orange-500 hover:bg-orange-600" disabled={!isConnected}>
                  Request Payout
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Request Payout</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="bg-slate-800/50 p-3 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Available to withdraw</p>
                    <p className="text-2xl font-bold text-orange-400">
                      ${(walletData.balance / 100).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <Label>Amount to Withdraw</Label>
                    <Input
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      max={walletData.balance / 100}
                      className="mt-2"
                      disabled={isRequestingPayout}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Max: ${(walletData.balance / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 flex gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200">
                      Payouts are processed within 1-2 business days
                    </p>
                  </div>

                  <Button
                    onClick={handleRequestPayout}
                    disabled={isRequestingPayout || !payoutAmount}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {isRequestingPayout ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      "Request Payout"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
