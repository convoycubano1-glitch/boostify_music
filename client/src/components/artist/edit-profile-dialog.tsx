import { useState, useRef, useEffect } from "react";
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
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";
import { Loader2, Sparkles, Wand2, Edit2, Upload, Image as ImageIcon, Plus, Calendar, Trash2, ExternalLink, ShoppingBag, Images } from "lucide-react";
import { ImageGalleryGenerator } from "./image-gallery-generator";
import { db, storage } from "../../firebase";
import { collection, doc, setDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { queryClient } from "../../lib/queryClient";
import { ensureFirebaseAuth } from "../../lib/firebase-auth";

interface Show {
  id: string;
  venue: string;
  date: string;
  location: string;
  ticketUrl?: string;
}

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
    loopVideoUrl?: string;
    slug?: string;
    contactEmail: string;
    contactPhone: string;
    instagram: string;
    twitter: string;
    youtube: string;
    spotify: string;
  };
  onUpdate: () => void;
  onGalleryCreated?: () => void;
}

export function EditProfileDialog({ artistId, currentData, onUpdate, onGalleryCreated }: EditProfileDialogProps) {
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
  const [shows, setShows] = useState<Show[]>([]);
  const [newShow, setNewShow] = useState({ venue: '', date: '', location: '', ticketUrl: '' });
  const [isAddingShow, setIsAddingShow] = useState(false);
  const [isGeneratingProducts, setIsGeneratingProducts] = useState(false);
  const [imageUpdateKey, setImageUpdateKey] = useState(0);

  // Actualizar formData cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Dialog opened, setting formData from currentData');
      setFormData(currentData);
      setImageUpdateKey(0);
    }
  }, [isOpen]);

  // Cargar shows al abrir el diálogo
  useEffect(() => {
    if (isOpen && artistId) {
      loadShows();
    }
  }, [isOpen, artistId]);

  const loadShows = async () => {
    try {
      const showsRef = collection(db, "shows");
      const q = query(showsRef, where("userId", "==", artistId));
      const querySnapshot = await getDocs(q);
      const showsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        venue: doc.data().venue,
        date: doc.data().date,
        location: doc.data().location,
        ticketUrl: doc.data().ticketUrl,
      }));
      showsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setShows(showsData);
    } catch (error) {
      console.error("Error loading shows:", error);
    }
  };

  const handleAddShow = async () => {
    if (!newShow.venue.trim() || !newShow.date || !newShow.location.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa venue, fecha y ubicación.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingShow(true);
    try {
      const newDocRef = doc(collection(db, "shows"));
      await setDoc(newDocRef, {
        venue: newShow.venue,
        date: newShow.date,
        location: newShow.location,
        ticketUrl: newShow.ticketUrl || '',
        userId: artistId,
        createdAt: new Date(),
      });

      toast({
        title: "Show agregado",
        description: "El show se agregó correctamente.",
      });

      setNewShow({ venue: '', date: '', location: '', ticketUrl: '' });
      await loadShows();
    } catch (error) {
      console.error("Error adding show:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el show.",
        variant: "destructive",
      });
    } finally {
      setIsAddingShow(false);
    }
  };

  const handleDeleteShow = async (showId: string) => {
    try {
      const showDoc = doc(db, "shows", showId);
      await deleteDoc(showDoc);
      
      toast({
        title: "Show eliminado",
        description: "El show se eliminó correctamente.",
      });

      await loadShows();
    } catch (error) {
      console.error("Error deleting show:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el show.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateProducts = async () => {
    if (!formData.displayName) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu nombre artístico primero.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingProducts(true);
    try {
      const artistName = formData.displayName;
      const brandImage = formData.profileImage || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';
      
      toast({
        title: "Generando productos...",
        description: "Esto puede tomar unos momentos. Estamos creando imágenes únicas para cada producto.",
      });

      // Eliminar productos existentes
      const merchRef = collection(db, "merchandise");
      const q = query(merchRef, where("userId", "==", artistId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      // Definir tipos de productos
      const productTypes = [
        { type: 'T-Shirt', name: `${artistName} T-Shirt`, description: `Official ${artistName} merchandise t-shirt with exclusive Boostify design`, price: 29.99, category: 'Apparel', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
        { type: 'Hoodie', name: `${artistName} Hoodie`, description: `Premium quality hoodie featuring ${artistName} and Boostify branding`, price: 49.99, category: 'Apparel', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
        { type: 'Cap', name: `${artistName} Cap`, description: `Stylish cap with embroidered ${artistName} and Boostify logo`, price: 24.99, category: 'Accessories', sizes: ['One Size'] },
        { type: 'Poster', name: `${artistName} Poster`, description: `Limited edition concert poster featuring ${artistName}`, price: 19.99, category: 'Art', sizes: ['24x36"'] },
        { type: 'Sticker Pack', name: `${artistName} Sticker Pack`, description: `Set of 10 vinyl stickers with ${artistName} branding`, price: 9.99, category: 'Accessories', sizes: ['Standard'] },
        { type: 'Vinyl Record', name: `${artistName} Vinyl`, description: `Limited edition vinyl record by ${artistName}`, price: 34.99, category: 'Music', sizes: ['12"'] },
      ];

      // Generar productos con imágenes únicas
      for (const productDef of productTypes) {
        console.log(`🎨 Generating image for ${productDef.type}...`);
        
        let productImage = brandImage;
        try {
          const imageResponse = await fetch('/api/artist-profile/generate-product-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Enviar cookies de sesión
            body: JSON.stringify({
              productType: productDef.type,
              artistName: artistName,
              brandImage: brandImage
            })
          });
          
          console.log(`📡 Response status for ${productDef.type}:`, imageResponse.status);
          
          const imageResult = await imageResponse.json();
          console.log(`📦 Response data for ${productDef.type}:`, imageResult);
          
          if (imageResult.success && imageResult.imageUrl) {
            // Si la imagen es base64, subirla a Firebase Storage
            if (imageResult.imageUrl.startsWith('data:')) {
              console.log(`📤 Uploading base64 image to Firebase Storage for ${productDef.type}...`);
              try {
                // Convertir base64 a blob
                const base64Response = await fetch(imageResult.imageUrl);
                const blob = await base64Response.blob();
                
                // Subir a Firebase Storage
                const timestamp = Date.now();
                const storageRef = ref(storage, `merchandise/${artistId}/${productDef.type.toLowerCase().replace(/\s+/g, '-')}_${timestamp}.png`);
                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);
                
                productImage = downloadURL;
                console.log(`✅ Image uploaded to Storage for ${productDef.type}`);
              } catch (uploadError) {
                console.error(`❌ Error uploading image for ${productDef.type}:`, uploadError);
                productImage = brandImage; // Usar imagen por defecto si falla la subida
              }
            } else {
              productImage = imageResult.imageUrl;
            }
            console.log(`✅ Image ready for ${productDef.type}`);
          } else {
            console.warn(`⚠️ Could not generate image for ${productDef.type}. Error:`, imageResult.error || 'No error message');
          }
        } catch (error) {
          console.error(`❌ Exception generating image for ${productDef.type}:`, error);
        }
        
        // Guardar producto en Firebase
        const newDocRef = doc(collection(db, "merchandise"));
        await setDoc(newDocRef, {
          name: productDef.name,
          description: productDef.description,
          price: productDef.price,
          imageUrl: productImage,
          category: productDef.category,
          sizes: productDef.sizes,
          userId: artistId,
          createdAt: new Date(),
        });
      }

      toast({
        title: "¡Productos generados!",
        description: `Se han creado ${productTypes.length} productos con imágenes únicas.`,
      });
    } catch (error) {
      console.error("Error generating products:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar los productos. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProducts(false);
    }
  };

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

  // Subir imagen o video de banner directamente
  const handleUploadBannerImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona una imagen (JPG, PNG, etc.) o un video (MP4, MOV, etc.).",
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
      const fileType = file.type.startsWith('image/') ? 'imagen' : 'video';
      toast({
        title: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} de banner cargada`,
        description: `Tu ${fileType} de banner ha sido subida exitosamente.`,
      });
    } catch (error) {
      console.error("Error uploading banner media:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el archivo de banner.",
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
        console.log('✅ Biografía generada exitosamente:', data.biography);
        // Actualizar el estado directamente
        setFormData(prev => ({
          ...prev,
          biography: data.biography
        }));
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
        console.log('✅ Imagen de perfil generada exitosamente');
        console.log('🖼️ Nueva URL de imagen de perfil:', data.imageUrl.substring(0, 100));
        // Actualizar el estado directamente y forzar re-render
        setFormData(prev => {
          console.log('📝 Actualizando formData.profileImage');
          return {
            ...prev,
            profileImage: data.imageUrl
          };
        });
        setImageUpdateKey(prev => {
          const newKey = prev + 1;
          console.log('🔑 Image update key:', prev, '->', newKey);
          return newKey;
        });
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
          style: `Professional music artist hero banner for Boostify platform. Wide cinematic 16:9 format perfect for hero section. 
                  Artistic composition featuring ${formData.displayName} with Boostify's signature orange (#FF6B35) and black color palette. 
                  Modern music industry aesthetic with professional lighting and dynamic energy. 
                  ${referenceImage ? 'Incorporate the artist\'s face/identity from reference image naturally into the artistic scene.' : ''}
                  High-end music platform vibe, premium quality, artistic and creative atmosphere.`,
          mood: `Energetic, creative, professional music industry atmosphere with Boostify brand identity (orange and black accents)`,
          referenceImage: referenceImage || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        console.log('✅ Banner generado exitosamente');
        console.log('🖼️ Nueva URL de banner:', data.imageUrl.substring(0, 100));
        // Actualizar el estado directamente y forzar re-render
        setFormData(prev => {
          console.log('📝 Actualizando formData.bannerImage');
          return {
            ...prev,
            bannerImage: data.imageUrl
          };
        });
        setImageUpdateKey(prev => {
          const newKey = prev + 1;
          console.log('🔑 Image update key:', prev, '->', newKey);
          return newKey;
        });
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

  // Convertir base64 a Firebase Storage URL
  const uploadBase64ToStorage = async (base64Data: string, fileName: string): Promise<string> => {
    // Extraer el tipo MIME y los datos base64
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }

    const contentType = matches[1];
    const base64Content = matches[2];
    
    // Convertir base64 a blob
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });

    // Subir a Firebase Storage
    const storageRef = ref(storage, `artist-profiles/${artistId}/${fileName}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('☁️ Imagen base64 subida a Storage:', downloadURL);
    return downloadURL;
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
      // Las imágenes generadas por IA ya vienen como URLs públicas
      // Las imágenes subidas se convierten a URLs de Storage
      // Solo guardamos URLs, nunca base64
      const profileImageUrl = formData.profileImage || "";
      const bannerImageUrl = formData.bannerImage || "";
      const referenceImageUrl = referenceImage || "";

      // Guardar directamente usando el artistId como document ID en Firestore
      const userDocRef = doc(db, "users", artistId);

      const profileData = {
        uid: artistId,
        displayName: formData.displayName,
        name: formData.displayName,
        biography: formData.biography || "",
        genre: formData.genre || "",
        location: formData.location || "",
        profileImage: profileImageUrl,
        photoURL: profileImageUrl,
        bannerImage: bannerImageUrl,
        bannerPosition: String(formData.bannerPosition || "50"),
        loopVideoUrl: formData.loopVideoUrl || "",
        slug: formData.slug || generateSlug(formData.displayName),
        contactEmail: formData.contactEmail || "",
        contactPhone: formData.contactPhone || "",
        instagram: formData.instagram || "",
        twitter: formData.twitter || "",
        youtube: formData.youtube || "",
        spotify: formData.spotify || "",
        referenceImage: referenceImageUrl,
        updatedAt: new Date(),
      };

      console.log('💾 DEBUG - Guardando perfil con ID:', artistId);
      console.log('💾 DEBUG - Guardando perfil con Spotify:', profileData.spotify);
      console.log('💾 DEBUG - FormData spotify antes de guardar:', formData.spotify);

      // Usar merge: true para crear o actualizar el documento
      await setDoc(userDocRef, profileData, { merge: true });
      console.log('💾 DEBUG - Perfil guardado exitosamente en Firestore con ID:', artistId);

      // Invalidar caché de React Query para forzar actualización en todos los dispositivos
      await queryClient.invalidateQueries({ queryKey: ["userProfile", artistId] });
      
      // 🔔 Enviar datos al webhook de Make.com para automatización
      try {
        console.log('📡 Enviando datos de perfil al webhook de Make.com...');
        const webhookUrl = 'https://hook.us2.make.com/jeo56r778isvcxe4q7ntg3n9f3ykbsnf';
        
        const webhookData = {
          timestamp: new Date().toISOString(),
          event: 'profile_updated',
          artistId: artistId,
          profile: {
            displayName: profileData.displayName,
            biography: profileData.biography,
            genre: profileData.genre,
            location: profileData.location,
            profileImage: profileData.profileImage,
            bannerImage: profileData.bannerImage,
            bannerPosition: profileData.bannerPosition,
            loopVideoUrl: profileData.loopVideoUrl,
            slug: profileData.slug,
            contactEmail: profileData.contactEmail,
            contactPhone: profileData.contactPhone,
            socialMedia: {
              instagram: profileData.instagram,
              twitter: profileData.twitter,
              youtube: profileData.youtube,
              spotify: profileData.spotify,
            },
            referenceImage: profileData.referenceImage,
            updatedAt: profileData.updatedAt.toISOString(),
          }
        };

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });

        if (webhookResponse.ok) {
          console.log('✅ Datos enviados exitosamente al webhook de Make.com');
        } else {
          console.warn('⚠️ El webhook respondió con status:', webhookResponse.status);
        }
      } catch (webhookError) {
        // No bloqueamos el flujo si el webhook falla
        console.error('❌ Error enviando datos al webhook (no crítico):', webhookError);
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
              <img 
                key={`profile-${imageUpdateKey}-${formData.profileImage.substring(0, 50)}`}
                src={formData.profileImage} 
                alt="Preview" 
                className="w-20 h-20 object-cover rounded-full mt-2" 
              />
            )}
          </div>

          {/* Imagen de Banner con botón de generar y subir */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bannerImage">Imagen o Video de Banner (Hero)</Label>
              <div className="flex gap-2">
                <input
                  ref={bannerImageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/x-msvideo,video/webm"
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
              placeholder="URL de imagen/video o usa los botones para subir/generar"
            />
            {formData.bannerImage && (
              <div className="space-y-3">
                {formData.bannerImage.match(/\.(mp4|mov|avi|webm)$/i) || formData.bannerImage.includes('video') ? (
                  <video 
                    key={`banner-${imageUpdateKey}-${formData.bannerImage.substring(0, 50)}`}
                    src={formData.bannerImage} 
                    className="w-full h-32 object-cover rounded-lg"
                    style={{ objectPosition: `center ${formData.bannerPosition || '50'}%` }}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img 
                    key={`banner-${imageUpdateKey}-${formData.bannerImage.substring(0, 50)}`}
                    src={formData.bannerImage} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg"
                    style={{ objectPosition: `center ${formData.bannerPosition || '50'}%` }}
                  />
                )}
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

          {/* Video en Loop (Background Hero) */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Video de Fondo en Loop (Opcional)</h4>
              <Badge variant="secondary" className="text-xs">Premium Feature</Badge>
            </div>
            <p className="text-xs text-gray-500">
              Agrega un video que se reproducirá en loop como fondo de tu perfil para darle más estilo y profesionalismo.
            </p>
            <div className="space-y-2">
              <Label htmlFor="loopVideoUrl">URL del Video</Label>
              <Input
                id="loopVideoUrl"
                value={formData.loopVideoUrl || ''}
                onChange={(e) => handleChange("loopVideoUrl", e.target.value)}
                placeholder="https://ejemplo.com/video.mp4"
              />
              <p className="text-xs text-gray-400 italic">
                Sube tu video a Firebase Storage o usa una URL directa. Formatos: MP4, WebM.
              </p>
            </div>
            {formData.loopVideoUrl && (
              <div className="space-y-2">
                <video
                  src={formData.loopVideoUrl}
                  className="w-full h-32 object-cover rounded-lg"
                  autoPlay
                  muted
                  loop
                />
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
                <Label htmlFor="spotify" className="flex items-center gap-2">
                  Spotify Artist URL
                  <Badge variant="outline" className="text-xs">Embed</Badge>
                </Label>
                <Input
                  id="spotify"
                  value={formData.spotify}
                  onChange={(e) => handleChange("spotify", e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                />
                <p className="text-xs text-gray-400 italic">
                  Pega la URL de tu perfil de artista de Spotify. Se mostrará un reproductor en tu página.
                </p>
              </div>
            </div>
          </div>

          {/* Gestión de Shows */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Próximos Shows
              </h4>
            </div>

            {/* Formulario para agregar show */}
            <div className="space-y-3 mb-4 p-3 bg-gray-900/30 rounded-lg border border-gray-700">
              <h5 className="text-xs font-medium text-gray-400">Agregar Nuevo Show</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="newShowVenue" className="text-xs">Nombre del Lugar *</Label>
                  <Input
                    id="newShowVenue"
                    value={newShow.venue}
                    onChange={(e) => setNewShow({ ...newShow, venue: e.target.value })}
                    placeholder="Ej: Hard Rock Cafe"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newShowDate" className="text-xs">Fecha y Hora *</Label>
                  <Input
                    id="newShowDate"
                    type="datetime-local"
                    value={newShow.date}
                    onChange={(e) => setNewShow({ ...newShow, date: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newShowLocation" className="text-xs">Ubicación *</Label>
                  <Input
                    id="newShowLocation"
                    value={newShow.location}
                    onChange={(e) => setNewShow({ ...newShow, location: e.target.value })}
                    placeholder="Ciudad, País"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newShowTicketUrl" className="text-xs">URL de Tickets (opcional)</Label>
                  <Input
                    id="newShowTicketUrl"
                    value={newShow.ticketUrl}
                    onChange={(e) => setNewShow({ ...newShow, ticketUrl: e.target.value })}
                    placeholder="https://..."
                    className="h-9"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddShow}
                disabled={isAddingShow}
                className="w-full h-9"
                size="sm"
              >
                {isAddingShow ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-3 w-3" />
                    Agregar Show
                  </>
                )}
              </Button>
            </div>

            {/* Lista de shows existentes */}
            {shows.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 mb-2">Shows Programados ({shows.length})</h5>
                {shows.map((show) => {
                  const showDate = new Date(show.date);
                  const formattedDate = showDate.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const formattedTime = showDate.toLocaleTimeString('es-ES', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <div
                      key={show.id}
                      className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h6 className="font-semibold text-sm text-white">{show.venue}</h6>
                          <p className="text-xs text-gray-400 mt-1">
                            {formattedDate} • {formattedTime}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{show.location}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteShow(show.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {show.ticketUrl && (
                        <a
                          href={show.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver tickets
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gestión de Merchandise */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Merchandise
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Genera productos promocionales con imágenes únicas creadas por IA
                </p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-lg border border-orange-500/20">
              <div className="flex items-start gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-orange-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-white mb-1">
                    Generación Automática con IA
                  </h5>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Crea 6 productos (T-Shirt, Hoodie, Gorra, Poster, Stickers, Vinyl) con imágenes únicas 
                    generadas por Inteligencia Artificial usando el branding de Boostify.
                  </p>
                  <p className="text-xs text-orange-400 mt-2">
                    💡 Próximamente: Integración con Printful para producción bajo demanda
                  </p>
                </div>
              </div>
              
              <Button
                type="button"
                onClick={handleGenerateProducts}
                disabled={isGeneratingProducts || !formData.displayName}
                className="w-full"
                style={{ 
                  backgroundColor: isGeneratingProducts ? undefined : '#f97316',
                  color: 'white'
                }}
              >
                {isGeneratingProducts ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando productos e imágenes...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar Productos con IA
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Galería de Imágenes Profesionales */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Images className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400">Galerías de Imágenes Profesionales</span>
                </h4>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-3">
                  <p className="text-xs text-gray-400">
                    Crea galerías de 6 imágenes profesionales para tus sencillos usando IA
                  </p>
                  
                  <div className="space-y-2 text-xs text-gray-400">
                    <p className="font-semibold text-purple-300">📸 ¿Cómo funciona?</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Sube 1-3 fotos tuyas (para mantener tu identidad facial)</li>
                      <li>Ingresa el nombre de tu sencillo</li>
                      <li>La IA generará 6 imágenes profesionales diferentes</li>
                      <li>Las imágenes aparecerán automáticamente en tu perfil público</li>
                    </ul>
                    
                    <p className="font-semibold text-purple-300 mt-3">✨ Incluye:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Close-up con iluminación dramática</li>
                      <li>Foto en escenario performando</li>
                      <li>Sesión urbana profesional</li>
                      <li>Retrato artístico creativo</li>
                      <li>Lifestyle natural</li>
                      <li>Editorial de alta moda</li>
                    </ul>

                    <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded">
                      <p className="text-orange-300 font-semibold">💡 Tip Profesional:</p>
                      <p className="mt-1">Usa fotos claras con buena iluminación donde se vea bien tu rostro. La IA mantendrá tus rasgos faciales en todas las 6 imágenes generadas.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <ImageGalleryGenerator
                artistId={artistId}
                artistName={currentData.displayName}
                onGalleryCreated={() => {
                  onUpdate();
                  if (onGalleryCreated) {
                    onGalleryCreated();
                  }
                }}
              />
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
