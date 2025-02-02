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
  Loader2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { searchContacts, contactCategories, type Contact } from "@/lib/apify-service";
import { useToast } from "@/hooks/use-toast";

export default function PRPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(contactCategories[0]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 10;

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

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">PR Management</h2>
          <p className="text-muted-foreground">
            Gestiona tus relaciones públicas y encuentra contactos en la industria musical
          </p>
        </div>
      </div>

      <div className="space-y-6">
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
                  <Button variant="outline" size="sm">
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
      </div>
    </div>
  );
}