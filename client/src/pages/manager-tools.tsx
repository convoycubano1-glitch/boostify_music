import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Header } from "../components/layout/header";
import { useToast } from "../hooks/use-toast";
import {
  FileText,
  Utensils,
  DollarSign,
  Truck,
  Users2,
  Brain,
  Calendar as CalendarIcon,
  ChevronRight,
  Play,
  ArrowRight
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { motion } from "framer-motion";
import { Calendar } from "../components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { TechnicalRiderSection } from "../components/manager/technical-rider";
import { RequirementsSection } from "../components/manager/requirements";
import { BudgetSection } from "../components/manager/budget";
import { LogisticsSection } from "../components/manager/logistics";
import { HiringSection } from "../components/manager/hiring";
import { AIToolsSection } from "../components/manager/ai-tools";
import { CalendarSection } from "../components/manager/calendar";


export default function ManagerToolsPage() {
  const [selectedTab, setSelectedTab] = useState("technical");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <section className="relative rounded-xl overflow-hidden mb-12">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-purple-500/20" />
              <div className="relative p-8 md:p-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-3xl md:text-5xl font-bold mb-4">
                    Manager Tools
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-6">
                    Professional tools powered by AI for comprehensive artist and production management
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button size="lg" variant="outline">
                      Watch Demo
                      <Play className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Main Content */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="w-full flex-wrap justify-start gap-2 bg-transparent h-auto p-0 mb-8">
                {[
                  { value: "technical", icon: FileText, label: "Technical" },
                  { value: "requirements", icon: Utensils, label: "Requirements" },
                  { value: "budget", icon: DollarSign, label: "Budget" },
                  { value: "logistics", icon: Truck, label: "Logistics" },
                  { value: "hiring", icon: Users2, label: "Hiring" },
                  { value: "ai", icon: Brain, label: "AI Assistant" },
                  { value: "calendar", icon: CalendarIcon, label: "Calendar" }
                ].map(({ value, icon: Icon, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-orange-500"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="space-y-8">
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