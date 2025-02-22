import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generateCourseContent } from "@/lib/api/openrouter";
import { Music2, BookOpen, Star, DollarSign, Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  instructor: string;
  rating: number;
  totalReviews: number;
  thumbnail: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  lessons: number;
}

const predefinedCourses: Course[] = [
  {
    id: "1",
    title: "Music Business Fundamentals",
    description: "Learn the essentials of the music industry, from copyright law to revenue streams.",
    price: 199,
    instructor: "John Smith",
    rating: 4.8,
    totalReviews: 245,
    thumbnail: "/assets/courses/music-business.jpg",
    category: "Business",
    level: "Beginner",
    duration: "12 weeks",
    lessons: 24
  },
  {
    id: "2",
    title: "Digital Music Marketing Mastery",
    description: "Master social media, content strategy, and digital promotion for musicians.",
    price: 249,
    instructor: "Sarah Johnson",
    rating: 4.9,
    totalReviews: 189,
    thumbnail: "/assets/courses/digital-marketing.jpg",
    category: "Marketing",
    level: "Intermediate",
    duration: "8 weeks",
    lessons: 16
  },
  {
    id: "3",
    title: "Music Production with DAWs",
    description: "Learn professional music production techniques using popular DAWs.",
    price: 299,
    instructor: "Mike Davis",
    rating: 4.7,
    totalReviews: 312,
    thumbnail: "/assets/courses/production.jpg",
    category: "Production",
    level: "Beginner",
    duration: "10 weeks",
    lessons: 20
  },
  {
    id: "4",
    title: "Advanced Songwriting Techniques",
    description: "Take your songwriting to the next level with advanced composition methods.",
    price: 179,
    instructor: "Emma Wilson",
    rating: 4.9,
    totalReviews: 156,
    thumbnail: "/assets/courses/songwriting.jpg",
    category: "Songwriting",
    level: "Advanced",
    duration: "6 weeks",
    lessons: 12
  },
  {
    id: "5",
    title: "Music Distribution & Streaming",
    description: "Understanding digital distribution and maximizing streaming revenue.",
    price: 149,
    instructor: "Alex Thompson",
    rating: 4.6,
    totalReviews: 178,
    thumbnail: "/assets/courses/distribution.jpg",
    category: "Business",
    level: "Intermediate",
    duration: "4 weeks",
    lessons: 8
  },
  {
    id: "6",
    title: "Building Your Artist Brand",
    description: "Create a strong, authentic brand identity for your music career.",
    price: 199,
    instructor: "Lisa Chen",
    rating: 4.8,
    totalReviews: 203,
    thumbnail: "/assets/courses/branding.jpg",
    category: "Marketing",
    level: "Beginner",
    duration: "6 weeks",
    lessons: 12
  },
  {
    id: "7",
    title: "Music Publishing 101",
    description: "Essential knowledge about music publishing and royalties.",
    price: 229,
    instructor: "David Brown",
    rating: 4.7,
    totalReviews: 167,
    thumbnail: "/assets/courses/publishing.jpg",
    category: "Business",
    level: "Beginner",
    duration: "8 weeks",
    lessons: 16
  },
  {
    id: "8",
    title: "Live Performance Mastery",
    description: "Perfect your live performance skills and stage presence.",
    price: 279,
    instructor: "Maria Garcia",
    rating: 4.9,
    totalReviews: 234,
    thumbnail: "/assets/courses/performance.jpg",
    category: "Performance",
    level: "Intermediate",
    duration: "8 weeks",
    lessons: 16
  },
  {
    id: "9",
    title: "Music Video Production",
    description: "Learn to create professional music videos on any budget.",
    price: 349,
    instructor: "James Wilson",
    rating: 4.8,
    totalReviews: 145,
    thumbnail: "/assets/courses/video-production.jpg",
    category: "Production",
    level: "Advanced",
    duration: "10 weeks",
    lessons: 20
  },
  {
    id: "10",
    title: "Networking in the Music Industry",
    description: "Build valuable connections and navigate the music business network.",
    price: 169,
    instructor: "Rachel Lee",
    rating: 4.7,
    totalReviews: 189,
    thumbnail: "/assets/courses/networking.jpg",
    category: "Business",
    level: "Intermediate",
    duration: "6 weeks",
    lessons: 12
  }
];

export default function EducationPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState(predefinedCourses);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    price: 0,
    category: "",
    level: "Beginner" as const
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.description || !newCourse.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      const prompt = `Create a detailed course outline for a music industry course titled "${newCourse.title}" with the following description: "${newCourse.description}". Include key learning objectives and main topics to be covered.`;
      
      const courseContent = await generateCourseContent(prompt);

      const createdCourse: Course = {
        id: (courses.length + 1).toString(),
        ...newCourse,
        instructor: "Your Name", // Would come from user profile
        rating: 0,
        totalReviews: 0,
        thumbnail: `/assets/courses/default-${newCourse.category.toLowerCase()}.jpg`,
        duration: "8 weeks",
        lessons: 16
      };

      setCourses([...courses, createdCourse]);
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Music Industry Education</h1>
            <p className="text-gray-400">Master the business of music with our expert-led courses</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden bg-black/50 backdrop-blur-sm border-orange-500/10">
                <div className="aspect-video relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-full">
                    <span className="text-sm font-medium text-white">{course.level}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-orange-500 text-sm mb-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.lessons} lessons</span>
                    <span>•</span>
                    <span>{course.duration}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                  <p className="text-gray-400 mb-4">{course.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                      <span className="font-medium text-white">{course.rating.toFixed(1)}</span>
                      <span className="text-gray-400">({course.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-white">${course.price}</span>
                    </div>
                  </div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Enroll Now
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
