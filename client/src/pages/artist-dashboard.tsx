import { useState } from "react";
import { motion } from "framer-motion";
import { Music2, Plus, X, Loader2, BarChart2, CheckCircle2, ChevronRight, Calendar, Download, Users, DollarSign, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";
import { MusicManager } from "@/components/music/music-manager";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { RightsManagementCard } from "@/components/rights/rights-management-card";
import { DistributionCard } from "@/components/distribution/distribution-card";
import { StrategyDialog } from "@/components/strategy/strategy-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as RePieChart, Pie, Cell } from "recharts";

// Define animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ArtistDashboard() {
  const [isStrategyGalleryOpen, setIsStrategyGalleryOpen] = useState(false);
  const [isStrategyDialogOpen, setIsStrategyDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const strategies = []; // Replace with your actual strategies data
  const currentStrategy = []; // Replace with your actual current strategy data
  const musicMetrics = {
    totalStreams: 12345,
    monthlyListeners: 6789,
    revenueGrowth: 10,
    topCountries: [
      { name: "USA", value: 40 },
      { name: "Canada", value: 25 },
      { name: "UK", value: 15 }
      // Add more countries as needed
    ]
  };
  const generateTimeData = (days:number) => {
    const data = [];
    for(let i = 0; i < days; i++) {
      data.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        streams: Math.random() * 1000
      })
    }
    return data
  }
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

  const handleVideoSubmit = () => {
    // Your video submission logic here
  };

  const fetchStrategies = () => {
    // Your fetch strategies logic here
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div variants={item}>
                <Card className="relative overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Music2 className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">My Music</h2>
                        <p className="text-sm text-muted-foreground">
                          Manage your music portfolio
                        </p>
                      </div>
                    </div>
                    <MusicManager />
                  </div>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 h-full shadow-md rounded-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <BarChart2 className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">My Strategy</h2>
                      <p className="text-sm text-muted-foreground">
                        Plan your growth and success
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsStrategyGalleryOpen(true)}
                      className="hidden sm:flex"
                    >
                      View All Strategies
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsStrategyDialogOpen(true)}
                    >
                      Create Strategy
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentStrategy.length > 0 ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-orange-500/5">
                        <h3 className="font-medium mb-2">Current Focus</h3>
                        <ul className="space-y-2">
                          {currentStrategy.slice(0, 3).map((item, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm"
                            >
                              <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        {currentStrategy.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => setIsStrategyDialogOpen(true)}
                          >
                            View More
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No active strategy</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setIsStrategyDialogOpen(true)}
                      >
                        Create Your First Strategy
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <RightsManagementCard />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <DistributionCard />
            </motion.div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6 backdrop-blur-sm border-orange-500/10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <BarChart2 className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Performance Analytics</h2>
                        <p className="text-sm text-muted-foreground">
                          Track your music performance metrics
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="gap-2" onClick={() => setSelectedPeriod("7d")}>
                        <Calendar className="h-4 w-4" />
                        7 días
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => setSelectedPeriod("30d")}>
                        <Calendar className="h-4 w-4" />
                        30 días
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => setSelectedPeriod("12m")}>
                        <Calendar className="h-4 w-4" />
                        12 meses
                      </Button>
                      <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                        <Download className="h-4 w-4" />
                        Export Report
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <Music2 className="h-4 w-4 text-orange-500" />
                          <h3 className="text-sm font-medium">Total Streams</h3>
                        </div>
                        <p className="text-2xl font-bold">{musicMetrics.totalStreams.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-green-500">↑ 12.5%</span> vs last period
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-orange-500" />
                          <h3 className="text-sm font-medium">Monthly Listeners</h3>
                        </div>
                        <p className="text-2xl font-bold">{musicMetrics.monthlyListeners.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-green-500">↑ 8.3%</span> vs last month
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-orange-500" />
                          <h3 className="text-sm font-medium">Revenue Growth</h3>
                        </div>
                        <p className="text-2xl font-bold">+{musicMetrics.revenueGrowth}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Monthly growth
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <Share2 className="h-4 w-4 text-orange-500" />
                          <h3 className="text-sm font-medium">Social Engagement</h3>
                        </div>
                        <p className="text-2xl font-bold">87.2%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-green-500">↑ 5.2%</span> engagement rate
                        </p>
                      </div>
                    </Card>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={generateTimeData(30)}>
                            <defs>
                              <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
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
                              dataKey="streams"
                              name="Streams"
                              stroke="hsl(24, 95%, 53%)"
                              fillOpacity={1}
                              fill="url(#colorPerformance)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={musicMetrics.topCountries}
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {musicMetrics.topCountries.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
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
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {musicMetrics.topCountries.map((country, index) => (
                          <div key={country.name} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm">{country.name}</span>
                            <span className="text-sm text-muted-foreground ml-auto">
                              {country.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
          <StrategyDialog
            open={isStrategyDialogOpen}
            onOpenChange={setIsStrategyDialogOpen}
            selectedStrategy={selectedStrategy}
            onStrategyUpdate={fetchStrategies}
          />
        </div>
      </main>
    </div>
  );
}