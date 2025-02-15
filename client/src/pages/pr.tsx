import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users2,
  MessageSquare,
  Newspaper,
  TrendingUp,
  Search,
  Plus,
  Loader2,
  Music2,
  Activity,
  Users,
  Calendar,
  Globe,
  Youtube,
  FileText,
  Megaphone,
  BarChart2,
  PieChart
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { searchContacts, contactCategories, type Contact, saveContact, getSavedContacts } from "@/lib/apify-service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Link } from "wouter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];

const prMetrics = {
  mediaContacts: 1234,
  monthlyReach: '2.5M',
  engagementRate: '8.2%',
  campaigns: 45,
  distribution: [
    { name: 'Music Press', value: 40 },
    { name: 'Lifestyle Media', value: 25 },
    { name: 'Digital Platforms', value: 20 },
    { name: 'Industry News', value: 15 }
  ],
  campaignTypes: [
    { name: 'Press Release', value: 30 },
    { name: 'Media Coverage', value: 25 },
    { name: 'Interviews', value: 20 },
    { name: 'Features', value: 15 },
    { name: 'Reviews', value: 10 }
  ]
};

export default function PRPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(contactCategories[0]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);
  const contactsPerPage = 10;

  useEffect(() => {
    if (user) {
      loadSavedContacts();
    }
  }, [user]);

  const loadSavedContacts = async () => {
    try {
      const contacts = await getSavedContacts(user!);
      setSavedContacts(contacts);
    } catch (error) {
      console.error('Error loading saved contacts:', error);
    }
  };

  const handleSaveContact = async (contact: Contact) => {
    try {
      await saveContact(user!, contact);
      toast({
        title: "Contact saved",
        description: "The contact has been saved successfully.",
      });
      await loadSavedContacts();
    } catch (error) {
      toast({
        title: "Save error",
        description: "Could not save the contact. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter a search term",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const results = await searchContacts(selectedCategory, searchQuery);
      clearInterval(progressInterval);
      setProgress(100);
      setContacts(results);
      setCurrentPage(1);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search error",
        description: "Could not retrieve contacts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = contacts.slice(indexOfFirstContact, indexOfLastContact);
  const totalPages = Math.ceil(contacts.length / contactsPerPage);

  const services = [
    {
      name: "Contacts",
      description: "Manage your network of contacts",
      icon: Users2,
      color: "text-orange-500",
      route: "/pr",
      stats: 500,
      statsLabel: "contacts",
    },
    {
      name: "News",
      description: "Stay updated with industry news",
      icon: Newspaper,
      color: "text-green-500",
      route: "/news",
      stats: 120,
      statsLabel: "news",
    },
    {
      name: "Events",
      description: "Organize or find events",
      icon: Calendar,
      color: "text-blue-500",
      route: "/events",
      stats: 50,
      statsLabel: "events",
    },
    {
      name: "Analytics",
      description: "Analyze your online presence",
      icon: TrendingUp,
      color: "text-pink-500",
      route: "/analytics",
      stats: 1500,
      statsLabel: "visits",
    },
    {
      name: "Global",
      description: "Global visibility",
      icon: Globe,
      color: "text-sky-500",
      route: "/global",
      stats: 25,
      statsLabel: "countries",
    },
    {
      name: "Videos",
      description: "Manage your videos",
      icon: Youtube,
      color: "text-red-500",
      route: "/videos",
      stats: 100,
      statsLabel: "videos",
    },
    {
      name: "Blog",
      description: "Write and manage your articles",
      icon: FileText,
      color: "text-violet-500",
      route: "/blog",
      stats: 75,
      statsLabel: "articles",
    },
    {
      name: "Promotion",
      description: "Promote your content",
      icon: Megaphone,
      color: "text-yellow-500",
      route: "/promotion",
      stats: 400,
      statsLabel: "promotions",
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <ScrollArea className="flex-1">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                  PR & Media Hub
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage your media presence and PR campaigns effectively
                </p>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Users2 className="h-5 w-5 text-orange-500" />
                    <h3 className="text-sm font-medium">Media Contacts</h3>
                  </div>
                  <p className="text-2xl font-bold">{prMetrics.mediaContacts.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-green-500">↑ 12.5%</span> vs último periodo
                  </p>
                </div>
              </Card>

              <Card className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="h-5 w-5 text-orange-500" />
                    <h3 className="text-sm font-medium">Monthly Reach</h3>
                  </div>
                  <p className="text-2xl font-bold">{prMetrics.monthlyReach}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-green-500">↑ 8.3%</span> vs último mes
                  </p>
                </div>
              </Card>

              <Card className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-orange-500" />
                    <h3 className="text-sm font-medium">Engagement Rate</h3>
                  </div>
                  <p className="text-2xl font-bold">{prMetrics.engagementRate}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-green-500">↑ 2.1%</span> engagement
                  </p>
                </div>
              </Card>

              <Card className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Megaphone className="h-5 w-5 text-orange-500" />
                    <h3 className="text-sm font-medium">Active Campaigns</h3>
                  </div>
                  <p className="text-2xl font-bold">{prMetrics.campaigns}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-green-500">↑ 15%</span> más campañas
                  </p>
                </div>
              </Card>
            </div>

            {/* Analytics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {/* Area Chart - Trends */}
              <Card className="lg:col-span-2 p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Media Coverage Trends</h3>
                  <p className="text-sm text-muted-foreground">
                    Monthly coverage and engagement metrics
                  </p>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={Array.from({ length: 12 }, (_, i) => ({
                      month: new Date(2024, i, 1).toLocaleDateString('default', { month: 'short' }),
                      coverage: Math.floor(Math.random() * 1000) + 500,
                      engagement: Math.floor(Math.random() * 800) + 300,
                    }))}>
                      <defs>
                        <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="coverage"
                        name="Coverage"
                        stroke="hsl(24, 95%, 53%)"
                        fillOpacity={1}
                        fill="url(#colorCoverage)"
                      />
                      <Area
                        type="monotone"
                        dataKey="engagement"
                        name="Engagement"
                        stroke="hsl(24, 95%, 53%)"
                        fillOpacity={0.5}
                        fill="url(#colorCoverage)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Pie Chart - Distribution */}
              <Card className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Media Distribution</h3>
                  <p className="text-sm text-muted-foreground">
                    Coverage distribution by media type
                  </p>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={prMetrics.distribution}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {prMetrics.distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Bar Chart - Campaign Types */}
              <Card className="lg:col-span-3 p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Campaign Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Distribution and success rate by campaign type
                  </p>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prMetrics.campaignTypes}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(24, 95%, 53%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card className="p-6 mb-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">General Activity</h3>
                <p className="text-sm text-muted-foreground">
                  Tracking metrics across all platforms
                </p>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({ length: 30 }, (_, i) => ({
                    date: new Date(2024, 0, i + 1).toLocaleDateString(),
                    spotify: Math.floor(Math.random() * 1000) + 500,
                    youtube: Math.floor(Math.random() * 800) + 300,
                    instagram: Math.floor(Math.random() * 600) + 200,
                  }))}>
                    <defs>
                      <linearGradient id="colorSpotify" x1="0" y1="0" x2="0" y2="1">
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
                      dataKey="spotify"
                      name="Spotify"
                      stroke="hsl(24, 95%, 53%)"
                      fillOpacity={1}
                      fill="url(#colorSpotify)"
                    />
                    <Area
                      type="monotone"
                      dataKey="youtube"
                      name="YouTube"
                      stroke="hsl(24, 95%, 53%)"
                      fillOpacity={0.5}
                      fill="url(#colorSpotify)"
                    />
                    <Area
                      type="monotone"
                      dataKey="instagram"
                      name="Instagram"
                      stroke="hsl(24, 95%, 53%)"
                      fillOpacity={0.3}
                      fill="url(#colorSpotify)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Search Contacts</h3>
                <div className="flex gap-4">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-1 relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button 
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="min-w-[100px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
                {isLoading && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">
                      {progress}% Complete
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Tabs defaultValue="results" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="saved">Saved Contacts</TabsTrigger>
              </TabsList>

              <TabsContent value="results">
                <Card>
                  <ScrollArea className="h-[500px]">
                    <div className="p-4 space-y-4">
                      {currentContacts.map((contact, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <div className="bg-primary/10 text-primary rounded-full h-full w-full flex items-center justify-center">
                                {contact.name.charAt(0)}
                              </div>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{contact.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {contact.role || contact.category}
                                {contact.company && ` at ${contact.company}`}
                              </p>
                              {contact.email && (
                                <p className="text-sm text-muted-foreground">
                                  {contact.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveContact(contact)}
                          >
                            Save Contact
                          </Button>
                        </div>
                      ))}
                      {contacts.length === 0 && !isLoading && (
                        <div className="text-center py-8 text-muted-foreground">
                          No contacts to display. Perform a search to find contacts.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  {contacts.length > 0 && (
                    <div className="p-4 border-t flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="saved">
                <Card>
                  <ScrollArea className="h-[500px]">
                    <div className="p-4 space-y-4">
                      {savedContacts.map((contact, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <div className="bg-primary/10 text-primary rounded-full h-full w-full flex items-center justify-center">
                                {contact.name.charAt(0)}
                              </div>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{contact.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {contact.role || contact.category}
                                {contact.company && ` at ${contact.company}`}
                              </p>
                              {contact.email && (
                                <p className="text-sm text-muted-foreground">
                                  {contact.email}
                                </p>
                              )}
                              {contact.savedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Saved on: {new Date(contact.savedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {savedContacts.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          You have no saved contacts.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}