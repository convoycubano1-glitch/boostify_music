import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import {
  FileText,
  Utensils,
  DollarSign,
  Truck,
  Users2,
  Brain,
  Building2,
  Calendar,
  MapPin,
  Briefcase,
  Download,
  Upload,
  SendHorizontal,
  Coffee,
  BadgeCheck,
  ChevronRight,
  Settings,
  ClipboardList
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function ManagerToolsPage() {
  const [selectedTab, setSelectedTab] = useState("technical");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
          <div className="container mx-auto px-4 py-6">
            {/* Hero Section with Video Background */}
            <section className="relative rounded-xl overflow-hidden mb-8">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                src="/assets/Standard_Mode_Generated_Video (9).mp4"
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="relative p-8 md:p-12">
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70 mb-4">
                  Manager Tools
                </h1>
                <p className="text-lg text-white/90 max-w-2xl">
                  Professional tools for comprehensive artist and production management
                </p>
              </div>
            </section>

            <Tabs defaultValue="technical" value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <TabsList className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <TabsTrigger value="technical" className="data-[state=active]:bg-orange-500">
                  <FileText className="w-4 h-4 mr-2" />
                  Technical Rider
                </TabsTrigger>
                <TabsTrigger value="requirements" className="data-[state=active]:bg-orange-500">
                  <Utensils className="w-4 h-4 mr-2" />
                  Requirements
                </TabsTrigger>
                <TabsTrigger value="budget" className="data-[state=active]:bg-orange-500">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Budget
                </TabsTrigger>
                <TabsTrigger value="logistics" className="data-[state=active]:bg-orange-500">
                  <Truck className="w-4 h-4 mr-2" />
                  Logistics
                </TabsTrigger>
                <TabsTrigger value="hiring" className="data-[state=active]:bg-orange-500">
                  <Users2 className="w-4 h-4 mr-2" />
                  Hiring
                </TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-orange-500">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Assistant
                </TabsTrigger>
              </TabsList>

              {/* Technical Rider Tab */}
              <TabsContent value="technical" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6 hover:bg-orange-500/5 transition-colors">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <FileText className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Generate Technical Rider</h3>
                        <p className="text-sm text-muted-foreground">
                          Create and manage technical specifications
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <ChevronRight className="h-4 w-4 text-orange-500" />
                        <span>Stage plot and dimensions</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ChevronRight className="h-4 w-4 text-orange-500" />
                        <span>Equipment specifications</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ChevronRight className="h-4 w-4 text-orange-500" />
                        <span>Audio requirements</span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-6">
                      <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
                        <Upload className="mr-2 h-4 w-4" />
                        Create New
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6 hover:bg-orange-500/5 transition-colors">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Building2 className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Provider Directory</h3>
                        <p className="text-sm text-muted-foreground">
                          Connect with technical equipment providers
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <BadgeCheck className="h-4 w-4 text-orange-500" />
                        <span>Verified providers network</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Settings className="h-4 w-4 text-orange-500" />
                        <span>Equipment specifications</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span>Availability calendar</span>
                      </div>
                    </div>
                    <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600">
                      Browse Providers
                    </Button>
                  </Card>
                </div>
              </TabsContent>

              {/* Production Requirements Tab */}
              <TabsContent value="requirements" className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <ClipboardList className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Artist Requirements</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage and track artist needs and preferences
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-orange-500" />
                        Catering & Hospitality
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Dietary restrictions</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Preferred meals</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Beverages</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        Accommodation
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Hotel preferences</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Room requirements</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Special requests</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600">
                    Update Requirements
                  </Button>
                </Card>
              </TabsContent>

              {/* Budget Tab */}
              <TabsContent value="budget" className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <DollarSign className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Production Budget</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage and track production expenses
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Equipment & Technical</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Sound System</span>
                          <span className="text-orange-500">$2,000</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Lighting</span>
                          <span className="text-orange-500">$1,500</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Stage Setup</span>
                          <span className="text-orange-500">$1,000</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Staff & Services</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Technical Staff</span>
                          <span className="text-orange-500">$1,200</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Security</span>
                          <span className="text-orange-500">$800</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Catering</span>
                          <span className="text-orange-500">$600</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-orange-500/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total Budget</span>
                      <span className="text-xl font-bold text-orange-500">$7,100</span>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
                      Create Budget
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Export Report
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Logistics Tab */}
              <TabsContent value="logistics" className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Truck className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Production Logistics</h3>
                      <p className="text-sm text-muted-foreground">
                        Coordinate and manage production logistics
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Transportation</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Equipment transport</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Artist transportation</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Crew movement</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Schedule</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Load-in times</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Setup schedule</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Performance timeline</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600">
                    Manage Logistics
                  </Button>
                </Card>
              </TabsContent>

              {/* Hiring Tab */}
              <TabsContent value="hiring" className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Briefcase className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Hiring Tools</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your production team recruitment
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Technical Staff</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Sound engineers</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Lighting technicians</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Stage managers</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Support Staff</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Security personnel</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Hospitality staff</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span>Transportation team</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
                      Post Job
                    </Button>
                    <Button variant="outline" className="flex-1">
                      View Applications
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* AI Assistant Tab */}
              <TabsContent value="ai" className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Brain className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">AI Production Assistant</h3>
                      <p className="text-sm text-muted-foreground">
                        Get AI-powered insights and recommendations
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-orange-500/5 rounded-lg">
                      <h4 className="font-medium mb-4">Ask AI Assistant</h4>
                      <textarea
                        className="w-full p-3 rounded-lg bg-background border border-input"
                        placeholder="Type your question here..."
                        rows={4}
                      />
                      <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600">
                        <SendHorizontal className="mr-2 h-4 w-4" />
                        Get AI Response
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="justify-start">
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Report
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Optimizer
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Budget Analysis
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Users2 className="mr-2 h-4 w-4" />
                          Team Suggestions
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}