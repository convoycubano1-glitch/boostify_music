import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "../components/layout/header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CourseCard } from "../components/education/course-card";
import { CreateCourseDialog } from "../components/education/create-course-dialog";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  fetchAllCourses, 
  fetchUserCourses, 
  enrollCourse, 
  updateCourseFullContent,
  saveCourses,
  type CourseData
} from "@/lib/firestore-courses";
import { 
  BookOpen, Search, Sparkles, Filter, 
  GraduationCap, Award, Zap
} from "lucide-react";
import { auth } from "../firebase";

export default function EducationPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [allCourses, setAllCourses] = useState<CourseData[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coursesInitialized, setCoursesInitialized] = useState(false);

  // Load courses from Firestore
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        const courses = await fetchAllCourses();
        
        // Si no hay cursos, generar los 20 automáticamente
        if (courses.length === 0) {
          console.log('📚 No courses found. Generating 20 AI courses...');
          const response = await apiRequest('/api/education/generate-20-courses', {
            method: 'POST'
          });
          
          if (response.success && response.courses) {
            // Guardar en Firestore
            await saveCourses(response.courses);
            setAllCourses(response.courses);
            toast({
              title: '🎉 Courses Generated!',
              description: `${response.count} AI-powered courses have been created and are ready to explore.`
            });
          }
        } else {
          setAllCourses(courses);
        }
        
        // Cargar cursos del usuario si está autenticado
        if (auth.currentUser) {
          const userCourses = await fetchUserCourses(auth.currentUser.uid);
          setMyCourses(userCourses);
        }
        
        setCoursesInitialized(true);
      } catch (error: any) {
        console.error('Error loading courses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load courses',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Enroll mutation
  const enrollMutation = useMutation(
    async (courseId: string) => {
      if (!auth.currentUser) {
        throw new Error('Must be logged in to enroll');
      }
      
      const success = await enrollCourse(auth.currentUser.uid, courseId);
      
      if (!success) {
        throw new Error('Failed to enroll in course');
      }
      
      return courseId;
    },
    {
      onSuccess: (courseId) => {
        toast({
          title: '🎉 Enrolled!',
          description: 'You have been enrolled in the course. Content will be generated as you progress.'
        });
        
        // Refresh user courses
        if (auth.currentUser) {
          fetchUserCourses(auth.currentUser.uid).then(setMyCourses);
        }
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to enroll in course',
          variant: 'destructive'
        });
      }
    }
  );

  // Generate full content on purchase mutation
  const purchaseMutation = useMutation(
    async (courseId: string) => {
      if (!auth.currentUser) {
        throw new Error('Must be logged in to purchase');
      }

      const course = allCourses.find(c => c.id === courseId);
      if (!course) throw new Error('Course not found');

      // Generate full course content
      const response = await apiRequest('/api/education/generate-full-content', {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          courseTitle: course.title,
          level: course.level
        })
      });

      if (response.success) {
        // Update Firestore with full content
        await updateCourseFullContent(
          auth.currentUser.uid,
          courseId,
          response.content
        );
        return response.content;
      }
      
      throw new Error('Failed to generate content');
    },
    {
      onSuccess: () => {
        toast({
          title: '✨ Content Generated!',
          description: 'Full course content has been generated. Start learning now!'
        });
        
        // Refresh courses
        if (auth.currentUser) {
          fetchUserCourses(auth.currentUser.uid).then(setMyCourses);
        }
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to generate course content',
          variant: 'destructive'
        });
      }
    }
  );

  const filteredCourses = allCourses.filter((course: any) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || course.level.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-orange-500/10 border-b">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Music Education Academy</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-500 to-primary">
              Master Your Craft
            </h1>
            
            <p className="text-xl text-muted-foreground">
              Learn from 20+ AI-generated courses with adaptive content.
              Preview content is free for everyone, full curriculum unlocks upon enrollment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => setCreateDialogOpen(true)}
                data-testid="button-create-course"
              >
                <Sparkles className="w-5 h-5" />
                Create AI Course
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <GraduationCap className="w-5 h-5" />
                Browse Academy
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search courses..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-courses"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course: CourseData) => (
                  <CourseCard 
                    key={course.id} 
                    course={{
                      id: parseInt(course.id || '0'),
                      title: course.title,
                      description: course.description,
                      category: 'Music',
                      level: course.level,
                      lessonsCount: course.preview?.length || 2,
                      duration: `${Math.round(course.estimatedHours)}h`,
                      thumbnail: course.thumbnail,
                      price: course.price || '0.00',
                      isAIGenerated: true,
                      generationStatus: null,
                      rating: '4.8',
                      totalReviews: 150
                    }}
                    onEnroll={() => enrollMutation.mutate(course.id!)}
                    onPurchase={() => purchaseMutation.mutate(course.id!)}
                    isEnrolled={myCourses.some(c => c.id === course.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* My Learning Journey */}
        {myCourses && myCourses.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">My Learning Journey</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourses.map((course: any) => (
                <CourseCard 
                  key={course.id} 
                  course={{
                    id: parseInt(course.id || '0'),
                    title: course.title,
                    description: course.description,
                    category: 'Music',
                    level: course.level,
                    lessonsCount: course.preview?.length || 2,
                    duration: `${Math.round(course.estimatedHours)}h`,
                    thumbnail: course.thumbnail,
                    price: course.price || '0.00',
                    isAIGenerated: true,
                    generationStatus: null,
                    rating: '4.8',
                    totalReviews: 150
                  }}
                  enrolled={true}
                  progress={course.progress || 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateCourseDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
