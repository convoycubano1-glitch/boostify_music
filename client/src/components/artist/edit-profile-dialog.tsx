import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { logger } from "@/lib/logger";
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
import { Loader2, Sparkles, Wand2, Edit2, Upload, Image as ImageIcon, Plus, Calendar, Trash2, ExternalLink, ShoppingBag, Images, Newspaper, FileText, Music, Lock, AlertCircle } from "lucide-react";
import { ImageGalleryGenerator } from "./image-gallery-generator";
import { EPKGenerator } from "../artist-profile/epk-generator";
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

interface Subscription {
  plan: string;
  aiGenerationLimit?: number;
  aiGenerationUsed?: number;
  epkLimit?: number;
  epkUsed?: number;
  imageGalleriesLimit?: number;
  imageGalleriesUsed?: number;
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
  
  // Query para obtener datos de suscripción con límites
  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscriptions/current"],
  });

  const [formData, setFormData] = useState(currentData);
  const [shows, setShows] = useState<Show[]>([]);
  const [newShow, setNewShow] = useState({ venue: '', date: '', location: '', ticketUrl: '' });
  const [isAddingShow, setIsAddingShow] = useState(false);
  const [isGeneratingProducts, setIsGeneratingProducts] = useState(false);
  const [isGeneratingNews, setIsGeneratingNews] = useState(false);
  const [isGeneratingAlbum, setIsGeneratingAlbum] = useState(false);
  const [imageUpdateKey, setImageUpdateKey] = useState(0);

  // Actualizar formData cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      logger.info('🔄 Dialog opened, setting formData from currentData');
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
      logger.error("Error loading shows:", error);
    }
  };

  const handleAddShow = async () => {
    if (!newShow.venue.trim() || !newShow.date || !newShow.location.trim()) {
      toast({
        title: "Required Fields",
        description: "Please complete venue, date and location.",
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
        title: "Show Added",
        description: "Show was added successfully.",
      });

      setNewShow({ venue: '', date: '', location: '', ticketUrl: '' });
      await loadShows();
    } catch (error) {
      logger.error("Error adding show:", error);
      toast({
        title: "Error",
        description: "Could not add show.",
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
        title: "Show Deleted",
        description: "Show was deleted successfully.",
      });

      await loadShows();
    } catch (error) {
      logger.error("Error deleting show:", error);
      toast({
        title: "Error",
        description: "Could not delete show.",
        variant: "destructive",
      });
    }
  };

  const checkAIGenerationLimit = () => {
    if (!subscription) return true;
    
    const aiLimit = subscription.aiGenerationLimit || 0;
    const aiUsed = subscription.aiGenerationUsed || 0;
    
    if (aiLimit > 0 && aiUsed >= aiLimit) {
      toast({
        title: "Limit Reached",
        description: `You have used your ${aiLimit} generations this month. Upgrade your plan for more.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const checkEPKLimit = () => {
    if (!subscription) return true;
    
    const epkLimit = subscription.epkLimit || 0;
    const epkUsed = subscription.epkUsed || 0;
    
    if (epkLimit === 0) {
      toast({
        title: "Tool Locked",
        description: "EPK is available only for BASIC, PRO and PREMIUM plans.",
        variant: "destructive",
      });
      return false;
    }
    
    if (epkUsed >= epkLimit) {
      toast({
        title: "Limit Reached",
        description: `Ya has creado ${epkLimit} EPK${epkLimit !== 1 ? 's' : ''}. Upgrade tu plan para más.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const checkImageGalleriesLimit = () => {
    if (!subscription) return true;
    
    const galleriesLimit = subscription.imageGalleriesLimit || 0;
    const galleriesUsed = subscription.imageGalleriesUsed || 0;
    
    if (galleriesLimit === 0) {
      toast({
        title: "Tool Locked",
        description: "Image Galleries is available only for BASIC, PRO and PREMIUM plans.",
        variant: "destructive",
      });
      return false;
    }
    
    if (galleriesUsed >= galleriesLimit) {
      toast({
        title: "Limit Reached",
        description: `Ya has creado ${galleriesLimit} galería${galleriesLimit !== 1 ? 's' : ''}. Upgrade tu plan para más.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleGenerateProducts = async () => {
    if (!formData.displayName) {
      toast({
        title: "Error",
        description: "Please enter your artist name first.",
        variant: "destructive",
      });
      return;
    }

    if (!checkAIGenerationLimit()) return;

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
        logger.info(`🎨 Generating image for ${productDef.type}...`);
        
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
          
          logger.info(`📡 Response status for ${productDef.type}:`, imageResponse.status);
          
          const imageResult = await imageResponse.json();
          logger.info(`📦 Response data for ${productDef.type}:`, imageResult);
          
          if (imageResult.success && imageResult.imageUrl) {
            // Si la imagen es base64, subirla a Firebase Storage
            if (imageResult.imageUrl.startsWith('data:')) {
              logger.info(`📤 Uploading base64 image to Firebase Storage for ${productDef.type}...`);
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
                logger.info(`✅ Image uploaded to Storage for ${productDef.type}`);
              } catch (uploadError) {
                logger.error(`❌ Error uploading image for ${productDef.type}:`, uploadError);
                productImage = brandImage; // Usar imagen por defecto si falla la subida
              }
            } else {
              productImage = imageResult.imageUrl;
            }
            logger.info(`✅ Image ready for ${productDef.type}`);
          } else {
            logger.warn(`⚠️ Could not generate image for ${productDef.type}. Error:`, imageResult.error || 'No error message');
          }
        } catch (error) {
          logger.error(`❌ Exception generating image for ${productDef.type}:`, error);
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
        title: "Products Generated!",
        description: `products with unique images have been created.`,
      });
    } catch (error) {
      logger.error("Error generating products:", error);
      toast({
        title: "Error",
        description: "Could not generate products. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProducts(false);
    }
  };

  const handleGenerateNews = async () => {
    if (!formData.displayName) {
      toast({
        title: "Error",
        description: "Please enter your artist name first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingNews(true);
    try {
      toast({
        title: "Generando noticias...",
        description: "Esto puede tomar unos momentos. Estamos creando 5 noticias únicas con IA.",
      });

      const response = await fetch(`/api/artist-generator/generate-news/${artistId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "News Generated!",
          description: `news items with unique images have been created.`,
        });
        
        onUpdate();
      } else {
        throw new Error(result.error || 'Error generando noticias');
      }
    } catch (error) {
      logger.error("Error generating news:", error);
      toast({
        title: "Error",
        description: "Could not generate news. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingNews(false);
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
        title: "Invalid File",
        description: "Please select an image.",
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
        title: "Image Uploaded",
        description: "Now you can generate tu perfil y banner con esta imagen de referencia.",
      });
    } catch (error) {
      logger.error("Error uploading reference image:", error);
      toast({
        title: "Error",
        description: "Could not load reference image.",
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
        title: "Invalid File",
        description: "Please select an image (JPG, PNG, etc.).",
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
        title: "Profile image uploaded",
        description: "Your profile image has been uploaded successfully.",
      });
    } catch (error) {
      logger.error("Error uploading profile image:", error);
      toast({
        title: "Error",
        description: "Could not upload profile image.",
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
        title: "Invalid File",
        description: "Please select an image (JPG, PNG, etc.) o un video (MP4, WebM, etc.).",
        variant: "destructive",
      });
      return;
    }

    // Advertir si el archivo es .MOV
    const isMovFile = file.name.toLowerCase().endsWith('.mov') || file.type === 'video/quicktime';
    if (isMovFile) {
      toast({
        title: "⚠️ Formato .MOV detectado",
        description: "Los archivos .MOV no funcionan en Chrome/Firefox. Recomendamos convertir a .MP4 para mejor compatibilidad.",
        variant: "destructive",
      });
      // Aún permitimos subir, pero con advertencia
    }

    setIsUploadingBannerImage(true);

    try {
      const storageRef = ref(storage, `artist-profiles/${artistId}/banner_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      handleChange("bannerImage", downloadURL);
      const fileType = file.type.startsWith('image/') ? 'imagen' : 'video';
      toast({
        title: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} of banner uploada`,
        description: isMovFile 
          ? `Tu ${fileType} fue subido, pero puede no funcionar en todos los navegadores. Considera usar .MP4 en su lugar.`
          : `Your banner has been uploaded successfully.`,
      });
    } catch (error) {
      logger.error("Error uploading banner media:", error);
      toast({
        title: "Error",
        description: "Could not upload banner file.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingBannerImage(false);
    }
  };

  const handleGenerateBiography = async () => {
    if (!formData.displayName) {
      toast({
        title: "Name Required",
        description: "You must enter your artist name first.",
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
        logger.info('✅ Biography generada exitosamente:', data.biography);
        // Actualizar el estado directamente
        setFormData(prev => ({
          ...prev,
          biography: data.biography
        }));
        toast({
          title: "Biography generada",
          description: "Your biography has been automatically generated with AI.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate biography');
      }
    } catch (error: any) {
      logger.error("Error generating biography:", error);
      toast({
        title: "Error",
        description: "Could not generate biography. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBiography(false);
    }
  };

  const handleGenerateAlbum = async () => {
    if (!formData.displayName) {
      toast({
        title: "Name Required",
        description: "You must enter your artist name first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAlbum(true);

    try {
      const response = await fetch('/api/generate-album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: formData.displayName,
          biography: formData.biography,
          profileImage: formData.profileImage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        logger.info('✅ Album Generated exitosamente');
        toast({
          title: "Album Generated",
          description: "3 songs with audio have been created. You can view them in your profile Music section.",
        });
      } else {
        throw new Error(data.message || 'Failed to generate album');
      }
    } catch (error: any) {
      logger.error("Error generating album:", error);
      toast({
        title: "Error",
        description: error.message || "Could not generate album. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAlbum(false);
    }
  };

  const handleGenerateProfileImage = async () => {
    if (!formData.displayName) {
      toast({
        title: "Name Required",
        description: "You must enter your artist name first.",
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
        logger.info('✅ Profile Image Generated exitosamente');
        logger.info('🖼️ Nueva URL de imagen de perfil:', data.imageUrl.substring(0, 100));
        // Actualizar el estado directamente y forzar re-render
        setFormData(prev => {
          logger.info('📝 Actualizando formData.profileImage');
          return {
            ...prev,
            profileImage: data.imageUrl
          };
        });
        setImageUpdateKey(prev => {
          const newKey = prev + 1;
          logger.info('🔑 Image update key:', prev, '->', newKey);
          return newKey;
        });
        toast({
          title: "Profile Image Generated",
          description: "Your profile image has been generated with AI.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate profile image');
      }
    } catch (error: any) {
      logger.error("Error generating profile image:", error);
      toast({
        title: "Error",
        description: "Could not generate profile image. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProfileImage(false);
    }
  };

  const handleGenerateBannerImage = async () => {
    if (!formData.displayName) {
      toast({
        title: "Name Required",
        description: "You must enter your artist name first.",
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
        logger.info('✅ Banner generado exitosamente');
        logger.info('🖼️ Nueva URL de banner:', data.imageUrl.substring(0, 100));
        // Actualizar el estado directamente y forzar re-render
        setFormData(prev => {
          logger.info('📝 Actualizando formData.bannerImage');
          return {
            ...prev,
            bannerImage: data.imageUrl
          };
        });
        setImageUpdateKey(prev => {
          const newKey = prev + 1;
          logger.info('🔑 Image update key:', prev, '->', newKey);
          return newKey;
        });
        toast({
          title: "Banner Image Generated",
          description: "Your banner image has been generated with AI.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate banner image');
      }
    } catch (error: any) {
      logger.error("Error generating banner image:", error);
      toast({
        title: "Error",
        description: "Could not generate banner image. Intenta de nuevo.",
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
    
    logger.info('☁️ Imagen base64 subida a Storage:', downloadURL);
    return downloadURL;
  };

  const handleSave = async () => {
    if (!artistId) {
      toast({
        title: "Error",
        description: "Invalid artist ID.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      logger.info('💾 Guardando perfil del artista', artistId);

      // Llamar al endpoint del backend que actualiza AMBAS bases de datos
      const response = await fetch(`/api/artist-generator/update-artist/${artistId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          displayName: formData.displayName,
          biography: formData.biography || "",
          genre: formData.genre || "",
          location: formData.location || "",
          profileImage: formData.profileImage || "",
          bannerImage: formData.bannerImage || "",
          bannerPosition: formData.bannerPosition || "50",
          loopVideoUrl: formData.loopVideoUrl || "",
          slug: formData.slug || generateSlug(formData.displayName),
          contactEmail: formData.contactEmail || "",
          contactPhone: formData.contactPhone || "",
          instagram: formData.instagram || "",
          twitter: formData.twitter || "",
          youtube: formData.youtube || "",
          spotify: formData.spotify || "",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error updating profile');
      }

      logger.info('✅ Profile updated successfully en PostgreSQL y Firebase');

      // Invalidar TODAS las queryKeys relevantes para forzar actualización en el UI
      const numericId = parseInt(artistId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["userProfile", artistId] }),
        queryClient.invalidateQueries({ queryKey: ["userProfile", String(artistId)] }),
        queryClient.invalidateQueries({ queryKey: ["userProfile", Number(artistId)] }),
        queryClient.invalidateQueries({ queryKey: ["/api/artist-generator/my-artists"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/artist", artistId] }),
        queryClient.invalidateQueries({ queryKey: ["/api/artist-profile", artistId] }),
        queryClient.invalidateQueries({ queryKey: [`/api/songs/user/${numericId}`] }),
        queryClient.invalidateQueries({ queryKey: ["songs"] }),
      ]);
      
      // 🔔 Enviar datos al webhook de Make.com para automatización
      try {
        logger.info('📡 Enviando datos de perfil al webhook de Make.com...');
        const webhookUrl = 'https://hook.us2.make.com/jeo56r778isvcxe4q7ntg3n9f3ykbsnf';
        
        const webhookData = {
          timestamp: new Date().toISOString(),
          event: 'profile_updated',
          artistId: artistId,
          profile: {
            displayName: formData.displayName,
            biography: formData.biography,
            genre: formData.genre,
            location: formData.location,
            profileImage: formData.profileImage,
            bannerImage: formData.bannerImage,
            bannerPosition: formData.bannerPosition,
            loopVideoUrl: formData.loopVideoUrl,
            slug: formData.slug,
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
            socialMedia: {
              instagram: formData.instagram,
              twitter: formData.twitter,
              youtube: formData.youtube,
              spotify: formData.spotify,
            },
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
          logger.info('✅ Datos enviados exitosamente al webhook de Make.com');
        } else {
          logger.warn('⚠️ El webhook respondió con status:', webhookResponse.status);
        }
      } catch (webhookError) {
        // No bloqueamos el flujo si el webhook falla
        logger.error('❌ Error enviando datos al webhook (no crítico):', webhookError);
      }
      
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil se ha guardado correctamente.",
      });

      setIsOpen(false);
      onUpdate();
    } catch (error) {
      logger.error("Error saving profile:", error);
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
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Artist Profile</DialogTitle>
          <DialogDescription>
            Update your information and generate professional content with AI
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
                  <span className="text-xs text-green-500">Image Uploaded ✓</span>
                </div>
              )}
            </div>
            {referenceImage && (
              <img src={referenceImage} alt="Reference" className="w-32 h-32 object-cover rounded-lg mt-2" />
            )}
          </div>

          {/* Artist Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Artist Name *</Label>
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

          {/* Biography con botón de generar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="biography">Biography</Label>
              <div className="flex gap-2">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAlbum}
                  disabled={isGeneratingAlbum}
                  data-testid="button-generate-album"
                >
                  {isGeneratingAlbum ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Music className="mr-2 h-4 w-4" />
                      Generar Álbum
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              id="biography"
              value={formData.biography}
              onChange={(e) => handleChange("biography", e.target.value)}
              placeholder="Cuéntanos tu historia como artista..."
              className="min-h-[100px]"
            />
          </div>

          {/* Género y Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Music Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => handleChange("genre", e.target.value)}
                placeholder="Ej: Pop, Rock, Hip-Hop"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
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
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,video/mp4,video/webm,video/quicktime"
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
              placeholder="URL de imagen/video (MP4/WebM recomendado)"
            />
            <p className="text-xs text-muted-foreground">
              💡 Para videos, usa formato <strong>.MP4</strong> o <strong>.WebM</strong> para mejor compatibilidad con todos los navegadores. ⚠️ .MOV no funciona en Chrome/Firefox.
            </p>
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
                    <Label className="text-sm">Ajustar Banner Position</Label>
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
                Sube tu video a Firebase Storage o usa una URL directa. Formatos recomendados: <strong>MP4</strong> o <strong>WebM</strong>. ⚠️ .MOV no funciona en Chrome/Firefox.
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
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                  placeholder="contacto@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
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
                  <Label htmlFor="newShowDate" className="text-xs">Date and Time *</Label>
                  <Input
                    id="newShowDate"
                    type="datetime-local"
                    value={newShow.date}
                    onChange={(e) => setNewShow({ ...newShow, date: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newShowLocation" className="text-xs">Location *</Label>
                  <Input
                    id="newShowLocation"
                    value={newShow.location}
                    onChange={(e) => setNewShow({ ...newShow, location: e.target.value })}
                    placeholder="Ciudad, País"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newShowTicketUrl" className="text-xs">Ticket URL (opcional)</Label>
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
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-3 w-3" />
                    Add Show
                  </>
                )}
              </Button>
            </div>

            {/* Lista de shows existentes */}
            {shows.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 mb-2">Scheduled Shows ({shows.length})</h5>
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
                          View Tickets
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
                  Automatic Generation with AI
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Generate products and professional content with unique AI-created images
                </p>
              </div>
              {subscription && (
                <Badge variant="outline" className="text-xs">
                  {subscription.aiGenerationUsed || 0}/{subscription.aiGenerationLimit || 0}
                </Badge>
              )}
            </div>
            
            {/* AI Generation Usage Bar */}
            {subscription && subscription.aiGenerationLimit && subscription.aiGenerationLimit > 0 && (
              <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Generations Used</span>
                  <span className={subscription.aiGenerationUsed >= subscription.aiGenerationLimit ? "text-red-400 font-semibold" : "text-gray-400"}>
                    {subscription.aiGenerationUsed}/{subscription.aiGenerationLimit}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      subscription.aiGenerationUsed >= subscription.aiGenerationLimit 
                        ? "bg-red-500" 
                        : "bg-gradient-to-r from-blue-500 to-cyan-500"
                    }`}
                    style={{
                      width: `${Math.min((subscription.aiGenerationUsed / subscription.aiGenerationLimit) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            )}

            <div className="p-4 bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-lg border border-orange-500/20">
              <div className="flex items-start gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-orange-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-white mb-1">
                    Automatic Generation with AI
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
                disabled={isGeneratingProducts}
                className="w-full"
                style={{ 
                  backgroundColor: isGeneratingProducts ? undefined : '#f97316',
                  color: 'white'
                }}
              >
                {isGeneratingProducts ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating products and images...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Products with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sección de Noticias con IA */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Newspaper className="h-4 w-4" />
                  Artist News
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Genera noticias de prensa profesionales con imágenes únicas creadas por IA
                </p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-start gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-white mb-1">
                    Automatic Generation with AI
                  </h5>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Crea 5 noticias profesionales (Lanzamiento, Performance, Colaboración, Logros, Lifestyle) 
                    con imágenes únicas generadas por Gemini 2.5 Flash Image (Nano Banana).
                  </p>
                  <p className="text-xs text-blue-400 mt-2">
                    📰 Contenido periodístico de alta calidad para aumentar tu presencia mediática
                  </p>
                </div>
              </div>
              
              <Button
                type="button"
                onClick={handleGenerateNews}
                disabled={isGeneratingNews}
                className="w-full"
                style={{ 
                  backgroundColor: isGeneratingNews ? undefined : '#3b82f6',
                  color: 'white'
                }}
              >
                {isGeneratingNews ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating news and images...
                  </>
                ) : (
                  <>
                    <Newspaper className="mr-2 h-4 w-4" />
                    Generate News with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Generador de EPK Profesional */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Electronic Press Kit (EPK)
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Genera un kit de prensa profesional completo con biografía mejorada, logros y fotos de prensa
                </p>
              </div>
              {subscription && (
                <Badge variant="outline" className="text-xs">
                  {subscription.epkUsed || 0}/{subscription.epkLimit || 0}
                </Badge>
              )}
            </div>
            
            {/* EPK Usage Status */}
            {subscription && subscription.epkLimit === 0 && (
              <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                <Lock className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-600">EPK is available only for BASIC, PRO and PREMIUM plans</p>
              </div>
            )}
            
            {subscription && subscription.epkLimit && subscription.epkLimit > 0 && (
              <div className="mb-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">EPKs creados</span>
                  <span className={subscription.epkUsed >= subscription.epkLimit ? "text-red-400 font-semibold" : "text-gray-400"}>
                    {subscription.epkUsed}/{subscription.epkLimit}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      subscription.epkUsed >= subscription.epkLimit 
                        ? "bg-red-500" 
                        : "bg-gradient-to-r from-green-500 to-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min((subscription.epkUsed / subscription.epkLimit) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            )}

            <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-start gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-green-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-white mb-1">
                    Complete Press Kit
                  </h5>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Create an EPK profesional listo para enviar a medios, festivales y promotores. Incluye biografías 
                    en diferentes formatos, logros destacados, citas inspiradoras, fact sheet y fotos de prensa 
                    coherentes con tu género musical generadas por Gemini 2.5 Flash (Nano Banana).
                  </p>
                  <p className="text-xs text-green-400 mt-2">
                    📄 Download as JSON • PDF coming soon
                  </p>
                </div>
              </div>
              
              {subscription && subscription.epkLimit && subscription.epkLimit > 0 && subscription.epkUsed < subscription.epkLimit ? (
                <div className="bg-black/20 rounded-lg p-3 border border-green-500/10">
                  <EPKGenerator />
                </div>
              ) : subscription && subscription.epkLimit && subscription.epkLimit > 0 ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-600">Limit Reached</p>
                    <p className="text-xs text-red-600/80 mt-1">Ya has creado {subscription.epkLimit} EPK este mes. Upgrade tu plan para más.</p>
                  </div>
                </div>
              ) : subscription && subscription.epkLimit === 0 ? null : (
                <div className="bg-black/20 rounded-lg p-3 border border-green-500/10">
                  <EPKGenerator />
                </div>
              )}
            </div>
          </div>

          {/* Galería de Imágenes Profesionales */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Images className="h-4 w-4 text-purple-400" />
                    <span className="text-purple-400">Professional Image Galleries</span>
                  </h4>
                  {subscription && (
                    <Badge variant="outline" className="text-xs">
                      {subscription.imageGalleriesUsed || 0}/{subscription.imageGalleriesLimit || 0}
                    </Badge>
                  )}
                </div>
                
                {/* Gallery Usage Status */}
                {subscription && subscription.imageGalleriesLimit === 0 && (
                  <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                    <Lock className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-600">Galerías está disponible solo para planes BASIC, PRO y PREMIUM</p>
                  </div>
                )}
                
                {subscription && subscription.imageGalleriesLimit && subscription.imageGalleriesLimit > 0 && (
                  <div className="mb-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-400">Galerías creadas</span>
                      <span className={subscription.imageGalleriesUsed >= subscription.imageGalleriesLimit ? "text-red-400 font-semibold" : "text-gray-400"}>
                        {subscription.imageGalleriesUsed}/{subscription.imageGalleriesLimit}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          subscription.imageGalleriesUsed >= subscription.imageGalleriesLimit 
                            ? "bg-red-500" 
                            : "bg-gradient-to-r from-purple-500 to-pink-500"
                        }`}
                        style={{
                          width: `${Math.min((subscription.imageGalleriesUsed / subscription.imageGalleriesLimit) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-3">
                  <p className="text-xs text-gray-400">
                    Create galleries of 6 imágenes profesionales para tus sencillos usando IA
                  </p>
                  
                  <div className="space-y-2 text-xs text-gray-400">
                    <p className="font-semibold text-purple-300">📸 How does it work?</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Upload 1-3 of your photos (to maintain your facial identity)</li>
                      <li>Enter your single name</li>
                      <li>AI will generate 6 imágenes profesionales diferentes</li>
                      <li>Images will appear automatically on your public profile</li>
                    </ul>
                    
                    <p className="font-semibold text-purple-300 mt-3">✨ Incluye:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Close-up with dramatic lighting</li>
                      <li>Photo on stage performing</li>
                      <li>Professional urban session</li>
                      <li>Creative artistic portrait</li>
                      <li>Natural lifestyle</li>
                      <li>High fashion editorial</li>
                    </ul>

                    <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded">
                      <p className="text-orange-300 font-semibold">💡 Professional Tip:</p>
                      <p className="mt-1">Use clear photos con good lighting where your face is visible. La IA will maintain your facial features en todas las 6 imágenes generadas.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {subscription && subscription.imageGalleriesLimit && subscription.imageGalleriesLimit > 0 && subscription.imageGalleriesUsed < subscription.imageGalleriesLimit ? (
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
              ) : subscription && subscription.imageGalleriesLimit && subscription.imageGalleriesLimit > 0 ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-600">Limit Reached</p>
                    <p className="text-xs text-red-600/80 mt-1">Ya has creado {subscription.imageGalleriesLimit} galería{subscription.imageGalleriesLimit !== 1 ? 's' : ''} este mes. Upgrade tu plan para más.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !formData.displayName}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
