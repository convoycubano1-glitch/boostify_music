import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Edit, Save, X, Upload, Users, Check, Music2, Video as VideoIcon } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { AIContentGenerator } from "./ai-content-generator";
import { auth } from "../../firebase";

interface EditableProfileHeaderProps {
  artistId: string;
  initialData?: {
    name: string;
    biography: string;
    genre: string;
    location: string;
    profileImage?: string;
    bannerImage?: string;
  };
  songsCount: number;
  videosCount: number;
  isOwner: boolean;
}

export function EditableProfileHeader({ 
  artistId, 
  initialData,
  songsCount,
  videosCount,
  isOwner 
}: EditableProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(initialData?.name || "Artist Name");
  const [biography, setBiography] = useState(initialData?.biography || "");
  const [genre, setGenre] = useState(initialData?.genre || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [profileImage, setProfileImage] = useState(initialData?.profileImage || "");
  const [bannerImage, setBannerImage] = useState(initialData?.bannerImage || "");
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "Artist Name");
      setBiography(initialData.biography || "");
      setGenre(initialData.genre || "");
      setLocation(initialData.location || "");
      setProfileImage(initialData.profileImage || "");
      setBannerImage(initialData.bannerImage || "");
    }
  }, [initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/artist/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: artistId,
          profileData: {
            name,
            biography,
            genre,
            location,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      toast({
        title: "¡Perfil actualizado!",
        description: "Tus cambios se han guardado exitosamente",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageUpload = async (imageData: string) => {
    try {
      const response = await fetch('/api/artist/upload-profile-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: artistId, imageData }),
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      setProfileImage(data.imageUrl);
      toast({
        title: "¡Imagen actualizada!",
        description: "Tu foto de perfil se ha actualizado",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    }
  };

  const handleBannerImageUpload = async (imageData: string) => {
    try {
      const response = await fetch('/api/artist/upload-banner-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: artistId, imageData }),
      });

      if (!response.ok) throw new Error('Failed to upload banner');

      const data = await response.json();
      setBannerImage(data.imageUrl);
      toast({
        title: "¡Banner actualizado!",
        description: "Tu imagen de portada se ha actualizado",
      });
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el banner",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="relative bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-sm overflow-hidden border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
      {/* Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-orange-600/20 to-red-500/20 rounded-t-lg relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />
        {bannerImage && (
          <img
            src={bannerImage}
            alt="Artist banner"
            className="w-full h-full object-cover"
          />
        )}
        {isOwner && isEditing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => handleBannerImageUpload(e.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              data-testid="button-upload-banner"
            >
              <Upload className="mr-2 h-4 w-4" />
              Cambiar Banner
            </Button>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8 pb-4 -mt-16 relative">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
          {/* Profile Image */}
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-black/80 overflow-hidden flex-shrink-0 bg-orange-500/10 relative group">
            {profileImage && (
              <img
                src={profileImage}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            )}
            {isOwner && isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => handleProfileImageUpload(e.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  data-testid="button-upload-profile"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left w-full">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-bold bg-black/30 border-orange-500/30"
                  placeholder="Nombre del Artista"
                  data-testid="input-artist-name"
                />
                <div className="flex gap-2">
                  <Input
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="bg-black/30 border-orange-500/30"
                    placeholder="Género"
                    data-testid="input-genre"
                  />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-black/30 border-orange-500/30"
                    placeholder="Ubicación"
                    data-testid="input-location"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-500">
                  {name}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3 flex-wrap">
                  {genre && (
                    <Badge variant="outline" className="text-orange-400 border-orange-500/30">
                      {genre}
                    </Badge>
                  )}
                  {location && (
                    <Badge variant="outline" className="text-orange-400 border-orange-500/30">
                      {location}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
                  <span className="flex items-center text-white/70 gap-1">
                    <Music2 className="w-4 h-4" />
                    {songsCount} tracks
                  </span>
                  <span className="flex items-center text-white/70 gap-1">
                    <VideoIcon className="w-4 h-4" />
                    {videosCount} videos
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Edit Controls */}
          <div className="flex gap-2 mt-4 md:mt-0">
            {isOwner && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      data-testid="button-save"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Guardando..." : "Guardar"}
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                      data-testid="button-cancel"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="rounded-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                      data-testid="button-edit"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Perfil
                    </Button>
                    <AIContentGenerator
                      artistName={name}
                      genre={genre}
                      onBiographyGenerated={(bio) => setBiography(bio)}
                      onImageGenerated={(img) => handleProfileImageUpload(img)}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Biography Section */}
        <div className="mt-6">
          <Card className="bg-black/40 backdrop-blur-sm border-orange-500/20 p-4 hover:border-orange-500/40 transition-all duration-300">
            <h3 className="font-semibold mb-2 flex items-center text-orange-400">
              Bio
            </h3>
            {isEditing ? (
              <Textarea
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                rows={6}
                className="resize-none bg-black/30 border-orange-500/30"
                placeholder="Escribe la biografía del artista..."
                data-testid="textarea-biography"
              />
            ) : (
              <p className="text-sm text-white/70 leading-relaxed">
                {biography || "Biografía no disponible"}
              </p>
            )}
          </Card>
        </div>
      </div>
    </Card>
  );
}
