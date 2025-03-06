import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIModelsManager } from "@/components/admin/ai-models-manager";
import MusicNewsPlugin from "@/components/admin/music-news-plugin";
import {
  Users,
  CreditCard,
  Mail,
  UserX,
  Star,
  RefreshCcw,
  Settings,
  Download,
  UserCheck,
  Brain,
  Wand2,
  DollarSign,
  Lock,
  Briefcase,
  Menu,
  Newspaper,
  Bot,
  Music,
  Image
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState("subscriptions");
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Mock data - replace with actual API calls
  const subscriptionData = {
    activeSubscriptions: 150,
    totalRevenue: 15000,
    recentCancellations: 5
  };

  const affiliateData = {
    totalAffiliates: 45,
    activeAffiliates: 32,
    totalCommissions: 2500
  };

  const tabOptions = [
    { value: "subscriptions", label: "Subscriptions", icon: <CreditCard className="w-4 h-4" /> },
    { value: "affiliates", label: "Affiliates", icon: <Star className="w-4 h-4" /> },
    { value: "ai-models", label: "AI Models", icon: <Brain className="w-4 h-4" /> },
    { value: "data", label: "Data & Emails", icon: <Mail className="w-4 h-4" /> },
    { value: "investors", label: "Investors", icon: <Briefcase className="w-4 h-4" /> },
    { value: "permissions", label: "Permissions", icon: <Lock className="w-4 h-4" /> },
    { value: "finances", label: "Finances", icon: <DollarSign className="w-4 h-4" /> },
    { value: "plugins", label: "Plugins", icon: <Bot className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
            {/* Hero Section */}
            <section className="relative rounded-xl overflow-hidden mb-6 md:mb-12 bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-background p-4 md:p-8">
              <div className="relative">
                <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4">
                  Admin Panel
                </h1>
                <p className="text-base md:text-xl text-muted-foreground max-w-2xl">
                  Manage subscriptions, affiliates, AI models and more from one place
                </p>
              </div>
            </section>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              {isMobile ? (
                <div className="mb-6">
                  <Select
                    value={selectedTab}
                    onValueChange={setSelectedTab}
                  >
                    <SelectTrigger className="w-full bg-orange-500/10">
                      <div className="flex items-center">
                        {tabOptions.find(tab => tab.value === selectedTab)?.icon}
                        <span className="ml-2">{tabOptions.find(tab => tab.value === selectedTab)?.label}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {tabOptions.map(tab => (
                        <SelectItem key={tab.value} value={tab.value}>
                          <div className="flex items-center">
                            {tab.icon}
                            <span className="ml-2">{tab.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <TabsList className="grid grid-cols-8 max-w-[1400px] mb-8">
                  <TabsTrigger value="subscriptions" className="data-[state=active]:bg-orange-500">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Subscriptions
                  </TabsTrigger>
                  <TabsTrigger value="affiliates" className="data-[state=active]:bg-orange-500">
                    <Star className="w-4 h-4 mr-2" />
                    Affiliates
                  </TabsTrigger>
                  <TabsTrigger value="ai-models" className="data-[state=active]:bg-orange-500">
                    <Brain className="w-4 h-4 mr-2" />
                    AI Models
                  </TabsTrigger>
                  <TabsTrigger value="data" className="data-[state=active]:bg-orange-500">
                    <Mail className="w-4 h-4 mr-2" />
                    Data & Emails
                  </TabsTrigger>
                  <TabsTrigger value="investors" className="data-[state=active]:bg-orange-500">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Investors
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="data-[state=active]:bg-orange-500">
                    <Lock className="w-4 h-4 mr-2" />
                    Permissions
                  </TabsTrigger>
                  <TabsTrigger value="finances" className="data-[state=active]:bg-orange-500">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Finances
                  </TabsTrigger>
                  <TabsTrigger value="plugins" className="data-[state=active]:bg-orange-500">
                    <Bot className="w-4 h-4 mr-2" />
                    Plugins
                  </TabsTrigger>
                </TabsList>
              )}

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Active Subscriptions</p>
                        <p className="text-xl md:text-2xl font-bold">{subscriptionData.activeSubscriptions}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-xl md:text-2xl font-bold">${subscriptionData.totalRevenue}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6 sm:col-span-2 md:col-span-1">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <UserX className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Recent Cancellations</p>
                        <p className="text-xl md:text-2xl font-bold">{subscriptionData.recentCancellations}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold">Subscription Management</h3>
                    <Button variant="outline" size={isMobile ? "sm" : "default"}>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                    {/* Add subscription management table/list here */}
                    <div className="text-center text-muted-foreground">
                      Subscription table will be implemented here
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Affiliates Tab */}
              <TabsContent value="affiliates">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Total Affiliates</p>
                        <p className="text-xl md:text-2xl font-bold">{affiliateData.totalAffiliates}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Active Affiliates</p>
                        <p className="text-xl md:text-2xl font-bold">{affiliateData.activeAffiliates}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6 sm:col-span-2 md:col-span-1">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Total Commissions</p>
                        <p className="text-xl md:text-2xl font-bold">${affiliateData.totalCommissions}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold">Affiliate Program</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size={isMobile ? "sm" : "default"}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" size={isMobile ? "sm" : "default"}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                    {/* Add affiliate management table/list here */}
                    <div className="text-center text-muted-foreground">
                      Affiliate table will be implemented here
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* AI Models Tab */}
              <TabsContent value="ai-models">
                <div className="grid gap-4 md:gap-6">
                  {/* AI Usage Statistics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-8">
                    <Card className="p-4 md:p-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                          <Brain className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground">Active Models</p>
                          <p className="text-xl md:text-2xl font-bold">8</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 md:p-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                          <Wand2 className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground">AI Generations</p>
                          <p className="text-xl md:text-2xl font-bold">2.5K</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 md:p-6 sm:col-span-2 md:col-span-1">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                          <Settings className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground">Configurations</p>
                          <p className="text-xl md:text-2xl font-bold">12</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* AI Models Manager */}
                  <AIModelsManager />
                </div>
              </TabsContent>

              {/* Data & Emails Tab */}
              <TabsContent value="data">
                <Card className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold">Data & Email Management</h3>
                    <Button variant="outline" size={isMobile ? "sm" : "default"}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    {/* Add email and data management interface here */}
                    <div className="text-center text-muted-foreground">
                      Data management interface will be implemented here
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Plugins Tab */}
              <TabsContent value="plugins">
                <div className="grid grid-cols-1 gap-4 md:gap-6 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <Card className="p-4 md:p-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                          <Newspaper className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground">Music News</p>
                          <p className="text-xl md:text-2xl font-bold">Active</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 md:p-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                          <Music className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground">Content Generated</p>
                          <p className="text-xl md:text-2xl font-bold">12</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 md:p-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                          <Image className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-muted-foreground">Images Created</p>
                          <p className="text-xl md:text-2xl font-bold">8</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                  
                  {/* Music News Plugin */}
                  <MusicNewsPlugin />
                </div>
              </TabsContent>
              
              {/* Investors Tab */}
              <TabsContent value="investors">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Total Investors</p>
                        <p className="text-xl md:text-2xl font-bold">24</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Total Investment</p>
                        <p className="text-xl md:text-2xl font-bold">$1.5M</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6 sm:col-span-2 md:col-span-1">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <RefreshCcw className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Current Round</p>
                        <p className="text-xl md:text-2xl font-bold">Series B</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold">Investor Management</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size={isMobile ? "sm" : "default"}>
                        <Download className="h-4 w-4 mr-2" />
                        Export List
                      </Button>
                      <Button variant="outline" size={isMobile ? "sm" : "default"}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                    <div className="text-center text-muted-foreground">
                      Investor table will be implemented here
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Total Users</p>
                        <p className="text-xl md:text-2xl font-bold">532</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <Lock className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Available Roles</p>
                        <p className="text-xl md:text-2xl font-bold">5</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6 sm:col-span-2 md:col-span-1">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Administrators</p>
                        <p className="text-xl md:text-2xl font-bold">3</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold">Permission Control</h3>
                    <Button variant="outline" size={isMobile ? "sm" : "default"}>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                    {/* Add permissions management interface here */}
                    <div className="text-center text-muted-foreground">
                      Permission management interface will be implemented here
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Finances Tab */}
              <TabsContent value="finances">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Current Month Revenue</p>
                        <p className="text-xl md:text-2xl font-bold">$42,581</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Current Month Expenses</p>
                        <p className="text-xl md:text-2xl font-bold">$21,302</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6 sm:col-span-2 md:col-span-1">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
                        <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Transactions</p>
                        <p className="text-xl md:text-2xl font-bold">248</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold">Financial Reports</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size={isMobile ? "sm" : "default"}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" size={isMobile ? "sm" : "default"}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 md:space-y-6">
                    {/* Add finance reports interface here */}
                    <div className="text-center text-muted-foreground">
                      Detailed financial reports will be implemented here
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* End of tabs */}
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}