import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Header } from '../components/layout/header';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/use-auth';
import { isAdminEmail, ADMIN_EMAILS } from '../../../shared/constants';
import { 
  BarChart3, Users, DollarSign, Music, FileVideo, Target, 
  Shield, RefreshCw, Activity, Upload, Sparkles, Link as LinkIcon,
  TrendingUp, Zap, Users2, AreaChart, PieChart as PieChartIcon, CreditCard
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { ArtistImportModal } from '../components/admin/artist-import-modal';
import { ArtistsManager } from '../components/admin/artists-manager';
import { ApiUsageDashboard } from '../components/admin/api-usage-dashboard';
import { AccountingDashboard } from '../components/admin/accounting-dashboard';
import { AdminAgent } from '../components/admin/admin-agent';
import { ApiLinks } from '../components/admin/api-links';
import { SessionManager } from '../components/admin/session-manager';
import { AffiliateSessions } from '../components/admin/affiliate-sessions';
import { InvestorSessions } from '../components/admin/investor-sessions';
import { StripeEventsLog } from '../components/admin/stripe-events-log';
import { UserManagement } from '../components/admin/user-management';
import { BoostiSwapArtistsManager } from '../components/admin/boostiswap-artists-manager';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showImportModal, setShowImportModal] = useState(false);
  
  const isAdmin = user && (user.isAdmin === true || isAdminEmail(user.email));

  const [stats, setStats] = useState({
    totalArtists: 0, totalInvestors: 0, totalInvestments: 0, totalRevenue: 0,
    activeSubscriptions: 0, totalCourses: 0, totalSocialPosts: 0, totalCampaigns: 0,
    totalVideos: 0, totalMusicians: 0, activeUsers: 0, totalUsers: 0
  });

  useEffect(() => {
    if (user && isAdmin) loadAllData();
  }, [user, isAdmin]);

  const loadAllData = async () => {
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="p-8 bg-slate-900 border-orange-500/20">
          <p className="text-white">Please login to access admin dashboard</p>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="p-8 bg-slate-900 border-red-500/20">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white text-center mb-2">Access Denied</h2>
          <p className="text-slate-400 text-center">Admin only: {ADMIN_EMAILS[0]}</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="p-8 bg-slate-900 border-orange-500/20">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-orange-400 animate-spin" />
            <p className="text-white">Loading admin dashboard...</p>
          </div>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: 'Artists', value: stats.totalArtists, icon: Music, gradient: 'from-orange-500/20 to-orange-600/20', color: 'text-orange-400' },
    { label: 'Videos', value: stats.totalVideos, icon: FileVideo, gradient: 'from-purple-500/20 to-purple-600/20', color: 'text-purple-400' },
    { label: 'Users', value: stats.totalUsers, icon: Users, gradient: 'from-blue-500/20 to-blue-600/20', color: 'text-blue-400' },
    { label: 'Subscriptions', value: stats.activeSubscriptions, icon: Zap, gradient: 'from-yellow-500/20 to-yellow-600/20', color: 'text-yellow-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <Header />
      
      <main className="flex-1 pt-16">
        <ScrollArea className="h-[calc(100vh-4rem)] w-full">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
            
            <div className="mb-8 pb-6 border-b border-orange-500/20">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                    Enterprise Control Hub
                  </h1>
                  <p className="text-slate-400 text-sm md:text-base">AI-powered analytics & unified platform management</p>
                </div>
                <Button 
                  onClick={() => setShowImportModal(true)} 
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white w-full md:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Artists
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card 
                    key={stat.label} 
                    className={`bg-gradient-to-br ${stat.gradient} border-orange-500/20 hover:border-orange-500/50 transition`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-400 text-sm">{stat.label}</p>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <ScrollArea className="w-full mb-4">
                <TabsList className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 w-full bg-slate-900/50 border border-orange-500/20 p-1 h-auto gap-1">
                  {[
                    { value: 'overview', label: 'Overview', icon: BarChart3 },
                    { value: 'ai-agent', label: 'AI Agent', icon: Sparkles },
                    { value: 'users', label: 'Users', icon: Users },
                    { value: 'accounting', label: 'Accounting', icon: DollarSign },
                    { value: 'api-usage', label: 'API Usage', icon: Activity },
                    { value: 'artists', label: 'Artists', icon: Music },
                    { value: 'affiliates', label: 'Affiliates', icon: TrendingUp },
                    { value: 'investors', label: 'Investors', icon: Target },
                    { value: 'apis', label: 'APIs', icon: LinkIcon },
                    { value: 'boostiswap-artists', label: 'BoostiSwap', icon: Zap },
                    { value: 'stripe-events', label: 'Stripe Events', icon: CreditCard },
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger 
                        key={tab.value}
                        value={tab.value} 
                        className="data-[state=active]:bg-orange-500 data-[state=active]:text-white hover:bg-orange-500/50 text-xs sm:text-sm whitespace-nowrap"
                      >
                        <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden xs:inline">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </ScrollArea>

              <TabsContent value="overview" className="space-y-6 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-orange-500/20">
                      <CardHeader>
                        <CardTitle className="text-orange-400 flex items-center gap-2">
                          <AreaChart className="h-5 w-5" />
                          Platform Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[
                            { label: 'Investors', value: stats.totalInvestors, icon: Target },
                            { label: 'Courses', value: stats.totalCourses, icon: FileVideo },
                            { label: 'Campaigns', value: stats.totalCampaigns, icon: TrendingUp },
                            { label: 'Posts', value: stats.totalSocialPosts, icon: Users2 },
                            { label: 'Revenue', value: `$${stats.totalRevenue}k`, icon: DollarSign },
                            { label: 'Growth', value: '+15%', icon: PieChartIcon },
                          ].map((metric) => {
                            const Icon = metric.icon;
                            return (
                              <div key={metric.label} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon className="h-4 w-4 text-orange-400" />
                                  <p className="text-xs text-slate-400">{metric.label}</p>
                                </div>
                                <p className="text-xl font-bold text-white">{metric.value}</p>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-orange-500/20">
                      <CardHeader>
                        <CardTitle className="text-orange-400">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button variant="outline" className="border-orange-500/30 hover:bg-orange-500/10">Generate Report</Button>
                        <Button variant="outline" className="border-orange-500/30 hover:bg-orange-500/10">Export Data</Button>
                        <Button variant="outline" className="border-orange-500/30 hover:bg-orange-500/10">View Logs</Button>
                        <Button variant="outline" className="border-orange-500/30 hover:bg-orange-500/10">Settings</Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <SessionManager />
                    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-orange-500/20">
                      <CardHeader>
                        <CardTitle className="text-orange-400 text-sm md:text-base">Admin Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-400">Email</p>
                          <p className="text-sm text-white font-mono break-all">{user?.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Status</p>
                          <Badge className="bg-green-500/20 text-green-300 text-xs">Active</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ai-agent" className="w-full">
                <AdminAgent />
              </TabsContent>

              <TabsContent value="users" className="w-full">
                <UserManagement />
              </TabsContent>

              <TabsContent value="accounting" className="w-full">
                <AccountingDashboard />
              </TabsContent>

              <TabsContent value="api-usage" className="w-full">
                <ApiUsageDashboard />
              </TabsContent>

              <TabsContent value="artists" className="w-full">
                <ArtistsManager onRefresh={loadAllData} />
              </TabsContent>

              <TabsContent value="affiliates" className="w-full">
                <AffiliateSessions />
              </TabsContent>

              <TabsContent value="investors" className="w-full">
                <InvestorSessions />
              </TabsContent>

              <TabsContent value="apis" className="w-full">
                <ApiLinks />
              </TabsContent>

              <TabsContent value="stripe-events" className="w-full">
                <StripeEventsLog />
              </TabsContent>

              <TabsContent value="boostiswap-artists" className="w-full">
                <BoostiSwapArtistsManager />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>

      <ArtistImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onSuccess={() => {
          loadAllData();
          toast({
            title: 'Artists imported',
            description: 'Artists were imported successfully'
          });
        }}
      />
    </div>
  );
}
