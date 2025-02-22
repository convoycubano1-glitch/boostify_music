import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Building2,
  Calendar as CalendarIcon,
  MapPin,
  Briefcase,
  Download,
  Upload,
  SendHorizontal,
  Coffee,
  BadgeCheck,
  ChevronRight,
  Settings,
  ClipboardList,
  ChartBar,
  Loader2
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

interface Task {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate: string;
}

interface Contact {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

interface ScheduleEvent {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  type: "meeting" | "rehearsal" | "performance" | "other";
  status: "scheduled" | "completed" | "cancelled";
}

interface Note {
  id: number;
  title: string;
  content: string;
  category: "general" | "meeting" | "idea" | "todo";
  tags: string[];
}

export default function ManagerToolsPage() {
  const [selectedTab, setSelectedTab] = useState("technical");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Task Management
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    dueDate: new Date().toISOString()
  });

  // Contact Management
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: "",
    role: "",
    email: "",
    phone: "",
    company: "",
    notes: ""
  });

  // Schedule Management
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    title: "",
    description: "",
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    location: "",
    type: "meeting",
    status: "scheduled"
  });

  // Notes Management
  const [newNote, setNewNote] = useState<Partial<Note>>({
    title: "",
    content: "",
    category: "general",
    tags: []
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      // Update the newEvent state with the selected date
      const startOfDay = new Date(date);
      startOfDay.setHours(9, 0, 0); // Default to 9 AM

      const endOfDay = new Date(date);
      endOfDay.setHours(17, 0, 0); // Default to 5 PM

      setNewEvent(prev => ({
        ...prev,
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString()
      }));
      setShowEventDialog(true);
    }
  };


  // Queries
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['manager/tasks'],
    queryFn: async () => {
      const response = await fetch('/api/manager/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    }
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['manager/contacts'],
    queryFn: async () => {
      const response = await fetch('/api/manager/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    }
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['manager/schedule'],
    queryFn: async () => {
      const response = await fetch('/api/manager/schedule');
      if (!response.ok) throw new Error('Failed to fetch schedule');
      return response.json();
    }
  });

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['manager/notes'],
    queryFn: async () => {
      const response = await fetch('/api/manager/notes');
      if (!response.ok) throw new Error('Failed to fetch notes');
      return response.json();
    }
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const response = await fetch('/api/manager/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager/tasks'] });
      toast({ title: "Task created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create task", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const createContactMutation = useMutation({
    mutationFn: async (contactData: Partial<Contact>) => {
      const response = await fetch('/api/manager/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });
      if (!response.ok) throw new Error('Failed to create contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager/contacts'] });
      toast({ title: "Contact created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create contact", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: Partial<ScheduleEvent>) => {
      const response = await fetch('/api/manager/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });
      if (!response.ok) throw new Error('Failed to create schedule event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager/schedule'] });
      toast({ title: "Event scheduled successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to schedule event", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: Partial<Note>) => {
      const response = await fetch('/api/manager/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });
      if (!response.ok) throw new Error('Failed to create note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager/notes'] });
      toast({ title: "Note created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create note", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Handler functions
  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.dueDate) {
      toast({ 
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    await createTaskMutation.mutateAsync(newTask);
    setNewTask({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      dueDate: new Date().toISOString()
    });
  };

  const handleCreateContact = async () => {
    if (!newContact.name || !newContact.email) {
      toast({ 
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    await createContactMutation.mutateAsync(newContact);
    setNewContact({
      name: "",
      role: "",
      email: "",
      phone: "",
      company: "",
      notes: ""
    });
  };

  const handleCreateScheduleEvent = async () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime || !newEvent.location) {
      toast({ 
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    await createScheduleMutation.mutateAsync(newEvent);
    setNewEvent({
      title: "",
      description: "",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      location: "",
      type: "meeting",
      status: "scheduled"
    });
    setShowEventDialog(false);
  };

  const handleCreateNote = async () => {
    if (!newNote.title || !newNote.content) {
      toast({ 
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    await createNoteMutation.mutateAsync(newNote);
    setNewNote({
      title: "",
      content: "",
      category: "general",
      tags: []
    });
  };

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
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-base md:text-lg px-6 py-4 md:px-8 md:py-6 h-auto"
                  onClick={() => setSelectedTab('technical')}
                >
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </section>

            {/* Manager Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
              {/* Venues Catalog */}
              <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                    <MapPin className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold">Venues Catalog</h3>
                    <p className="text-sm text-muted-foreground">
                      Find perfect venues for your events
                    </p>
                  </div>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 h-auto py-3">
                  Find Venues
                </Button>
              </Card>
              {/* Venues Booking */}
              <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                    <CalendarIcon className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold">Venues Booking</h3>
                    <p className="text-sm text-muted-foreground">
                      Schedule and manage bookings
                    </p>
                  </div>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 h-auto py-3">
                  Book Now
                </Button>
              </Card>
              {/* Venues Reports */}
              <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                    <ChartBar className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold">Venues Reports</h3>
                    <p className="text-sm text-muted-foreground">
                      Analytics and performance data
                    </p>
                  </div>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 h-auto py-3">
                  View Reports
                </Button>
              </Card>
              {/* Your Artists */}
              <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                    <Users2 className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold">Your Artists</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your artist roster
                    </p>
                  </div>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 h-auto py-3">
                  View Artists
                </Button>
              </Card>
            </div>

            <Tabs defaultValue={selectedTab} value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 p-2">
                <TabsTrigger 
                  value="technical" 
                  className="data-[state=active]:bg-orange-500 px-2 md:px-4 py-4 md:py-3 h-auto text-[10px] md:text-sm flex flex-col md:flex-row items-center gap-1 md:gap-2"
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">Technical</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="requirements" 
                  className="data-[state=active]:bg-orange-500 px-2 md:px-4 py-4 md:py-3 h-auto text-[10px] md:text-sm flex flex-col md:flex-row items-center gap-1 md:gap-2"
                >
                  <Utensils className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">Requirements</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="budget" 
                  className="data-[state=active]:bg-orange-500 px-2 md:px-4 py-4 md:py-3 h-auto text-[10px] md:text-sm flex flex-col md:flex-row items-center gap-1 md:gap-2"
                >
                  <DollarSign className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">Budget</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="logistics" 
                  className="data-[state=active]:bg-orange-500 px-2 md:px-4 py-4 md:py-3 h-auto text-[10px] md:text-sm flex flex-col md:flex-row items-center gap-1 md:gap-2"
                >
                  <Truck className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">Logistics</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="hiring" 
                  className="data-[state=active]:bg-orange-500 px-2 md:px-4 py-4 md:py-3 h-auto text-[10px] md:text-sm flex flex-col md:flex-row items-center gap-1 md:gap-2"
                >
                  <Users2 className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">Hiring</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ai" 
                  className="data-[state=active]:bg-orange-500 px-2 md:px-4 py-4 md:py-3 h-auto text-[10px] md:text-sm flex flex-col md:flex-row items-center gap-1 md:gap-2"
                >
                  <Brain className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">AI</span>
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="data-[state=active]:bg-orange-500 px-2 md:px-4 py-4 md:py-3 h-auto text-[10px] md:text-sm flex flex-col md:flex-row items-center gap-1 md:gap-2"
                >
                  <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">Calendar</span>
                </TabsTrigger>
              </TabsList>

              <div className="mt-24 md:mt-20 relative">
                {/* Technical Rider Tab */}
                <TabsContent value="technical">
                  <div className="grid gap-6 md:gap-8 md:grid-cols-2">
                    <Card className="p-6 md:p-8 hover:bg-orange-500/5 transition-colors">
                      <div className="flex items-center gap-4 mb-6 md:mb-8">
                        <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                          <FileText className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-semibold">Generate Technical Rider</h3>
                          <p className="text-sm md:text-base text-muted-foreground mt-1">
                            Create and manage technical specifications
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
                        <div className="flex items-center gap-3">
                          <ChevronRight className="h-5 w-5 text-orange-500 flex-shrink-0" />
                          <span className="text-base md:text-lg">Stage plot and dimensions</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <ChevronRight className="h-5 w-5 text-orange-500 flex-shrink-0" />
                          <span className="text-base md:text-lg">Equipment specifications</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <ChevronRight className="h-5 w-5 text-orange-500 flex-shrink-0" />
                          <span className="text-base md:text-lg">Audio requirements</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Button size="lg" className="bg-orange-500 hover:bg-orange-600 h-auto py-3 whitespace-nowrap">
                          <Upload className="mr-2 h-5 w-5 flex-shrink-0" />
                          Create New
                        </Button>
                        <Button size="lg" variant="outline" className="h-auto py-3 whitespace-nowrap">
                          <Download className="mr-2 h-5 w-5 flex-shrink-0" />
                          Download
                        </Button>
                      </div>
                    </Card>

                    <Card className="p-6 md:p-8 hover:bg-orange-500/5 transition-colors">
                      <div className="flex items-center gap-4 mb-6 md:mb-8">
                        <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                          <Building2 className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-semibold">Provider Directory</h3>
                          <p className="text-sm md:text-base text-muted-foreground mt-1">
                            Connect with technical equipment providers
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
                        <div className="flex items-center gap-3">
                          <BadgeCheck className="h-5 w-5 text-orange-500 flex-shrink-0" />
                          <span className="text-base md:text-lg">Verified providers network</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Settings className="h-5 w-5 text-orange-500 flex-shrink-0" />
                          <span className="text-base md:text-lg">Equipment specifications</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5 text-orange-500 flex-shrink-0" />
                          <span className="text-base md:text-lg">Availability calendar</span>
                        </div>
                      </div>
                      <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600 h-auto py-3">
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
                  <Card className="p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                        <Truck className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold mb-1">Production Logistics</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Coordinate and manage production logistics
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-lg md:text-xl font-medium mb-6">Transportation</h4>
                          <div className="space-y-6">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                              <span className="text-sm md:text-base">Equipment transport</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                              <span className="text-smmd:text-base">Artist transportation</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                              <span className="text-sm md:text-base">Crew movement</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <h4 className="text-lg md:text-xl font-medium mb6">Schedule</h4>
                          <div className="space-y-6">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                              <span className="text-sm md:text-base">Load-in times</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                              <span className="text-sm md:text-base">Setup schedule</span>
                            </div>
                            <div className="flex items-start gap-3 mb-6">
                              <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                              <span className="text-sm md:text-base">Performance timeline</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600 h-auto py-3">
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
                        <Textarea
                          className="w-full p-3 rounded-lg bg-background border border-input"
                          placeholder="Type your question here..."
                          rows={4}
                          value={newNote.content}
                          onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value}))}
                        />
                        <Button size="lg" className="w-full mt-4 bg-orange-500 hover:bg-orange-600" onClick={handleCreateNote}>
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
                            <CalendarIcon className="mr-2 h-5 w-5" />
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
                {/* Calendar Tab */}
                <TabsContent value="calendar">
                    <Card className="p-6 md:p-8">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-orange-500/10 rounded-lg">
                          <CalendarIcon className="h-8 w-8 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-semibold">Event Calendar</h3>
                          <p className="text-muted-foreground mt-1">
                            Manage your events and important dates
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-8 md:grid-cols-2">
                        {/* Calendar Section */}
                        <div className="space-y-6">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            className="rounded-lg border shadow"
                            locale={es}
                          />
                        </div>

                        {/* Events List Section */}
                        <div className="space-y-6">
                          <h4 className="text-lg font-medium">Upcoming Events</h4>
                          <ScrollArea className="h-[400px] rounded-lg border p-4">
                            {schedules?.length > 0 ? (
                              <div className="space-y-4">
                                {schedules.map((event, index) => (
                                  <Card key={index} className="p-4 hover:bg-orange-500/5 transition-colors">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="font-medium">{event.title}</h5>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {format(new Date(event.startTime), 'PPP', { locale: es })}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {format(new Date(event.startTime), 'p', { locale: es })} - {format(new Date(event.endTime), 'p', { locale: es })}
                                        </p>
                                        <p className="text-sm mt-2">{event.location}</p>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full text-muted-foreground">
                                No events scheduled
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </div>
                    </Card>

                    {/* Event Dialog */}
                    {showEventDialog && (
                      <Dialog open={showEventDialog} onOpenChange={() => setShowEventDialog(false)}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Crear Nuevo Evento</DialogTitle>
                            <DialogDescription>
                              Ingresa los detalles del nuevo evento en el calendario.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="title" className="text-right">Título</Label>
                              <Input
                                id="title"
                                className="col-span-3"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="description" className="text-right">Descripción</Label>
                              <Textarea
                                id="description"
                                className="col-span-3"
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="location" className="text-right">Ubicación</Label>
                              <Input
                                id="location"
                                className="col-span-3"
                                value={newEvent.location}
                                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button onClick={handleCreateScheduleEvent}>Crear Evento</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TabsContent>
              </div>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}