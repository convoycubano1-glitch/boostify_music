import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generateCourseContent, extendCourseContent, AdditionalCourseContent } from "@/lib/api/education-service";
import { Music2, BookOpen, Star, DollarSign, Plus, Loader2, Clock, Users, Award, Play, ChevronRight, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/firebase";
import { 
  collection, addDoc, getDocs, query, orderBy, Timestamp, doc, updateDoc,
  getDoc, setDoc 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getRelevantImage } from "@/lib/unsplash-service";
import { generateImageWithFal } from "@/lib/api/fal-ai";
import { createCourseEnrollmentSession } from "@/lib/api/stripe-service";
import MasterclassSection from "@/components/education/MasterclassSection";

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
  
  // Estado para las categorías de nivel con sus imágenes (defaults temporales)
  const [levelImages, setLevelImages] = useState({
    Beginner: "https://placehold.co/1200x800/2A2A2A/FFFFFF?text=Beginner%20Music%20Education",
    Intermediate: "https://placehold.co/1200x800/2A2A2A/FFFFFF?text=Intermediate%20Music%20Education", 
    Advanced: "https://placehold.co/1200x800/2A2A2A/FFFFFF?text=Advanced%20Music%20Education"
  });
  
  // Colección para el caché de imágenes generadas
  const imagesCacheCollection = "generated_images_cache";
  
  /**
   * Recupera una imagen del caché de Firestore o genera una nueva si no existe
   * @param key Clave única para identificar la imagen (ej: "category_Beginner")
   * @param prompt Prompt para generar la imagen si no está en caché
   * @param options Opciones adicionales para la generación
   * @returns URL de la imagen (desde caché o recién generada)
   */
  const getOrGenerateImage = async (key: string, prompt: string, options?: {
    negativePrompt?: string,
    imageSize?: string,
    forceRegenerate?: boolean
  }): Promise<string> => {
    try {
      // Primero verificamos si la imagen ya existe en el caché
      if (!options?.forceRegenerate) {
        const cacheRef = doc(db, imagesCacheCollection, key);
        const cacheDoc = await getDoc(cacheRef);
        
        if (cacheDoc.exists()) {
          const cachedData = cacheDoc.data();
          // Verificar que la URL es válida y no es de Unsplash
          if (cachedData.imageUrl && 
              !cachedData.imageUrl.includes('unsplash.com') && 
              !cachedData.imageUrl.includes('placeholder')) {
            console.log(`Imagen recuperada del caché para: ${key}`);
            return cachedData.imageUrl;
          }
        }
      }
      
      // Si no está en caché o se fuerza regeneración, intentamos generar con fal-ai
      console.log(`Generando nueva imagen para: ${key}`);
      console.log("Prompt:", prompt.substring(0, 50) + "...");
      
      // Intento de generación con FAL.AI
      try {
        const result = await generateImageWithFal({
          prompt,
          negativePrompt: options?.negativePrompt || "text, words, watermarks, logos, blurry, distorted, people, faces",
          imageSize: options?.imageSize || "landscape_16_9"
        });
        
        if (result.data?.images?.[0]) {
          // Procesar la URL de la imagen
          let imageUrl = result.data.images[0];
          if (typeof imageUrl === 'object' && imageUrl.url) {
            imageUrl = imageUrl.url;
          }
          
          // Guardar en caché
          const cacheRef = doc(db, imagesCacheCollection, key);
          await setDoc(cacheRef, {
            key,
            prompt,
            imageUrl,
            timestamp: Timestamp.now(),
            source: 'fal-ai'
          });
          
          console.log(`Imagen generada y guardada en caché: ${key}`);
          return imageUrl;
        } else {
          throw new Error("No image data in fal-ai response");
        }
      } catch (error) {
        console.error(`Error generando imagen con fal-ai para ${key}:`, error);
        
        // Si hay un error con FAL.ai, verificamos si hay una imagen en caché, aunque sea antigua
        const cacheRef = doc(db, imagesCacheCollection, key);
        const cacheDoc = await getDoc(cacheRef);
        
        if (cacheDoc.exists() && cacheDoc.data().imageUrl) {
          console.log(`Recuperando imagen existente en caché debido a error de generación: ${key}`);
          return cacheDoc.data().imageUrl;
        }
        
        // Si no hay nada en caché, usamos un placeholder basado en el nivel/categoría
        return `https://placehold.co/1200x800/2A2A2A/FFFFFF?text=${encodeURIComponent(key.replace('_', ' '))}`;
      }
    } catch (finalError) {
      console.error(`Error final en getOrGenerateImage para ${key}:`, finalError);
      return `https://placehold.co/1200x800/2A2A2A/FFFFFF?text=${encodeURIComponent(key)}`;
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
          console.error(`Error procesando imagen para categoría ${level}:`, error);
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
      console.error("Error procesando imágenes de categorías:", error);
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
    });

    return () => unsubscribe();
  }, []);

  // Efecto para generar automáticamente las imágenes de categorías
  useEffect(() => {
    // Regenera las imágenes de categorías solo si las URLs contienen "unsplash"
    const shouldRegenerateImages = Object.values(levelImages).some(url => 
      url.includes('unsplash.com') || !url.includes('fal-ai')
    );
    
    if (shouldRegenerateImages) {
      console.log("Regenerando imágenes de categorías automáticamente...");
      regenerateCategoryImages();
    }
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
          console.log(`Detectados ${coursesToProcess.length} cursos con imágenes que necesitan procesamiento. Verificando caché...`);
          
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
              
              console.log(`Procesando imagen para curso: ${course.title} (${i+1}/${coursesToProcess.length})`);
              
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
                console.log(`Actualizando imagen para curso: ${course.title}`);
                
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
                console.log(`La imagen para ${course.title} ya está actualizada o se usó un placeholder`);
              }
            } catch (error) {
              console.error(`Error procesando imagen para curso ${course.title}:`, error);
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
        console.error('Error fetching courses:', error);
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
    // Temporalmente desactivamos la comprobación de autenticación para permitir crear cursos
    // Solo con fines de prueba
    console.log("Authentication status:", isAuthenticated ? "Authenticated" : "Not authenticated");
    
    // if (!isAuthenticated) {
    //   toast({
    //     title: "Error",
    //     description: "You must be logged in to create a course",
    //     variant: "destructive"
    //   });
    //   return;
    // }

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
      
      console.log("Starting course creation process...");

      // Crear un prompt más específico y detallado para la generación de la imagen
      const imagePrompt = `professional ${newCourse.level.toLowerCase()} level ${newCourse.category.toLowerCase()} music education course cover titled "${newCourse.title}", modern minimalist design, high quality, cinematic lighting, course thumbnail image for music industry education`;
      console.log("Generating image with fal-ai:", imagePrompt);
      
      let thumbnailUrl = "";
      try {
        // Intentar generar con fal-ai con reintentos
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          attempts++;
          try {
            console.log(`Intento ${attempts} de generar imagen con fal-ai`);
            const result = await generateImageWithFal({
              prompt: imagePrompt,
              negativePrompt: "low quality, blurry, distorted, unrealistic, watermark, text, words, deformed, amateurish, unprofessional",
              imageSize: "square_1_1"
            });
            
            if (result.data?.images?.[0]) {
              // Asegurarnos de tener la URL de la imagen (el formato puede variar)
              let generatedImage = result.data.images[0];
              if (typeof generatedImage === 'object' && generatedImage.url) {
                thumbnailUrl = generatedImage.url;
              } else {
                thumbnailUrl = generatedImage;
              }
              console.log("Fal-ai image generated successfully:", thumbnailUrl.substring(0, 50) + "...");
              break; // Salir del bucle si se generó correctamente
            } else {
              throw new Error("No image data in fal-ai response");
            }
          } catch (error) {
            console.error(`Error en intento ${attempts}:`, error);
            if (attempts >= maxAttempts) {
              throw error; // Re-lanzar el error después del último intento
            }
            // Esperar un momento antes de reintentar (backoff exponencial)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
        
        if (!thumbnailUrl) {
          throw new Error("No se pudo generar la imagen después de múltiples intentos");
        }
      } catch (error) {
        console.error("Error generating with fal-ai, using alternative approach:", error);
        
        // Intentar con un prompt más simple como alternativa (sin usar Unsplash como fallback)
        try {
          const simplePrompt = `minimal music ${newCourse.category} course cover, clean design, abstract`;
          const result = await generateImageWithFal({
            prompt: simplePrompt,
            negativePrompt: "text, words, people, faces, blurry",
            imageSize: "square_1_1"
          });
          
          if (result.data?.images?.[0]) {
            let generatedImage = result.data.images[0];
            if (typeof generatedImage === 'object' && generatedImage.url) {
              thumbnailUrl = generatedImage.url;
            } else {
              thumbnailUrl = generatedImage;
            }
            console.log("Alternative fal-ai image generated:", thumbnailUrl.substring(0, 50) + "...");
          } else {
            // Si todo falla, creamos una URL de imagen estática con gradiente basada en la categoría
            const colors = {
              "Marketing": "from-orange-500 to-red-700",
              "Business": "from-blue-500 to-indigo-700",
              "Production": "from-green-500 to-emerald-700",
              "Branding": "from-purple-500 to-violet-700",
              "Distribution": "from-pink-500 to-rose-700",
              "default": "from-gray-700 to-slate-900"
            };
            
            // Esta es una URL de ejemplo que debería reemplazarse con una imagen real en producción
            const categoryColor = colors[newCourse.category as keyof typeof colors] || colors.default;
            thumbnailUrl = `https://placehold.co/600x600/1f1f1f/ffffff?text=${encodeURIComponent(newCourse.title)}&css=.bg{background:linear-gradient(135deg,${categoryColor});}`;
            
            console.log("Using placeholder image:", thumbnailUrl);
            
            toast({
              title: "Advertencia",
              description: "No se pudo generar una imagen personalizada. Se usará una imagen temporal.",
              variant: "destructive"
            });
          }
        } catch (finalError) {
          console.error("Todos los intentos de generación fallaron:", finalError);
          // URL de marcador de posición final si todo falla
          thumbnailUrl = `https://placehold.co/600x600/1f1f1f/ffffff?text=${encodeURIComponent(newCourse.title)}`;
        }
      }

      const prompt = `Generate a professional music course with these characteristics:
        - Title: "${newCourse.title}"
        - Description: "${newCourse.description}"
        - Level: ${newCourse.level}
        - Category: ${newCourse.category}

        The course should be detailed and practical, focused on the current music industry.
        Create a comprehensive course with clear structure, practical lessons, and actionable content.`;

      console.log("Calling generateCourseContent with prompt:", prompt.substring(0, 100) + "...");
      toast({
        title: "Creating course",
        description: "Generating course content with AI... This might take a moment."
      });
      
      const courseContent = await generateCourseContent(prompt);
      console.log("Course content generated successfully:", typeof courseContent, Object.keys(courseContent));
      
      if (!courseContent || !courseContent.curriculum || !Array.isArray(courseContent.curriculum)) {
        throw new Error("Invalid course content structure received from AI. Please try again.");
      }
      
      console.log(`Generated curriculum with ${courseContent.curriculum.length} lessons`);
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
      console.error('Error creating course:', error);
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
    // Temporalmente desactivamos la comprobación de autenticación para permitir crear cursos de muestra
    // Solo con fines de prueba
    console.log("Authentication status for sample courses:", isAuthenticated ? "Authenticated" : "Not authenticated");
    
    // if (!isAuthenticated) {
    //   toast({
    //     title: "Error",
    //     description: "You must be logged in to create courses",
    //     variant: "destructive"
    //   });
    //   return;
    // }

    setIsGenerating(true);
    let createdCount = 0;

    try {
      console.log("Starting sample courses creation process...");
      
      for (const course of sampleCourses) {
        console.log(`Creating sample course: ${course.title}`);
        
        // Crear un prompt más específico para la imagen de curso de muestra
        const imagePrompt = `professional ${course.level.toLowerCase()} level ${course.category.toLowerCase()} music education course cover titled "${course.title}", modern minimalist design, high quality, cinematic lighting, course thumbnail image for music industry education`;
        console.log("Generating image with fal-ai for sample course:", course.title);
        
        let thumbnailUrl = "";
        try {
          // Intentar generar con fal-ai con reintentos
          let attempts = 0;
          const maxAttempts = 2; // Menos intentos que para cursos normales para no ralentizar demasiado
          
          while (attempts < maxAttempts) {
            attempts++;
            try {
              console.log(`Sample course: Intento ${attempts} de generar imagen para "${course.title}"`);
              const result = await generateImageWithFal({
                prompt: imagePrompt,
                negativePrompt: "low quality, blurry, distorted, unrealistic, watermark, text, words, deformed, amateurish, unprofessional",
                imageSize: "square_1_1"
              });
              
              if (result.data?.images?.[0]) {
                // Asegurarnos de tener la URL de la imagen (el formato puede variar)
                let generatedImage = result.data.images[0];
                if (typeof generatedImage === 'object' && generatedImage.url) {
                  thumbnailUrl = generatedImage.url;
                } else {
                  thumbnailUrl = generatedImage;
                }
                console.log(`Fal-ai image generated successfully for sample course "${course.title}"`);
                break; // Salir del bucle si se generó correctamente
              } else {
                throw new Error("No image data in fal-ai response");
              }
            } catch (error) {
              console.error(`Error en intento ${attempts} para curso de muestra:`, error);
              if (attempts >= maxAttempts) {
                throw error; // Re-lanzar el error después del último intento
              }
              // Esperar un momento antes de reintentar
              await new Promise(resolve => setTimeout(resolve, 500 * attempts));
            }
          }
          
          if (!thumbnailUrl) {
            throw new Error("No se pudo generar la imagen después de múltiples intentos");
          }
        } catch (error) {
          console.error("Error generating with fal-ai for sample course, using alternative:", error);
          
          // Usar un enfoque alternativo - prompt más simple
          try {
            const simplePrompt = `minimal music ${course.category} course cover, clean design, abstract`;
            const result = await generateImageWithFal({
              prompt: simplePrompt,
              negativePrompt: "text, words, people, faces, blurry",
              imageSize: "square_1_1"
            });
            
            if (result.data?.images?.[0]) {
              let generatedImage = result.data.images[0];
              if (typeof generatedImage === 'object' && generatedImage.url) {
                thumbnailUrl = generatedImage.url;
              } else {
                thumbnailUrl = generatedImage;
              }
              console.log(`Alternative fal-ai image generated for sample course "${course.title}"`);
            } else {
              // Usar un color de fondo según la categoría para generar una imagen de placeholder
              const colors = {
                "Marketing": "from-orange-500 to-red-700",
                "Business": "from-blue-500 to-indigo-700",
                "Production": "from-green-500 to-emerald-700",
                "Branding": "from-purple-500 to-violet-700",
                "Distribution": "from-pink-500 to-rose-700",
                "default": "from-gray-700 to-slate-900"
              };
              
              const categoryColor = colors[course.category as keyof typeof colors] || colors.default;
              thumbnailUrl = `https://placehold.co/600x600/1f1f1f/ffffff?text=${encodeURIComponent(course.title)}&css=.bg{background:linear-gradient(135deg,${categoryColor});}`;
              
              console.log(`Using placeholder image for sample course "${course.title}"`);
            }
          } catch (finalError) {
            console.error(`All image generation attempts failed for "${course.title}":`, finalError);
            thumbnailUrl = `https://placehold.co/600x600/1f1f1f/ffffff?text=${encodeURIComponent(course.title)}`;
          }
        }

        const prompt = `Generate a professional music course with these characteristics:
          - Title: "${course.title}"
          - Description: "${course.description}"
          - Level: ${course.level}
          - Category: ${course.category}

          The course should be detailed and practical, focused on the current music industry. 
          Include specific actionable steps and real-world examples.
          Create a comprehensive curriculum with clear structure and practical lessons.`;

        console.log("Calling generateCourseContent with prompt:", prompt.substring(0, 100) + "...");
        toast({
          title: "Creating course sample",
          description: `Generating content for "${course.title}"... This might take a moment.`
        });
        
        const courseContent = await generateCourseContent(prompt);
        console.log("Course content generated successfully:", typeof courseContent, Object.keys(courseContent));
        
        if (!courseContent || !courseContent.curriculum || !Array.isArray(courseContent.curriculum)) {
          console.error("Invalid content structure:", courseContent);
          throw new Error(`Invalid course content structure for "${course.title}". Please try again.`);
        }
        
        console.log(`Generated curriculum with ${courseContent.curriculum.length} lessons`);
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
      console.error('Error creating sample courses:', error);
      toast({
        title: "Error creating courses",
        description: error.message || "Failed to create sample courses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
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
      console.log("Iniciando extensión de curso:", selectedCourse.title);
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

      console.log("Contenido adicional generado:", additionalContent);

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
      console.error('Error al extender el curso:', error);
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
      console.log('Enrolling in course:', course);

      await createCourseEnrollmentSession({
        courseId: course.id,
        title: course.title,
        price: course.price,
        thumbnail: course.thumbnail
      });
      toast({
        title: "Success",
        description: `Successfully enrolled in ${course.title}`
      });
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      toast({
        title: "Error",
        description: error.message || "Error al inscribirse en el curso. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      <main className="container mx-auto px-4 py-8 pt-20">
        {/* Dialog para extender un curso */}
        <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ampliar Curso</DialogTitle>
              <DialogDescription>
                Generar contenido adicional para el curso "{selectedCourse?.title}". Esto agregará nuevas lecciones, recursos y temas avanzados al curso existente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-4">
              <p className="text-sm text-gray-400">
                Se utilizará inteligencia artificial para generar contenido adicional complementario al curso actual. El nuevo contenido incluirá:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
                <li>5 lecciones adicionales con objetivos y aplicaciones prácticas</li>
                <li>Recursos recomendados para profundizar en los temas</li>
                <li>Temas avanzados relacionados con el contenido del curso</li>
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
                    Generando contenido...
                  </>
                ) : (
                  "Generar Contenido Adicional"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Encabezado y botones */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Music Industry Education</h1>
            <p className="text-gray-400 max-w-2xl">
              Master the business of music with our expert-led courses. From production techniques to marketing strategies,
              our comprehensive curriculum will help you succeed in the music industry.
            </p>
          </div>

          <div className="flex space-x-4">
            <Button 
              onClick={createSampleCourses} 
              className="bg-orange-700 hover:bg-orange-800"
              disabled={isGenerating || isRegeneratingImages}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando cursos...
                </>
              ) : (
                <>Generar cursos de muestra</>
              )}
            </Button>
            
            <Button
              onClick={async () => {
                setIsRegeneratingImages(true);
                setRegenerationProgress(0);
                
                try {
                  // Regenerar las imágenes para todos los cursos, independientemente de su origen
                  // Esto asegura que todas las portadas se generen con fal-ai
                  const coursesToUpdate = [...courses];
                  
                  if (coursesToUpdate.length === 0) {
                    toast({
                      title: "Información",
                      description: "Todos los cursos ya tienen imágenes generadas con fal-ai"
                    });
                    setIsRegeneratingImages(false);
                    return;
                  }
                  
                  toast({
                    title: "Regenerando imágenes",
                    description: `Generando ${coursesToUpdate.length} nuevas imágenes de cursos con fal-ai...`
                  });
                  
                  // Regenerar imágenes para cada curso
                  for (let i = 0; i < coursesToUpdate.length; i++) {
                    const course = coursesToUpdate[i];
                    console.log(`Regenerando imagen para curso: ${course.title}`);
                    
                    const imagePrompt = `professional photorealistic education ${course.title} ${course.category} music industry course cover, modern design, minimalist, high quality`;
                    
                    try {
                      // Generar nueva imagen con fal-ai
                      const result = await generateImageWithFal({
                        prompt: imagePrompt,
                        negativePrompt: "low quality, blurry, distorted, unrealistic, watermark, text, words, deformed",
                        imageSize: "square_1_1"
                      });
                      
                      if (result.data?.images?.[0]) {
                        // Asegurarnos de tener la URL de la imagen (el formato puede variar)
                        let newThumbnail = result.data.images[0];
                        if (typeof newThumbnail === 'object' && newThumbnail.url) {
                          newThumbnail = newThumbnail.url;
                        }
                        
                        console.log(`Imagen generada para ${course.title}:`, newThumbnail.substring(0, 50) + "...");
                        
                        // Actualizar en Firestore
                        const courseRef = doc(db, 'courses', course.id);
                        await updateDoc(courseRef, { thumbnail: newThumbnail });
                        
                        // Actualizar localmente
                        setCourses(prev => prev.map(c => 
                          c.id === course.id ? { ...c, thumbnail: newThumbnail } : c
                        ));
                        
                        console.log(`Imagen regenerada con éxito para: ${course.title}`);
                      } else {
                        throw new Error("No image data in fal-ai response");
                      }
                    } catch (error) {
                      console.error(`Error regenerando imagen para curso ${course.title}:`, error);
                    }
                    
                    // Actualizar progreso
                    const newProgress = Math.round(((i + 1) / coursesToUpdate.length) * 100);
                    setRegenerationProgress(newProgress);
                    
                    // Mostrar progreso cada 25%
                    if (newProgress % 25 === 0 || i === coursesToUpdate.length - 1) {
                      toast({
                        title: "Progreso",
                        description: `Regeneración de imágenes: ${newProgress}% completado`
                      });
                    }
                  }
                  
                  toast({
                    title: "Éxito",
                    description: `Se han regenerado ${coursesToUpdate.length} imágenes de cursos con fal-ai`
                  });
                } catch (error: any) {
                  console.error('Error regenerando imágenes:', error);
                  toast({
                    title: "Error",
                    description: error.message || "Error regenerando imágenes. Intente de nuevo.",
                    variant: "destructive"
                  });
                } finally {
                  setIsRegeneratingImages(false);
                  setRegenerationProgress(0);
                }
              }}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isGenerating || isRegeneratingImages}
            >
              {isRegeneratingImages ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerando imágenes... {regenerationProgress}%
                </>
              ) : (
                <>Regenerar imágenes con AI</>
              )}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </Button>
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
          </div>
        </div>

        {/* Carrusel de categorías con las imágenes regeneradas por AI */}
        {showCategoryCarousel && (
          <div className="w-full mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Explore by Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(levelImages).map(([level, imageUrl]) => (
                <div key={level} className="relative overflow-hidden rounded-lg group h-48 cursor-pointer">
                  <img 
                    src={imageUrl} 
                    alt={`${level} level courses`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{level}</h3>
                      <p className="text-gray-300 text-sm">
                        {level === 'Beginner' 
                          ? 'Start your music career journey'
                          : level === 'Intermediate' 
                            ? 'Enhance your existing skills'
                            : 'Master advanced industry techniques'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  />
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-full">
                    <span className="text-sm font-medium text-white">{course.level}</span>
                  </div>

                  <AnimatePresence>
                    {hoveredCourse === course.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/75 flex flex-col justify-center items-center p-4 space-y-3"
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

                <div className="p-6">
                  <div className="flex items-center gap-2 text-orange-500 text-sm mb-2">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                    <span>•</span>
                    <BookOpen className="h-4 w-4" />
                    <span>{course.lessons} lessons</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-gray-400 mb-4 line-clamp-2">{course.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-gray-400">Certificate Included</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-gray-400">{course.enrolledStudents} enrolled</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                      <span className="font-medium text-white">
                        {typeof course.rating === 'number'
                          ? course.rating.toFixed(1)
                          : parseFloat(String(course.rating)).toFixed(1)}
                      </span>
                      <span className="text-gray-400">({course.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-white">${course.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <Button 
                      className="flex-1 bg-orange-700 hover:bg-orange-800"
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowExtendDialog(true);
                      }}
                    >
                      <span>Ampliar Curso</span>
                      <PlusCircle className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  <div className="flex gap-4">
                    <Link href={`/course/${course.id}`}>
                      <Button className="flex-1 bg-orange-500 hover:bg-orange-600 group">
                        <span>View Course</span>
                        <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => handleEnrollCourse(course)}
                    >
                      <span>Enroll Now</span>
                      <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
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