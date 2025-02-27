import { useState, useEffect, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Rocket, Mail, Building, AtSign, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MusicLoadingSpinner } from "@/components/ui/music-loading-spinner";

// Tipos de datos
interface Contact {
  id: string;
  company: string;
  name: string;
  email: string;
  category: string;
  position?: string;
  influence?: number;
}

interface ProfileData {
  name: string;
  biography: string;
  genre?: string;
  socialLinks?: {
    spotify?: string;
    instagram?: string;
    youtube?: string;
  };
  profileImage?: string;
}

export function CreativeContactSearch({
  category,
  onSendProfile,
}: {
  category: "radio" | "tv" | "movies";
  onSendProfile?: (contact: Contact) => void;
}) {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Simulación de carga de contactos
  useEffect(() => {
    const loadSampleContacts = () => {
      const sampleContacts: Contact[] = [];
      
      // Contactos para radio
      if (category === "radio") {
        sampleContacts.push(
          { id: "1", company: "National Radio Network", name: "Sarah Johnson", email: "sjohnson@nationalradio.com", category: "radio", position: "Program Director", influence: 85 },
          { id: "2", company: "Urban Beats FM", name: "Marcus Williams", email: "marcus@urbanbeats.fm", category: "radio", position: "Music Curator", influence: 72 },
          { id: "3", company: "Classic Hits Radio", name: "Jennifer Davis", email: "jdavis@classichits.com", category: "radio", position: "Content Manager", influence: 78 },
          { id: "4", company: "Global Radio Group", name: "Thomas Richards", email: "trichards@globalradio.com", category: "radio", position: "Acquisition Manager", influence: 91 },
          { id: "5", company: "Indie Radio Collective", name: "Zoe Parker", email: "zoe@indieradio.co", category: "radio", position: "Artist Relations", influence: 68 }
        );
      }
      
      // Contactos para TV
      else if (category === "tv") {
        sampleContacts.push(
          { id: "6", company: "Channel Music", name: "David Thompson", email: "dthompson@channelmusic.tv", category: "tv", position: "Licensing Director", influence: 88 },
          { id: "7", company: "MusicTV Network", name: "Elena Rodriguez", email: "elena@musictv.net", category: "tv", position: "Content Acquisition", influence: 83 },
          { id: "8", company: "Drama Productions", name: "Michael Chen", email: "mchen@dramaproductions.com", category: "tv", position: "Music Supervisor", influence: 75 },
          { id: "9", company: "Reality Shows Inc", name: "Amanda Lewis", email: "alewis@realityshows.tv", category: "tv", position: "Production Director", influence: 79 },
          { id: "10", company: "Series Unlimited", name: "Robert Garcia", email: "rgarcia@seriesunlimited.com", category: "tv", position: "Creative Director", influence: 86 }
        );
      }
      
      // Contactos para movies
      else if (category === "movies") {
        sampleContacts.push(
          { id: "11", company: "Blockbuster Studios", name: "Catherine Moore", email: "cmoore@blockbusterstudios.com", category: "movies", position: "Music Supervisor", influence: 94 },
          { id: "12", company: "Independent Films", name: "Jason Kim", email: "jkim@independentfilms.org", category: "movies", position: "Director", influence: 71 },
          { id: "13", company: "Documentary Channel", name: "Laura Peterson", email: "lpeterson@documentarychannel.com", category: "movies", position: "Producer", influence: 77 },
          { id: "14", company: "Feature Films Co", name: "Daniel Martinez", email: "dmartinez@featurefilms.co", category: "movies", position: "Executive Producer", influence: 89 },
          { id: "15", company: "International Pictures", name: "Olivia Wilson", email: "owilson@internationalpictures.com", category: "movies", position: "Rights Manager", influence: 82 }
        );
      }
      
      setContacts(sampleContacts);
      setFilteredContacts(sampleContacts);
    };
    
    loadSampleContacts();
    
    // Cargar perfil del usuario
    const fetchUserProfile = async () => {
      if (!user?.uid) return;
      
      try {
        // Aquí podríamos hacer una llamada a la API para obtener el perfil completo
        // Por ahora simulamos datos de perfil
        setProfileData({
          name: user.displayName || "Artista Boostify",
          biography: "Artista musical con experiencia en composición y producción. Busco oportunidades para licenciar mi música en proyectos de medios.",
          genre: "Pop/Electronic",
          socialLinks: {
            spotify: "https://open.spotify.com/artist/example",
            instagram: "https://instagram.com/artistaboostify",
            youtube: "https://youtube.com/c/artistaboostify"
          }
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    
    fetchUserProfile();
  }, [category, user]);

  // Manejar búsqueda
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredContacts(contacts);
      return;
    }
    
    setIsSearching(true);
    
    // Simulación de tiempo de búsqueda para efecto
    setTimeout(() => {
      const filtered = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setFilteredContacts(filtered);
      setIsSearching(false);
      
      // Mensaje de éxito/info
      if (filtered.length === 0) {
        toast({
          title: "No se encontraron contactos",
          description: "Intenta con otra búsqueda",
          variant: "destructive"
        });
      } else {
        toast({
          title: `${filtered.length} contactos encontrados`,
          description: "Puedes enviar tu perfil a cualquiera de ellos",
          variant: "default"
        });
      }
    }, 1500);
  };

  // Abrir diálogo para enviar perfil
  const handleSendProfile = (contact: Contact) => {
    setSelectedContact(contact);
    setProfileDialogOpen(true);
    
    // Mensaje personalizado predeterminado
    setCustomMessage(
      `Hola ${contact.name},\n\nSoy un artista de ${profileData?.genre || "música"} y me gustaría presentarle mi trabajo para posibles oportunidades de licenciamiento en ${contact.company}.\n\nPuede escuchar mi música en mi perfil de Spotify y ver más información a continuación.\n\nEspero poder colaborar con usted.\n\nSaludos cordiales,\n${profileData?.name || "Artista Boostify"}`
    );
  };

  // Enviar perfil por email usando SendGrid
  const sendProfileEmail = async () => {
    if (!selectedContact || !profileData || !user) return;
    
    setIsSending(true);
    
    try {
      // Llamada a la API del servidor para enviar email
      await axios.post("/api/email/send-profile", {
        to: selectedContact.email,
        contactName: selectedContact.name,
        contactCompany: selectedContact.company,
        artistName: profileData.name,
        artistBio: profileData.biography,
        customMessage: customMessage,
        artistGenre: profileData.genre || "",
        socialLinks: profileData.socialLinks || {},
        userId: user.uid
      });
      
      toast({
        title: "Perfil enviado con éxito",
        description: `Tu perfil ha sido enviado a ${selectedContact.name} de ${selectedContact.company}`,
        variant: "default"
      });
      
      // Cerrar diálogo
      setProfileDialogOpen(false);
      setIsSending(false);
      
      // Callback opcional
      if (onSendProfile) {
        onSendProfile(selectedContact);
      }
    } catch (error) {
      console.error("Error sending profile email:", error);
      toast({
        title: "Error al enviar el perfil",
        description: "Ha ocurrido un error al enviar tu perfil. Intenta nuevamente más tarde.",
        variant: "destructive"
      });
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado de búsqueda creativo */}
      <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 p-4 rounded-xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center">
            <Search className="mr-2 h-5 w-5 text-orange-500" />
            <span>Busca contactos en {getCategoryTitle(category)}</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Encuentra contactos clave y envía tu perfil artístico directamente
          </p>
          
          <div className="relative">
            <div className="flex gap-2">
              <Input
                ref={searchInputRef}
                placeholder={`Buscar por nombre, empresa o email...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background/80 border-orange-500/30 focus-visible:ring-orange-500"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button 
                onClick={handleSearch} 
                className="bg-orange-500 hover:bg-orange-600"
                disabled={isSearching}
              >
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Buscar</span>
              </Button>
            </div>
            
            {/* Partículas animadas durante la búsqueda */}
            <AnimatePresence>
              {isSearching && (
                <motion.div 
                  className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-orange-500"
                      initial={{ 
                        x: searchInputRef.current?.offsetWidth ? searchInputRef.current.offsetWidth / 2 : 100, 
                        y: searchInputRef.current?.offsetHeight ? searchInputRef.current.offsetHeight / 2 : 20,
                        opacity: 0
                      }}
                      animate={{ 
                        x: [null, Math.random() * 200 - 100], 
                        y: [null, Math.random() * 100 - 50], 
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 1 + Math.random(), 
                        repeat: Infinity, 
                        repeatType: "loop",
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      
      {/* Lista de contactos con animación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {isSearching ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-2 flex justify-center items-center py-12"
            >
              <MusicLoadingSpinner size="lg" />
              <span className="ml-3 text-lg font-medium text-muted-foreground">Buscando contactos...</span>
            </motion.div>
          ) : (
            <>
              {filteredContacts.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-2 text-center py-12"
                >
                  <p className="text-muted-foreground">No se encontraron contactos con ese criterio</p>
                </motion.div>
              ) : (
                filteredContacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="p-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold flex items-center">
                            <Building className="h-4 w-4 mr-2 text-orange-500" />
                            {contact.company}
                          </h4>
                          <p className="text-sm my-1">{contact.name}</p>
                          <p className="text-sm flex items-center text-muted-foreground">
                            <AtSign className="h-3 w-3 mr-1 inline" />
                            {contact.email}
                          </p>
                          {contact.position && (
                            <Badge variant="outline" className="mt-2">
                              {contact.position}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <Button 
                            size="sm" 
                            onClick={() => handleSendProfile(contact)}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            <Send className="h-3 w-3 mr-2" />
                            Enviar perfil
                          </Button>
                        </div>
                      </div>
                      
                      {contact.influence && (
                        <div className="mt-3 pt-3 border-t border-muted">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Influencia en la industria</span>
                            <span className="font-medium">{contact.influence}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${contact.influence}%` }}
                              transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))
              )}
            </>
          )}
        </AnimatePresence>
      </div>
      
      {/* Diálogo para enviar perfil */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar perfil artístico</DialogTitle>
            <DialogDescription>
              Personaliza el mensaje para {selectedContact?.name} de {selectedContact?.company}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Preview del perfil */}
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center space-x-4 mb-3">
                <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-semibold">{profileData?.name || "Tu perfil artístico"}</h4>
                  <p className="text-xs text-muted-foreground">
                    {profileData?.genre || "Música"} · Boostify Music
                  </p>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">Mensaje personalizado</Label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Escribe un mensaje personalizado..."
                    className="resize-none mt-1"
                    rows={6}
                  />
                </div>
              </div>
            </Card>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setProfileDialogOpen(false)}
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              onClick={sendProfileEmail}
              disabled={isSending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Enviar ahora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Función auxiliar para obtener el título según la categoría
function getCategoryTitle(category: string): ReactNode {
  switch (category) {
    case "radio":
      return (
        <>
          <span className="font-medium">Radio</span>
          <Badge variant="outline" className="ml-2 bg-orange-500/10">
            Estaciones y Networks
          </Badge>
        </>
      );
    case "tv":
      return (
        <>
          <span className="font-medium">TV</span>
          <Badge variant="outline" className="ml-2 bg-orange-500/10">
            Canales y Programas
          </Badge>
        </>
      );
    case "movies":
      return (
        <>
          <span className="font-medium">Películas</span>
          <Badge variant="outline" className="ml-2 bg-orange-500/10">
            Estudios y Productoras
          </Badge>
        </>
      );
    default:
      return category;
  }
}