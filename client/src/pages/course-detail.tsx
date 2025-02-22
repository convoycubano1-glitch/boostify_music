import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/header";
import { Loader2, CheckCircle2, Lock, ImageIcon, BookOpen, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { auth, db } from "@/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { getRelevantImage } from "@/lib/unsplash-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateLessonContent, type LessonContent } from "@/lib/course-content-generator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface CourseProgress {
  completedLessons: string[];
  lastAccessedAt: Date;
  currentLesson: number;
  generatedImages: Record<string, string>;
  timeSpent: number;
  startedAt: Date;
  lastCompletedAt?: Date;
  lessonContents: Record<string, LessonContent>;
}

interface Course {
  id: string;
  title: string;
  description: string;
  content: {
    curriculum: Array<{
      title: string;
      description: string;
      estimatedMinutes: number;
    }>;
  };
}

export default function CourseDetailPage() {
  const [location] = useLocation();
  const courseId = location.split('/').pop() || '';
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress>({
    completedLessons: [],
    lastAccessedAt: new Date(),
    currentLesson: 0,
    generatedImages: {},
    timeSpent: 0,
    startedAt: new Date(),
    lessonContents: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonContent | null>(null);

useEffect(() => {
    const fetchCourseAndProgress = async () => {
      try {
        if (!courseId) {
          toast({
            title: "Error",
            description: "Invalid course ID",
            variant: "destructive"
          });
          return;
        }

        // Fetch course details
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
          toast({
            title: "Error",
            description: "Course not found",
            variant: "destructive"
          });
          return;
        }

        const courseData = courseSnap.data() as Course;
        courseData.id = courseSnap.id;
        setCourse(courseData);

        // Fetch user's progress if authenticated
        if (auth.currentUser) {
          const progressRef = doc(db, 'course_progress', `${auth.currentUser.uid}_${courseId}`);
          const progressSnap = await getDoc(progressRef);

          if (progressSnap.exists()) {
            const progressData = progressSnap.data();
            setProgress({
              completedLessons: progressData.completedLessons || [],
              lastAccessedAt: new Date(progressData.lastAccessedAt),
              currentLesson: progressData.currentLesson || 0,
              generatedImages: progressData.generatedImages || {},
              timeSpent: progressData.timeSpent || 0,
              startedAt: new Date(progressData.startedAt),
              lastCompletedAt: progressData.lastCompletedAt ? new Date(progressData.lastCompletedAt) : undefined,
              lessonContents: progressData.lessonContents || {}
            });
          } else {
            // Initialize progress document if it doesn't exist
            const initialProgress: CourseProgress = {
              completedLessons: [],
              lastAccessedAt: new Date(),
              currentLesson: 0,
              generatedImages: {},
              timeSpent: 0,
              startedAt: new Date(),
              lessonContents: {}
            };
            await setDoc(progressRef, initialProgress);
            setProgress(initialProgress);
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast({
          title: "Error",
          description: "Failed to load course",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseAndProgress();
  }, [courseId, toast]);

  const generateLessonImage = async (lessonTitle: string, lessonDescription: string) => {
    if (progress.generatedImages[lessonTitle]) return;

    setIsGeneratingImage(true);
    try {
      const imageUrl = await getRelevantImage(`educational illustration ${lessonTitle} ${lessonDescription}`);

      // Update progress with new image
      const newProgress = {
        ...progress,
        generatedImages: {
          ...progress.generatedImages,
          [lessonTitle]: imageUrl
        }
      };

      // Save to Firestore
      if (auth.currentUser) {
        const progressRef = doc(db, 'course_progress', `${auth.currentUser.uid}_${courseId}`);
        await updateDoc(progressRef, {
          generatedImages: newProgress.generatedImages
        });
      }

      setProgress(newProgress);
      toast({
        title: "Success",
        description: "Lesson illustration generated successfully"
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate lesson illustration",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateLessonContentForUser = async (lessonTitle: string, lessonDescription: string) => {
    if (!lessonTitle || !lessonDescription) {
      console.error('Missing lesson title or description');
      return;
    }

    const currentLessonContents = progress.lessonContents || {};

    if (currentLessonContents[lessonTitle]) {
      setSelectedLesson(currentLessonContents[lessonTitle]);
      return;
    }

    setIsGeneratingContent(true);
    try {
      const content = await generateLessonContent(lessonTitle, lessonDescription);

      if (!content) {
        throw new Error('Failed to generate lesson content');
      }

      const newProgress = {
        ...progress,
        lessonContents: {
          ...currentLessonContents,
          [lessonTitle]: content
        }
      };

      // Save to Firestore
      if (auth.currentUser && courseId) {
        const progressRef = doc(db, 'course_progress', `${auth.currentUser.uid}_${courseId}`);
        await updateDoc(progressRef, {
          lessonContents: newProgress.lessonContents
        });
      }

      setProgress(newProgress);
      setSelectedLesson(content);

      toast({
        title: "Success",
        description: "Lesson content generated successfully"
      });
    } catch (error) {
      console.error('Error generating lesson content:', error);
      toast({
        title: "Error",
        description: "Failed to generate lesson content",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const markLessonComplete = async (lessonIndex: number) => {
    if (!auth.currentUser || !course) return;

    setIsSavingProgress(true);
    try {
      const lessonTitle = course.content.curriculum[lessonIndex].title;
      const now = new Date();
      const newProgress = {
        ...progress,
        completedLessons: [...progress.completedLessons, lessonTitle],
        currentLesson: Math.max(progress.currentLesson, lessonIndex + 1),
        lastAccessedAt: now,
        lastCompletedAt: now,
        timeSpent: progress.timeSpent + course.content.curriculum[lessonIndex].estimatedMinutes
      };

      const progressRef = doc(db, 'course_progress', `${auth.currentUser.uid}_${courseId}`);
      await updateDoc(progressRef, newProgress);
      setProgress(newProgress);

      toast({
        title: "Success",
        description: "Lesson completed successfully! Keep going!"
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update lesson progress",
        variant: "destructive"
      });
    } finally {
      setIsSavingProgress(false);
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

  if (!course) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20">
          <h1 className="text-2xl font-bold text-white">Course not found</h1>
        </div>
      </div>
    );
  }

  const progressPercentage = (progress.completedLessons.length / course.content.curriculum.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-orange-950/20">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">{course.title}</h1>
          <p className="text-gray-400 mb-4">{course.description}</p>

          <div className="bg-black/40 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="text-orange-500" />
                <div>
                  <p className="text-sm text-gray-400">Lessons</p>
                  <p className="text-lg font-semibold text-white">{course.content.curriculum.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-orange-500" />
                <div>
                  <p className="text-sm text-gray-400">Completed</p>
                  <p className="text-lg font-semibold text-white">{progress.completedLessons.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-orange-500" />
                <div>
                  <p className="text-sm text-gray-400">Time Spent</p>
                  <p className="text-lg font-semibold text-white">{progress.timeSpent} minutes</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Progress value={progressPercentage} className="w-full" />
              <span className="text-white font-medium">{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {course.content.curriculum.map((lesson, index) => {
            const isCompleted = progress.completedLessons.includes(lesson.title);
            const isLocked = index > progress.currentLesson;
            const hasImage = progress.generatedImages?.[lesson.title];
            const hasContent = progress.lessonContents?.[lesson.title];

            return (
              <motion.div
                key={lesson.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-6 backdrop-blur-sm border-orange-500/10 ${
                  isLocked ? 'bg-black/30' : isCompleted ? 'bg-black/50 border-green-500/20' : 'bg-black/50'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {index + 1}. {lesson.title}
                      </h3>
                      <p className="text-gray-400">{lesson.description}</p>
                      <p className="text-sm text-orange-500 mt-2">
                        Estimated time: {lesson.estimatedMinutes} minutes
                      </p>
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : isLocked ? (
                      <Lock className="h-6 w-6 text-gray-500" />
                    ) : null}
                  </div>

                  {hasContent && (
                    <Accordion type="single" collapsible className="mb-4">
                      <AccordionItem value="content">
                        <AccordionTrigger>View Lesson Content</AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-[400px] rounded-md border p-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-lg text-orange-500">Introduction</h4>
                                <p className="text-gray-300">{progress.lessonContents[lesson.title].content.introduction}</p>
                              </div>

                              <div>
                                <h4 className="font-semibold text-lg text-orange-500">Key Points</h4>
                                <ul className="list-disc list-inside space-y-2">
                                  {progress.lessonContents[lesson.title].content.keyPoints.map((point, i) => (
                                    <li key={i} className="text-gray-300">{point}</li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-semibold text-lg text-orange-500">Content</h4>
                                {progress.lessonContents[lesson.title].content.mainContent.map((section, i) => (
                                  <div key={i} className="mt-3">
                                    <h5 className="font-medium text-white">{section.subtitle}</h5>
                                    {section.paragraphs.map((paragraph, j) => (
                                      <p key={j} className="text-gray-300 mt-2">{paragraph}</p>
                                    ))}
                                  </div>
                                ))}
                              </div>

                              <div>
                                <h4 className="font-semibold text-lg text-orange-500">Practical Exercises</h4>
                                <ul className="list-decimal list-inside space-y-2">
                                  {progress.lessonContents[lesson.title].content.practicalExercises.map((exercise, i) => (
                                    <li key={i} className="text-gray-300">{exercise}</li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-semibold text-lg text-orange-500">Additional Resources</h4>
                                <ul className="list-disc list-inside space-y-2">
                                  {progress.lessonContents[lesson.title].content.additionalResources.map((resource, i) => (
                                    <li key={i} className="text-gray-300">{resource}</li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-semibold text-lg text-orange-500">Summary</h4>
                                <p className="text-gray-300">{progress.lessonContents[lesson.title].content.summary}</p>
                              </div>
                            </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {hasImage && (
                    <div className="mb-4">
                      <img
                        src={progress.generatedImages[lesson.title]}
                        alt={`Illustration for ${lesson.title}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex gap-4">
                    {!isLocked && !hasContent && (
                      <Button
                        onClick={() => generateLessonContentForUser(lesson.title, lesson.description)}
                        disabled={isGeneratingContent}
                        variant="outline"
                      >
                        {isGeneratingContent ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Content...
                          </>
                        ) : (
                          <>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Generate Lesson Content
                          </>
                        )}
                      </Button>
                    )}

                    {!isLocked && !isCompleted && (
                      <Button
                        onClick={() => markLessonComplete(index)}
                        className="bg-orange-500 hover:bg-orange-600"
                        disabled={isSavingProgress}
                      >
                        {isSavingProgress ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Complete Lesson'
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}