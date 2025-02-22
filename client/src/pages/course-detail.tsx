import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/header";
import { Loader2, CheckCircle2, Lock, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { auth, db } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import * as fal from "@fal-ai/serverless-client";

interface CourseProgress {
  completedLessons: string[];
  lastAccessedAt: Date;
  currentLesson: number;
  generatedImages: Record<string, string>;
}

interface Course {
  id: string;
  title: string;
  description: string;
  content: {
    curriculum: Array<{
      title: string;
      description: string;
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
    generatedImages: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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
            const progressData = progressSnap.data() as CourseProgress;
            setProgress({
              ...progressData,
              lastAccessedAt: new Date(progressData.lastAccessedAt)
            });
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
      const result = await fal.subscribe("fal-ai/flux-pro", {
        input: {
          prompt: `Professional educational illustration for music industry lesson about ${lessonTitle}: ${lessonDescription}`,
          model_id: "flux-pro",
          width: 768,
          height: 512,
          scheduler: "dpmpp",
          num_inference_steps: 40,
          guidance_scale: 7.5,
        },
      });

      if (result && 'images' in result && result.images && result.images[0] && result.images[0].url) {
        const imageUrl = result.images[0].url;

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
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const markLessonComplete = async (lessonIndex: number) => {
    if (!auth.currentUser || !course) return;

    const lessonTitle = course.content.curriculum[lessonIndex].title;
    const newProgress = {
      ...progress,
      completedLessons: [...progress.completedLessons, lessonTitle],
      currentLesson: Math.max(progress.currentLesson, lessonIndex + 1),
      lastAccessedAt: new Date()
    };

    try {
      const progressRef = doc(db, 'course_progress', `${auth.currentUser.uid}_${courseId}`);
      await updateDoc(progressRef, newProgress);
      setProgress(newProgress);

      toast({
        title: "Success",
        description: "Lesson marked as complete"
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
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
          <div className="flex items-center gap-4 mb-6">
            <Progress value={progressPercentage} className="w-full" />
            <span className="text-white">{Math.round(progressPercentage)}%</span>
          </div>
        </div>

        <div className="grid gap-6">
          {course.content.curriculum.map((lesson, index) => {
            const isCompleted = progress.completedLessons.includes(lesson.title);
            const isLocked = index > progress.currentLesson;
            const hasImage = progress.generatedImages[lesson.title];

            return (
              <motion.div
                key={lesson.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-black/50 backdrop-blur-sm border-orange-500/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {index + 1}. {lesson.title}
                      </h3>
                      <p className="text-gray-400">{lesson.description}</p>
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : isLocked ? (
                      <Lock className="h-6 w-6 text-gray-500" />
                    ) : null}
                  </div>

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
                    {!isLocked && !hasImage && (
                      <Button
                        onClick={() => generateLessonImage(lesson.title, lesson.description)}
                        disabled={isGeneratingImage}
                        variant="outline"
                      >
                        {isGeneratingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Generate Illustration
                          </>
                        )}
                      </Button>
                    )}

                    {!isLocked && !isCompleted && (
                      <Button
                        onClick={() => markLessonComplete(index)}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Complete Lesson
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