import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Users, Zap, ArrowUpRight, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

// Sample data for token appreciation
const appreciationData = [
  { month: "Month 0", price: 0.10, volume: 50 },
  { month: "Month 1", price: 0.15, volume: 120 },
  { month: "Month 2", price: 0.28, volume: 280 },
  { month: "Month 3", price: 0.45, volume: 450 },
  { month: "Month 4", price: 0.72, volume: 680 },
  { month: "Month 5", price: 1.20, volume: 950 },
  { month: "Month 6", price: 2.10, volume: 1400 },
  { month: "Month 7", price: 3.45, volume: 1850 },
  { month: "Month 8", price: 5.20, volume: 2300 }
];

// Portfolio growth example
const portfolioData = [
  { month: "Start", value: 1000 },
  { month: "M1", value: 1150 },
  { month: "M2", value: 1380 },
  { month: "M3", value: 1920 },
  { month: "M4", value: 2850 },
  { month: "M5", value: 4100 },
  { month: "M6", value: 6200 },
  { month: "M7", value: 9400 },
  { month: "M8", value: 14200 }
];

// Revenue distribution
const revenueData = [
  { category: "Artists (80%)", value: 80 },
  { category: "Platform (5%)", value: 5 },
  { category: "LPs (15%)", value: 15 }
];

export function InvestmentPotential() {
  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-slate-900 to-black overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-l from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Investment Potential
            </span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Artist tokens have shown explosive growth. Early investors have seen returns of 5000%+ from emerging artists
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: TrendingUp, label: "Avg. Growth", value: "423%", change: "+52% YoY" },
            { icon: Target, label: "Early Bird Bonus", value: "5-20x", change: "Within 12 months" },
            { icon: Users, label: "Active Artists", value: "1,000+", change: "+250 monthly" },
            { icon: DollarSign, label: "Avg. Token Return", value: "$4.23", change: "From $0.10 launch" }
          ].map((metric, i) => {
            const Icon = metric.icon;
            return (
              <Card key={i} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-blue-500/30 transition">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-8 h-8 text-blue-400" />
                    <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {metric.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                  <p className="text-sm text-slate-400">{metric.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Token Price Appreciation */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Token Price Appreciation
              </CardTitle>
              <CardDescription>8-month growth projection from launch</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={appreciationData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-slate-400 mt-4">Typical emerging artist token performance</p>
            </CardContent>
          </Card>

          {/* Portfolio Growth */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-400" />
                $1000 Portfolio Growth
              </CardTitle>
              <CardDescription>Diversified 5-artist token portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={portfolioData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f97316" 
                    fillOpacity={1} 
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-slate-400 mt-4">Return: 1,320% (14.2x your investment)</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Distribution */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              Revenue Distribution Model
            </CardTitle>
            <CardDescription>How platform fees benefit all stakeholders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="category" stroke="#94a3b8" style={{ fontSize: "11px" }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-400 mb-1">80% - Artists & Royalties</p>
                  <p className="text-xs text-slate-400">Direct earnings from token sales and ongoing royalties</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                  <p className="text-sm font-semibold text-orange-400 mb-1">5% - Platform Fee</p>
                  <p className="text-xs text-slate-400">Supports development, marketing, and infrastructure</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-400 mb-1">15% - Liquidity Providers</p>
                  <p className="text-xs text-slate-400">Rewards for providing market liquidity</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Invest */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {[
            { title: "Early Adoption", desc: "Get in before mainstream adoption - biggest gains come early" },
            { title: "Diversified Portfolio", desc: "Spread risk across multiple artist tokens for stability" },
            { title: "Direct Support", desc: "Every purchase directly supports your favorite creators" },
            { title: "Passive Income", desc: "Earn royalties and trading fees as token value grows" },
            { title: "Community Power", desc: "Token holders have voting rights on artist initiatives" },
            { title: "Transparent Blockchain", desc: "All transactions verifiable on-chain - full transparency" }
          ].map((item, i) => (
            <Card key={i} className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/30">
              <CardContent className="pt-6">
                <p className="font-semibold text-white mb-2">{item.title}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
