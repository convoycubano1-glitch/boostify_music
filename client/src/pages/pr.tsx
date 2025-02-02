import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users2,
  MessageSquare,
  Newspaper,
  TrendingUp,
  Search,
  Plus,
  Loader2,
  Music2,
  Activity,
  Users,
  Calendar,
  Globe,
  Youtube,
  FileText,
  Megaphone
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { searchContacts, contactCategories, type Contact, saveContact, getSavedContacts } from "@/lib/apify-service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Link } from "wouter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';


export default function PRPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(contactCategories[0]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);
  const contactsPerPage = 10;

  useEffect(() => {
    if (user) {
      loadSavedContacts();
    }
  }, [user]);

  const loadSavedContacts = async () => {
    try {
      const contacts = await getSavedContacts(user!);
      setSavedContacts(contacts);
    } catch (error) {
      console.error('Error al cargar contactos guardados:', error);
    }
  };

  const handleSaveContact = async (contact: Contact) => {
    try {
      await saveContact(user!, contact);
      toast({
        title: "Contacto guardado",
        description: "El contacto se ha guardado exitosamente.",
      });
      await loadSavedContacts();
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el contacto. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Búsqueda vacía",
        description: "Por favor, ingresa un término de búsqueda",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const results = await searchContacts(selectedCategory, searchQuery);
      clearInterval(progressInterval);
      setProgress(100);
      setContacts(results);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      toast({
        title: "Error en la búsqueda",
        description: "No se pudieron obtener los contactos. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = contacts.slice(indexOfFirstContact, indexOfLastContact);
  const totalPages = Math.ceil(contacts.length / contactsPerPage);

  const services = [
    {
      name: "Contactos",
      description: "Gestiona tu red de contactos",
      icon: Users2,
      color: "text-orange-500",
      route: "/pr",
      stats: 500,
      statsLabel: "contactos",
    },
    {
      name: "Noticias",
      description: "Entérate de las últimas noticias de la industria",
      icon: Newspaper,
      color: "text-green-500",
      route: "/news",
      stats: 120,
      statsLabel: "noticias",
    },
    {
      name: "Eventos",
      description: "Organiza o encuentra eventos",
      icon: Calendar,
      color: "text-blue-500",
      route: "/events",
      stats: 50,
      statsLabel: "eventos",
    },
    {
      name: "Análisis",
      description: "Analiza tu presencia en línea",
      icon: TrendingUp,
      color: "text-pink-500",
      route: "/analytics",
       stats: 1500,
      statsLabel: "visitas",
    },
        {
      name: "Global",
      description: "Visibilidad global",
      icon: Globe,
      color: "text-sky-500",
      route: "/global",
      stats: 25,
      statsLabel: "países",
    },
    {
      name: "Videos",
      description: "Gestiona tus videos",
      icon: Youtube,
      color: "text-red-500",
      route: "/videos",
      stats: 100,
       statsLabel: "videos",
    },
    {
      name: "Blog",
      description: "Escribe y gestiona tus articulos",
      icon: FileText,
      color: "text-violet-500",
      route: "/blog",
      stats: 75,
      statsLabel: "artículos",
    },
    {
      name: "Promoción",
      description: "Promociona tu contenido",
       icon: Megaphone,
       color: "text-yellow-500",
      route: "/promotion",
      stats: 400,
      statsLabel: "promociones",
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Music Marketing Hub
              </h1>
              <p className="text-muted-foreground mt-2">
                Gestiona y potencia tu presencia musical desde un solo lugar
              </p>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Activity className="mr-2 h-4 w-4" />
              Vista en Vivo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {services.map((service) => (
              <Link key={service.name} href={service.route}>
                <Card className="p-6 cursor-pointer hover:bg-orange-500/5 transition-colors border-orange-500/10 hover:border-orange-500/30">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <service.icon className={`h-5 w-5 ${service.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                      {service.stats.toLocaleString()}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {service.statsLabel}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Actividad General</h3>
              <p className="text-sm text-muted-foreground">
                Seguimiento de métricas en todas las plataformas
              </p>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.from({ length: 30 }, (_, i) => ({
                  date: new Date(2024, 0, i + 1).toLocaleDateString(),
                  spotify: Math.floor(Math.random() * 1000) + 500,
                  youtube: Math.floor(Math.random() * 800) + 300,
                  instagram: Math.floor(Math.random() * 600) + 200,
                }))}>
                  <defs>
                    <linearGradient id="colorSpotify" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="spotify"
                    name="Spotify"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={1}
                    fill="url(#colorSpotify)"
                  />
                  <Area
                    type="monotone"
                    dataKey="youtube"
                    name="YouTube"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.5}
                    fill="url(#colorSpotify)"
                  />
                  <Area
                    type="monotone"
                    dataKey="instagram"
                    name="Instagram"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.3}
                    fill="url(#colorSpotify)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
           <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Buscar Contactos</h3>
            <div className="flex gap-4">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {contactCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contactos..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  'Buscar'
                )}
              </Button>
            </div>
            {isLoading && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  {progress}% Completado
                </p>
              </div>
            )}
          </div>
        </Card>

        <Tabs defaultValue="resultados" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
            <TabsTrigger value="guardados">Contactos Guardados</TabsTrigger>
          </TabsList>

          <TabsContent value="resultados">
            <Card>
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-4">
                  {currentContacts.map((contact, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <div className="bg-primary/10 text-primary rounded-full h-full w-full flex items-center justify-center">
                            {contact.name.charAt(0)}
                          </div>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{contact.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {contact.role || contact.category}
                            {contact.company && ` at ${contact.company}`}
                          </p>
                          {contact.email && (
                            <p className="text-sm text-muted-foreground">
                              {contact.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveContact(contact)}
                      >
                        Guardar Contacto
                      </Button>
                    </div>
                  ))}
                  {contacts.length === 0 && !isLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay contactos para mostrar. Realiza una búsqueda para encontrar contactos.
                    </div>
                  )}
                </div>
              </ScrollArea>
              {contacts.length > 0 && (
                <div className="p-4 border-t flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="guardados">
            <Card>
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-4">
                  {savedContacts.map((contact, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <div className="bg-primary/10 text-primary rounded-full h-full w-full flex items-center justify-center">
                            {contact.name.charAt(0)}
                          </div>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{contact.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {contact.role || contact.category}
                            {contact.company && ` at ${contact.company}`}
                          </p>
                          {contact.email && (
                            <p className="text-sm text-muted-foreground">
                              {contact.email}
                            </p>
                          )}
                          {contact.savedAt && (
                            <p className="text-xs text-muted-foreground">
                              Guardado el: {new Date(contact.savedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {savedContacts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No tienes contactos guardados.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}