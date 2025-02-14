import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import {
  Search,
  DollarSign,
  Building2,
  Calendar,
  MapPin,
  Users,
  Briefcase,
  FileText,
  BarChart2,
  GraduationCap
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function ManagerToolsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                  Manager Tools
                </h1>
                <p className="text-muted-foreground mt-2">
                  Professional tools for artist management and business growth
                </p>
              </div>
            </div>

            <Tabs defaultValue="shows" className="space-y-6">
              <TabsList className="grid grid-cols-3 lg:w-[400px]">
                <TabsTrigger value="shows">Show Finder</TabsTrigger>
                <TabsTrigger value="investors">Investors</TabsTrigger>
                <TabsTrigger value="business">Business</TabsTrigger>
              </TabsList>

              {/* Show Finder Tab */}
              <TabsContent value="shows" className="space-y-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Upcoming Shows Card */}
                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Calendar className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Upcoming Shows</h3>
                        <p className="text-sm text-muted-foreground">
                          Browse available venues and dates
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Find Venues
                    </Button>
                  </Card>

                  {/* Location Based Search */}
                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <MapPin className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Location Search</h3>
                        <p className="text-sm text-muted-foreground">
                          Find venues by location
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Search Map
                    </Button>
                  </Card>

                  {/* Venue Directory */}
                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Building2 className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Venue Directory</h3>
                        <p className="text-sm text-muted-foreground">
                          Browse our venue database
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      View Directory
                    </Button>
                  </Card>
                </div>
              </TabsContent>

              {/* Investors Tab */}
              <TabsContent value="investors" className="space-y-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Find Investors Card */}
                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <DollarSign className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Find Investors</h3>
                        <p className="text-sm text-muted-foreground">
                          Connect with potential investors
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Browse Investors
                    </Button>
                  </Card>

                  {/* Investment Proposals */}
                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Briefcase className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Investment Proposals</h3>
                        <p className="text-sm text-muted-foreground">
                          Create and manage proposals
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Create Proposal
                    </Button>
                  </Card>

                  {/* Network */}
                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Users className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Investor Network</h3>
                        <p className="text-sm text-muted-foreground">
                          Join our investor community
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Join Network
                    </Button>
                  </Card>
                </div>
              </TabsContent>

              {/* Business Tab */}
              <TabsContent value="business" className="space-y-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Contract Templates */}
                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <FileText className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Contract Templates</h3>
                        <p className="text-sm text-muted-foreground">
                          Professional legal templates
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      View Templates
                    </Button>
                  </Card>

                  {/* Business Analytics */}
                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <BarChart2 className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Business Analytics</h3>
                        <p className="text-sm text-muted-foreground">
                          Track business performance
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      View Analytics
                    </Button>
                  </Card>

                  {/* Resource Center */}
                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <GraduationCap className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Resource Center</h3>
                        <p className="text-sm text-muted-foreground">
                          Business guides and resources
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Browse Resources
                    </Button>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}