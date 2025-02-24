import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Utensils,
  DollarSign,
  Truck,
  Users2,
  Brain,
  Calendar as CalendarIcon,
  ChevronRight,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TechnicalRiderSection } from "@/components/manager/technical-rider";
import { RequirementsSection } from "@/components/manager/requirements";
import { BudgetSection } from "@/components/manager/budget";
import { LogisticsSection } from "@/components/manager/logistics";
import { HiringSection } from "@/components/manager/hiring";
import { AIToolsSection } from "@/components/manager/ai-tools";
import { CalendarSection } from "@/components/manager/calendar";


export default function ManagerToolsPage() {
  const [selectedTab, setSelectedTab] = useState("technical");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
          <div className="container mx-auto px-4 py-6">
            {/* Hero Section with Video Background */}
            <section className="relative rounded-xl overflow-hidden mb-12">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                src="/assets/Standard_Mode_Generated_Video (9).mp4"
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="relative p-8 md:p-16">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6">
                  Manager Tools
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-6 md:mb-8">
                  Professional tools for comprehensive artist and production management
                </p>
              </div>
            </section>

            <Tabs defaultValue={selectedTab} value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b grid grid-cols-3 md:grid-cols-3 lg:grid-cols-7 gap-2 md:gap-4 p-2">
                <TabsTrigger value="technical" className="data-[state=active]:bg-orange-500">
                  <FileText className="w-4 h-4" />
                  <span>Technical</span>
                </TabsTrigger>
                <TabsTrigger value="requirements" className="data-[state=active]:bg-orange-500">
                  <Utensils className="w-4 h-4" />
                  <span>Requirements</span>
                </TabsTrigger>
                <TabsTrigger value="budget" className="data-[state=active]:bg-orange-500">
                  <DollarSign className="w-4 h-4" />
                  <span>Budget</span>
                </TabsTrigger>
                <TabsTrigger value="logistics" className="data-[state=active]:bg-orange-500">
                  <Truck className="w-4 h-4" />
                  <span>Logistics</span>
                </TabsTrigger>
                <TabsTrigger value="hiring" className="data-[state=active]:bg-orange-500">
                  <Users2 className="w-4 h-4" />
                  <span>Hiring</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-orange-500">
                  <Brain className="w-4 h-4" />
                  <span>AI</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="data-[state=active]:bg-orange-500">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Calendar</span>
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="technical">
                  <TechnicalRiderSection />
                </TabsContent>
                <TabsContent value="requirements">
                  <RequirementsSection />
                </TabsContent>
                <TabsContent value="budget">
                  <BudgetSection />
                </TabsContent>
                <TabsContent value="logistics">
                  <LogisticsSection />
                </TabsContent>
                <TabsContent value="hiring">
                  <HiringSection />
                </TabsContent>
                <TabsContent value="ai">
                  <AIToolsSection />
                </TabsContent>
                <TabsContent value="calendar">
                  <CalendarSection />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}