import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Activity, Globe, Map, Flag } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function GlobalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Global Reach
              </h1>
              <p className="text-muted-foreground mt-2">
                Monitor your worldwide audience and impact
              </p>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Globe className="mr-2 h-4 w-4" />
              Global Overview
            </Button>
          </div>

          <Card className="p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Global Performance</h3>
              <p className="text-sm text-muted-foreground">
                Track your reach across different regions
              </p>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.from({ length: 30 }, (_, i) => ({
                  date: new Date(2024, 0, i + 1).toLocaleDateString(),
                  america: Math.floor(Math.random() * 1000) + 500,
                  europe: Math.floor(Math.random() * 800) + 300,
                  asia: Math.floor(Math.random() * 600) + 200,
                }))}>
                  <defs>
                    <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="america"
                    name="Americas"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={1}
                    fill="url(#colorGlobal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="europe"
                    name="Europe"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.5}
                    fill="url(#colorGlobal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="asia"
                    name="Asia"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.3}
                    fill="url(#colorGlobal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
