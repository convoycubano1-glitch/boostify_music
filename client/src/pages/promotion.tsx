import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Activity, TrendingUp, Megaphone, Target, Globe } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Campaign {
  id: number;
  name: string;
  description: string;
  platform: string;
  status: 'active' | 'scheduled' | 'completed';
  budget: number;
  reach: number;
  engagement: number;
  startDate: string;
  endDate: string;
}

const campaignData: Campaign[] = [
  {
    id: 1,
    name: "Summer Tour Promotion",
    description: "Digital campaign for upcoming summer tour dates",
    platform: "Multiple Platforms",
    status: "active",
    budget: 5000,
    reach: 250000,
    engagement: 15000,
    startDate: "2025-02-01",
    endDate: "2025-03-01"
  },
  {
    id: 2,
    name: "New Single Launch",
    description: "Promotional campaign for latest single release",
    platform: "Spotify & Social Media",
    status: "scheduled",
    budget: 3000,
    reach: 150000,
    engagement: 8000,
    startDate: "2025-02-15",
    endDate: "2025-03-15"
  },
  {
    id: 3,
    name: "Fan Engagement Drive",
    description: "Campaign to boost fan interaction and following",
    platform: "Social Media",
    status: "completed",
    budget: 2000,
    reach: 100000,
    engagement: 12000,
    startDate: "2025-01-01",
    endDate: "2025-01-31"
  }
];

export default function PromotionPage() {
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
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Megaphone className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>

          <Card className="p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Campaign Performance</h3>
              <p className="text-sm text-muted-foreground">
                Track your promotional campaign metrics
              </p>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.from({ length: 30 }, (_, i) => ({
                  date: new Date(2024, 0, i + 1).toLocaleDateString(),
                  reach: Math.floor(Math.random() * 1000) + 500,
                  engagement: Math.floor(Math.random() * 800) + 300,
                  conversion: Math.floor(Math.random() * 600) + 200,
                }))}>
                  <defs>
                    <linearGradient id="colorPromotion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reach"
                    name="Reach"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={1}
                    fill="url(#colorPromotion)"
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    name="Engagement"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.5}
                    fill="url(#colorPromotion)"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversion"
                    name="Conversion"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.3}
                    fill="url(#colorPromotion)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6">
            {campaignData.map((campaign) => (
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-semibold capitalize">{campaign.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-semibold">${campaign.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Reach</p>
                        <p className="font-semibold">{campaign.reach.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Engagement</p>
                        <p className="font-semibold">{campaign.engagement.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        {campaign.platform}
                      </div>
                      <div>
                        {campaign.startDate} - {campaign.endDate}
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
