import { useState, useRef } from "react";
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
import { Loader2, Sparkles, Wand2, Edit2, Upload, Image as ImageIcon } from "lucide-react";
import { db, storage } from "../../firebase";
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface EditProfileDialogProps {
  artistId: string;
  currentData: {
    displayName: string;
    biography: string;
    genre: string;
    location: string;
    profileImage: string;
    bannerImage: string;
    bannerPosition?: string;
    slug?: string;
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
  const [isUploadingReference, setIsUploadingReference] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isUploadingBannerImage, setIsUploadingBannerImage] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const bannerImageInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const [formData, setFormData] = useState(currentData);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Generar slug automáticamente desde el nombre del artista
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
      .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio y final
  };

  // Actualizar slug automáticamente cuando cambia el nombre
  const handleNameChange = (name: string) => {
    handleChange('displayName', name);
    if (!formData.slug || formData.slug === generateSlug(currentData.displayName)) {
      // Solo auto-generar si no hay slug personalizado o si es el slug original
      handleChange('slug', generateSlug(name));
    }
  };

  // Subir imagen de referencia
  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona una imagen.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingReference(true);

    try {
      const storageRef = ref(storage, `artist-references/${artistId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setReferenceImage(downloadURL);
      toast({
        title: "Imagen cargada",
        description: "Ahora puedes generar tu perfil y banner con esta imagen de referencia.",
      });
    } catch (error) {
      console.error("Error uploading reference image:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen de referencia.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingReference(false);
    }
  };

  // Subir imagen de perfil directamente
  const handleUploadProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona una imagen (JPG, PNG, etc.).",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingProfileImage(true);

    try {
      const storageRef = ref(storage, `artist-profiles/${artistId}/profile_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      handleChange("profileImage", downloadURL);
      toast({
        title: "Imagen de perfil cargada",
        description: "Tu imagen de perfil ha sido subida exitosamente.",
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen de perfil.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  // Subir imagen de banner directamente
  const handleUploadBannerImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona una imagen (JPG, PNG, etc.).",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingBannerImage(true);

    try {
      const storageRef = ref(storage, `artist-profiles/${artistId}/banner_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      handleChange("bannerImage", downloadURL);
      toast({
        title: "Imagen de banner cargada",
        description: "Tu imagen de banner ha sido subida exitosamente.",
      });
    } catch (error) {
      console.error("Error uploading banner image:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen de banner.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingBannerImage(false);
    }
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
          referenceImage: referenceImage || undefined,
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
          referenceImage: referenceImage || undefined,
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
        bannerPosition: formData.bannerPosition || "50",
        slug: formData.slug || generateSlug(formData.displayName),
        contactEmail: formData.contactEmail || "",
        contactPhone: formData.contactPhone || "",
        instagram: formData.instagram || "",
        twitter: formData.twitter || "",
        youtube: formData.youtube || "",
        spotify: formData.spotify || "",
        referenceImage: referenceImage || "",
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
          {/* Subida de Imagen de Referencia */}
          <div className="space-y-2 border rounded-lg p-4 bg-orange-500/5 border-orange-500/20">
            <Label className="text-orange-400 font-semibold">🎨 Imagen de Referencia para IA</Label>
            <p className="text-xs text-gray-400">
              Sube una foto tuya para que la IA genere imágenes personalizadas de tu perfil y banner
            </p>
            <div className="flex gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReferenceImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingReference}
              >
                {isUploadingReference ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Imagen
                  </>
                )}
              </Button>
              {referenceImage && (
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-500">Imagen cargada ✓</span>
                </div>
              )}
            </div>
            {referenceImage && (
              <img src={referenceImage} alt="Reference" className="w-32 h-32 object-cover rounded-lg mt-2" />
            )}
          </div>

          {/* Nombre Artístico */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre Artístico *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Tu nombre artístico"
            />
          </div>

          {/* Slug/URL Único */}
          <div className="space-y-2 border rounded-lg p-4 bg-blue-500/5 border-blue-500/20">
            <Label htmlFor="slug" className="text-blue-400 font-semibold">🔗 URL Único del Perfil</Label>
            <p className="text-xs text-gray-400">
              Esta es la dirección web personalizada de tu perfil que puedes compartir
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{window.location.origin}/artist/</span>
              <Input
                id="slug"
                value={formData.slug || ''}
                onChange={(e) => handleChange("slug", generateSlug(e.target.value))}
                placeholder="nombre-artista"
                className="flex-1"
              />
            </div>
            {formData.slug && (
              <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                <span className="text-xs text-green-400 font-mono">
                  {window.location.origin}/artist/{formData.slug}
                </span>
              </div>
            )}
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

          {/* Imagen de Perfil con botón de generar y subir */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="profileImage">Imagen de Perfil</Label>
              <div className="flex gap-2">
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                  onChange={handleUploadProfileImage}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => profileImageInputRef.current?.click()}
                  disabled={isUploadingProfileImage}
                >
                  {isUploadingProfileImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateProfileImage}
                  disabled={isGeneratingProfileImage || !formData.displayName}
                >
                  {isGeneratingProfileImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      IA
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Input
              id="profileImage"
              value={formData.profileImage}
              onChange={(e) => handleChange("profileImage", e.target.value)}
              placeholder="URL de imagen o usa los botones para subir/generar"
            />
            {formData.profileImage && (
              <img src={formData.profileImage} alt="Preview" className="w-20 h-20 object-cover rounded-full mt-2" />
            )}
          </div>

          {/* Imagen de Banner con botón de generar y subir */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bannerImage">Imagen de Banner (Hero)</Label>
              <div className="flex gap-2">
                <input
                  ref={bannerImageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                  onChange={handleUploadBannerImage}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bannerImageInputRef.current?.click()}
                  disabled={isUploadingBannerImage}
                >
                  {isUploadingBannerImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateBannerImage}
                  disabled={isGeneratingBannerImage || !formData.displayName}
                >
                  {isGeneratingBannerImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      IA
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Input
              id="bannerImage"
              value={formData.bannerImage}
              onChange={(e) => handleChange("bannerImage", e.target.value)}
              placeholder="URL de imagen o usa los botones para subir/generar"
            />
            {formData.bannerImage && (
              <div className="space-y-3">
                <img 
                  src={formData.bannerImage} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded-lg"
                  style={{ objectPosition: `center ${formData.bannerPosition || '50'}%` }}
                />
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Ajustar Posición del Banner</Label>
                    <span className="text-xs text-gray-500">
                      {formData.bannerPosition ? `${formData.bannerPosition}%` : '50%'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Arriba</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.bannerPosition || '50'}
                      onChange={(e) => handleChange('bannerPosition', e.target.value)}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${formData.bannerPosition || 50}%, rgb(229, 231, 235) ${formData.bannerPosition || 50}%, rgb(229, 231, 235) 100%)`
                      }}
                    />
                    <span className="text-xs text-gray-500">Abajo</span>
                  </div>
                  <p className="text-xs text-gray-400 italic">
                    Arrastra el control para centrar la imagen donde desees
                  </p>
                </div>
              </div>
            )}
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
          <Button onClick={handleSave} disabled={isSaving || !formData.displayName}>
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
