import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Activity, Calendar, MapPin, Users, Clock, Plus } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxCapacity: number;
  image: string;
  type: "concert" | "conference" | "networking" | "workshop";
}

const eventsData: Event[] = [
  {
    id: 1,
    title: "Music Industry Networking Summit 2025",
    description: "Connect with leading professionals in the music industry",
    date: "2025-03-15",
    time: "18:00",
    location: "Los Angeles Convention Center",
    attendees: 230,
    maxCapacity: 300,
    image: "https://source.unsplash.com/random/800x600/?conference",
    type: "networking"
  },
  {
    id: 2,
    title: "Digital Marketing for Musicians Workshop",
    description: "Learn the latest strategies for promoting your music online",
    date: "2025-03-20",
    time: "14:00",
    location: "Online - Zoom",
    attendees: 150,
    maxCapacity: 200,
    image: "https://source.unsplash.com/random/800x600/?workshop",
    type: "workshop"
  },
  {
    id: 3,
    title: "Emerging Artists Showcase",
    description: "Live performances from the most promising new talents",
    date: "2025-03-25",
    time: "20:00",
    location: "The Wiltern, Los Angeles",
    attendees: 450,
    maxCapacity: 500,
    image: "https://source.unsplash.com/random/800x600/?concert",
    type: "concert"
  }
];

export default function EventsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Industry Events
              </h1>
              <p className="text-muted-foreground mt-2">
                Discover and manage music industry events
              </p>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </div>

          {/* Analytics Section */}
          <Card className="p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Event Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track event engagement and attendance
              </p>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.from({ length: 30 }, (_, i) => ({
                  date: new Date(2024, 0, i + 1).toLocaleDateString(),
                  attendees: Math.floor(Math.random() * 1000) + 500,
                  engagement: Math.floor(Math.random() * 800) + 300,
                  revenue: Math.floor(Math.random() * 600) + 200,
                }))}>
                  <defs>
                    <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="attendees"
                    name="Attendees"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={1}
                    fill="url(#colorAttendees)"
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    name="Engagement"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.5}
                    fill="url(#colorAttendees)"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.3}
                    fill="url(#colorAttendees)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Events Section */}
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
              <TabsTrigger value="my-events">My Events</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <div className="grid gap-6">
                {eventsData.map((event) => (
                  <Card key={event.id} className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-1/3">
                        <div className="relative aspect-video rounded-lg overflow-hidden">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                            <p className="text-muted-foreground mb-4">{event.description}</p>
                          </div>
                          <Button variant="outline">Register</Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {event.date}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {event.attendees}/{event.maxCapacity}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
