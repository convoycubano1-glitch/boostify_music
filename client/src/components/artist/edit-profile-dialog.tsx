import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { Loader2, Sparkles, Wand2, Edit2 } from "lucide-react";
import { db } from "../../firebase";
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore";

interface EditProfileDialogProps {
  artistId: string;
  currentData: {
    displayName: string;
    biography: string;
    genre: string;
    location: string;
    profileImage: string;
    bannerImage: string;
    contactEmail: string;
    contactPhone: string;
    instagram: string;
    twitter: string;
    youtube: string;
    spotify: string;
  };
  onUpdate: () => void;
}

export function EditProfileDialog({ artistId, currentData, onUpdate }: EditProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingBiography, setIsGeneratingBiography] = useState(false);
  const [isGeneratingProfileImage, setIsGeneratingProfileImage] = useState(false);
  const [isGeneratingBannerImage, setIsGeneratingBannerImage] = useState(false);

  const { toast } = useToast();

  const [formData, setFormData] = useState(currentData);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateBiography = async () => {
    if (!formData.displayName) {
      toast({
        title: "Nombre requerido",
        description: "Debes ingresar tu nombre artístico primero.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBiography(true);

    try {
      const response = await fetch('/api/artist-profile/generate-biography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.displayName,
          genre: formData.genre,
          location: formData.location,
        }),
      });

      const data = await response.json();

      if (data.success && data.biography) {
        handleChange("biography", data.biography);
        toast({
          title: "Biografía generada",
          description: "Tu biografía ha sido generada automáticamente con IA.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate biography');
      }
    } catch (error: any) {
      console.error("Error generating biography:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la biografía. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBiography(false);
    }
  };

  const handleGenerateProfileImage = async () => {
    if (!formData.displayName) {
      toast({
        title: "Nombre requerido",
        description: "Debes ingresar tu nombre artístico primero.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingProfileImage(true);

    try {
      const response = await fetch('/api/artist-profile/generate-profile-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: formData.displayName,
          genre: formData.genre,
          style: "Professional portrait, studio lighting, artistic aesthetic",
        }),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        handleChange("profileImage", data.imageUrl);
        toast({
          title: "Imagen de perfil generada",
          description: "Tu imagen de perfil ha sido generada con IA.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate profile image');
      }
    } catch (error: any) {
      console.error("Error generating profile image:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen de perfil. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProfileImage(false);
    }
  };

  const handleGenerateBannerImage = async () => {
    if (!formData.displayName) {
      toast({
        title: "Nombre requerido",
        description: "Debes ingresar tu nombre artístico primero.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBannerImage(true);

    try {
      const response = await fetch('/api/artist-profile/generate-banner-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: formData.displayName,
          genre: formData.genre,
          style: "Wide cinematic banner, professional music artist aesthetic",
          mood: "Creative and energetic atmosphere",
        }),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        handleChange("bannerImage", data.imageUrl);
        toast({
          title: "Imagen de banner generada",
          description: "Tu imagen de banner ha sido generada con IA.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate banner image');
      }
    } catch (error: any) {
      console.error("Error generating banner image:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen de banner. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBannerImage(false);
    }
  };

  const handleSave = async () => {
    if (!artistId) {
      toast({
        title: "Error",
        description: "ID de artista no válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", artistId));
      const querySnapshot = await getDocs(q);

      const profileData = {
        uid: artistId,
        displayName: formData.displayName,
        name: formData.displayName,
        biography: formData.biography || "",
        genre: formData.genre || "",
        location: formData.location || "",
        profileImage: formData.profileImage || "",
        photoURL: formData.profileImage || "",
        bannerImage: formData.bannerImage || "",
        contactEmail: formData.contactEmail || "",
        contactPhone: formData.contactPhone || "",
        instagram: formData.instagram || "",
        twitter: formData.twitter || "",
        youtube: formData.youtube || "",
        spotify: formData.spotify || "",
        updatedAt: new Date(),
      };

      if (!querySnapshot.empty) {
        const userDocRef = querySnapshot.docs[0].ref;
        await setDoc(userDocRef, profileData, { merge: true });
      } else {
        const newDocRef = doc(collection(db, "users"));
        await setDoc(newDocRef, {
          ...profileData,
          createdAt: new Date(),
        });
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu perfil se ha guardado correctamente.",
      });

      setIsOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
          <Edit2 className="mr-2 h-4 w-4" />
          Editar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil de Artista</DialogTitle>
          <DialogDescription>
            Actualiza tu información y genera contenido profesional con IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nombre Artístico */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre Artístico</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleChange("displayName", e.target.value)}
              placeholder="Tu nombre artístico"
            />
          </div>

          {/* Biografía con botón de generar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="biography">Biografía</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateBiography}
                disabled={isGeneratingBiography}
              >
                {isGeneratingBiography ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar con IA
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="biography"
              value={formData.biography}
              onChange={(e) => handleChange("biography", e.target.value)}
              placeholder="Cuéntanos tu historia como artista..."
              className="min-h-[100px]"
            />
          </div>

          {/* Género y Ubicación */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Género Musical</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => handleChange("genre", e.target.value)}
                placeholder="Ej: Pop, Rock, Hip-Hop"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Ciudad, País"
              />
            </div>
          </div>

          {/* Imagen de Perfil con botón de generar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="profileImage">URL de Imagen de Perfil</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateProfileImage}
                disabled={isGeneratingProfileImage}
              >
                {isGeneratingProfileImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generar con IA
                  </>
                )}
              </Button>
            </div>
            <Input
              id="profileImage"
              value={formData.profileImage}
              onChange={(e) => handleChange("profileImage", e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          {/* Imagen de Banner con botón de generar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bannerImage">URL de Imagen de Banner</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateBannerImage}
                disabled={isGeneratingBannerImage}
              >
                {isGeneratingBannerImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generar con IA
                  </>
                )}
              </Button>
            </div>
            <Input
              id="bannerImage"
              value={formData.bannerImage}
              onChange={(e) => handleChange("bannerImage", e.target.value)}
              placeholder="https://ejemplo.com/banner.jpg"
            />
          </div>

          {/* Información de Contacto */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3">Información de Contacto</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email de Contacto</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                  placeholder="contacto@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Teléfono</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange("contactPhone", e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3">Redes Sociales</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => handleChange("instagram", e.target.value)}
                  placeholder="@tuusuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <Input
                  id="twitter"
                  value={formData.twitter}
                  onChange={(e) => handleChange("twitter", e.target.value)}
                  placeholder="@tuusuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={formData.youtube}
                  onChange={(e) => handleChange("youtube", e.target.value)}
                  placeholder="https://youtube.com/@tucanal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spotify">Spotify</Label>
                <Input
                  id="spotify"
                  value={formData.spotify}
                  onChange={(e) => handleChange("spotify", e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
