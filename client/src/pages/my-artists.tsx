import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { PlanTierGuard } from "../components/youtube-views/plan-tier-guard";
import { Link, useLocation } from "wouter";
import {
  Plus,
  User,
  Music,
  MapPin,
  ExternalLink,
  Loader2,
  Sparkles,
  Bot,
  UserPlus,
  Wrench,
  RefreshCw,
  Trash2
} from "lucide-react";
import { fixGeneratedByForUserArtists } from "../lib/api/artist-profile-service";
import { Head } from "../components/ui/head";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { AIGenerationModal } from "../components/artist/ai-generation-modal";
import { ArtistLandingPage } from "../components/artist/artist-landing-page";
import { isAdminEmail } from "../../../shared/constants";

interface Artist {
  id: number;
  firestoreId: string;
  name: string;
  slug: string;
  biography?: string;
  profileImage?: string;
  coverImage?: string;
  genres?: string[];
  country?: string;
  isAIGenerated: boolean;
  createdAt?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  spotify?: string;
}

export default function MyArtistsPage() {
  const { user, isLoading: authLoading, userSubscription } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Detectar si el usuario es admin
  const isAdmin = isAdminEmail(user?.email);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIGenerationModal, setShowAIGenerationModal] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingArtistId, setDeletingArtistId] = useState<number | null>(null);
  const [regeneratingArtistId, setRegeneratingArtistId] = useState<number | null>(null);
  
  // Form state for manual artist creation
  const [manualArtistForm, setManualArtistForm] = useState({
    name: "",
    biography: "",
    genre: "",
    location: "",
  });

  // Query para verificar si el usuario puede crear artistas
  const { data: permissionData } = useQuery<{
    canCreate: boolean;
    reason?: string;
    isAdmin: boolean;
    artistCount: number;
    maxAllowed: number;
    hasPremium: boolean;
  }>({
    queryKey: ["/api/artist-generator/can-create-artist"],
    enabled: !!user
  });

  // Query para obtener los artistas del usuario
  const { data: artistsData, isLoading: artistsLoading, refetch } = useQuery<{
    success: boolean;
    count: number;
    artists: Artist[];
  }>({
    queryKey: ["/api/artist-generator/my-artists"],
    enabled: !!user
  });

  // Mutation para crear un nuevo artista
  const createArtistMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest({
        url: "/api/artist-generator/generate-artist/secure",
        method: "POST"
      });
      return response;
    },
    onSuccess: (data) => {
      // Modal closes automatically when it detects isGenerating = false
      toast({
        title: "Artist created!",
        description: `${data.name} has been created successfully`,
      });
      // Invalidate both queries to update permissions and artist list
      queryClient.invalidateQueries({ queryKey: ["/api/artist-generator/my-artists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artist-generator/can-create-artist"] });
      setIsGenerating(false);
    },
    onError: (error: any) => {
      // Close modal immediately on error
      setShowAIGenerationModal(false);
      toast({
        title: "Error",
        description: error.message || "Could not create the artist",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  // Mutation para eliminar un artista
  const deleteArtistMutation = useMutation({
    mutationFn: async (artistId: number) => {
      setDeletingArtistId(artistId);
      const response = await apiRequest({
        url: `/api/artist-generator/delete-artist/${artistId}`,
        method: "DELETE"
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Artist deleted",
        description: "The artist has been deleted successfully",
      });
      // Invalidate both queries to update permissions and artist list
      queryClient.invalidateQueries({ queryKey: ["/api/artist-generator/my-artists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artist-generator/can-create-artist"] });
      setDeletingArtistId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete the artist",
        variant: "destructive",
      });
      setDeletingArtistId(null);
    },
  });

  // Mutation to regenerate artist images
  const regenerateImagesMutation = useMutation({
    mutationFn: async (artistId: number) => {
      setRegeneratingArtistId(artistId);
      const response = await apiRequest({
        url: `/api/artist-generator/regenerate-images/${artistId}`,
        method: "POST"
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Images regenerated!",
        description: "The artist images have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/artist-generator/my-artists"] });
      setRegeneratingArtistId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not regenerate images",
        variant: "destructive",
      });
      setRegeneratingArtistId(null);
    },
  });

  // Mutation to update existing AI artists
  const fixArtistsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !user?.email) {
        throw new Error('Invalid user');
      }
      return await fixGeneratedByForUserArtists(user.id, user.email);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "✅ Artists Updated",
          description: data.message || `${data.updated} profiles updated successfully`,
        });
        refetch();
      } else {
        toast({
          title: "Information",
          description: data.message || "No artists found to update",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not update the artists",
        variant: "destructive",
      });
    },
  });

  const handleCreateArtist = async () => {
    setIsGenerating(true);
    setShowAIGenerationModal(true);
    createArtistMutation.mutate();
  };

  const handleCreateManualArtist = async () => {
    if (!manualArtistForm.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the artist",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Create slug from name
      const slug = manualArtistForm.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const response = await apiRequest({
        url: "/api/artist-generator/create-manual",
        method: "POST",
        data: {
          name: manualArtistForm.name,
          biography: manualArtistForm.biography,
          genre: manualArtistForm.genre,
          location: manualArtistForm.location,
          slug
        }
      });

      toast({
        title: "Artist created!",
        description: `${manualArtistForm.name} has been created successfully`,
      });

      // Reset form
      setManualArtistForm({
        name: "",
        biography: "",
        genre: "",
        location: "",
      });
      
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not create the artist",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteArtist = (artistId: number, artistName: string) => {
    if (window.confirm(`Are you sure you want to delete ${artistName}? This action cannot be undone.`)) {
      deleteArtistMutation.mutate(artistId);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Show premium landing page for non-logged users with lead capture
    return <ArtistLandingPage />;
  }

  const artists = artistsData?.artists || [];

  return (
    <PlanTierGuard 
      requiredPlan="premium" 
      userSubscription={userSubscription} 
      featureName="Artist Generation"
      isAdmin={isAdmin}
    >
      <>
        <Head
          title="My Artists | Boostify Music"
          description="Administra todos tus artistas generados con IA en Boostify Music"
          url={window.location.href}
        />
        <div className="min-h-screen bg-black text-white py-8">
          <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                My Artists
              </h1>
              <p className="text-gray-400">
                Manage all your artists
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {/* Button to fix existing AI artists */}
              
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                // Only allow opening if user has permission
                if (open && !permissionData?.canCreate && !isAdmin) {
                  toast({
                    title: "Cannot create artist",
                    description: permissionData?.reason || "You don't have permission to create more artists",
                    variant: "destructive"
                  });
                  return;
                }
                setIsDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white disabled:opacity-50"
                    data-testid="button-create-manual-artist"
                    disabled={!permissionData?.canCreate && !isAdmin}
                    title={!permissionData?.canCreate && !isAdmin ? permissionData?.reason : undefined}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Manually
                    {!permissionData?.hasPremium && !isAdmin && " 🔒"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle>Create New Artist</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Enter the basic artist information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Artist Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g. John Doe"
                        value={manualArtistForm.name}
                        onChange={(e) => setManualArtistForm({ ...manualArtistForm, name: e.target.value })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genre">Music Genre</Label>
                      <Input
                        id="genre"
                        placeholder="e.g. Pop, Rock, Hip-Hop"
                        value={manualArtistForm.genre}
                        onChange={(e) => setManualArtistForm({ ...manualArtistForm, genre: e.target.value })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g. Miami, FL"
                        value={manualArtistForm.location}
                        onChange={(e) => setManualArtistForm({ ...manualArtistForm, location: e.target.value })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biography">Biography</Label>
                      <Textarea
                        id="biography"
                        placeholder="Tell us about the artist..."
                        rows={4}
                        value={manualArtistForm.biography}
                        onChange={(e) => setManualArtistForm({ ...manualArtistForm, biography: e.target.value })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateManualArtist}
                      disabled={isCreating}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Artist"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={handleCreateArtist}
                disabled={isGenerating || (!permissionData?.canCreate && !isAdmin)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                data-testid="button-create-ai-artist"
                title={!permissionData?.canCreate && !isAdmin ? permissionData?.reason : undefined}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Generate with AI
                    {!permissionData?.hasPremium && !isAdmin && " 🔒"}
                    {permissionData?.hasPremium && !permissionData?.canCreate && !isAdmin && ` (${permissionData?.artistCount}/${permissionData?.maxAllowed})`}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Permission Warning Banner */}
          {!permissionData?.canCreate && !isAdmin && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-yellow-500 text-xl">⚠️</span>
                <div>
                  <p className="text-yellow-500 font-medium">
                    {!permissionData?.hasPremium 
                      ? "Premium subscription required to create artists"
                      : `Artist limit reached (${permissionData?.artistCount}/${permissionData?.maxAllowed})`
                    }
                  </p>
                  <p className="text-yellow-500/70 text-sm">
                    {!permissionData?.hasPremium 
                      ? "Upgrade to Premium to unlock artist generation"
                      : "Each account can create a maximum of 1 artist. Contact support for more."
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Admin Badge */}
          {isAdmin && (
            <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-purple-500 text-xl">👑</span>
                <div>
                  <p className="text-purple-500 font-medium">Admin Mode - Unlimited Artist Creation</p>
                  <p className="text-purple-500/70 text-sm">You can create unlimited artists as an administrator</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <User className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Artists</p>
                  <p className="text-2xl font-bold">{artists.length}</p>
                </div>
              </div>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Bot className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">AI Generated</p>
                  <p className="text-2xl font-bold">
                    {artists.filter(a => a.isAIGenerated).length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Music className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Unique Genres</p>
                  <p className="text-2xl font-bold">
                    {new Set(artists.flatMap(a => a.genres || [])).size}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Artists Grid */}
          {artistsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            </div>
          ) : artists.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800 p-12 text-center">
              <Sparkles className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">You don't have any artists yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first AI artist to get started
              </p>
              <Button
                onClick={handleCreateArtist}
                disabled={isGenerating}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create My First Artist
                  </>
                )}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artists.map((artist) => (
                <Card
                  key={artist.id}
                  className="bg-gray-900 border-gray-800 overflow-hidden hover:border-orange-500 transition-all duration-300 group"
                  data-testid={`card-artist-${artist.id}`}
                >
                  {/* Cover Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                    {artist.coverImage || artist.profileImage ? (
                      <img
                        src={artist.coverImage || artist.profileImage}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-16 w-16 text-gray-700" />
                      </div>
                    )}
                    {artist.isAIGenerated && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          AI Generated
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 truncate">{artist.name}</h3>
                    
                    {artist.genres && artist.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {artist.genres.slice(0, 2).map((genre, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}

                    {artist.country && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <MapPin className="h-4 w-4" />
                        {artist.country}
                      </div>
                    )}

                    {artist.biography && (
                      <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                        {artist.biography}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/artist/${artist.slug}`} className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                          data-testid={`button-view-artist-${artist.id}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                        onClick={() => regenerateImagesMutation.mutate(artist.id)}
                        disabled={regeneratingArtistId === artist.id}
                        title="Regenerate images with AI"
                        data-testid={`button-regenerate-artist-${artist.id}`}
                      >
                        {regeneratingArtistId === artist.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => handleDeleteArtist(artist.id, artist.name)}
                        disabled={deletingArtistId === artist.id}
                        data-testid={`button-delete-artist-${artist.id}`}
                      >
                        {deletingArtistId === artist.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* AI Generation Modal */}
        <AIGenerationModal 
          isOpen={showAIGenerationModal}
          isGenerating={createArtistMutation.isPending}
          onClose={() => setShowAIGenerationModal(false)}
        />
      </>
    </PlanTierGuard>
  );
}
