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
              <div className="relative p-12 md:p-16">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Manager Tools
                </h1>
                <p className="text-xl text-white/90 max-w-2xl mb-8">
                  Professional tools for comprehensive artist and production management
                </p>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-lg px-8 py-6"
                >
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </section>

            <Tabs defaultValue="technical" value={selectedTab} onValueChange={setSelectedTab}>
              <div className="mb-12">
                <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              </div>

              {/* Technical Rider Tab */}
              <TabsContent value="technical">
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="p-8 hover:bg-orange-500/5 transition-colors">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 bg-orange-500/10 rounded-lg">
                        <FileText className="h-8 w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold">Generate Technical Rider</h3>
                        <p className="text-muted-foreground mt-1">
                          Create and manage technical specifications
                        </p>
                      </div>
                    </div>
                    <div className="space-y-6 mb-8">
                      <div className="flex items-center gap-3">
                        <ChevronRight className="h-5 w-5 text-orange-500" />
                        <span className="text-lg">Stage plot and dimensions</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ChevronRight className="h-5 w-5 text-orange-500" />
                        <span className="text-lg">Equipment specifications</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ChevronRight className="h-5 w-5 text-orange-500" />
                        <span className="text-lg">Audio requirements</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                        <Upload className="mr-2 h-5 w-5" />
                        Create New
                      </Button>
                      <Button size="lg" variant="outline">
                        <Download className="mr-2 h-5 w-5" />
                        Download
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-8 hover:bg-orange-500/5 transition-colors">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 bg-orange-500/10 rounded-lg">
                        <Building2 className="h-8 w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold">Provider Directory</h3>
                        <p className="text-muted-foreground mt-1">
                          Connect with technical equipment providers
                        </p>
                      </div>
                    </div>
                    <div className="space-y-6 mb-8">
                      <div className="flex items-center gap-3">
                        <BadgeCheck className="h-5 w-5 text-orange-500" />
                        <span className="text-lg">Verified providers network</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-orange-500" />
                        <span className="text-lg">Equipment specifications</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        <span className="text-lg">Availability calendar</span>
                      </div>
                    </div>
                    <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600">
                      Browse Providers
                    </Button>
                  </Card>
                </div>
              </TabsContent>

              {/* Production Requirements Tab */}
              <TabsContent value="requirements">
                <Card className="p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-orange-500/10 rounded-lg">
                      <ClipboardList className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold">Artist Requirements</h3>
                      <p className="text-muted-foreground mt-1">
                        Manage and track artist needs and preferences
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-12 mb-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Coffee className="h-6 w-6 text-orange-500" />
                        <h4 className="text-xl font-medium">Catering & Hospitality</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Dietary restrictions</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Preferred meals</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Beverages</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <MapPin className="h-6 w-6 text-orange-500" />
                        <h4 className="text-xl font-medium">Accommodation</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Hotel preferences</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Room requirements</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Special requests</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600">
                    Update Requirements
                  </Button>
                </Card>
              </TabsContent>

              {/* Budget Tab */}
              <TabsContent value="budget">
                <Card className="p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-orange-500/10 rounded-lg">
                      <DollarSign className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold">Production Budget</h3>
                      <p className="text-muted-foreground mt-1">
                        Manage and track production expenses
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-12 mb-8">
                    <div className="space-y-6">
                      <h4 className="text-xl font-medium">Equipment & Technical</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-lg">
                          <span>Sound System</span>
                          <span className="text-orange-500 font-medium">$2,000</span>
                        </div>
                        <div className="flex items-center justify-between text-lg">
                          <span>Lighting</span>
                          <span className="text-orange-500 font-medium">$1,500</span>
                        </div>
                        <div className="flex items-center justify-between text-lg">
                          <span>Stage Setup</span>
                          <span className="text-orange-500 font-medium">$1,000</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xl font-medium">Staff & Services</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-lg">
                          <span>Technical Staff</span>
                          <span className="text-orange-500 font-medium">$1,200</span>
                        </div>
                        <div className="flex items-center justify-between text-lg">
                          <span>Security</span>
                          <span className="text-orange-500 font-medium">$800</span>
                        </div>
                        <div className="flex items-center justify-between text-lg">
                          <span>Catering</span>
                          <span className="text-orange-500 font-medium">$600</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-orange-500/5 rounded-lg mb-8">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-semibold">Total Budget</span>
                      <span className="text-3xl font-bold text-orange-500">$7,100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                      Create Budget
                    </Button>
                    <Button size="lg" variant="outline">
                      Export Report
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Logistics Tab */}
              <TabsContent value="logistics">
                <Card className="p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-orange-500/10 rounded-lg">
                      <Truck className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold">Production Logistics</h3>
                      <p className="text-muted-foreground mt-1">
                        Coordinate and manage production logistics
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-12 mb-8">
                    <div className="space-y-6">
                      <h4 className="text-xl font-medium">Transportation</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Equipment transport</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Artist transportation</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Crew movement</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xl font-medium">Schedule</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Load-in times</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Setup schedule</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Performance timeline</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600">
                    Manage Logistics
                  </Button>
                </Card>
              </TabsContent>

              {/* Hiring Tab */}
              <TabsContent value="hiring">
                <Card className="p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-orange-500/10 rounded-lg">
                      <Briefcase className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold">Hiring Tools</h3>
                      <p className="text-muted-foreground mt-1">
                        Manage your production team recruitment
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-12 mb-8">
                    <div className="space-y-6">
                      <h4 className="text-xl font-medium">Technical Staff</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Sound engineers</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Lighting technicians</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Stage managers</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xl font-medium">Support Staff</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Security personnel</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Hospitality staff</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-lg">Transportation team</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                      Post Job
                    </Button>
                    <Button size="lg" variant="outline">
                      View Applications
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* AI Assistant Tab */}
              <TabsContent value="ai">
                <Card className="p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-orange-500/10 rounded-lg">
                      <Brain className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold">AI Production Assistant</h3>
                      <p className="text-muted-foreground mt-1">
                        Get AI-powered insights and recommendations
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-orange-500/5 rounded-lg">
                      <h4 className="text-xl font-medium mb-4">Ask AI Assistant</h4>
                      <textarea
                        className="w-full p-3 rounded-lg bg-background border border-input"
                        placeholder="Type your question here..."
                        rows={4}
                      />
                      <Button size="lg" className="w-full mt-4 bg-orange-500 hover:bg-orange-600">
                        <SendHorizontal className="mr-2 h-5 w-5" />
                        Get AI Response
                      </Button>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xl font-medium">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Button size="lg" variant="outline" className="justify-start">
                          <FileText className="mr-2 h-5 w-5" />
                          Generate Report
                        </Button>
                        <Button size="lg" variant="outline" className="justify-start">
                          <Calendar className="mr-2 h-5 w-5" />
                          Schedule Optimizer
                        </Button>
                        <Button size="lg" variant="outline" className="justify-start">
                          <DollarSign className="mr-2 h-5 w-5" />
                          Budget Analysis
                        </Button>
                        <Button size="lg" variant="outline" className="justify-start">
                          <Users2 className="mr-2 h-5 w-5" />
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