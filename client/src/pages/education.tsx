import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Header } from "../components/layout/header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { generateCourseContent, extendCourseContent, AdditionalCourseContent } from "../lib/api/education-service";
import { ImagePreloader } from "../components/ui/image-preloader";
import { Music2, BookOpen, Star, DollarSign, Plus, Loader2, Clock, Users, Award, Play, ChevronRight, PlusCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { 
  collection, addDoc, getDocs, query, orderBy, Timestamp, doc, updateDoc,
  getDoc, setDoc, where, limit, deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getRelevantImage } from "../lib/unsplash-service";
import { generateImageWithFal } from "../lib/api/fal-ai";
import { createCheckoutSession } from "../lib/api/stripe-service";
import MasterclassSection from "../components/education/MasterclassSection";
import { logger } from "../lib/logger";

interface CourseFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
}

// Type for Course interface is defined below

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  level: string;
  thumbnail: string;
  rating: number;
  totalReviews: number;
  duration: string;
  lessons: number;
  enrolledStudents: number;
  content?: any;
  additionalContent?: AdditionalCourseContent[];
  lastUpdated?: Date;
  createdAt: Date;
  createdBy: string;
}

export default function EducationPage() {
  const { toast } = useToast();
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newCourse, setNewCourse] = useState<CourseFormData>({
    title: "",
    description: "",
    price: 0,
    category: "",
    level: "Beginner"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isExtendingCourse, setIsExtendingCourse] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  
  // Estados para controlar la regeneración de imágenes
  const [isRegeneratingImages, setIsRegeneratingImages] = useState(false);
  const [regenerationProgress, setRegenerationProgress] = useState(0);
  const [showCategoryCarousel, setShowCategoryCarousel] = useState(true);
  
  // State for level categories with predefined high-quality images
  type LevelImages = {
    Beginner: string;
    Intermediate: string;
    Advanced: string;
    [key: string]: string; // Allow additional string indices
  };
  
  const [levelImages, setLevelImages] = useState<LevelImages>({
    Beginner: "https://storage.googleapis.com/pai-images/fd0f6b4aff5d4469ab4afd39d0490253.jpeg", // Imagen de estudio musical para principiantes
    Intermediate: "https://storage.googleapis.com/pai-images/a0bb7f209be241cbbc4982a177f2d7d1.jpeg", // Imagen de estudio intermedio profesional 
    Advanced: "https://storage.googleapis.com/pai-images/16c2b91fafb84224b52e7bb0e13e4fe4.jpeg" // Imagen de estudio avanzado de alta gama
  });
  
  // Colección para el caché de imágenes generadas
  const imagesCacheCollection = "generated_images_cache";
  
  // Lista de imágenes críticas que siempre deben precargarse 
  // Usamos imágenes estáticas para evitar errores de renderizado
  const criticalImageUrls = [
    "https://storage.googleapis.com/pai-images/fd0f6b4aff5d4469ab4afd39d0490253.jpeg", // Beginner
    "https://storage.googleapis.com/pai-images/a0bb7f209be241cbbc4982a177f2d7d1.jpeg", // Intermediate
    "https://storage.googleapis.com/pai-images/16c2b91fafb84224b52e7bb0e13e4fe4.jpeg", // Advanced
    "https://storage.googleapis.com/pai-images/ae9e7782ddee4a0b9a1d2f5374fc0167.jpeg", // Marketing
    "https://storage.googleapis.com/pai-images/8e9a835ef5404252b5ff5eba50d04aec.jpeg", // Distribution
  ];
  
  // Memoria caché local PERSISTENTE para imágenes (persiste entre recargas de página)
  // Usamos sessionStorage para mantener la persistencia durante la sesión del usuario
  const getImageCache = (): Record<string, string> => {
    try {
      const cachedData = sessionStorage.getItem('imageCache');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (error) {
      logger.warn("Error al recuperar caché de imágenes:", error);
    }
    return {};
  };
  
  // Inicializamos el caché con datos almacenados en sessionStorage
  const imageCache: Record<string, string> = getImageCache();
  
  // Función para guardar en caché local persistente
  const saveToImageCache = (key: string, url: string) => {
    try {
      imageCache[key] = url;
      sessionStorage.setItem('imageCache', JSON.stringify(imageCache));
    } catch (error) {
      logger.warn("Error al guardar en caché de imágenes:", error);
    }
  };
  
  /**
   * Sistema MEJORADO de gestión de imágenes que evita COMPLETAMENTE generaciones innecesarias
   * @param key Clave única para identificar la imagen
   * @param prompt Prompt para generar la imagen solo si es absolutamente necesario
   * @param options Opciones adicionales para la gestión de imágenes
   * @returns URL de la imagen (prioriza datos guardados)
   */
  const getOrGenerateImage = async (key: string, prompt: string, options?: {
    negativePrompt?: string,
    imageSize?: string,
    forceRegenerate?: boolean,
    category?: string
  }): Promise<string> => {
    try {
      logger.info(`SOLICITUD DE IMAGEN: ${key}`);
      
      // 1. PASO 1: Verificar caché LOCAL PERSISTENTE primero
      if (imageCache[key] && !options?.forceRegenerate) {
        logger.info(`✅ Imagen recuperada de caché persistente: ${key}`);
        return imageCache[key];
      }
      
      // 2. PASO 2: Verificar imágenes predefinidas para categorías
      if (options?.category) {
        const defaultCategoryImages: Record<string, string> = {
          "Marketing": "https://storage.googleapis.com/pai-images/ae9e7782ddee4a0b9a1d2f5374fc0167.jpeg",
          "Business": "https://storage.googleapis.com/pai-images/a0bb7f209be241cbbc4982a177f2d7d1.jpeg",
          "Production": "https://storage.googleapis.com/pai-images/fd0f6b4aff5d4469ab4afd39d0490253.jpeg",
          "Branding": "https://storage.googleapis.com/pai-images/16c2b91fafb84224b52e7bb0e13e4fe4.jpeg",
          "Distribution": "https://storage.googleapis.com/pai-images/8e9a835ef5404252b5ff5eba50d04aec.jpeg",
          "default": "https://storage.googleapis.com/pai-images/ae9e7782ddee4a0b9a1d2f5374fc0167.jpeg"
        };
        
        // Usar la imagen predefinida para esta categoría
        if (key.includes('category_') || key.includes('course_')) {
          const categoryImage = defaultCategoryImages[options.category] || defaultCategoryImages.default;
          logger.info(`🖼️ Usando imagen predefinida para categoría (${options.category}): ${key}`);
          
          // Guardar en caché persistente
          saveToImageCache(key, categoryImage);
          
          // Intentar guardar en Firestore (sin bloquear)
          try {
            await setDoc(doc(db, imagesCacheCollection, key), {
              key,
              prompt,
              imageUrl: categoryImage,
              timestamp: Timestamp.now(),
              category: options.category,
              source: 'predefined'
            });
          } catch (error: any) {
            logger.warn(`⚠️ No se pudo guardar en Firestore: ${error.message || "Error desconocido"}`);
          }
          
          return categoryImage;
        }
      }
      
      // 3. PASO 3: Verificar la existencia en Firestore como último recurso
      try {
        const cachedDoc = await getDoc(doc(db, imagesCacheCollection, key));
        
        if (cachedDoc.exists() && !options?.forceRegenerate) {
          const data = cachedDoc.data();
          if (data.imageUrl && !data.imageUrl.includes('unsplash.com')) {
            logger.info(`✅ Imagen recuperada de Firestore: ${key}`);
            // Guardamos en caché persistente
            saveToImageCache(key, data.imageUrl);
            return data.imageUrl;
          }
        }
      } catch (error: any) {
        logger.info(`⚠️ No se pudo verificar en Firestore: ${error.message || "Error desconocido"}`);
      }
      
      // 4. PASO 4: No generamos nuevas imágenes, usamos placeholders definitivos
      logger.info(`⚠️ No se encontró imagen para ${key}, usando placeholder permanente`);
      const placeholderUrl = `https://placehold.co/800x800/1A1A2E/FFFFFF?text=${encodeURIComponent(key.replace(/_/g, ' '))}`;
      
      // Guardar en caché persistente
      saveToImageCache(key, placeholderUrl);
      
      return placeholderUrl;
    } catch (error: any) {
      logger.error(`❌ Error crítico en sistema de imágenes: ${error.message || "Error desconocido"}`);
      const fallbackUrl = `https://placehold.co/800x800/1A1A2E/FFFFFF?text=Error`;
      return fallbackUrl;
    }
  };
  
  // Función para regenerar las imágenes de categorías
  const regenerateCategoryImages = async () => {
    try {
      toast({
        title: "Cargando imágenes de categorías",
        description: "Obteniendo o generando imágenes para las categorías principales..."
      });
      
      const levels = ['Beginner', 'Intermediate', 'Advanced'];
      const newImages: Record<string, string> = { ...levelImages };
      
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const prompt = `professional photorealistic ${level.toLowerCase()} music studio setup for education, modern design, high quality equipment, ${level === 'Beginner' ? 'simple setup' : level === 'Intermediate' ? 'medium complexity' : 'professional advanced setup'}`;
        
        try {
          // Clave única para esta imagen en el caché
          const cacheKey = `category_${level}`;
          
          // Obtener o generar la imagen
          const imageUrl = await getOrGenerateImage(cacheKey, prompt, {
            imageSize: "landscape_16_9",
            // Solo forzar regeneración si se solicita explícitamente
            forceRegenerate: false
          });
          
          // Actualizar estado local
          newImages[level] = imageUrl;
          
          // Notificar progreso
          toast({
            title: "Progreso",
            description: `Imagen para categoría ${level} lista (${i+1}/${levels.length})`
          });
        } catch (error) {
          logger.error(`Error procesando imagen para categoría ${level}:`, error);
        }
      }
      
      // Actualizar el estado con todas las imágenes juntas
      // Hay que asegurarse de que todas las propiedades Beginner, Intermediate y Advanced existan
      setLevelImages({
        Beginner: newImages.Beginner || levelImages.Beginner,
        Intermediate: newImages.Intermediate || levelImages.Intermediate,
        Advanced: newImages.Advanced || levelImages.Advanced
      });
      
      toast({
        title: "Éxito",
        description: "Imágenes de categorías cargadas correctamente"
      });
    } catch (error) {
      logger.error("Error procesando imágenes de categorías:", error);
      toast({
        title: "Error",
        description: "Error al procesar imágenes de categorías",
        variant: "destructive"
      });
    }
  };

  // Firebase imports are already handled at the top of the file

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      // Verificar si el usuario es administrador (convoycubano@gmail.com)
      if (user && user.email === "convoycubano@gmail.com") {
        setIsAdmin(true);
        logger.info("Usuario administrador autenticado");
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Función auxiliar para precargar imágenes
  const preloadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    });
  };

  // Efecto para cargar imágenes de categorías desde Firestore y asegurar su carga completa
  useEffect(() => {
    const loadImagesFromFirestore = async () => {
      try {
        logger.info("Verificando y precargando imágenes de categorías...");
        const levels = ['Beginner', 'Intermediate', 'Advanced'];
        let needsUpdate = false;
        const newImages: Record<string, string> = { ...levelImages };
        
        // NUEVO: Precargar las imágenes predefinidas para asegurar su disponibilidad
        const imagesToPreload = [
          levelImages.Beginner,
          levelImages.Intermediate,
          levelImages.Advanced
        ];
        
        try {
          // Precargar imágenes en paralelo
          await Promise.all(imagesToPreload.map(url => preloadImage(url)));
          logger.info("✅ Todas las imágenes predefinidas han sido precargadas correctamente");
          
          // Guardar en caché para uso futuro
          saveToImageCache('category_Beginner', levelImages.Beginner);
          saveToImageCache('category_Intermediate', levelImages.Intermediate);
          saveToImageCache('category_Advanced', levelImages.Advanced);
          
          // Guardar en Firestore en segundo plano (sin esperar)
          levels.forEach(level => {
            const cacheKey = `category_${level}`;
            setDoc(doc(db, imagesCacheCollection, cacheKey), {
              key: cacheKey,
              prompt: `Level ${level}`,
              imageUrl: levelImages[level as keyof LevelImages],
              timestamp: Timestamp.now(),
              category: level,
              source: 'predefined'
            }).catch(err => logger.warn(`No se pudo guardar imagen en Firestore: ${err.message}`));
          });
        } catch (preloadError) {
          logger.warn("⚠️ Error al precargar algunas imágenes:", preloadError);
          needsUpdate = true;
        }
        
        // Actualizar el estado con las imágenes cargadas (aunque sean las mismas)
        setLevelImages({
          Beginner: levelImages.Beginner,
          Intermediate: levelImages.Intermediate,
          Advanced: levelImages.Advanced
        });
      } catch (error) {
        logger.error("Error en el proceso de carga de imágenes:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar algunas imágenes. Usando versiones predeterminadas."
        });
      }
    };
    
    loadImagesFromFirestore();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesRef = collection(db, 'courses');
        const q = query(coursesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const coursesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          };
        }) as Course[];
        setCourses(coursesData);
        
        // Después de cargar los cursos, procesamos las imágenes utilizando nuestro sistema de caché
        // para evitar regeneraciones innecesarias que consuman tokens de API
        const coursesToProcess = coursesData.filter(course => {
          // Verificamos si la URL contiene 'unsplash.com' o si no es una imagen generada por fal-ai
          return course.thumbnail?.includes('unsplash.com') || 
                 (course.thumbnail && !course.thumbnail.includes('fal-ai'));
        });
        
        if (coursesToProcess.length > 0) {
          logger.info(`Detectados ${coursesToProcess.length} cursos con imágenes que necesitan procesamiento. Verificando caché...`);
          
          // Indicador visual para el usuario
          toast({
            title: "Procesando Imágenes",
            description: `Verificando y procesando ${coursesToProcess.length} imágenes de cursos...`,
            duration: 5000
          });
          
          // Procesamos los cursos uno por uno para evitar sobrecargar la API
          // y asegurarnos de usar el caché correctamente
          for (let i = 0; i < coursesToProcess.length; i++) {
            const course = coursesToProcess[i];
            
            try {
              // Clave única para el caché - incluimos título y categoría para identificación única
              const cacheKey = `course_${course.id}_${course.title.substring(0, 20).replace(/\s+/g, '_').toLowerCase()}`;
              
              // Prompt específico para este curso
              const imagePrompt = `professional ${course.level.toLowerCase()} level ${course.category.toLowerCase()} music education course cover titled "${course.title}", modern minimalist design, high quality, cinematic lighting, course thumbnail image`;
              
              logger.info(`Procesando imagen para curso: ${course.title} (${i+1}/${coursesToProcess.length})`);
              
              // Obtener imagen del caché o generar nueva si es necesario
              const imageUrl = await getOrGenerateImage(cacheKey, imagePrompt, {
                negativePrompt: "low quality, blurry, distorted, unrealistic, watermark, text, words, deformed, amateurish, unprofessional",
                imageSize: "square", // Usamos "square" que es el valor soportado por FAL.ai
                // No forzamos regeneración para ahorrar tokens
                forceRegenerate: false
              });
              
              // Solo actualizamos en Firestore si la URL es diferente a la actual
              // y no es una URL de placeholder (para casos donde fal-ai falló)
              if (imageUrl !== course.thumbnail && !imageUrl.includes('placehold.co')) {
                logger.info(`Actualizando imagen para curso: ${course.title}`);
                
                // Guardar en Firestore
                const courseRef = doc(db, 'courses', course.id);
                await updateDoc(courseRef, { thumbnail: imageUrl });
                
                // Actualizar localmente
                setCourses(prev => prev.map(c => 
                  c.id === course.id ? { ...c, thumbnail: imageUrl } : c
                ));
                
                // Notificar al usuario
                if ((i+1) % 3 === 0 || i === coursesToProcess.length - 1) {
                  toast({
                    title: "Progreso",
                    description: `Procesado ${i+1} de ${coursesToProcess.length} imágenes`,
                    duration: 2000
                  });
                }
              } else {
                logger.info(`La imagen para ${course.title} ya está actualizada o se usó un placeholder`);
              }
            } catch (error) {
              logger.error(`Error procesando imagen para curso ${course.title}:`, error);
            }
          }
          
          // Notificación de finalización
          toast({
            title: "Procesamiento Completado",
            description: `Se han verificado ${coursesToProcess.length} imágenes de cursos`,
            duration: 5000
          });
        }
      } catch (error) {
        logger.error('Error fetching courses:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los cursos",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [toast, levelImages]);

  const generateRandomCourseData = () => {
    return {
      rating: Number((Math.random() * (5 - 3.5) + 3.5).toFixed(1)),
      totalReviews: Math.floor(Math.random() * (1000 - 50 + 1)) + 50,
      enrolledStudents: Math.floor(Math.random() * (5000 - 100 + 1)) + 100,
    };
  };

  const handleCreateCourse = async () => {
    logger.info("Authentication status:", isAuthenticated ? "Authenticated" : "Not authenticated");
    logger.info("Admin status:", isAdmin ? "Admin" : "Not admin");
    
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear un curso",
        variant: "destructive"
      });
      return;
    }
    
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo el administrador (convoycubano@gmail.com) puede crear cursos",
        variant: "destructive"
      });
      return;
    }

    if (!newCourse.title || !newCourse.description || !newCourse.category || !newCourse.level) {
      toast({
        title: "Error",
        description: "Please complete all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      logger.info("Starting course creation process...");

      // Crear un prompt específico para la generación de la imagen
      const imagePrompt = `professional ${newCourse.level.toLowerCase()} level ${newCourse.category.toLowerCase()} music education course cover titled "${newCourse.title}", modern minimalist design, high quality, cinematic lighting, course thumbnail image for music industry education`;
      logger.info("Obteniendo imagen para el nuevo curso:", newCourse.title);
      
      // Crear una clave única para este curso en la base de datos
      // Usamos un ID temporal ya que aún no tenemos el ID real del curso
      const tempId = Date.now().toString();
      const cacheKey = `course_temp_${tempId}_${newCourse.title.substring(0, 20).replace(/\s+/g, '_').toLowerCase()}`;
      
      // Usar nuestro sistema optimizado de imágenes que prioriza la base de datos
      let thumbnailUrl = await getOrGenerateImage(cacheKey, imagePrompt, {
        negativePrompt: "low quality, blurry, distorted, unrealistic, watermark, text, words, deformed, amateurish, unprofessional", 
        imageSize: "square", // Usamos el formato correcto para FAL.ai
        category: newCourse.category, // Incluimos la categoría para reutilización
        forceRegenerate: false // No forzamos regeneración para ahorrar tokens
      });
      
      // Si obtenemos un placeholder, usamos una imagen predefinida según la categoría
      if (thumbnailUrl.includes('placehold.co')) {
        logger.info("Usando imagen predefinida para el curso por categoría");
        
        // Mapa de imágenes predefinidas por categoría
        const defaultCategoryImages: Record<string, string> = {
          "Marketing": "https://storage.googleapis.com/pai-images/ae9e7782ddee4a0b9a1d2f5374fc0167.jpeg",
          "Business": "https://storage.googleapis.com/pai-images/a0bb7f209be241cbbc4982a177f2d7d1.jpeg",
          "Production": "https://storage.googleapis.com/pai-images/fd0f6b4aff5d4469ab4afd39d0490253.jpeg",
          "Branding": "https://storage.googleapis.com/pai-images/16c2b91fafb84224b52e7bb0e13e4fe4.jpeg",
          "Distribution": "https://storage.googleapis.com/pai-images/8e9a835ef5404252b5ff5eba50d04aec.jpeg",
          "default": "https://storage.googleapis.com/pai-images/ae9e7782ddee4a0b9a1d2f5374fc0167.jpeg"
        };
        
        // Si tenemos una imagen predefinida para esta categoría, la usamos
        const categoryImage = defaultCategoryImages[newCourse.category] || defaultCategoryImages.default;
        thumbnailUrl = categoryImage;
        logger.info("🔄 Usando imagen predefinida para categoría:", newCourse.category);
        
        // Guardamos esta asociación en la caché local
        imageCache[cacheKey] = thumbnailUrl;
      }

      const prompt = `Generate a professional music course with these characteristics:
        - Title: "${newCourse.title}"
        - Description: "${newCourse.description}"
        - Level: ${newCourse.level}
        - Category: ${newCourse.category}

        The course should be detailed and practical, focused on the current music industry.
        Create a comprehensive course with clear structure, practical lessons, and actionable content.`;

      logger.info("Calling generateCourseContent with prompt:", prompt.substring(0, 100) + "...");
      toast({
        title: "Creating course",
        description: "Generating course content with AI... This might take a moment."
      });
      
      const courseContent = await generateCourseContent(prompt);
      logger.info("Course content generated successfully:", typeof courseContent, Object.keys(courseContent));
      
      if (!courseContent || !courseContent.curriculum || !Array.isArray(courseContent.curriculum)) {
        throw new Error("Invalid course content structure received from AI. Please try again.");
      }
      
      logger.info(`Generated curriculum with ${courseContent.curriculum.length} lessons`);
      const randomData = generateRandomCourseData();

      const courseData = {
        ...newCourse,
        content: courseContent,
        thumbnail: thumbnailUrl,
        lessons: courseContent.curriculum.length,
        duration: `${Math.ceil(courseContent.curriculum.length / 2)} weeks`,
        ...randomData,
        createdAt: Timestamp.now(),
        createdBy: auth.currentUser?.uid || ""
      };

      const courseRef = await addDoc(collection(db, 'courses'), courseData);

      setCourses(prev => [{
        id: courseRef.id,
        ...courseData,
        createdAt: new Date()
      } as Course, ...prev]);

      toast({
        title: "Success",
        description: "Course created successfully"
      });

      setIsCreatingCourse(false);
      setNewCourse({
        title: "",
        description: "",
        price: 0,
        category: "",
        level: "Beginner"
      });
    } catch (error: any) {
      logger.error('Error creating course:', error);
      toast({
        title: "Error creating course",
        description: error.message || "Failed to create course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sampleCourses = [
    {
      title: "Music Marketing Mastery",
      description: "Learn advanced digital marketing strategies specifically tailored for musicians and music industry professionals. From social media optimization to email campaigns, discover how to effectively promote your music in the digital age.",
      category: "Marketing",
      level: "Intermediate",
      price: 199
    },
    {
      title: "Music Business Essentials",
      description: "Master the fundamentals of the music business. Learn about copyright law, royalties, music licensing, and how to navigate contracts. Essential knowledge for any music professional.",
      category: "Business",
      level: "Beginner",
      price: 249
    },
    {
      title: "Advanced Music Production & Engineering",
      description: "Deep dive into professional music production techniques. From advanced mixing and mastering to studio workflow optimization, take your production skills to the next level.",
      category: "Production",
      level: "Advanced",
      price: 299
    },
    {
      title: "Artist Brand Development",
      description: "Learn how to build and maintain a strong artist brand. Cover everything from visual identity to social media presence, and create a compelling artist narrative that resonates with your audience.",
      category: "Branding",
      level: "Intermediate",
      price: 179
    },
    {
      title: "Digital Music Distribution Mastery",
      description: "Master the digital distribution landscape. Learn about streaming platforms, playlist pitching, release strategies, and how to maximize your music's reach in the digital age.",
      category: "Distribution",
      level: "Beginner",
      price: 149
    }
  ];

  const createSampleCourses = async () => {
    logger.info("Authentication status for sample courses:", isAuthenticated ? "Authenticated" : "Not authenticated");
    logger.info("Admin status for sample courses:", isAdmin ? "Admin" : "Not admin");
    
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear cursos",
        variant: "destructive"
      });
      return;
    }
    
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo el administrador (convoycubano@gmail.com) puede crear cursos de ejemplo",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    let createdCount = 0;

    try {
      logger.info("Starting sample courses creation process...");
      
      for (const course of sampleCourses) {
        logger.info(`Creating sample course: ${course.title}`);
        
        // Crear un prompt más específico para la imagen de curso de muestra
        const imagePrompt = `professional ${course.level.toLowerCase()} level ${course.category.toLowerCase()} music education course cover titled "${course.title}", modern minimalist design, high quality, cinematic lighting, course thumbnail image for music industry education`;
        logger.info("Generating image with fal-ai for sample course:", course.title);
        
        // Usar nuestro sistema mejorado para la generación de imágenes
        const cacheKey = `course_sample_${Date.now()}_${course.title.substring(0, 20).replace(/\s+/g, '_').toLowerCase()}`;
        
        // Usamos imágenes predefinidas según la categoría para evitar generaciones innecesarias
        const defaultCategoryImages: Record<string, string> = {
          "Marketing": "https://storage.googleapis.com/pai-images/ae9e7782ddee4a0b9a1d2f5374fc0167.jpeg",
          "Business": "https://storage.googleapis.com/pai-images/a0bb7f209be241cbbc4982a177f2d7d1.jpeg",
          "Production": "https://storage.googleapis.com/pai-images/fd0f6b4aff5d4469ab4afd39d0490253.jpeg",
          "Branding": "https://storage.googleapis.com/pai-images/16c2b91fafb84224b52e7bb0e13e4fe4.jpeg",
          "Distribution": "https://storage.googleapis.com/pai-images/8e9a835ef5404252b5ff5eba50d04aec.jpeg",
          "default": "https://storage.googleapis.com/pai-images/ae9e7782ddee4a0b9a1d2f5374fc0167.jpeg"
        };
        
        // Usamos directamente la imagen predefinida por categoría
        let thumbnailUrl = defaultCategoryImages[course.category] || defaultCategoryImages.default;
        logger.info(`Using predefined image for sample course "${course.title}" (${course.category})`);
        
        // Guardamos en caché local para futuras referencias
        imageCache[cacheKey] = thumbnailUrl;

        const prompt = `Generate a professional music course with these characteristics:
          - Title: "${course.title}"
          - Description: "${course.description}"
          - Level: ${course.level}
          - Category: ${course.category}

          The course should be detailed and practical, focused on the current music industry. 
          Include specific actionable steps and real-world examples.
          Create a comprehensive curriculum with clear structure and practical lessons.`;

        logger.info("Calling generateCourseContent with prompt:", prompt.substring(0, 100) + "...");
        toast({
          title: "Creating course sample",
          description: `Generating content for "${course.title}"... This might take a moment.`
        });
        
        const courseContent = await generateCourseContent(prompt);
        logger.info("Course content generated successfully:", typeof courseContent, Object.keys(courseContent));
        
        if (!courseContent || !courseContent.curriculum || !Array.isArray(courseContent.curriculum)) {
          logger.error("Invalid content structure:", courseContent);
          throw new Error(`Invalid course content structure for "${course.title}". Please try again.`);
        }
        
        logger.info(`Generated curriculum with ${courseContent.curriculum.length} lessons`);
        const randomData = generateRandomCourseData();

        const courseData = {
          ...course,
          content: courseContent,
          thumbnail: thumbnailUrl,
          lessons: courseContent.curriculum.length,
          duration: `${Math.ceil(courseContent.curriculum.length / 2)} weeks`,
          ...randomData,
          createdAt: Timestamp.now(),
          createdBy: auth.currentUser?.uid || ""
        };

        const courseRef = await addDoc(collection(db, 'courses'), courseData);

        setCourses(prev => [{
          id: courseRef.id,
          ...courseData,
          createdAt: new Date()
        } as Course, ...prev]);

        createdCount++;

        toast({
          title: "Progress",
          description: `Created course ${createdCount}/5: ${course.title}`
        });
      }

      toast({
        title: "Success",
        description: `Created ${createdCount} new courses successfully`
      });
    } catch (error: any) {
      logger.error('Error creating sample courses:', error);
      toast({
        title: "Error creating courses",
        description: error.message || "Failed to create sample courses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Función para eliminar un curso (solo para administrador)
  const handleDeleteCourse = async (courseId: string) => {
    // Verificar si el usuario es administrador
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo el administrador (convoycubano@gmail.com) puede eliminar cursos",
        variant: "destructive"
      });
      return;
    }

    try {
      // Confirmar con el usuario antes de eliminar
      if (!confirm("¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.")) {
        return;
      }

      // Eliminar el curso de Firestore
      const courseRef = doc(db, 'courses', courseId);
      await deleteDoc(courseRef);

      // Actualizar el estado local eliminando el curso
      setCourses(prev => prev.filter(course => course.id !== courseId));

      toast({
        title: "Éxito",
        description: "Curso eliminado correctamente",
      });
    } catch (error: any) {
      logger.error('Error eliminando curso:', error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el curso. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleExtendCourse = async () => {
    if (!selectedCourse) {
      toast({
        title: "Error",
        description: "No se ha seleccionado ningún curso para extender",
        variant: "destructive"
      });
      return;
    }

    setIsExtendingCourse(true);

    try {
      logger.info("Iniciando extensión de curso:", selectedCourse.title);
      toast({
        title: "Generando contenido adicional",
        description: `Ampliando el curso "${selectedCourse.title}" con nuevo contenido...`
      });

      // Using extendCourseContent function imported at the top of file

      // Generar contenido adicional para el curso
      const additionalContent = await extendCourseContent(
        selectedCourse.id,
        selectedCourse.title,
        selectedCourse.description,
        selectedCourse.content
      );

      logger.info("Contenido adicional generado:", additionalContent);

      // Si el curso ya tiene contenido adicional, agregamos al existente
      const existingAdditionalContent = selectedCourse.additionalContent || [];
      
      // Actualizar el curso en Firestore
      const courseRef = doc(db, 'courses', selectedCourse.id);
      await updateDoc(courseRef, {
        additionalContent: [...existingAdditionalContent, additionalContent],
        lastUpdated: Timestamp.now()
      });

      // Actualizar el curso en el estado local
      setCourses(prev => prev.map(course => 
        course.id === selectedCourse.id 
          ? { 
              ...course, 
              additionalContent: [...(course.additionalContent || []), additionalContent],
              lastUpdated: new Date()
            } 
          : course
      ));

      toast({
        title: "¡Éxito!",
        description: `Se ha ampliado el curso "${selectedCourse.title}" con nuevo contenido`
      });

      setShowExtendDialog(false);
    } catch (error: any) {
      logger.error('Error al extender el curso:', error);
      toast({
        title: "Error",
        description: error.message || "Error al generar contenido adicional. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsExtendingCourse(false);
    }
  };

  const handleEnrollCourse = async (course: Course) => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para inscribirte en un curso",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      logger.info('Enrolling in course:', course);

      // Obtener token del usuario autenticado
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        throw new Error("No se pudo obtener el token de autenticación");
      }
      
      // Usar el ID del curso como priceId temporal para inscripción
      // En un sistema real, esto sería un ID de producto de Stripe registrado
      const priceId = `course_${course.id}`;
      
      await createCheckoutSession(token, priceId);
      toast({
        title: "Success",
        description: `Successfully enrolled in ${course.title}`
      });
    } catch (error: any) {
      logger.error('Error enrolling in course:', error);
      toast({
        title: "Error",
        description: error.message || "Error al inscribirse en el curso. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Estado para controlar si las imágenes críticas están cargadas
  const [criticalAssetsLoaded, setCriticalAssetsLoaded] = useState(false);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-orange-950/20">
      <Header />
      
      {/* Componente de precarga invisible para asegurar que todas las imágenes críticas estén disponibles */}
      {/* Solo renderizamos el componente de precarga cuando es estrictamente necesario */}
      {!criticalAssetsLoaded && (
        <ImagePreloader 
          urls={criticalImageUrls}
          timeout={5000} // Reducimos el tiempo de espera para evitar bloqueos
          onComplete={(success, failure) => {
            logger.info(`✅ Precarga de imágenes críticas completada. Éxito: ${success}, Fallos: ${failure}`);
            setCriticalAssetsLoaded(true);
            if (failure > 0) {
              toast({
                title: "Aviso",
                description: "Algunas imágenes pueden tardar en cargar correctamente. Los recursos críticos están siendo procesados.",
                duration: 5000
              });
            }
          }}
        />
      )}

      <main className="container mx-auto px-4 py-8 pt-20">
        {/* Dialog para extender un curso */}
        <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Extend Course</DialogTitle>
              <DialogDescription>
                Generate additional content for "{selectedCourse?.title}". This will add new lessons, resources, and advanced topics to the existing course.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-4">
              <p className="text-sm text-gray-400">
                Artificial intelligence will be used to generate additional complementary content for the current course. The new content will include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
                <li>5 additional lessons with objectives and practical applications</li>
                <li>Recommended resources to deepen your understanding</li>
                <li>Advanced topics related to the course content</li>
              </ul>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleExtendCourse} 
                disabled={isExtendingCourse}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isExtendingCourse ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating content...
                  </>
                ) : (
                  "Generate Additional Content"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Encabezado mejorado con gradientes e imagen de fondo */}
        <div className="relative rounded-2xl overflow-hidden mb-12">
          {/* Imagen de fondo */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://storage.googleapis.com/pai-images/a0bb7f209be241cbbc4982a177f2d7d1.jpeg" 
              alt="Music studio background" 
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
          </div>
          
          {/* Contenido principal */}
          <div className="relative z-10 py-10 px-6 md:py-16 md:px-10">
            {/* Elementos decorativos */}
            <div className="absolute -left-8 -top-8 w-32 h-32 bg-gradient-to-br from-orange-600/30 to-purple-600/30 rounded-full blur-3xl"></div>
            <div className="absolute right-10 bottom-10 w-40 h-40 bg-gradient-to-tl from-blue-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
            
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-orange-500">
                Music Industry Education
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mb-6 leading-relaxed">
                Master the business of music with our expert-led courses. From production techniques to marketing strategies,
                our comprehensive curriculum will help you succeed in the music industry.
              </p>
              
              {/* Único botón para generar muestras */}
              <Button 
                onClick={createSampleCourses} 
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-6 py-6 rounded-xl text-lg shadow-lg hover:shadow-orange-500/20 transition-all duration-300 mt-4"
                disabled={isGenerating || isRegeneratingImages}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Generating courses...
                  </>
                ) : (
                  <><PlusCircle className="mr-3 h-5 w-5" />Explore Our Sample Courses</>
                )}
              </Button>
            </div>
          </div>
        </div>
            
        <Dialog>
          <DialogTrigger asChild>
            <span className="hidden">Hidden create course button</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new course. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">Course Title</label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="Enter course title"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Enter course description"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="price" className="text-sm font-medium">Price (USD)</label>
                <Input
                  id="price"
                  type="number"
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({ ...newCourse, price: Number(e.target.value) })}
                  placeholder="Enter price"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="category" className="text-sm font-medium">Category</label>
                <Input
                  id="category"
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                  placeholder="Enter category"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="level" className="text-sm font-medium">Level</label>
                <select
                  id="level"
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value as "Beginner" | "Intermediate" | "Advanced" })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateCourse} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Course...
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modern section with background video - Mobile optimized */}
        {showCategoryCarousel && (
          <div className="w-full mb-10 md:mb-16 relative px-4 md:px-0">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 md:mb-8 relative z-20 text-center md:text-left">
              Explore Music <span className="text-orange-500">Education Levels</span>
            </h2>
            
            {/* Background video with overlay - Visible only on tablets and desktop */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden rounded-2xl hidden md:block">
              <div className="absolute inset-0 bg-black/60 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
              <video 
                className="w-full h-full object-cover"
                autoPlay 
                muted 
                loop 
                playsInline
                preload="auto"
              >
                <source src="/assets/Standard_Mode_Generated_Video (9).mp4" type="video/mp4" />
              </video>
            </div>
            
            {/* Static background for mobile */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden rounded-2xl block md:hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-orange-950/20 z-10" />
            </div>
            
            {/* Modern cards with hover effect - Responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 relative z-20 p-2 md:p-4">
              {/* Beginner */}
              <div className="bg-gradient-to-br from-black/80 to-orange-950/40 backdrop-blur-sm rounded-xl overflow-hidden border border-orange-900/30 shadow-xl transform transition-all duration-300 hover:scale-102 md:hover:scale-105 hover:shadow-orange-500/20 group">
                <div className="p-4 md:p-6 relative">
                  <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-orange-500/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8"></div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 group-hover:text-orange-400 transition-colors">Beginner</h3>
                  <p className="text-gray-300 text-sm md:text-base mb-4 md:mb-6">Start your music career journey with foundational knowledge and essential skills.</p>
                  <button className="w-full md:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors text-sm md:text-base">Get Started</button>
                </div>
              </div>
              
              {/* Intermediate */}
              <div className="bg-gradient-to-br from-black/80 to-orange-900/40 backdrop-blur-sm rounded-xl overflow-hidden border border-orange-800/30 shadow-xl transform transition-all duration-300 hover:scale-102 md:hover:scale-105 hover:shadow-orange-500/20 group">
                <div className="p-4 md:p-6 relative">
                  <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-orange-500/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8"></div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 group-hover:text-orange-400 transition-colors">Intermediate</h3>
                  <p className="text-gray-300 text-sm md:text-base mb-4 md:mb-6">Enhance your existing skills and expand your musical horizons with advanced techniques.</p>
                  <button className="w-full md:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors text-sm md:text-base">Level Up</button>
                </div>
              </div>
              
              {/* Advanced */}
              <div className="bg-gradient-to-br from-black/80 to-orange-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-orange-700/30 shadow-xl transform transition-all duration-300 hover:scale-102 md:hover:scale-105 hover:shadow-orange-500/20 group md:col-span-2 lg:col-span-1 md:col-start-1 md:col-end-3 lg:col-start-auto lg:col-end-auto">
                <div className="p-4 md:p-6 relative">
                  <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-orange-500/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8"></div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 group-hover:text-orange-400 transition-colors">Advanced</h3>
                  <p className="text-gray-300 text-sm md:text-base mb-4 md:mb-6">Master advanced industry techniques and prepare for professional music career success.</p>
                  <button className="w-full md:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors text-sm md:text-base">Master Now</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Courses - Mobile optimized */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 px-2 md:px-0">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onHoverStart={() => setHoveredCourse(course.id)}
              onHoverEnd={() => setHoveredCourse(null)}
            >
              <Card className="overflow-hidden bg-black/50 backdrop-blur-sm border-orange-500/10 hover:border-orange-500/30 transition-all group">
                <div className="aspect-video relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-full">
                    <span className="text-xs md:text-sm font-medium text-white">{course.level}</span>
                  </div>

                  {/* Play button visible on mobile without hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex justify-center items-center p-4 md:hidden">
                    <div className="rounded-full bg-orange-500/80 p-2 cursor-pointer hover:bg-orange-600 transition-colors">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Only show this overlay on desktop where hover works */}
                  <AnimatePresence>
                    {hoveredCourse === course.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/75 hidden md:flex flex-col justify-center items-center p-4 space-y-3"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="rounded-full bg-orange-500 p-3 cursor-pointer hover:bg-orange-600 transition-colors"
                        >
                          <Play className="h-8 w-8 text-white" />
                        </motion.div>
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 20, opacity: 0 }}
                          className="text-center"
                        >
                          <p className="text-white font-medium mb-2">Preview Course</p>
                          <p className="text-gray-300 text-sm">Watch introduction video</p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex items-center gap-1 md:gap-2 text-orange-500 text-xs md:text-sm mb-2">
                    <Clock className="h-3 w-3 md:h-4 md:w-4" />
                    <span>{course.duration}</span>
                    <span>•</span>
                    <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
                    <span>{course.lessons} lessons</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-gray-400 text-sm md:text-base mb-3 md:mb-4 line-clamp-2">{course.description}</p>

                  <div className="flex flex-wrap items-center justify-between mb-3 md:mb-4 gap-2">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Award className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                      <span className="text-xs md:text-sm text-gray-400">Certificate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                      <span className="text-xs md:text-sm text-gray-400">{course.enrolledStudents} enrolled</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Star className="h-3 w-3 md:h-4 md:w-4 text-orange-500 fill-orange-500" />
                      <span className="font-medium text-white text-sm md:text-base">
                        {typeof course.rating === 'number'
                          ? course.rating.toFixed(1)
                          : parseFloat(String(course.rating)).toFixed(1)}
                      </span>
                      <span className="text-gray-400 text-xs md:text-sm">({course.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                      <span className="font-medium text-white text-sm md:text-base">${course.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Responsive buttons - Simple on mobile, complete on desktop */}
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <Link href={`/course/${course.id}`} className="w-full">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 group text-xs md:text-sm px-2 md:px-4">
                        <span className="whitespace-nowrap">View Course</span>
                        <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-xs md:text-sm px-2 md:px-4"
                      onClick={() => handleEnrollCourse(course)}
                    >
                      <span className="whitespace-nowrap">Enroll Now</span>
                      <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                  
                  {/* Desktop only - Admin controls */}
                  <div className="flex mt-3 gap-2">
                    <Button 
                      className="flex-1 bg-orange-700 hover:bg-orange-800 text-xs md:text-sm"
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowExtendDialog(true);
                      }}
                    >
                      <span className="whitespace-nowrap">Extend Course</span>
                      <PlusCircle className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
                    </Button>
                    
                    {/* Delete button - Only visible to admin */}
                    {isAdmin && (
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-xs md:text-sm px-2"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="ml-1 whitespace-nowrap hidden md:inline">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <div className="my-16 border-t border-gray-800 pt-16">
          <MasterclassSection />
        </div>
      </main>
    </div>
  );
}