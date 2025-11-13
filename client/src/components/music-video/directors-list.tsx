import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Video,
  Award,
  Star,
  Loader2,
  Clock,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "../../hooks/use-toast";
import { db } from "../../lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth } from "../../lib/firebase";
import { DirectorDetailsModal } from "./DirectorDetailsModal";
import { DIRECTORS, getDirectorById, type DirectorProfile } from "../../data/directors";


// Interface for directors list props
interface DirectorsListProps {
  onDirectorSelected?: (director: DirectorProfile) => void;
}

// Legacy Director interface for Firestore compatibility
interface Director {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  style: string;
  rating: number;
  imageUrl?: string;
}

interface MusicVideoRequest {
  id: string;
  directorId: string;
  directorName: string;
  userId: string;
  visualTheme: string;
  mood: string;
  visualStyle: string;
  budget: string;
  timeline: string;
  status: string;
  createdAt: any;
  submittedAt: string;
  requestType: string;
  projectStatus: string;
  priceEstimate?: {
    basicPackage: {
      price: number;
      description: string;
      features: string[];
    };
    standardPackage: {
      price: number;
      description: string;
      features: string[];
    };
    premiumPackage: {
      price: number;
      description: string;
      features: string[];
    };
  };
  conceptImages?: string[];
}

export function DirectorsList({ onDirectorSelected }: DirectorsListProps = {}) {
  const { toast } = useToast();
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDirectorForDetails, setSelectedDirectorForDetails] = useState<DirectorProfile | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [requests, setRequests] = useState<MusicVideoRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);

  useEffect(() => {
    const fetchDirectors = async () => {
      try {
        // Cargar directores desde Firestore para obtener las imágenes
        const directorsSnapshot = await getDocs(collection(db, "directors"));
        const directorsFromFirestore = directorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Director[];

        // Combinar con datos JSON para información completa
        // Solo incluir directores que tienen datos completos en JSON
        const directorsWithFullData = directorsFromFirestore
          .map(firestoreDirector => {
            // Buscar el director correspondiente en JSON usando el nombre
            // Normalizar nombres para comparación (quitar apóstrofes, espacios extra, etc.)
            const normalizeName = (name: string) => 
              name.toLowerCase().replace(/['\s-]/g, '');
            
            const jsonDirector = DIRECTORS.find(d => 
              normalizeName(d.name) === normalizeName(firestoreDirector.name || '')
            );

            if (!jsonDirector) {
              console.warn(`⚠️ Director "${firestoreDirector.name}" en Firestore pero sin datos JSON completos`);
              return null;
            }

            return {
              id: jsonDirector.id,
              name: firestoreDirector.name,
              specialty: firestoreDirector.specialty,
              experience: firestoreDirector.experience,
              style: firestoreDirector.style,
              rating: firestoreDirector.rating,
              imageUrl: firestoreDirector.imageUrl || undefined
            };
          })
          .filter((director): director is Director => director !== null);
        
        setDirectors(directorsWithFullData);
        console.log(`✅ Cargados ${directorsWithFullData.length} directores con detalles completos`);
      } catch (error) {
        console.error("Error loading directors:", error);
        toast({
          title: "Error",
          description: "Failed to load directors. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchRequests = async () => {
      try {
        // Verificar si hay un usuario autenticado
        const user = auth.currentUser;
        
        // Cargar solicitudes desde Firestore
        const requestsRef = collection(db, "music-video-request");
        const q = query(requestsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const requestsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MusicVideoRequest[];
        setRequests(requestsData);
      } catch (error) {
        console.error("Error fetching requests:", error);
        // Si es un error de permisos, no mostrar toast para evitar spam
        if (!(error instanceof Error && error.name === "FirebaseError" && error.toString().includes("permission-denied"))) {
          toast({
            title: "Error",
            description: "Failed to load requests. Please try again later.",
            variant: "destructive",
          });
        }
        
        // Establecer un array vacío como fallback
        setRequests([]);
      }
    };

    fetchDirectors();
    fetchRequests();
  }, [toast]);

  // Handler para ver detalles del director
  const handleViewDetails = (director: Director) => {
    // Buscar el director completo en los datos JSON por nombre normalizado
    const normalizeName = (name: string) => 
      name.toLowerCase().replace(/['\s-]/g, '');
    
    const fullDirector = DIRECTORS.find(d => 
      normalizeName(d.name) === normalizeName(director.name)
    );
    
    if (fullDirector) {
      setSelectedDirectorForDetails(fullDirector);
      setShowDetailsModal(true);
      console.log(`✅ Detalles del director cargados:`, fullDirector.name);
    } else {
      console.error(`❌ Director no encontrado en JSON:`, director.name);
      toast({
        title: "Información no disponible",
        description: "No se encontraron los detalles completos para este director",
        variant: "destructive"
      });
    }
  };

  // Handler para crear video con un director
  const handleCreateVideo = (director: DirectorProfile) => {
    setShowDetailsModal(false);
    if (onDirectorSelected) {
      onDirectorSelected(director);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Video className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Featured Directors</h2>
                <p className="text-sm text-muted-foreground">
                  Connect with talented music video directors
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowRequests(!showRequests)}
              className="transition-all duration-200"
            >
              {showRequests ? "Show Directors" : "View Requests"}
            </Button>
          </div>

          {showRequests ? (
            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border hover:bg-orange-500/5 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{request.directorName}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Theme</Label>
                        <p>{request.visualTheme}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Mood</Label>
                        <p>{request.mood}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Style</Label>
                        <p>{request.visualStyle}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Budget</Label>
                        <p>${request.budget}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Clock className="h-4 w-4" />
                      <span>Timeline: {request.timeline}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {directors.map((director) => (
                <motion.div
                  key={director.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border hover:bg-orange-500/5 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="h-32 w-32 rounded-lg overflow-hidden bg-orange-500/10 flex-shrink-0">
                      {director.imageUrl ? (
                        <img
                          src={director.imageUrl}
                          alt={`${director.name} - ${director.specialty}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(director.name);
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Award className="h-8 w-8 text-orange-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold truncate">{director.name}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                          <span className="text-sm font-medium">{director.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-orange-500">
                        {director.specialty}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {director.experience}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Style: {director.style}
                      </p>
                      <Button
                        className="mt-4 w-full transition-all duration-200"
                        variant="outline"
                        onClick={() => handleViewDetails(director)}
                        data-testid={`button-view-details-${director.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <DirectorDetailsModal
        director={selectedDirectorForDetails}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onCreateVideo={handleCreateVideo}
      />
    </>
  );
}