import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { 
  Activity, 
  Megaphone, 
  Plus, 
  Target, 
  Globe,
  Calendar,
  Users,
  TrendingUp,
  BarChart2,
  Edit2,
  Trash2,
  Clock
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PromotionPage() {
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) return [];

      try {
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
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        return [];
      }
    },
    enabled: !!auth.currentUser,
    staleTime: 30000,
    retry: false
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24"> {/* Added pt-24 to fix header overlap */}
        <ScrollArea className="h-[calc(100vh-6rem)]">
          <div className="container mx-auto px-4">
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
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Campaign Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Target, label: "Active Campaigns", value: "12", change: "+2" },
                { icon: Users, label: "Total Reach", value: "45.2K", change: "+12%" },
                { icon: TrendingUp, label: "Engagement Rate", value: "8.5%", change: "+1.2%" },
                { icon: BarChart2, label: "ROI", value: "215%", change: "+15%" }
              ].map((stat, index) => (
                <Card key={index} className="p-6 hover:bg-orange-500/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <stat.icon className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold">{stat.value}</h3>
                        <span className="text-sm text-green-500">{stat.change}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="active" className="space-y-6">
              <TabsList>
                <TabsTrigger value="active">Active Campaigns</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-6">
                {campaigns.map((campaign: any) => (
                  <Card key={campaign.id} className="p-6 hover:bg-orange-500/5 transition-colors">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold">{campaign.name}</h3>
                              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                Active
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{campaign.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="icon">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Globe className="h-4 w-4" /> Platform
                            </p>
                            <p className="font-semibold capitalize">{campaign.platform}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Target className="h-4 w-4" /> Budget
                            </p>
                            <p className="font-semibold">${campaign.budget?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-4 w-4" /> Duration
                            </p>
                            <p className="font-semibold">
                              {campaign.startDate && new Date(campaign.startDate).toLocaleDateString()} - {campaign.endDate && new Date(campaign.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="h-4 w-4" /> Time Left
                            </p>
                            <p className="font-semibold">12 days</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Campaign Progress</span>
                            <span className="font-medium">65%</span>
                          </div>
                          <Progress value={65} className="bg-orange-500/20" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              {/* Other tab contents would be similar but with different statuses */}
              <TabsContent value="scheduled">
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">No scheduled campaigns</p>
                </Card>
              </TabsContent>
              <TabsContent value="completed">
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">No completed campaigns</p>
                </Card>
              </TabsContent>
              <TabsContent value="draft">
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">No draft campaigns</p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}