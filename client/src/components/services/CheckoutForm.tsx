import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { CreditCard, Loader2, AlertCircle, DollarSign } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";

interface CheckoutFormProps {
  bidId: number;
  bidPrice: number;
  musicianName: string;
  onPaymentComplete: () => void;
}

export function CheckoutForm({
  bidId,
  bidPrice,
  musicianName,
  onPaymentComplete,
}: CheckoutFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [cardName, setCardName] = useState("");
  const { toast } = useToast();

  const platformFee = Math.round(bidPrice * 0.2);
  const artistReceives = bidPrice - platformFee;

  const handlePayment = async () => {
    if (!email || !cardName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Create payment intent
      const { clientSecret } = await apiRequest({
        url: "/api/payments/create",
        method: "POST",
        data: {
          bidId,
          amount: bidPrice,
          email,
          description: `Payment for ${musicianName}'s service`,
        },
      }) as any;

      // In production, you would use Stripe.js to confirm the payment
      // For now, we'll use the Stripe test mode
      const result = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: clientSecret.split("_secret_")[0],
        }),
      }).then((res) => res.json());

      if (result.success) {
        toast({
          title: "Success",
          description: "Payment processed successfully!",
        });
        setIsOpen(false);
        setEmail("");
        setCardName("");
        onPaymentComplete();
      } else {
        toast({
          title: "Error",
          description: result.error || "Payment failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-orange-500 hover:bg-orange-600">
          <CreditCard className="h-4 w-4" />
          Accept & Pay
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card className="border-orange-500/20 bg-slate-800/50">
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-semibold">{musicianName}</span>
              </div>
              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">${(bidPrice / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-orange-400 mb-2">
                  <span className="text-xs">Platform fee (20%):</span>
                  <span className="font-semibold">-${(platformFee / 100).toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
                  <span className="text-sm font-bold">Artist receives:</span>
                  <span className="text-lg font-bold text-green-400">
                    ${(artistReceives / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label>Cardholder Name</Label>
              <Input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
                className="mt-2"
                disabled={isLoading}
              />
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-200">
                This is a demo. Use Stripe test card: 4242 4242 4242 4242
              </p>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ${(bidPrice / 100).toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
