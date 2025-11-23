import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { CheckoutForm } from "./CheckoutForm";

interface BidFormProps {
  requestId: number;
  musicianId: number;
  onBidPlaced: () => void;
}

export function BidForm({ requestId, musicianId, onBidPlaced }: BidFormProps) {
  const [bidPrice, setBidPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [description, setDescription] = useState("");
  const [revisionIncluded, setRevisionIncluded] = useState("3");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidPrice || !deliveryDays) {
      toast({ title: "Error", description: "Price and delivery days are required", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      await apiRequest({
        url: "/api/social/service-bids",
        method: "POST",
        data: {
          requestId,
          musicianId,
          bidPrice,
          deliveryDays: parseInt(deliveryDays),
          description: description || undefined,
          revisionIncluded: parseInt(revisionIncluded),
        }
      });

      toast({ title: "Success", description: "Bid placed successfully!" });
      setBidPrice("");
      setDeliveryDays("7");
      setDescription("");
      setRevisionIncluded("3");
      onBidPlaced();
    } catch (error) {
      toast({ title: "Error", description: "Failed to place bid", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-orange-500 hover:bg-orange-600">
          Place a Bid
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Submit Your Bid</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Your Price ($)</Label>
            <Input
              type="number"
              value={bidPrice}
              onChange={(e) => setBidPrice(e.target.value)}
              placeholder="e.g., 250"
              className="mt-2"
              step="0.01"
            />
          </div>

          <div>
            <Label>Delivery Time (Days)</Label>
            <Input
              type="number"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              placeholder="7"
              className="mt-2"
              min="1"
            />
          </div>

          <div>
            <Label>Revisions Included</Label>
            <select
              value={revisionIncluded}
              onChange={(e) => setRevisionIncluded(e.target.value)}
              className="w-full mt-2 px-3 py-2 border rounded-md bg-background"
            >
              <option value="1">1 revision</option>
              <option value="2">2 revisions</option>
              <option value="3">3 revisions</option>
              <option value="5">5 revisions</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>

          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your approach, experience, or any special details..."
              className="mt-2 min-h-20"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={isLoading}
          >
            {isLoading ? "Placing Bid..." : "Place Bid"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface BidListProps {
  requestId: number;
  bids: any[];
  clientId: number;
  currentUserId?: number;
  onBidAccepted?: () => void;
  clientEmail?: string;
}

export function BidList({ requestId, bids, clientId, currentUserId, onBidAccepted, clientEmail }: BidListProps) {
  const { toast } = useToast();

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Bids ({bids.length})</h4>
      {bids.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bids yet</p>
      ) : (
        bids.map((bid) => (
          <Card key={bid.id} className="border-orange-500/10">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{bid.musician?.displayName}</p>
                    <p className="text-sm text-muted-foreground">{bid.description || "No description provided"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-500">${parseFloat(bid.bidPrice)}</p>
                    <p className="text-xs text-muted-foreground">{bid.deliveryDays} days delivery</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>✓ {bid.revisionIncluded} revisions included</span>
                  <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-200 capitalize">
                    {bid.status}
                  </span>
                </div>
                {currentUserId === clientId && bid.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <CheckoutForm
                      bidId={bid.id}
                      bidPrice={Math.round(parseFloat(bid.bidPrice) * 100)}
                      musicianName={bid.musician?.displayName || "Musician"}
                      onPaymentComplete={onBidAccepted || (() => {})}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
