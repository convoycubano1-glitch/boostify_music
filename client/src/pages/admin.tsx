import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Header } from '../components/layout/header';
import { collection, getDocs, deleteDoc, doc, query, limit as fbLimit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/use-auth';
import { 
  Users, DollarSign, TrendingUp, Music, FileVideo, GraduationCap, Target, BarChart3,
  Shield, Trash2, Eye, Search, Download, RefreshCw, Database, Activity, CreditCard,
  Globe, Image as ImageIcon, Film, Layout, Upload
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { ArtistImportModal } from '../components/admin/artist-import-modal';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  
  const ADMIN_EMAIL = 'convoycubano@gmail.com';
  const isAdmin = user && user.email === ADMIN_EMAIL;

  const [artists, setArtists] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [musicians, setMusicians] = useState<any[]>([]);
  const [musicianImages, setMusicianImages] = useState<any[]>([]);
  const [recordLabels, setRecordLabels] = useState<any[]>([]);
  const [directors, setDirectors] = useState<any[]>([]);
  const [musicVideoRequests, setMusicVideoRequests] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    totalArtists: 0, totalInvestors: 0, totalInvestments: 0, totalRevenue: 0,
    activeSubscriptions: 0, totalCourses: 0, totalSocialPosts: 0, totalCampaigns: 0,
    totalVideos: 0, totalMusicians: 0, totalMusicianImages: 0, totalRecordLabels: 0,
    totalDirectors: 0, totalMusicVideoRequests: 0, basicPlan: 0, proPlan: 0, premiumPlan: 0, activeUsers: 0
  });

  useEffect(() => {
    if (user && isAdmin) loadAllData();
  }, [user, isAdmin]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const collections = [
        { name: 'generated_artists', setter: setArtists },
        { name: 'investors', setter: setInvestors },
        { name: 'users', setter: setUsers, limit: 500 },
        { name: 'courses', setter: setCourses },
        { name: 'videos', setter: setVideos, limit: 100 },
        { name: 'social_posts', setter: setSocialPosts, limit: 100 },
        { name: 'campaigns', setter: setCampaigns },
        { name: 'musicians', setter: setMusicians, limit: 100 },
        { name: 'musician_images', setter: setMusicianImages, limit: 100 },
        { name: 'record_labels', setter: setRecordLabels },
        { name: 'directors', setter: setDirectors },
        { name: 'music-video-request', setter: setMusicVideoRequests, limit: 100 },
      ];

      const results: any = {};
      for (const col of collections) {
        try {
          const q = col.limit ? query(collection(db, col.name), fbLimit(col.limit)) : collection(db, col.name);
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          col.setter(data);
          results[col.name] = data;
        } catch (e) {
          console.log(`${col.name} not found`);
          results[col.name] = [];
        }
      }

      const artistsData = results.generated_artists || [];
      const investorsData = results.investors || [];
      const usersData = results.users || [];

      let totalRevenue = 0, activeSubscriptions = 0, basicPlan = 0, proPlan = 0, premiumPlan = 0;
      artistsData.forEach((artist: any) => {
        if (artist.subscription?.price) {
          totalRevenue += artist.subscription.price;
          activeSubscriptions++;
          if (artist.subscription.plan === 'Basic') basicPlan++;
          else if (artist.subscription.plan === 'Pro') proPlan++;
          else if (artist.subscription.plan === 'Premium') premiumPlan++;
        }
        if (artist.purchases?.videos?.totalSpent) totalRevenue += artist.purchases.videos.totalSpent;
        if (artist.purchases?.courses?.totalSpent) totalRevenue += artist.purchases.courses.totalSpent;
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = usersData.filter((u: any) => {
        if (u.lastLogin) {
          const lastLogin = u.lastLogin.toDate ? u.lastLogin.toDate() : new Date(u.lastLogin);
          return lastLogin > thirtyDaysAgo;
        }
        return false;
      }).length;

      setStats({
        totalArtists: artistsData.length,
        totalInvestors: investorsData.length,
        totalInvestments: investorsData.reduce((sum: number, inv: any) => sum + (inv.investmentAmount || 0), 0),
        totalRevenue, activeSubscriptions,
        totalCourses: results.courses.length,
        totalSocialPosts: results.social_posts.length,
        totalCampaigns: results.campaigns.length,
        totalVideos: results.videos.length,
        totalMusicians: results.musicians.length,
        totalMusicianImages: results.musician_images.length,
        totalRecordLabels: results.record_labels.length,
        totalDirectors: results.directors.length,
        totalMusicVideoRequests: results['music-video-request'].length,
        basicPlan, proPlan, premiumPlan, activeUsers
      });

      setLoading(false);
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (!confirm(`Delete this item from ${collectionName}?`)) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast({ title: "Success", description: `Item deleted from ${collectionName}` });
      loadAllData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  const exportData = (data: any[], filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="p-8 bg-slate-900 border-cyan-500/20">
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
          <p className="text-slate-400 text-center">Admin only: {ADMIN_EMAIL}</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="p-8 bg-slate-900 border-cyan-500/20">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-cyan-400 animate-spin" />
            <p className="text-white">Loading admin dashboard...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />
      <main className="flex-1 pt-16">
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-yellow-400 bg-clip-text text-transparent">
                    Admin Control Panel
                  </h1>
                  <p className="text-slate-400 mt-2">Complete control over Boostify platform data</p>
                  <Badge className="mt-2 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                    Admin: {user.email}
                  </Badge>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setShowImportModal(true)} 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    data-testid="button-import-artists"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Artistas
                  </Button>
                  <Button onClick={() => loadAllData()} variant="outline" className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-400">Artists</CardTitle>
                    <Music className="h-5 w-5 text-cyan-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.totalArtists}</div>
                  <p className="text-xs text-green-400 mt-1">+{Math.round(stats.totalArtists * 0.12)} this month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-green-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-400">Investors</CardTitle>
                    <Target className="h-5 w-5 text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.totalInvestors}</div>
                  <p className="text-xs text-yellow-400 mt-1">${(stats.totalInvestments / 1000).toFixed(1)}K invested</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-yellow-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-400">Revenue</CardTitle>
                    <DollarSign className="h-5 w-5 text-yellow-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">${(stats.totalRevenue / 1000).toFixed(1)}K</div>
                  <p className="text-xs text-green-400 mt-1">{stats.activeSubscriptions} active subs</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-purple-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-400">Active Users</CardTitle>
                    <Activity className="h-5 w-5 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats.activeUsers}</div>
                  <p className="text-xs text-purple-400 mt-1">Last 30 days</p>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Basic Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.basicPlan}</div>
                  <p className="text-xs text-slate-400">$59.99/mo each</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Pro Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.proPlan}</div>
                  <p className="text-xs text-slate-400">$99.99/mo each</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Premium Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.premiumPlan}</div>
                  <p className="text-xs text-slate-400">$149.99/mo each</p>
                </CardContent>
              </Card>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search across all collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900 border-cyan-500/20 text-white placeholder:text-slate-500"
                  data-testid="input-admin-search"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-900/50 border border-cyan-500/20 p-1 mb-6 flex-wrap h-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  <BarChart3 className="h-4 w-4 mr-2" />Overview
                </TabsTrigger>
                <TabsTrigger value="artists" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  <Music className="h-4 w-4 mr-2" />Artists ({stats.totalArtists})
                </TabsTrigger>
                <TabsTrigger value="investors" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  <Target className="h-4 w-4 mr-2" />Investors ({stats.totalInvestors})
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  <Users className="h-4 w-4 mr-2" />Users ({users.length})
                </TabsTrigger>
                <TabsTrigger value="videos" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  <FileVideo className="h-4 w-4 mr-2" />Videos ({stats.totalVideos})
                </TabsTrigger>
                <TabsTrigger value="musicians" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  <Music className="h-4 w-4 mr-2" />Musicians ({stats.totalMusicians})
                </TabsTrigger>
                <TabsTrigger value="landing" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  <Layout className="h-4 w-4 mr-2" />Landing ({stats.totalRecordLabels})
                </TabsTrigger>
                <TabsTrigger value="database" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  <Database className="h-4 w-4 mr-2" />All Data
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300">Platform Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Videos Created</p>
                        <p className="text-2xl font-bold text-purple-400">{stats.totalVideos}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Landing Pages</p>
                        <p className="text-2xl font-bold text-green-400">{stats.totalRecordLabels}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Musicians</p>
                        <p className="text-2xl font-bold text-cyan-400">{stats.totalMusicians}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400">Directors</p>
                        <p className="text-2xl font-bold text-yellow-400">{stats.totalDirectors}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Artists Tab */}
              <TabsContent value="artists">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-cyan-300">Artists Database</CardTitle>
                      <Button onClick={() => exportData(artists, 'artists')} variant="outline" size="sm" className="border-cyan-500/50 text-cyan-300">
                        <Download className="h-4 w-4 mr-2" />Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-slate-900">
                          <tr className="border-b border-slate-700">
                            <th className="text-left p-3 text-sm font-medium text-slate-400">Name</th>
                            <th className="text-left p-3 text-sm font-medium text-slate-400">Email</th>
                            <th className="text-left p-3 text-sm font-medium text-slate-400">Plan</th>
                            <th className="text-left p-3 text-sm font-medium text-slate-400">Revenue</th>
                            <th className="text-right p-3 text-sm font-medium text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {artists.filter(a => !searchTerm || a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(artist => (
                            <tr key={artist.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                              <td className="p-3 text-sm text-white">{artist.name || 'N/A'}</td>
                              <td className="p-3 text-sm text-slate-400">{artist.email || 'N/A'}</td>
                              <td className="p-3 text-sm">
                                <Badge className={artist.subscription?.plan === 'Premium' ? 'bg-purple-500/20 text-purple-300' : artist.subscription?.plan === 'Pro' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}>
                                  {artist.subscription?.plan || 'Free'}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-green-400">${artist.subscription?.price || 0}</td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => {console.log('Artist:', artist); toast({title: "Check console"})}} className="text-cyan-400 hover:bg-cyan-500/10">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDelete('generated_artists', artist.id)} className="text-red-400 hover:bg-red-500/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Similar tabs for investors, users, videos, etc. - simplified for brevity */}
              <TabsContent value="investors">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-cyan-300">Investors ({stats.totalInvestors}) • ${(stats.totalInvestments/1000).toFixed(1)}K</CardTitle>
                      <Button onClick={() => exportData(investors, 'investors')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-slate-900">
                          <tr className="border-b border-slate-700">
                            <th className="text-left p-3 text-sm text-slate-400">Name</th>
                            <th className="text-left p-3 text-sm text-slate-400">Email</th>
                            <th className="text-left p-3 text-sm text-slate-400">Amount</th>
                            <th className="text-left p-3 text-sm text-slate-400">Status</th>
                            <th className="text-right p-3 text-sm text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {investors.map(inv => (
                            <tr key={inv.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                              <td className="p-3 text-sm text-white">{inv.fullName}</td>
                              <td className="p-3 text-sm text-slate-400">{inv.email}</td>
                              <td className="p-3 text-sm text-green-400">${inv.investmentAmount?.toLocaleString()}</td>
                              <td className="p-3 text-sm">
                                <Badge className={inv.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}>
                                  {inv.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="ghost" onClick={() => {console.log(inv); toast({title: "Check console"})}} className="text-cyan-400">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDelete('investors', inv.id)} className="text-red-400">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300">Users ({users.length}) • {stats.activeUsers} active</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400">Total users: {users.length}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="videos">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-cyan-300">Videos Created in My Profile ({stats.totalVideos})</CardTitle>
                      <Button onClick={() => exportData(videos, 'videos')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-slate-900">
                          <tr className="border-b border-slate-700">
                            <th className="text-left p-3 text-sm text-slate-400">Title</th>
                            <th className="text-left p-3 text-sm text-slate-400">User ID</th>
                            <th className="text-left p-3 text-sm text-slate-400">Created</th>
                            <th className="text-right p-3 text-sm text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {videos.map(v => (
                            <tr key={v.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                              <td className="p-3 text-sm text-white">{v.title || v.songTitle || 'Untitled'}</td>
                              <td className="p-3 text-sm text-slate-400">{v.userId?.substring(0,15)}...</td>
                              <td className="p-3 text-sm text-slate-400">{v.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                              <td className="p-3 text-right">
                                <Button size="sm" variant="ghost" onClick={() => handleDelete('videos', v.id)} className="text-red-400">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="musicians">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300">Musicians ({stats.totalMusicians})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400">{stats.totalMusicianImages} images generated</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="landing">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-cyan-300">Landing Pages / Record Labels ({stats.totalRecordLabels})</CardTitle>
                      <Button onClick={() => exportData(recordLabels, 'record_labels')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-slate-900">
                          <tr className="border-b border-slate-700">
                            <th className="text-left p-3 text-sm text-slate-400">Name</th>
                            <th className="text-left p-3 text-sm text-slate-400">Tagline</th>
                            <th className="text-left p-3 text-sm text-slate-400">Created</th>
                            <th className="text-right p-3 text-sm text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recordLabels.map(l => (
                            <tr key={l.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                              <td className="p-3 text-sm text-white">{l.name || 'Untitled'}</td>
                              <td className="p-3 text-sm text-slate-400">{l.tagline || 'N/A'}</td>
                              <td className="p-3 text-sm text-slate-400">{l.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                              <td className="p-3 text-right">
                                <Button size="sm" variant="ghost" onClick={() => handleDelete('record_labels', l.id)} className="text-red-400">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="database">
                <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300">All Firestore Collections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        {name: 'Artists', count: stats.totalArtists, data: artists, collection: 'generated_artists'},
                        {name: 'Investors', count: stats.totalInvestors, data: investors, collection: 'investors'},
                        {name: 'Videos', count: stats.totalVideos, data: videos, collection: 'videos'},
                        {name: 'Musicians', count: stats.totalMusicians, data: musicians, collection: 'musicians'},
                        {name: 'Landing Pages', count: stats.totalRecordLabels, data: recordLabels, collection: 'record_labels'},
                        {name: 'Directors', count: stats.totalDirectors, data: directors, collection: 'directors'},
                      ].map(c => (
                        <div key={c.collection} className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20">
                          <h4 className="font-semibold text-white text-sm mb-1">{c.name}</h4>
                          <p className="text-2xl font-bold text-cyan-400 mb-2">{c.count}</p>
                          <Button size="sm" variant="ghost" onClick={() => exportData(c.data, c.collection)} className="w-full text-cyan-400">
                            <Download className="h-3 w-3 mr-2" />Export
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
      
      {/* Import Artists Modal */}
      <ArtistImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onSuccess={() => {
          loadAllData();
          toast({
            title: 'Artistas importados',
            description: 'Los artistas fueron importados exitosamente'
          });
        }}
      />
    </div>
  );
}
