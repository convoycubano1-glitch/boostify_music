import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "../components/layout/header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CourseCard } from "../components/education/course-card";
import { CreateCourseDialog } from "../components/education/create-course-dialog";
import { 
  BookOpen, Search, Sparkles, TrendingUp, Filter, 
  GraduationCap, Award
} from "lucide-react";

export default function EducationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: allCourses, isLoading } = useQuery({
    queryKey: ["/api/education/courses"],
  });

  const { data: myCourses } = useQuery({
    queryKey: ["/api/education/my-courses"],
  });

  const filteredCourses = allCourses?.filter((course: any) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || course.level.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-orange-500/10 border-b">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Music Education</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-500 to-primary">
              Master Your Craft
            </h1>
            
            <p className="text-xl text-muted-foreground">
              Learn from AI-generated courses that adapt to your progress.
              Content is created dynamically as you advance through lessons.
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
                Browse Courses
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
                  Try adjusting your search or create a new course
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course: any) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

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
                  course={course} 
                  enrolled={true}
                  progress={course.progress}
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
