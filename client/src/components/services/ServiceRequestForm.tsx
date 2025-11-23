import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Plus, Clock, DollarSign, AlertCircle, ChevronDown } from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { BidForm, BidList } from "./BidForm";
import { RevisionManager } from "./RevisionManager";
import { useAuth } from "../../hooks/use-auth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

interface ServiceRequest {
  id: number;
  title: string;
  description: string;
  serviceType: string;
  budget?: string;
  deadline?: string;
  status: string;
  client?: { displayName: string; avatar?: string };
  bidsCount?: number;
}

interface ServiceRequestFormProps {
  clientId: number;
  onRequestCreated: () => void;
}

export function ServiceRequestForm({ clientId, onRequestCreated }: ServiceRequestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("vocals");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast({ title: "Error", description: "Title and description are required", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      await apiRequest({
        url: "/api/social/service-requests",
        method: "POST",
        data: {
          clientId,
          title,
          description,
          serviceType,
          budget: budget || undefined,
          deadline: deadline || undefined,
        }
      });

      toast({ title: "Success", description: "Service request created!" });
      setTitle("");
      setDescription("");
      setServiceType("vocals");
      setBudget("");
      setDeadline("");
      onRequestCreated();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create request", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Post Service Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post a Service Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Service Type</Label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full mt-2 px-3 py-2 border rounded-md bg-background"
            >
              <option value="vocals">Vocals</option>
              <option value="guitar">Guitar</option>
              <option value="drums">Drums</option>
              <option value="piano">Piano</option>
              <option value="production">Production</option>
              <option value="mixing">Mixing</option>
              <option value="mastering">Mastering</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Need professional vocal recording"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need..."
              className="mt-2 min-h-32"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget (Optional)</Label>
              <Input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g., $200-500"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Deadline (Optional)</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ServiceRequestListProps {
  filter?: string;
}

export function ServiceRequestList({ filter = "open" }: ServiceRequestListProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [requestDetails, setRequestDetails] = useState<{ [key: number]: any }>({});
  const { toast } = useToast();
  const { user } = useAuth() || {};

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest({
        url: `/api/social/service-requests?status=${filter}`,
        method: "GET"
      }) as ServiceRequest[];
      setRequests(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load requests", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequestDetails = async (requestId: number) => {
    if (requestDetails[requestId]) return;
    try {
      const data = await apiRequest({
        url: `/api/social/service-requests/${requestId}`,
        method: "GET"
      });
      setRequestDetails((prev) => ({ ...prev, [requestId]: data }));
    } catch (error) {
      console.error("Error loading request details:", error);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filter]);

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-muted-foreground">Loading requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-muted-foreground">No requests found</p>
      ) : (
        requests.map((request) => (
          <Card key={request.id} className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
            <Collapsible
              open={expandedId === request.id}
              onOpenChange={(open) => {
                setExpandedId(open ? request.id : null);
                if (open) loadRequestDetails(request.id);
              }}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            expandedId === request.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{request.client?.displayName}</p>
                    </div>
                    <Badge className="bg-orange-500/10 text-orange-500">{request.serviceType}</Badge>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent className="px-6 pb-6 pt-0">
                <div className="space-y-4">
                  <p className="text-sm">{request.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {request.budget && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>{request.budget}</span>
                      </div>
                    )}
                    {request.deadline && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(request.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>{request.bidsCount || 0} bids</span>
                    </div>
                  </div>

                  {/* Bids Section */}
                  {requestDetails[request.id]?.bids && (
                    <div className="border-t pt-4">
                      <BidList
                        requestId={request.id}
                        bids={requestDetails[request.id].bids}
                        clientId={request.client?.id || 0}
                        currentUserId={user?.id}
                        clientEmail={user?.email}
                      />
                    </div>
                  )}

                  {/* Action Button */}
                  {user?.id && user.id !== request.client?.id && (
                    <BidForm
                      requestId={request.id}
                      musicianId={user.id as any}
                      onBidPlaced={async () => {
                        await loadRequestDetails(request.id);
                        await loadRequests();
                      }}
                    />
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))
      )}
    </div>
  );
}
