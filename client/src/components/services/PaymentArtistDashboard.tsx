import { useAuth } from "../../hooks/use-auth";
import { ArtistWalletPanel } from "./ArtistWalletPanel";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DollarSign, TrendingUp } from "lucide-react";

export function PaymentArtistDashboard() {
  const { user } = useAuth() || {};

  if (!user || !user.id) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Earnings & Payments</h2>
        <p className="text-muted-foreground">Manage your wallet and payouts</p>
      </div>

      <ArtistWalletPanel musicianId={user.id as any} />

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-900/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-500" />
            How it Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">📝 1. Client Accepts Your Bid</p>
            <p>When a client accepts your service bid and completes payment, 80% goes to your wallet immediately.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">🏦 2. Connect Your Bank</p>
            <p>Link your bank account via Stripe to enable payouts. We verify your account for security.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">💸 3. Request Payout</p>
            <p>Withdraw your earnings anytime. Payouts are processed within 1-2 business days.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
