import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generateCourseContent } from "@/lib/api/openrouter";
import { Music2, BookOpen, Star, DollarSign, Plus, Loader2, Clock, Users, Award, Play, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SelectCourse } from "@db/schema";

interface CourseFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
}

// Predefined courses as fallback
const predefinedCourses = [
  {
    id: 1,
    title: "Music Business Fundamentals",
    description: "Master the essentials of the music industry, from copyright law to revenue streams.",
    price: 199.99,
    category: "Business",
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop",
    rating: 4.8,
    totalReviews: 245,
    duration: "8 weeks",
    lessons: 16
  },
  {
    id: 2,
    title: "Digital Music Marketing",
    description: "Learn advanced social media strategies and digital promotion techniques for musicians.",
    price: 249.99,
    category: "Marketing",
    level: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1595491542937-3de00ac7e08a?w=800&auto=format&fit=crop",
    rating: 4.9,
    totalReviews: 189,
    duration: "6 weeks",
    lessons: 12
  },
  {
    id: 3,
    title: "Music Production Masterclass",
    description: "Learn professional music production techniques from industry experts.",
    price: 299.99,
    category: "Production",
    level: "Advanced",
    thumbnail: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800&auto=format&fit=crop",
    rating: 4.7,
    totalReviews: 312,
    duration: "10 weeks",
    lessons: 20
  }
];

export default function EducationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState<CourseFormData>({
    title: "",
    description: "",
    price: 0,
    category: "",
    level: "Beginner"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoveredCourse, setHoveredCourse] = useState<number | null>(null);

  const { data: courses = predefinedCourses, isLoading } = useQuery<SelectCourse[]>({
    queryKey: ["/api/courses"],
  });

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await apiRequest("POST", "/api/courses", courseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsCreatingCourse(false);
      setNewCourse({
        title: "",
        description: "",
        price: 0,
        category: "",
        level: "Beginner"
      });
      toast({
        title: "Success",
        description: "Course created successfully!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.description || !newCourse.price || !newCourse.category || !newCourse.level) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      console.log("Iniciando generación de curso:", newCourse);

      const prompt = `Crea un curso detallado de la industria musical titulado "${newCourse.title}" con la siguiente descripción: "${newCourse.description}". El curso debe ser del nivel ${newCourse.level} y estar en la categoría ${newCourse.category}.`;

      console.log("Enviando prompt a OpenRouter:", prompt);
      const courseContent = await generateCourseContent(prompt);
      console.log("Contenido del curso generado:", courseContent);

      const courseData = {
        ...newCourse,
        content: courseContent,
        thumbnail: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800&auto=format&fit=crop",
        lessons: courseContent.curriculum?.length || 12,
        duration: "8 weeks",
        rating: 0,
        totalReviews: 0
      };

      console.log("Creando nuevo curso con datos:", courseData);
      await createCourseMutation.mutateAsync(courseData);

      toast({
        title: "¡Éxito!",
        description: "Curso creado correctamente"
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
      console.error('Error al crear el curso:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el curso. Por favor intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
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
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Music Industry Education</h1>
            <p className="text-gray-400 max-w-2xl">
              Master the business of music with our expert-led courses. From production techniques to marketing strategies,
              our comprehensive curriculum will help you succeed in the music industry.
            </p>
          </div>

          <Dialog open={isCreatingCourse} onOpenChange={setIsCreatingCourse}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Course Title
                  </label>
                  <Input
                    id="title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="Enter course title"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="Enter course description"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="price" className="text-sm font-medium">
                    Price (USD)
                  </label>
                  <Input
                    id="price"
                    type="number"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: Number(e.target.value) })}
                    placeholder="Enter price"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <Input
                    id="category"
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    placeholder="Enter category"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="level" className="text-sm font-medium">
                    Level
                  </label>
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
              </div>
            </DialogContent>
          </Dialog>
        </div>

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

                  {/* Interactive Preview Overlay */}
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
                      <span className="text-sm text-gray-400">{course.totalReviews} enrolled</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                      <span className="font-medium text-white">{Number(course.rating).toFixed(1)}</span>
                      <span className="text-gray-400">({course.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-white">${Number(course.price).toFixed(2)}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-orange-500 hover:bg-orange-600 group">
                    <span>Enroll Now</span>
                    <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}