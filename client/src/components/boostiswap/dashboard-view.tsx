import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockchainStatusWidget } from "./blockchain-status-widget";
import {
  BarChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function DashboardView() {
  const priceData = [
    { time: "00:00", "Song A": 1.2, "Song B": 0.95, "Song C": 1.45 },
    { time: "04:00", "Song A": 1.35, "Song B": 1.05, "Song C": 1.52 },
    { time: "08:00", "Song A": 1.28, "Song B": 0.98, "Song C": 1.48 },
    { time: "12:00", "Song A": 1.45, "Song B": 1.15, "Song C": 1.62 },
    { time: "16:00", "Song A": 1.42, "Song B": 1.12, "Song C": 1.58 },
    { time: "20:00", "Song A": 1.5, "Song B": 1.18, "Song C": 1.65 },
    { time: "24:00", "Song A": 1.55, "Song B": 1.22, "Song C": 1.72 },
  ];

  const volumeData = [
    { day: "Monday", volume: 2400, trades: 124 },
    { day: "Tuesday", volume: 3200, trades: 156 },
    { day: "Wednesday", volume: 2800, trades: 142 },
    { day: "Thursday", volume: 3900, trades: 189 },
    { day: "Friday", volume: 4200, trades: 201 },
    { day: "Saturday", volume: 3800, trades: 178 },
    { day: "Sunday", volume: 2900, trades: 145 },
  ];

  const liquidityData = [
    { pool: "Luna/USDC", liquidity: 450000 },
    { pool: "Urban/USDC", liquidity: 380000 },
    { pool: "Neon/USDC", liquidity: 350000 },
    { pool: "Electric/USDC", liquidity: 520000 },
    { pool: "Soul/USDC", liquidity: 420000 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Blockchain Status Widget */}
      <div className="lg:col-span-1">
        <BlockchainStatusWidget />
      </div>

      {/* 24h Price Chart */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700 lg:col-span-2">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="flex items-center gap-2">
            📊 Price History (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={priceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Song A"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Song B"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Song C"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volume & Trades */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="text-base">📈 Trading Volume (Weekly)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="volume" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Liquidity Distribution */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="text-base">💧 Liquidity by Pool</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={liquidityData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="pool" type="category" stroke="#94a3b8" width={95} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="liquidity" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700">
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="text-base">📊 Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
            <span className="text-muted-foreground">Total Swaps (24h)</span>
            <span className="font-bold text-orange-400 text-lg">1,245</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
            <span className="text-muted-foreground">Avg. Trade Size</span>
            <span className="font-bold text-orange-400 text-lg">$1,920</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
            <span className="text-muted-foreground">Total Fees Collected</span>
            <span className="font-bold text-green-400 text-lg">$4,850</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
            <span className="text-muted-foreground">Unique Traders</span>
            <span className="font-bold text-blue-400 text-lg">342</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
