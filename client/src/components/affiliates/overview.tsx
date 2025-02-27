import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, TrendingUp, Users, DollarSign, Link, Clock, ChevronRight, Download, Share2, Wallet, Award, ChevronUp, ChevronDown, ExternalLink, BarChart2, PieChart, Zap, FileDown, FileText, AreaChart, Rocket } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircularProgress } from "@/components/ui/circular-progress";

interface AffiliateOverviewProps {
  affiliateData: {
    id: string;
    level?: string;
    name?: string;
    stats?: {
      totalClicks?: number;
      conversions?: number;
      earnings?: number;
      pendingPayment?: number;
    };
    links?: any[];
  } | null;
}

export function AffiliateOverview({ affiliateData }: AffiliateOverviewProps) {
  const { user } = useAuth() || {};
  // Sample data for stats and performance
  const stats = [
    {
      title: "Total Clicks",
      value: affiliateData?.stats?.totalClicks || 0,
      change: +15,
      icon: <TrendingUp className="h-4 w-4 text-primary" />,
    },
    {
      title: "Conversions",
      value: affiliateData?.stats?.conversions || 0,
      change: +12.3,
      icon: <Users className="h-4 w-4 text-primary" />,
    },
    {
      title: "Earnings",
      value: `$${(affiliateData?.stats?.earnings || 0).toFixed(2)}`,
      change: +18.1,
      icon: <DollarSign className="h-4 w-4 text-primary" />,
    },
    {
      title: "Active Links",
      value: affiliateData?.links?.length || 0,
      change: +4,
      icon: <Link className="h-4 w-4 text-primary" />,
    },
  ];

  // Sample performance data for the chart
  const performanceData = [
    { name: "Mon", clicks: 120, conversions: 8 },
    { name: "Tue", clicks: 145, conversions: 10 },
    { name: "Wed", clicks: 132, conversions: 9 },
    { name: "Thu", clicks: 165, conversions: 12 },
    { name: "Fri", clicks: 187, conversions: 14 },
    { name: "Sat", clicks: 142, conversions: 9 },
    { name: "Sun", clicks: 130, conversions: 8 },
  ];

  // Sample popular products data
  const popularProducts = [
    {
      id: "prod1",
      name: "Music Production Masterclass",
      clicks: 234,
      conversions: 18,
      commissionRate: 25,
      earnings: 450.0,
    },
    {
      id: "prod2",
      name: "Pro Mastering Plugin",
      clicks: 187,
      conversions: 15,
      commissionRate: 20,
      earnings: 297.0,
    },
    {
      id: "prod3",
      name: "Music Distribution Package",
      clicks: 156,
      conversions: 12,
      commissionRate: 30,
      earnings: 396.0,
    },
  ];

  // Sample payment data
  const nextPayment = {
    amount: (affiliateData?.stats?.pendingPayment || 0).toFixed(2),
    date: "March 15, 2025",
  };

  // Sample traffic sources
  const trafficSources = [
    { name: "Social Media", percentage: 45, color: "bg-blue-500" },
    { name: "Blog/Content", percentage: 30, color: "bg-green-500" },
    { name: "Email", percentage: 15, color: "bg-yellow-500" },
    { name: "Other", percentage: 10, color: "bg-purple-500" },
  ];

  // Sample performance by device
  const devicePerformance = [
    { device: "Mobile", clicks: 542, conversions: 38, rate: 7.0 },
    { device: "Desktop", clicks: 423, conversions: 45, rate: 10.6 },
    { device: "Tablet", clicks: 157, conversions: 12, rate: 7.6 },
  ];

  // Sample alerts
  const alerts = [
    {
      title: "Commission Rate Increase",
      description: "Your commission rate for 'Music Production Masterclass' has increased to 30%",
      icon: <ChevronUp className="h-5 w-5 text-green-500" />,
      date: "Today"
    },
    {
      title: "New Product Available",
      description: "A new high-converting course 'Advanced Mixing Techniques' is now available for promotion",
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      date: "Yesterday"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick actions header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg">
        <div>
          <h2 className="text-xl font-semibold">Welcome back, {affiliateData?.name || "Affiliate"}!</h2>
          <p className="text-sm text-muted-foreground">
            Here's what's happening with your affiliate performance today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            <span>Download Report</span>
          </Button>
          <Button className="gap-2">
            <Share2 className="h-4 w-4" />
            <span>Share Dashboard</span>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/40">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {stat.icon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View detailed {stat.title.toLowerCase()} analytics</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change > 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                    {stat.change > 0 ? "+" : ""}{stat.change}%
                  </span>{" "}
                  from last month
                </p>
                {index < 2 && (
                  <div className="h-8 w-16">
                    <AreaChart className="h-8 w-16 text-primary/70" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance chart */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Weekly Performance</CardTitle>
                <CardDescription>
                  Overview of clicks and conversions in the last 7 days
                </CardDescription>
              </div>
              <Tabs defaultValue="clicks" className="w-auto">
                <TabsList className="grid w-[220px] grid-cols-2">
                  <TabsTrigger value="clicks">Clicks</TabsTrigger>
                  <TabsTrigger value="conversions">Conversions</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px] flex items-center justify-center border rounded-md">
              <LineChart className="h-8 w-8 text-primary/70" />
              <span className="ml-2 text-sm text-muted-foreground">
                Weekly performance chart (UI placeholder)
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Clicks</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary/30"></div>
                <span>Conversions</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              <FileDown className="h-4 w-4" />
              Export Data
            </Button>
          </CardFooter>
        </Card>

        {/* Next payment card */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Next Payment</CardTitle>
            <CardDescription>
              Summary of your pending earnings
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <CircularProgress 
              value={Math.min((parseFloat(nextPayment.amount) / 100) * 100, 100)} 
              strokeWidth={8}
              className="w-36 h-36 mb-4"
            >
              <div className="text-center">
                <DollarSign className="h-5 w-5 mx-auto text-primary" />
                <span className="text-3xl font-bold">${nextPayment.amount}</span>
              </div>
            </CircularProgress>
            
            <p className="text-sm text-muted-foreground flex items-center mt-4">
              <Clock className="mr-1 h-3.5 w-3.5" /> Estimated date: {nextPayment.date}
            </p>
            
            <div className="w-full mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Payment threshold progress</span>
                <span>${nextPayment.amount} / $100</span>
              </div>
              <Progress value={Math.min((parseFloat(nextPayment.amount) / 100) * 100, 100)} className="h-2" />
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {parseFloat(nextPayment.amount) >= 100 
                ? "Threshold reached! Payment will be processed soon."
                : `You need $${(100 - parseFloat(nextPayment.amount)).toFixed(2)} more to reach the payment threshold.`}
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" className="w-full gap-2">
              <Wallet className="h-4 w-4" />
              Payment History
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Traffic sources */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>
              Where your affiliate traffic is coming from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-6">
              <PieChart className="h-32 w-32 text-primary/70" />
            </div>
            <div className="space-y-4">
              {trafficSources.map((source, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{source.name}</span>
                    <span>{source.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${source.color}`} 
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="gap-1">
              <BarChart2 className="h-4 w-4" />
              View Detailed Analytics
            </Button>
          </CardFooter>
        </Card>

        {/* Device performance */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Device Performance</CardTitle>
            <CardDescription>
              Conversion rates across different devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devicePerformance.map((device, index) => (
                <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{device.device}</span>
                    <Badge variant="outline" className="font-normal">
                      {device.rate}% conversion
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{device.clicks} clicks</span>
                    <span>{device.conversions} conversions</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="gap-1 w-full">
              <FileText className="h-4 w-4" />
              Download Device Report
            </Button>
          </CardFooter>
        </Card>

        {/* Alerts and notifications */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>
              Latest alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {alert.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">{alert.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full gap-1">
              View All Notifications
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Popular products */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>
                Products with the best performance in your affiliate account
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              <BarChart className="h-4 w-4" />
              View All Products
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-3 rounded-l-lg">Product</th>
                  <th scope="col" className="px-6 py-3 text-right">Clicks</th>
                  <th scope="col" className="px-6 py-3 text-right">Conversions</th>
                  <th scope="col" className="px-6 py-3 text-right">Commission</th>
                  <th scope="col" className="px-6 py-3 text-right">Earnings</th>
                  <th scope="col" className="px-6 py-3 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {popularProducts.map((product) => (
                  <tr key={product.id} className="bg-card">
                    <td className="px-6 py-4 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-right">{product.clicks}</td>
                    <td className="px-6 py-4 text-right">{product.conversions}</td>
                    <td className="px-6 py-4 text-right">{product.commissionRate}%</td>
                    <td className="px-6 py-4 text-right font-medium">${product.earnings.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button variant="outline" className="gap-2">
            <Rocket className="h-4 w-4" />
            Generate Product Promotion Plan
          </Button>
        </CardFooter>
      </Card>

      {/* Account status */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>
            Account information and level progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">{affiliateData?.name || "Affiliate"}</h4>
              <p className="text-sm text-muted-foreground">{user?.email || "No email available"}</p>
            </div>
            <Badge variant="outline" className="ml-auto flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-yellow-500" />
              {affiliateData?.level || "Basic"} Level
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to next level</span>
              <span>$1,143 / $2,000</span>
            </div>
            <Progress value={57} className="h-2" />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                You need $857 more in sales to reach the "Gold" level
              </p>
              <Button variant="link" size="sm" className="h-auto p-0">
                View benefits
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Account Settings
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Download Affiliate Badge
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}