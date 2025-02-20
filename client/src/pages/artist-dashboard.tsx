import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { motion } from "framer-motion";
import {
  Video,
  Music2,
  BarChart2,
  User,
  Users,
  DollarSign,
  Plus,
  PlayCircle,
  Mic2,
  Loader2,
  X,
  Grid,
  Info,
  ChevronRight,
  Trash2,
  Share2,
  Calendar,
  Download,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { RightsManagementCard } from "@/components/rights/rights-management-card";
import { DistributionCard } from "@/components/distribution/distribution-card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];

export function ArtistDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-gray-100">
      <Header />
      <main className="flex-1 pt-20">
        <div className="relative w-full h-[50vh] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/assets/artist-background.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-background" />
          <div className="relative z-10 container mx-auto h-full flex flex-col justify-end items-center md:items-start px-4 md:px-8 py-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70 drop-shadow-lg"
            >
              Welcome to Your Creative Hub
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-base sm:text-lg md:text-xl text-muted-foreground"
            >
              Manage and enhance your musical presence from one place
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full mt-8">
              <Card className="p-6 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Artist Profile
                    </p>
                    <div className="mt-2">
                      {auth.currentUser && (
                        <Link href={`/artist/${auth.currentUser.uid}`}>
                          <Button className="bg-orange-500 hover:bg-orange-600">
                            View Artist Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ArtistDashboard;