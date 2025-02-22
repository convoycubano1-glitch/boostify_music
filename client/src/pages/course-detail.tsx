import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/header";
import { Loader2, CheckCircle2, Lock, ImageIcon, BookOpen, Clock, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { auth, db } from "@/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { getRelevantImage } from "@/lib/unsplash-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateLessonContent, type LessonContent } from "@/lib/course-content-generator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface CourseProgress {
  completedLessons: string[];
  completedExams: string[];
  lastAccessedAt: Date;
  currentLesson: number;
  generatedImages: Record<string, string>;
  lessonImages: Record<string, string>;
  timeSpent: number;
  startedAt: Date;
  lastCompletedAt?: Date;
  lessonContents: Record<string, LessonContent>;
  examScores: Record<string, number>;
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
    completedExams: [],
    lastAccessedAt: new Date(),
    currentLesson: 0,
    generatedImages: {},
    lessonImages: {},
    timeSpent: 0,
    startedAt: new Date(),
    lessonContents: {},
    examScores: {}
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonContent | null>(null);
  const [showExam, setShowExam] = useState(false);
  const [selectedExamQuestion, setSelectedExamQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [examResult, setExamResult] = useState<{
    correct: boolean;
    explanation: string;
  } | null>(null);
  const [currentExamLesson, setCurrentExamLesson] = useState<string | null>(null);
  const [courseCoverImage, setCourseCoverImage] = useState<string | null>(null);

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

        const courseData = {
          id: courseSnap.id,
          ...courseSnap.data()
        } as Course;

        setCourse(courseData);

        if (auth.currentUser) {
          const progressRef = doc(db, 'course_progress', `${auth.currentUser.uid}_${courseId}`);
          const progressSnap = await getDoc(progressRef);

          if (progressSnap.exists()) {
            const progressData = progressSnap.data();
            setProgress({
              completedLessons: progressData.completedLessons || [],
              completedExams: progressData.completedExams || [],
              lastAccessedAt: new Date(progressData.lastAccessedAt),
              currentLesson: progressData.currentLesson || 0,
              generatedImages: progressData.generatedImages || {},
              lessonImages: progressData.lessonImages || {},
              timeSpent: progressData.timeSpent || 0,
              startedAt: new Date(progressData.startedAt),
              lastCompletedAt: progressData.lastCompletedAt ? new Date(progressData.lastCompletedAt) : undefined,
              lessonContents: progressData.lessonContents || {},
              examScores: progressData.examScores || {}
            });
          } else {
            await setDoc(progressRef, {
              completedLessons: [],
              completedExams: [],
              lastAccessedAt: new Date(),
              currentLesson: 0,
              generatedImages: {},
              lessonImages: {},
              timeSpent: 0,
              startedAt: new Date(),
              lessonContents: {},
              examScores: {}
            });
            setProgress({
              completedLessons: [],
              completedExams: [],
              lastAccessedAt: new Date(),
              currentLesson: 0,
              generatedImages: {},
              lessonImages: {},
              timeSpent: 0,
              startedAt: new Date(),
              lessonContents: {},
              examScores: {}
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

  const fetchCourseCoverImage = async () => {
    if (course?.title) {
      try {
        const imageUrl = await getRelevantImage(`professional education ${course.title} music industry course cover`);
        setCourseCoverImage(imageUrl);
      } catch (error) {
        console.error('Error fetching course cover image:', error);
      }
    }
  };

  useEffect(() => {
    fetchCourseCoverImage();
  }, [course?.title]);


  const generateLessonContentForUser = async (lessonTitle: string, lessonDescription: string) => {
    if (!lessonTitle || !lessonDescription) {
      toast({
        title: "Error",
        description: "Missing lesson information",
        variant: "destructive"
      });
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

      const newProgress = {
        ...progress,
        lessonContents: {
          ...currentLessonContents,
          [lessonTitle]: content
        }
      };

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
        description: "Failed to generate lesson content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const generateLessonImage = async (lessonTitle: string, lessonDescription: string) => {
    if (progress.generatedImages[lessonTitle]) return;

    setIsGeneratingImage(true);
    try {
      const imageUrl = await getRelevantImage(`educational illustration ${lessonTitle} ${lessonDescription}`);

      const newProgress = {
        ...progress,
        generatedImages: {
          ...progress.generatedImages,
          [lessonTitle]: imageUrl
        }
      };

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

  const markLessonComplete = async (lessonIndex: number) => {
    if (!auth.currentUser || !course) return;

    setIsSavingProgress(true);
    try {
      const lessonTitle = course.content.curriculum[lessonIndex].title;
      const now = new Date().toISOString();
      const newProgress = {
        ...progress,
        completedLessons: [...progress.completedLessons, lessonTitle],
        currentLesson: Math.max(progress.currentLesson, lessonIndex + 1),
        lastAccessedAt: now,
        lastCompletedAt: now,
        timeSpent: progress.timeSpent + course.content.curriculum[lessonIndex].estimatedMinutes
      };

      const progressRef = doc(db, 'course_progress', `${auth.currentUser.uid}_${courseId}`);
      await updateDoc(progressRef, {
        completedLessons: newProgress.completedLessons,
        currentLesson: newProgress.currentLesson,
        lastAccessedAt: now,
        lastCompletedAt: now,
        timeSpent: newProgress.timeSpent
      });

      setProgress({
        ...progress,
        ...newProgress,
        lastAccessedAt: new Date(now),
        lastCompletedAt: new Date(now)
      });

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

  const startExam = async (lessonTitle: string) => {
    try {
      if (!progress.lessonContents[lessonTitle]) {
        toast({
          title: "Error",
          description: "Please generate lesson content first",
          variant: "destructive"
        });
        return;
      }

      const examContent = progress.lessonContents[lessonTitle]?.content?.exam;
      console.log('Exam content:', examContent); // Para debugging

      if (!examContent || !Array.isArray(examContent) || examContent.length === 0) {
        console.error('Invalid exam content:', examContent);
        toast({
          title: "Error",
          description: "No exam questions available. Please try regenerating the lesson content.",
          variant: "destructive"
        });
        return;
      }

      setCurrentExamLesson(lessonTitle);
      setSelectedExamQuestion(0);
      setSelectedAnswer(null);
      setExamResult(null);
      setShowExam(true);
    } catch (error) {
      console.error('Error starting exam:', error);
      toast({
        title: "Error",
        description: "Failed to start exam. Please try again.",
        variant: "destructive"
      });
    }
  };

  const checkAnswer = async () => {
    if (!currentExamLesson || selectedAnswer === null) return;

    const currentLesson = progress.lessonContents[currentExamLesson];
    if (!currentLesson?.content.exam || !currentLesson.content.exam[selectedExamQuestion]) {
      toast({
        title: "Error",
        description: "Invalid exam question",
        variant: "destructive"
      });
      return;
    }

    const currentQuestion = currentLesson.content.exam[selectedExamQuestion];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    setExamResult({
      correct: isCorrect,
      explanation: currentQuestion.explanation
    });

    if (isCorrect && selectedExamQuestion === currentLesson.content.exam.length - 1) {
      try {
        const newProgress = {
          ...progress,
          completedExams: [...(progress.completedExams || []), currentExamLesson],
          examScores: {
            ...(progress.examScores || {}),
            [currentExamLesson]: 100
          }
        };

        if (auth.currentUser) {
          const progressRef = doc(db, 'course_progress', `${auth.currentUser.uid}_${courseId}`);
          await updateDoc(progressRef, {
            completedExams: newProgress.completedExams,
            examScores: newProgress.examScores
          });
        }

        setProgress(newProgress);
        toast({
          title: "Congratulations!",
          description: "You've completed the exam successfully!"
        });
      } catch (error) {
        console.error('Error updating progress:', error);
        toast({
          title: "Error",
          description: "Failed to save exam progress",
          variant: "destructive"
        });
      }
    }
  };

  const nextQuestion = () => {
    if (!currentExamLesson) return;
    const currentLesson = progress.lessonContents[currentExamLesson];
    if (selectedExamQuestion < currentLesson.content.exam.length - 1) {
      setSelectedExamQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setExamResult(null);
    } else {
      setShowExam(false);
      setCurrentExamLesson(null);
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


  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-orange-950/20">
      <Header />

      {/* Hero Section with Course Cover */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
        {courseCoverImage && (
          <div className="absolute inset-0">
            <img
              src={courseCoverImage}
              alt="Course Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
          </div>
        )}
        <div className="container mx-auto px-4 h-full flex items-center relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold text-white mb-4">{course?.title}</h1>
            <p className="text-xl text-gray-200 mb-6">{course?.description}</p>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2 bg-black/40 p-3 rounded-lg">
                <BookOpen className="text-orange-500" />
                <span className="text-white">{course?.content.curriculum.length} Lessons</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 p-3 rounded-lg">
                <Clock className="text-orange-500" />
                <span className="text-white">{progress.timeSpent} Minutes Spent</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 p-3 rounded-lg">
                <Trophy className="text-orange-500" />
                <span className="text-white">{progress.completedLessons.length} Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 -mt-16 relative z-20">
        {/* Progress Section */}
        <Card className="bg-black/40 backdrop-blur-sm border-orange-500/10 p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Course Progress</span>
              <span className="text-white font-medium">{Math.round((progress.completedLessons.length / (course?.content.curriculum.length || 1)) * 100)}%</span>
            </div>
            <Progress
              value={(progress.completedLessons.length / (course?.content.curriculum.length || 1)) * 100}
              className="h-2"
            />
          </div>
        </Card>

        {/* Lessons Grid */}
        <div className="grid gap-6">
          {course?.content.curriculum.map((lesson, index) => {
            const isCompleted = progress.completedLessons.includes(lesson.title);
            const isExamCompleted = progress.completedExams?.includes(lesson.title);
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
                <Card className={`overflow-hidden backdrop-blur-sm border-orange-500/10 ${
                  isLocked ? 'bg-black/30' : isCompleted ? 'bg-black/50 border-green-500/20' : 'bg-black/50'
                }`}>
                  {hasImage && (
                    <div className="w-full h-48">
                      <img
                        src={progress.generatedImages[lesson.title]}
                        alt={`Illustration for ${lesson.title}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {index + 1}. {lesson.title}
                        </h3>
                        <div className="text-gray-400">{lesson.description}</div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-orange-500">
                          <Clock className="h-4 w-4" />
                          <span>{lesson.estimatedMinutes} minutes</span>
                        </div>
                      </div>
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : isLocked ? (
                        <Lock className="h-6 w-6 text-gray-500" />
                      ) : null}
                    </div>

                    {hasContent && (
                      <div className="space-y-4">
                        <Accordion type="single" collapsible>
                          <AccordionItem value="content">
                            <AccordionTrigger className="text-white">View Lesson Content</AccordionTrigger>
                            <AccordionContent>
                              <ScrollArea className="h-[400px] rounded-md border border-orange-500/10 p-4">
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="font-semibold text-lg text-orange-500">Introduction</h4>
                                    <div className="text-gray-300 mt-2">{progress.lessonContents[lesson.title].content.introduction}</div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-lg text-orange-500">Key Points</h4>
                                    <ul className="list-disc list-inside space-y-2 mt-2">
                                      {progress.lessonContents[lesson.title].content.keyPoints.map((point, i) => (
                                        <li key={i} className="text-gray-300">{point}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  {progress.lessonContents[lesson.title].content.mainContent.map((section, i) => (
                                    <div key={i}>
                                      <h4 className="font-semibold text-lg text-orange-500">{section.subtitle}</h4>
                                      <div className="space-y-2 mt-2">
                                        {section.paragraphs.map((paragraph, j) => (
                                          <div key={j} className="text-gray-300">{paragraph}</div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}

                                  <div>
                                    <h4 className="font-semibold text-lg text-orange-500">Practical Exercises</h4>
                                    <ul className="list-decimal list-inside space-y-2 mt-2">
                                      {progress.lessonContents[lesson.title].content.practicalExercises.map((exercise, i) => (
                                        <li key={i} className="text-gray-300">{exercise}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-lg text-orange-500">Additional Resources</h4>
                                    <ul className="list-disc list-inside space-y-2 mt-2">
                                      {progress.lessonContents[lesson.title].content.additionalResources.map((resource, i) => (
                                        <li key={i} className="text-gray-300">{resource}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-lg text-orange-500">Summary</h4>
                                    <div className="text-gray-300 mt-2">{progress.lessonContents[lesson.title].content.summary}</div>
                                  </div>
                                </div>
                              </ScrollArea>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        {!isLocked && !isExamCompleted && (
                          <Button
                            onClick={() => startExam(lesson.title)}
                            className="w-full bg-orange-500 hover:bg-orange-600"
                            disabled={!hasContent}
                          >
                            <Trophy className="mr-2 h-4 w-4" />
                            Take Lesson Exam
                          </Button>
                        )}

                        {isExamCompleted && (
                          <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-lg">
                            <Trophy className="h-5 w-5" />
                            <span>Exam completed with score: {progress.examScores?.[lesson.title]}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4 mt-4">
                      {!isLocked && !hasContent && (
                        <Button
                          onClick={() => generateLessonContentForUser(lesson.title, lesson.description)}
                          disabled={isGeneratingContent}
                          variant="outline"
                          className="flex-1"
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
                          className="flex-1 bg-orange-500 hover:bg-orange-600"
                          disabled={isSavingProgress}
                        >
                          {isSavingProgress ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Complete Lesson
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>

      <Dialog open={showExam} onOpenChange={setShowExam}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Course Exam - {currentExamLesson}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {currentExamLesson &&
              progress.lessonContents[currentExamLesson]?.content?.exam &&
              progress.lessonContents[currentExamLesson]?.content?.exam[selectedExamQuestion] && (
                <>
                  <div className="text-lg font-semibold mb-4">
                    Question {selectedExamQuestion + 1} of {progress.lessonContents[currentExamLesson].content.exam.length}
                  </div>
                  <div className="mb-4">
                    {progress.lessonContents[currentExamLesson].content.exam[selectedExamQuestion].question}
                  </div>
                  <div className="space-y-4">
                    <RadioGroup
                      value={selectedAnswer?.toString()}
                      onValueChange={(value) => setSelectedAnswer(parseInt(value))}
                      className="space-y-4"
                    >
                      {progress.lessonContents[currentExamLesson].content.exam[selectedExamQuestion].options.map(
                        (option, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                            <Label htmlFor={`option-${idx}`}>{option}</Label>
                          </div>
                        )
                      )}
                    </RadioGroup>

                    {examResult && (
                      <div className={`mt-4 p-4 rounded-lg ${examResult.correct ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        <div className="font-semibold">{examResult.correct ? 'Correct!' : 'Incorrect'}</div>
                        <div className="mt-2">{examResult.explanation}</div>
                      </div>
                    )}
                  </div>
                </>
              )}
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowExam(false)}>
              Cancel
            </Button>
            {!examResult ? (
              <Button
                onClick={checkAnswer}
                disabled={selectedAnswer === null}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Check Answer
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {selectedExamQuestion < (progress.lessonContents[currentExamLesson]?.content.exam.length || 0) - 1
                  ? 'Next Question'
                  : 'Finish Exam'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}