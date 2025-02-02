import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Activity, Megaphone, Plus, Target, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CampaignForm } from "@/components/promotion/campaign-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export default function PromotionPage() {
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);

  const { data: campaigns = [], refetch: refetchCampaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const campaignsRef = collection(db, "campaigns");
      const q = query(
        campaignsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },
    enabled: !!auth.currentUser
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Promotion Center
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage and track your promotional campaigns
              </p>
            </div>
            <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Set up your campaign details and get AI-powered suggestions
                  </DialogDescription>
                </DialogHeader>
                <CampaignForm 
                  onSuccess={() => {
                    setShowNewCampaignDialog(false);
                    refetchCampaigns();
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {campaigns.map((campaign: any) => (
              <Card key={campaign.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{campaign.name}</h3>
                        <p className="text-muted-foreground">{campaign.description}</p>
                      </div>
                      <Button variant="outline">
                        Manage Campaign
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-semibold capitalize">{campaign.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-semibold">${campaign.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Platform</p>
                        <p className="font-semibold">{campaign.platform}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-semibold">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}