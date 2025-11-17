import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Header } from "../components/layout/header";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  BookOpen, Lock, CheckCircle2, PlayCircle, Clock, 
  Award, Sparkles, ChevronLeft, Loader2, GraduationCap 
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QuizDialog } from "../components/education/quiz-dialog";

export default function CourseDetailPage() {
  const [, params] = useRoute("/courses/:id");
  const courseId = params?.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ["/api/education/courses", courseId],
    enabled: !!courseId
  });

  const { data: enrollment } = useQuery({
    queryKey: ["/api/education/enrollment", courseId],
    enabled: !!courseId
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["/api/education/lessons", courseId],
    enabled: !!courseId
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["/api/education/progress", courseId],
    enabled: !!courseId && !!enrollment
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      return apiRequest({
        url: `/api/education/enroll/${courseId}`,
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "🎉 Successfully Enrolled!",
        description: "You can now start learning"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/education/enrollment", courseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/education/my-courses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return apiRequest({
        url: `/api/education/lessons/${lessonId}/complete`,
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/education/progress", courseId] });
      toast({
        title: "Lesson Completed! ✅",
        description: "Great progress! Keep learning."
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const courseData: any = course || {};
  
  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button onClick={() => navigate("/education")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  const progressData = (progress as any[]) || [];
  const lessonsData = (lessons as any[]) || [];
  
  const completedLessons = progressData.filter((p: any) => p.completed).length;
  const totalLessons = lessonsData.length;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const isLessonUnlocked = (lesson: any) => {
    if (!enrollment) return false;
    
    const lessonProgress = progressData.find((p: any) => p.lessonId === lesson.id);
    return lessonProgress?.isUnlocked || false;
  };

  const isLessonCompleted = (lessonId: number) => {
    return progressData.some((p: any) => p.lessonId === lessonId && p.completed);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="relative bg-gradient-to-br from-primary/10 via-background to-orange-500/10 border-b">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate("/education")}
            data-testid="button-back-to-courses"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{courseData.level}</Badge>
                    {courseData.isAIGenerated && (
                      <Badge variant="outline" className="gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Generated
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold mb-4">{courseData.title}</h1>
                  <p className="text-lg text-muted-foreground">{courseData.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{courseData.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>{courseData.category}</span>
                </div>
              </div>
            </div>

            <Card className="p-6 h-fit">
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {parseFloat(courseData.price || '0') === 0 ? 'Free' : `$${parseFloat(courseData.price).toFixed(2)}`}
                  </div>
                  {enrollment ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Enrolled</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-semibold">{progressPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                    </div>
                  ) : (
                    <Button 
                      className="w-full gap-2"
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isPending}
                      data-testid="button-enroll-course"
                    >
                      {enrollMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          Enroll Now
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="curriculum" className="space-y-6">
          <TabsList>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum" className="space-y-4">
            {lessonsData.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No lessons available yet. Content will be generated as you progress.
                </p>
              </Card>
            ) : (
              lessonsData.map((lesson: any, index: number) => {
                const unlocked = isLessonUnlocked(lesson);
                const completed = isLessonCompleted(lesson.id);

                return (
                  <Card 
                    key={lesson.id} 
                    className={`p-6 ${unlocked ? 'cursor-pointer hover:shadow-md' : 'opacity-60'} transition-all`}
                    onClick={() => unlocked && setSelectedLessonId(lesson.id)}
                    data-testid={`card-lesson-${lesson.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        completed ? 'bg-green-500 text-white' : 
                        unlocked ? 'bg-primary/10 text-primary' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {completed ? <CheckCircle2 className="w-5 h-5" /> :
                         unlocked ? <BookOpen className="w-5 h-5" /> :
                         <Lock className="w-5 h-5" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Lesson {lesson.orderIndex + 1}: {lesson.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {lesson.description}
                            </p>
                          </div>
                          {!unlocked && (
                            <Badge variant="secondary" className="gap-1">
                              <Lock className="w-3 h-3" />
                              Locked
                            </Badge>
                          )}
                        </div>

                        {lesson.unlockDate && !unlocked && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Unlocks: {new Date(lesson.unlockDate).toLocaleDateString()}
                          </p>
                        )}

                        {unlocked && !completed && (
                          <Button
                            size="sm"
                            className="mt-3 gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              completeLessonMutation.mutate(lesson.id);
                            }}
                            disabled={completeLessonMutation.isPending}
                            data-testid={`button-complete-lesson-${lesson.id}`}
                          >
                            Mark as Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="about">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">About This Course</h3>
              <p className="text-muted-foreground leading-relaxed">
                {courseData.description}
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">What you'll learn</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Comprehensive coverage of {courseData.category}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Progressive content delivery based on your advancement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Interactive quizzes to test your knowledge</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedLessonId && (
        <QuizDialog
          lessonId={selectedLessonId}
          courseId={courseId!}
          onClose={() => setSelectedLessonId(null)}
        />
      )}
    </div>
  );
}
