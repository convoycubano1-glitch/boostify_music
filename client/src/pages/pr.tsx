import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users2,
  MessageSquare,
  Newspaper,
  TrendingUp,
  Search,
  Plus
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";

const prContacts = [
  {
    id: 1,
    name: "María González",
    role: "Music Journalist",
    publication: "Revista Musical",
    status: "active",
    lastContact: "2024-01-25"
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    role: "Radio Host",
    publication: "Radio Música",
    status: "pending",
    lastContact: "2024-01-20"
  },
  {
    id: 3,
    name: "Ana López",
    role: "Blog Editor",
    publication: "Blog Musical",
    status: "active",
    lastContact: "2024-01-15"
  }
];

const campaigns = [
  {
    id: 1,
    title: "Lanzamiento Nuevo Single",
    status: "active",
    reach: "15K+",
    engagement: "8.5%",
    startDate: "2024-02-01"
  },
  {
    id: 2,
    title: "Tour Promocional",
    status: "planned",
    reach: "50K+",
    engagement: "12%",
    startDate: "2024-03-15"
  }
];

export default function PRPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">PR Management</h2>
          <p className="text-muted-foreground">
            Gestiona tus relaciones públicas y campañas de comunicación
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Campaña
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Contacto
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Users2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Contactos PR</h3>
            </div>
            <p className="mt-2 text-3xl font-bold">{prContacts.length}</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Campañas Activas</h3>
            </div>
            <p className="mt-2 text-3xl font-bold">
              {campaigns.filter(c => c.status === 'active').length}
            </p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Menciones</h3>
            </div>
            <p className="mt-2 text-3xl font-bold">45</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Alcance Total</h3>
            </div>
            <p className="mt-2 text-3xl font-bold">65K+</p>
          </Card>
        </div>

        <Tabs defaultValue="contacts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="contacts" className="gap-2">
              <Users2 className="h-4 w-4" />
              Contactos
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Campañas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Buscar contactos..."
                className="max-w-sm"
                type="search"
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            <Card>
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-4">
                  {prContacts.map((contact) => (
                    <div
                      key={contact.id}
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
                            {contact.role} at {contact.publication}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Contactar
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Inicia: {campaign.startDate}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver Detalles
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Alcance</p>
                      <p className="text-lg font-semibold">{campaign.reach}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Engagement</p>
                      <p className="text-lg font-semibold">{campaign.engagement}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
