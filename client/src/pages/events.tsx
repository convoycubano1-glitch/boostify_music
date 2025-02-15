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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useState } from "react";

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
  type: string;
  registrationLink?: string;
}

const majorEventsData: Event[] = [
  {
    id: 1,
    title: "The 67th Annual Grammy Awards",
    description: "Music's Biggest Night celebrating the best in music across all genres",
    date: "2025-02-02",
    time: "20:00",
    location: "Crypto.com Arena, Los Angeles",
    attendees: 18000,
    maxCapacity: 20000,
    image: "https://source.unsplash.com/random/800x600/?grammy-awards",
    type: "awards",
    registrationLink: "https://www.grammy.com/tickets"
  },
  {
    id: 2,
    title: "Billboard Music Awards 2025",
    description: "Annual music awards ceremony celebrating chart success",
    date: "2025-05-15",
    time: "19:00",
    location: "MGM Grand Garden Arena, Las Vegas",
    attendees: 15000,
    maxCapacity: 17000,
    image: "https://source.unsplash.com/random/800x600/?billboard-awards",
    type: "awards",
    registrationLink: "https://www.billboard.com/awards"
  },
  {
    id: 3,
    title: "Coachella Valley Music and Arts Festival",
    description: "The world's most iconic music festival",
    date: "2025-04-11",
    time: "12:00",
    location: "Empire Polo Club, Indio, California",
    attendees: 125000,
    maxCapacity: 125000,
    image: "https://source.unsplash.com/random/800x600/?coachella-festival",
    type: "festival",
    registrationLink: "https://www.coachella.com/tickets"
  },
  {
    id: 4,
    title: "MTV Video Music Awards 2025",
    description: "Celebrating the best music videos of the year",
    date: "2025-08-25",
    time: "20:00",
    location: "Barclays Center, Brooklyn",
    attendees: 19000,
    maxCapacity: 19000,
    image: "https://source.unsplash.com/random/800x600/?mtv-vma",
    type: "awards",
    registrationLink: "https://www.mtv.com/vma/tickets"
  },
  {
    id: 5,
    title: "Glastonbury Festival 2025",
    description: "The largest greenfield music festival in the world",
    date: "2025-06-25",
    time: "09:00",
    location: "Worthy Farm, Somerset, UK",
    attendees: 210000,
    maxCapacity: 210000,
    image: "https://source.unsplash.com/random/800x600/?glastonbury",
    type: "festival",
    registrationLink: "https://www.glastonburyfestivals.co.uk"
  },
  {
    id: 6,
    title: "American Music Awards 2025",
    description: "The world's largest fan-voted awards show",
    date: "2025-11-20",
    time: "20:00",
    location: "Microsoft Theater, Los Angeles",
    attendees: 7100,
    maxCapacity: 7100,
    image: "https://source.unsplash.com/random/800x600/?music-awards",
    type: "awards",
    registrationLink: "https://www.theamas.com/tickets"
  },
  {
    id: 7,
    title: "iHeartRadio Music Festival 2025",
    description: "Two-day music festival featuring the biggest names in music",
    date: "2025-09-19",
    time: "19:00",
    location: "T-Mobile Arena, Las Vegas",
    attendees: 16800,
    maxCapacity: 20000,
    image: "https://source.unsplash.com/random/800x600/?concert-festival",
    type: "festival",
    registrationLink: "https://www.iheart.com/festival"
  },
  {
    id: 8,
    title: "Latin Grammy Awards 2025",
    description: "Celebrating excellence in Latin music",
    date: "2025-11-14",
    time: "20:00",
    location: "Miami-Dade Arena, Miami",
    attendees: 19000,
    maxCapacity: 19000,
    image: "https://source.unsplash.com/random/800x600/?latin-grammy",
    type: "awards",
    registrationLink: "https://www.latingrammy.com/tickets"
  },
  {
    id: 9,
    title: "Ultra Music Festival 2025",
    description: "Premier electronic music festival",
    date: "2025-03-28",
    time: "16:00",
    location: "Bayfront Park, Miami",
    attendees: 165000,
    maxCapacity: 165000,
    image: "https://source.unsplash.com/random/800x600/?ultra-festival",
    type: "festival",
    registrationLink: "https://ultramusicfestival.com/tickets"
  },
  {
    id: 10,
    title: "BRIT Awards 2025",
    description: "The British Phonographic Industry's annual popular music awards",
    date: "2025-02-20",
    time: "20:00",
    location: "The O2 Arena, London",
    attendees: 20000,
    maxCapacity: 20000,
    image: "https://source.unsplash.com/random/800x600/?brit-awards",
    type: "awards",
    registrationLink: "https://www.brits.co.uk/tickets"
  }
];

const chartData = {
  monthlyAttendance: Array.from({ length: 12 }, (_, month) => ({
    month: new Date(2025, month).toLocaleString('default', { month: 'short' }),
    attendance: Math.floor(Math.random() * 50000 + 10000),
  })),
  eventTypes: [
    { name: 'Awards Shows', value: 45 },
    { name: 'Music Festivals', value: 30 },
    { name: 'Conferences', value: 15 },
    { name: 'Industry Events', value: 10 },
  ],
  venueCapacity: [
    { venue: 'Crypto.com Arena', capacity: 20000 },
    { venue: 'O2 Arena', capacity: 20000 },
    { venue: 'Madison Square Garden', capacity: 18000 },
    { venue: 'Barclays Center', capacity: 19000 },
  ]
};

const COLORS = ['#f97316', '#ea580c', '#c2410c', '#9a3412'];

export default function EventsPage() {
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxCapacity: '',
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6 pt-20">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Industry Events
              </h1>
              <p className="text-muted-foreground mt-2">
                Discover and manage major music industry events
              </p>
            </div>
            <Dialog open={showCreateEventDialog} onOpenChange={setShowCreateEventDialog}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Maximum Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newEvent.maxCapacity}
                      onChange={(e) => setNewEvent({...newEvent, maxCapacity: e.target.value})}
                    />
                  </div>
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      // Add event handling logic here
                      setShowCreateEventDialog(false);
                    }}
                  >
                    Create Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Events Section */}
          <Tabs defaultValue="upcoming" className="w-full mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
              <TabsTrigger value="my-events">My Events</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <div className="grid gap-6">
                {majorEventsData.map((event) => (
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
                          {event.registrationLink && (
                            <Button 
                              variant="outline"
                              onClick={() => window.open(event.registrationLink, '_blank')}
                            >
                              Register
                            </Button>
                          )}
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

            <TabsContent value="my-events">
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold mb-4">Create Your Own Events</h3>
                <p className="text-muted-foreground mb-6">
                  Start managing your own music industry events
                </p>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => setShowCreateEventDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Event
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Analytics Section */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Monthly Attendance</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.monthlyAttendance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                    <Bar dataKey="attendance" fill="hsl(24, 95%, 53%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Event Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.eventTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.eventTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Venue Capacities</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.venueCapacity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="venue" type="category" width={100} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                    <Bar dataKey="capacity" fill="hsl(24, 95%, 53%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}