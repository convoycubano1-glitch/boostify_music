import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { AlertCircle, CheckCircle, RotateCcw } from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";

interface RevisionManagerProps {
  bidId: number;
  requestId: number;
  revisionLimit: number;
  userId: number;
  status: string;
}

export function RevisionManager({
  bidId,
  requestId,
  revisionLimit,
  userId,
  status,
}: RevisionManagerProps) {
  const [revisions, setRevisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const { toast } = useToast();

  const loadRevisions = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest({
        url: `/api/social/revisions/${bidId}`,
        method: "GET"
      });
      setRevisions(data);
    } catch (error) {
      console.error("Error loading revisions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      toast({ title: "Error", description: "Please add revision notes", variant: "destructive" });
      return;
    }

    try {
      const result = await apiRequest({
        url: "/api/social/revisions",
        method: "POST",
        data: {
          bidId,
          requestId,
          notes: revisionNotes,
          requestedBy: userId,
        }
      }) as any;

      toast({ title: "Success", description: `Revision requested (${result.revisionsRemaining} remaining)` });
      setRevisionNotes("");
      await loadRevisions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to request revision",
        variant: "destructive",
      });
    }
  };

  const revisionsUsed = revisions.length;
  const revisionsRemaining = revisionLimit - revisionsUsed;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Revisions ({revisionsRemaining}/{revisionLimit})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revision Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Revision Counter */}
          <div className="bg-slate-900 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revisions Used</p>
                <p className="text-2xl font-bold text-orange-500">
                  {revisionsUsed}/{revisionLimit}
                </p>
              </div>
              {revisionsRemaining === 0 ? (
                <AlertCircle className="h-12 w-12 text-red-500" />
              ) : (
                <CheckCircle className="h-12 w-12 text-green-500" />
              )}
            </div>
          </div>

          {/* Request New Revision */}
          {status === "accepted" && revisionsRemaining > 0 && (
            <div className="space-y-3 border rounded-lg p-4 bg-slate-900/50">
              <Label>Request Revision</Label>
              <Textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Describe what changes you'd like..."
                className="min-h-24"
              />
              <Button
                onClick={handleRequestRevision}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Request Revision
              </Button>
            </div>
          )}

          {revisionsRemaining === 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-200">
                ⚠️ All revisions have been used. Additional changes will need to be negotiated separately.
              </p>
            </div>
          )}

          {/* Revision History */}
          {revisions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Revision History</h4>
              {revisions.map((rev) => (
                <div key={rev.id} className="border border-slate-700 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">Revision #{rev.revisionNumber}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {rev.notes && <p className="text-sm text-muted-foreground">{rev.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
